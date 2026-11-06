import {
  countItems,
  createAreaWorld,
  giveItems,
  step,
} from "../../testing/harness";
import { World } from "../../engine";
import { ITEM } from "../../engine/components/item";
import { INVENTORY } from "../../engine/components/inventory";
import { LOOTABLE } from "../../engine/components/lootable";
import { POSITION } from "../../engine/components/position";
import { RENDERABLE } from "../../engine/components/renderable";
import { SPAWNABLE } from "../../engine/components/spawnable";
import { SHOOTABLE } from "../../engine/components/shootable";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { TypedEntity } from "../../engine/entities";
import { LEVEL } from "../../engine/components/level";
import { dropEntity, findAdjacentDroppable } from "../../engine/systems/drop";
import { setupHero } from "./helpers";

/** Something holding items, like the inventory of a harvested resource. */
const createStash = (world: World, position: { x: number; y: number }) => {
  const stash: TypedEntity<"INVENTORY" | "POSITION" | "LOOTABLE"> = {
    [INVENTORY]: { items: [] },
    [LOOTABLE]: { disposable: true },
    [POSITION]: { ...position },
    [RENDERABLE]: { generation: 0 },
  };
  return stash;
};

/** Positions and item names of all loot lying on the map. */
const getDrops = (world: World) =>
  world.getEntities([LOOTABLE, INVENTORY, POSITION]).flatMap((container) =>
    container[INVENTORY].items.map((itemId) => {
      const item = world.assertByIdAndComponents(itemId, [ITEM])[ITEM];
      return {
        x: container[POSITION].x,
        y: container[POSITION].y,
        item: item.stackable || item.weapon || item.accessory,
        amount: item.amount,
      };
    })
  );

const isWalkable = (world: World, { x, y }: { x: number; y: number }) =>
  !!world.metadata.gameEntity[LEVEL].walkable[x][y];

describe("dropping items", () => {
  it("drops the first item in place and spreads the rest around it", () => {
    const area = `
|     |
|♀    |
|     |
`;
    const world = createAreaWorld(area);
    const center = { x: 2, y: 1 };
    const stash = createStash(world, center);
    giveItems(world, stash, [
      { stackable: "coin", amount: 1 },
      { stackable: "berry", amount: 2 },
      { stackable: "ore", amount: 3 },
    ]);

    const containers = dropEntity(world, stash, center);
    step(world, 30);

    expect(containers).toHaveLength(3);
    const drops = getDrops(world);
    expect(drops.map(({ item, amount }) => `${amount} ${item}`).sort()).toEqual(
      ["1 coin", "2 berry", "3 ore"]
    );
    expect(drops.filter(({ x, y }) => x === 2 && y === 1)).toHaveLength(1);
    drops.forEach((drop) => {
      expect(Math.abs(drop.x - center.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(drop.y - center.y)).toBeLessThanOrEqual(1);
    });
    expect(new Set(drops.map(({ x, y }) => `${x},${y}`)).size).toBe(3);
  });

  it("never drops items onto mountains", () => {
    const area = `
|█████|
|█  ██|
|█ ███|
|♀████|
`;
    const world = createAreaWorld(area);
    const center = { x: 2, y: 1 };
    const stash = createStash(world, center);
    giveItems(world, stash, [
      { stackable: "coin", amount: 1 },
      { stackable: "berry", amount: 1 },
      { stackable: "ore", amount: 1 },
    ]);

    dropEntity(world, stash, center);
    step(world, 30);

    const cells = getDrops(world).map(({ x, y }) => `${x},${y}`);
    expect(cells.sort()).toEqual(["1,1", "1,2", "2,1"]);
  });

  it("searches no further than the given radius", () => {
    const area = `
|█████|
|██ ██|
|█████|
|♀    |
|█████|
`;
    const world = createAreaWorld(area);
    const center = { x: 2, y: 3 };
    expect(isWalkable(world, { x: 2, y: 1 })).toBe(true);
    jest.spyOn(console, "error").mockImplementation(() => {});

    expect(findAdjacentDroppable(world, { x: 2, y: 1 }, 1, false)).toEqual({
      x: 2,
      y: 1,
    });
    expect(findAdjacentDroppable(world, center, 1)).toEqual(center);
    expect(findAdjacentDroppable(world, { x: 2, y: 0 }, 1)).toEqual({
      x: 2,
      y: 1,
    });
    expect(findAdjacentDroppable(world, { x: 2, y: 0 }, 0)).toEqual({
      x: 2,
      y: 0,
    });
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  it("drops items in front when given an orientation", () => {
    const area = `
|     |
|♀    |
|     |
`;
    const world = createAreaWorld(area);
    const stash = createStash(world, { x: 2, y: 1 });
    giveItems(world, stash, [{ stackable: "coin", amount: 4 }]);

    dropEntity(world, stash, stash[POSITION], false, 5, "down");
    step(world, 30);

    expect(getDrops(world)).toEqual([{ x: 2, y: 2, item: "coin", amount: 4 }]);
  });
});

describe("dropping a hero's items", () => {
  const area = `
|     |
|  ♀  |
|     |
`;

  it("turns a wood sword back into a stick and keeps bound items", () => {
    const world = createAreaWorld(area);
    const hero = setupHero(world);
    giveItems(world, hero, [
      { weapon: "sword", material: "wood", amount: 1 },
      { stackable: "coin", amount: 2, bound: true },
    ]);

    dropEntity(world, hero, hero[POSITION]);
    step(world, 30);

    expect(getDrops(world)).toEqual([
      expect.objectContaining({ item: "stick", amount: 1 }),
    ]);
    expect(hero[EQUIPPABLE].weapon).toBeUndefined();
    expect(countItems(world, hero, { stackable: "coin" })).toBe(2);
  });

  it("remembers the dropped compass for the next life", () => {
    const world = createAreaWorld(area);
    const hero = world.assertComponents(setupHero(world), [
      INVENTORY,
      POSITION,
      SPAWNABLE,
    ]);
    const [compass] = giveItems(world, hero, [
      { accessory: "compass", material: "iron", amount: 1 },
    ]);

    dropEntity(world, hero, hero[POSITION]);
    step(world, 30);

    expect(hero[SPAWNABLE].compassId).toBe(world.getEntityId(compass));
    expect(getDrops(world)).toEqual([
      expect.objectContaining({ item: "compass" }),
    ]);
  });

  it("drops arrows that hit the hero", () => {
    const world = createAreaWorld(area);
    const hero = world.assertComponents(setupHero(world), [
      INVENTORY,
      POSITION,
      SHOOTABLE,
    ]);
    hero[SHOOTABLE].shots = 3;

    dropEntity(world, hero, hero[POSITION]);
    step(world, 30);

    expect(getDrops(world)).toEqual([
      expect.objectContaining({ item: "arrow", amount: 3 }),
    ]);
  });
});
