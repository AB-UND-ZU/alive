import {
  advanceUntil,
  createAreaWorld,
  giveItems,
  holdMove,
  step,
  walk,
} from "../../testing/harness";
import { STATS } from "../../engine/components/stats";
import { MOVABLE } from "../../engine/components/movable";
import { BELONGABLE, Faction } from "../../engine/components/belongable";
import { isFriendlyFire } from "../../engine/systems/damage";
import { attackUntil, createCombatWorld, getUnit } from "./helpers";

// ♀ hero, U target unit
const area = `
|         |
| ♀ U     |
|         |
`;

const setup = (unit: string) => {
  const { world, hero } = createCombatWorld(area, { U: unit });
  walk(world, "right");
  return { world, hero, unit: getUnit(world, area, "U") };
};

describe("friendly fire", () => {
  it("prevents hitting a tribe member with a sword", () => {
    const { world, hero, unit } = setup("earthDruid");
    giveItems(world, hero, [{ weapon: "sword", material: "iron", amount: 1 }]);

    holdMove(world, ["right"]);
    step(world, 60);

    expect(unit[STATS].hp).toBe(unit[STATS].maxHp);
  });

  it("heals a tribe member with an earth sword", () => {
    const { world, hero, unit } = setup("earthDruid");
    giveItems(world, hero, [{ weapon: "sword", element: "earth", amount: 1 }]);
    unit[STATS].hp = 5;

    attackUntil(world, "right", () => unit[STATS].hp > 5);

    expect(unit[STATS].hp).toBe(7);
  });

  it("doesn't damage enemies with an earth sword", () => {
    const { world, hero, unit } = setup("prism");
    giveItems(world, hero, [{ weapon: "sword", element: "earth", amount: 1 }]);

    holdMove(world, ["right"]);
    step(world, 60);

    expect(unit[STATS].hp).toBe(unit[STATS].maxHp);
  });

  it("lets wild units hit the hero but not neutral objects", () => {
    const wildArea = `
|     |
|♀UP  |
|     |
`;
    const { world, hero } = createCombatWorld(wildArea, {
      U: "prism",
      P: "pot",
    });
    const prism = world.assertComponents(getUnit(world, wildArea, "U"), [
      MOVABLE,
    ]);
    const pot = getUnit(world, wildArea, "P");

    prism[MOVABLE].orientations = ["right"];
    step(world, 60);

    expect(pot[STATS].hp).toBe(10);

    prism[MOVABLE].orientations = ["left"];
    advanceUntil(world, () => hero[STATS].hp < 10);

    expect(hero[STATS].hp).toBe(9);
  });

  const unit = (faction?: Faction) =>
    faction ? { [BELONGABLE]: { faction } } : {};

  it.each<[Faction | undefined, Faction | undefined, boolean]>([
    ["settler", "settler", true],
    ["settler", "earth", true],
    ["settler", "unit", false],
    ["settler", "wild", false],
    ["settler", "hostile", false],
    ["wild", "settler", false],
    ["wild", "unit", true],
    ["wild", "animal", false],
    ["unit", "animal", true],
    ["hostile", "wild", false],
    ["settler", undefined, true],
    [undefined, "wild", true],
  ])("treats %s attacking %s as friendly: %s", (attacker, target, friendly) => {
    const world = createAreaWorld(area);
    expect(isFriendlyFire(world, unit(attacker), unit(target))).toBe(friendly);
  });
});
