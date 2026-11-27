import {
  advanceUntil,
  findEntityAt,
  findInArea,
  giveItems,
  holdMove,
  step,
  walk,
} from "../../testing/harness";
import { SPRITE } from "../../engine/components/sprite";
import { STATS } from "../../engine/components/stats";
import { POSITION } from "../../engine/components/position";
import { HARVESTABLE } from "../../engine/components/harvestable";
import { isDead } from "../../engine/systems/damage";
import { getItemBuyPrice } from "../../game/balancing/trading";
import { unitDefinitions } from "../../game/balancing/units";
import {
  attackUntil,
  createCombatWorld,
  getDrops,
  getLoot,
  getUnit,
} from "./helpers";

// ♀ hero, U target object
const area = `
|         |
| ♀ U     |
|         |
`;

const target = findInArea(area, "U");

const destroy = (unit: string, map = area) => {
  const { world, hero } = createCombatWorld(map, { U: unit });
  const object = getUnit(world, map, "U");
  const loot = getLoot(world, object);
  walk(world, "right");
  giveItems(world, hero, [{ weapon: "sword", material: "iron", amount: 1 }]);

  attackUntil(world, "right", () => isDead(world, object));
  step(world, 120);

  return { world, hero, object, loot };
};

describe("destroying objects", () => {
  it("rolls one gold chest reward stack as close to 100 coins as its price allows", () => {
    const { drops } = unitDefinitions.goldChest;
    expect(drops.reduce((total, drop) => total + drop.chance, 0)).toBe(100);
    expect(drops.map((drop) => drop.items)).toContainEqual([
      { stackable: "resource", material: "iron", amount: 5 },
    ]);
    for (const { items } of drops) {
      expect(items).toHaveLength(1);
      const [item] = items;
      const price = getItemBuyPrice(item)[0].amount;
      expect(price).toBeGreaterThan(0);
      expect(item.amount).toBe(Math.floor(100 / price));
    }
  });

  it("drops a letter in addition to the normal gold chest reward at a bandit camp", () => {
    const { world } = createCombatWorld("|♀     C     |", { C: "bandit_camp" });
    const chest = world
      .getEntities([STATS, SPRITE])
      .find(
        (entity) => entity[SPRITE].id === unitDefinitions.goldChest.sprite.id
      )!;
    chest[STATS].hp = 0;
    step(world, 120);
    const items = getDrops(world).map(({ item }) => item);
    const letters = items.filter((item) => item.stackable === "letter");
    expect(letters).toHaveLength(1);
    expect(letters[0].amount).toBe(1);
    const reward = items
      .filter((item) => item.stackable !== "letter")
      .map(({ carrier, bound, ...item }) => item);
    expect(
      unitDefinitions.goldChest.drops.map((drop) => drop.items)
    ).toContainEqual(reward);
  });

  it.each(["pot", "woodChest", "ironChest", "tumbleweed", "hedge"])(
    "breaks a %s and drops its content",
    (unit) => {
      const { world, loot } = destroy(unit);

      expect(loot.length).toBeGreaterThan(0);
      expect(getDrops(world).map((drop) => drop.item)).toEqual(
        loot.map((item) => expect.objectContaining(item))
      );
      expect(findEntityAt(world, target, [STATS])).toBeUndefined();
    }
  );

  it("drops nothing from an empty pot", () => {
    const { world } = destroy("pot_empty");

    expect(getDrops(world)).toEqual([]);
    expect(findEntityAt(world, target, [STATS])).toBeUndefined();
  });

  it("places drops on free cells around the broken object", () => {
    const { world, hero } = destroy("pot");

    getDrops(world).forEach(({ position }) => {
      expect(position).not.toEqual(hero[POSITION]);
      expect(
        Math.abs(position.x - target.x) + Math.abs(position.y - target.y)
      ).toBeLessThanOrEqual(2);
    });
  });

  it("leaves a post after breaking a fence", () => {
    const { world, loot } = destroy("fence");

    expect(loot).toEqual([
      expect.objectContaining({ stackable: "stick", amount: 2 }),
    ]);
    expect(getDrops(world).map((drop) => drop.item)).toEqual([
      expect.objectContaining({ stackable: "stick", amount: 2 }),
    ]);
    expect(
      findEntityAt(world, target, [HARVESTABLE])?.[HARVESTABLE].resource
    ).toBe("post");
  });

  it("leaves a stump after breaking a training dummy", () => {
    const { world } = destroy("dummy");

    expect(
      findEntityAt(world, target, [HARVESTABLE])?.[HARVESTABLE].resource
    ).toBe("stump");
    expect(getDrops(world).map((drop) => drop.item)).toEqual([
      expect.objectContaining({ stackable: "coin", amount: 1 }),
    ]);
  });

  it("lets a training dummy heal back up when left alone", () => {
    const { world, hero } = createCombatWorld(area, { U: "dummy" });
    const dummy = getUnit(world, area, "U", false);
    walk(world, "right");
    giveItems(world, hero, [{ weapon: "sword", material: "iron", amount: 1 }]);

    attackUntil(world, "right", () => dummy[STATS].hp < 25);
    expect(dummy[STATS].hp).toBe(21);

    const frames = advanceUntil(world, () => dummy[STATS].hp === 25);

    expect(frames).toBeGreaterThan(150);
  });

  it("pushes a box with free space behind it", () => {
    const { world, hero } = createCombatWorld(area, { U: "box" });
    const box = getUnit(world, area, "U");
    walk(world, "right");
    giveItems(world, hero, [{ weapon: "sword", material: "iron", amount: 1 }]);

    walk(world, "right");

    expect(box[POSITION]).toEqual({ x: target.x + 1, y: target.y });
    expect(box[STATS].hp).toBe(5);
  });

  it("can't break a box with a sword even when it is blocked", () => {
    const blocked = `
|         |
| ♀ U█    |
|         |
`;
    const { world, hero } = createCombatWorld(blocked, { U: "box" });
    const box = getUnit(world, blocked, "U");
    walk(world, "right");
    giveItems(world, hero, [{ weapon: "sword", material: "iron", amount: 1 }]);

    holdMove(world, ["right"]);
    step(world, 60);

    expect(box[POSITION]).toEqual(target);
    expect(box[STATS].hp).toBe(5);
  });
});
