import {
  advanceUntil,
  giveItems,
  holdMove,
  step,
  walk,
} from "../../testing/harness";
import { STATS } from "../../engine/components/stats";
import { AFFECTABLE } from "../../engine/components/affectable";
import { POSITION } from "../../engine/components/position";
import { applyEffects } from "../../engine/systems/damage";
import { isControllable, isFrozen } from "../../engine/systems/freeze";
import { attackUntil, createCombatWorld, getUnit } from "./helpers";

// ♀ hero, U target unit
const area = `
|         |
| ♀ U     |
|         |
`;

describe("freezing", () => {
  it("is caused by water swords and wears off", () => {
    const { world, hero } = createCombatWorld(area, { U: "prism" });
    const prism = world.assertComponents(getUnit(world, area, "U"), [
      AFFECTABLE,
      STATS,
    ]);
    walk(world, "right");
    giveItems(world, hero, [
      { weapon: "sword", material: "wood", element: "water", amount: 1 },
    ]);

    attackUntil(world, "right", () => prism[STATS].hp < 8);

    expect(prism[AFFECTABLE].freeze).toBe(2);
    expect(isFrozen(world, prism)).toBe(true);
    expect(isControllable(world, prism)).toBe(false);

    advanceUntil(world, () => !isFrozen(world, prism));
    expect(isControllable(world, prism)).toBe(true);
  });

  it("stops a frozen hero from moving until thawed", () => {
    const { world, hero } = createCombatWorld(area);
    applyEffects(world, hero, 0, 2);

    holdMove(world, ["right"]);
    step(world, 15);
    expect(hero[POSITION]).toEqual({ x: 1, y: 1 });

    advanceUntil(world, () => hero[POSITION].x > 1);
    expect(isFrozen(world, hero)).toBe(false);
  });

  it("stops a frozen hero from attacking", () => {
    const { world, hero } = createCombatWorld(area, { U: "pot" });
    const pot = getUnit(world, area, "U");
    walk(world, "right");
    giveItems(world, hero, [{ weapon: "sword", material: "iron", amount: 1 }]);
    applyEffects(world, hero, 0, 2);

    holdMove(world, ["right"]);
    step(world, 15);
    expect(pot[STATS].hp).toBe(10);

    advanceUntil(world, () => pot[STATS].hp < 10);
  });

  it("is reduced by thaw", () => {
    const { world, hero } = createCombatWorld(area);
    hero[STATS].thaw = 2;

    expect(applyEffects(world, hero, 0, 2)).toBe(false);
    expect(applyEffects(world, hero, 0, 3)).toBe(true);
    expect(hero[AFFECTABLE].freeze).toBe(1);
  });

  it("is cancelled by fire together with the burn", () => {
    const { world, hero } = createCombatWorld(area);
    applyEffects(world, hero, 0, 2);

    expect(applyEffects(world, hero, 3, 0)).toBe(true);
    expect(hero[AFFECTABLE].freeze).toBe(0);
    expect(hero[AFFECTABLE].burn).toBe(0);
  });

  it("doesn't freeze units without affectable state", () => {
    const { world } = createCombatWorld(area, { U: "pot" });
    const pot = getUnit(world, area, "U");

    expect(applyEffects(world, pot, 3, 3)).toBe(false);
    expect(isFrozen(world, pot)).toBeFalsy();
  });
});
