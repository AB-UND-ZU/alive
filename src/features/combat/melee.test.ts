import {
  findInArea,
  giveItems,
  holdMove,
  step,
  walk,
} from "../../testing/harness";
import { STATS } from "../../engine/components/stats";
import { POSITION } from "../../engine/components/position";
import { MELEE } from "../../engine/components/melee";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { INVENTORY } from "../../engine/components/inventory";
import { isDead } from "../../engine/systems/damage";
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

describe("melee attack", () => {
  it("hits a pot instead of walking into it", () => {
    const { world, hero, unit } = setup("pot");
    giveItems(world, hero, [{ weapon: "sword", material: "iron", amount: 1 }]);

    attackUntil(world, "right", () => unit[STATS].hp < 10);

    expect(unit[STATS].hp).toBe(6);
    expect(hero[POSITION]).toEqual({ x: findInArea(area, "U").x - 1, y: 1 });
    expect(world.assertComponents(hero, [MELEE])[MELEE].hits).toBe(1);
  });

  it("keeps hitting while the direction is held", () => {
    const { world, hero, unit } = setup("pot");
    giveItems(world, hero, [{ weapon: "sword", material: "iron", amount: 1 }]);

    attackUntil(world, "right", () => isDead(world, unit));

    expect(unit[STATS].hp).toBe(0);
    expect(world.assertComponents(hero, [MELEE])[MELEE].hits).toBe(3);
  });

  it("does nothing without a weapon", () => {
    const { world, hero, unit } = setup("pot");

    holdMove(world, ["right"]);
    step(world, 60);

    expect(unit[STATS].hp).toBe(10);
    expect(hero[POSITION]).toEqual({ x: findInArea(area, "U").x - 1, y: 1 });
    expect(world.assertComponents(hero, [MELEE])[MELEE].hits).toBe(0);
  });

  it("deals sword damage reduced by the target's armor", () => {
    const { world, hero, unit } = setup("woodChest");
    giveItems(world, hero, [{ weapon: "sword", material: "iron", amount: 1 }]);

    attackUntil(world, "right", () => unit[STATS].hp < 15);

    expect(unit[STATS].armor).toBe(1);
    expect(unit[STATS].hp).toBe(12);
  });

  it("adds the attacker's power to the sword damage", () => {
    const { world, hero, unit } = setup("woodChest");
    giveItems(world, hero, [{ weapon: "sword", material: "iron", amount: 1 }]);
    hero[STATS].power = 2;

    attackUntil(world, "right", () => unit[STATS].hp < 15);

    expect(unit[STATS].hp).toBe(10);
  });

  it("adds a shield to the target's armor", () => {
    const { world, hero, unit } = setup("prism");
    const target = world.assertComponents(unit, [
      EQUIPPABLE,
      INVENTORY,
      POSITION,
    ]);
    giveItems(world, target, [
      { offhand: "shield", material: "iron", amount: 1 },
    ]);
    giveItems(world, hero, [{ weapon: "sword", material: "iron", amount: 1 }]);

    attackUntil(world, "right", () => unit[STATS].hp < 8);

    expect(target[EQUIPPABLE].offhand).toBeDefined();
    expect(unit[STATS].hp).toBe(6);
  });

  it("accumulates damage below one point over several hits", () => {
    const { world, hero, unit } = setup("ironChest");
    giveItems(world, hero, [{ weapon: "sword", material: "wood", amount: 1 }]);

    attackUntil(world, "right", () => unit[STATS].hp < 20);
    expect(unit[STATS].hp).toBe(19.5);

    attackUntil(world, "right", () => unit[STATS].hp < 19.5);
    expect(unit[STATS].hp).toBe(19);
  });
});
