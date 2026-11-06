import {
  advanceUntil,
  findEntityAt,
  findInArea,
  getEntitiesAt,
  giveItems,
  parseArea,
  step,
  walk,
} from "../../testing/harness";
import { STATS } from "../../engine/components/stats";
import { PLAYER } from "../../engine/components/player";
import { INVENTORY } from "../../engine/components/inventory";
import { SPRITE } from "../../engine/components/sprite";
import { POSITION } from "../../engine/components/position";
import { isDead } from "../../engine/systems/damage";
import { tombstone1 } from "../../game/assets/sprites";
import {
  attackUntil,
  createCombatWorld,
  getDrops,
  getLoot,
  getUnit,
} from "./helpers";

// ♀ hero, U mob
const area = `
|         |
| ♀ U     |
|         |
`;

const target = findInArea(area, "U");

const slay = (mob: string, map = area) => {
  const { world, hero } = createCombatWorld(map, { U: mob });
  const unit = getUnit(world, map, "U");
  walk(world, "right");
  giveItems(world, hero, [{ weapon: "sword", material: "iron", amount: 1 }]);
  const loot = getLoot(world, unit);

  attackUntil(world, "right", () => isDead(world, unit));

  return { world, hero, unit, loot };
};

describe("defeating mobs", () => {
  it("removes a slain prism from its cell", () => {
    const { world, unit } = slay("prism");

    step(world, 120);

    expect(getEntitiesAt(world, target)).not.toContain(unit);
    expect(findEntityAt(world, target, [STATS])).toBeUndefined();
  });

  it("counts the defeated unit on the hero", () => {
    const { world, hero } = slay("prism");
    expect(hero[PLAYER].defeatedUnits).toEqual({});

    advanceUntil(world, () => hero[PLAYER].defeatedUnits.prism === 1);

    step(world, 60);
    expect(hero[PLAYER].defeatedUnits).toEqual({ prism: 1 });
  });

  it("drops unbound loot but keeps bound equipment", () => {
    const { world, loot } = slay("prism");

    step(world, 120);

    const unbound = loot.filter((item) => !item.bound && item.stat !== "xp");
    expect(loot).toContainEqual(
      expect.objectContaining({ weapon: "sword", bound: true })
    );
    expect(getDrops(world).map((drop) => drop.item)).toEqual(
      unbound.map((item) => expect.objectContaining(item))
    );
  });

  it("leaves a tombstone and no drops from a bandit with bound gear", () => {
    const { world, unit, loot } = slay("banditKnight");

    step(world, 120);

    expect(loot.map((item) => item.bound)).toEqual([true, true]);
    expect(getDrops(world)).toEqual([]);
    expect(
      getEntitiesAt(world, target).map((entity) => entity[SPRITE])
    ).toContain(tombstone1);
    expect(
      world.assertComponents(unit, [INVENTORY])[INVENTORY].items
    ).toHaveLength(2);
  });

  it("turns a dropped wood sword into a stick", () => {
    const { world, hero } = createCombatWorld(area, { U: "prism" });
    const prism = world.assertComponents(getUnit(world, area, "U"), [
      INVENTORY,
      POSITION,
    ]);
    giveItems(world, prism, [{ weapon: "sword", material: "wood", amount: 1 }]);
    walk(world, "right");
    giveItems(world, hero, [{ weapon: "sword", material: "iron", amount: 1 }]);

    attackUntil(world, "right", () => isDead(world, prism));
    step(world, 120);

    const drops = getDrops(world).map((drop) => drop.item);
    expect(drops).toContainEqual(
      expect.objectContaining({ stackable: "stick", amount: 1 })
    );
    expect(drops).not.toContainEqual(
      expect.objectContaining({ weapon: "sword" })
    );
  });

  it("spreads loot on free cells around blocked terrain", () => {
    const enclosed = `
|         |
|  ███    |
| ♀ U█    |
|  ███    |
|         |
`;
    const { world, hero } = slay("prism", enclosed);

    step(world, 120);

    const rows = parseArea(enclosed);
    const positions = getDrops(world).map(({ position }) => position);
    expect(positions.length).toBeGreaterThan(1);
    positions.forEach(({ x, y }) => {
      expect(rows[y][x]).not.toBe("█");
      expect({ x, y }).not.toEqual(hero[POSITION]);
    });
    expect(new Set(positions.map(({ x, y }) => `${x},${y}`)).size).toBe(
      positions.length
    );
  });
});
