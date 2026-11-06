import {
  advanceUntil,
  countItems,
  createAreaWorld,
  findEntityAt,
  findInArea,
  getItems,
  giveItems,
  holdMove,
  step,
  walk,
} from "../../testing/harness";
import { playedSounds } from "../../testing/env";
import { INVENTORY } from "../../engine/components/inventory";
import { LOOTABLE } from "../../engine/components/lootable";
import { POSITION } from "../../engine/components/position";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { ITEM } from "../../engine/components/item";
import { finishCollecting, placeDrop, setupHero } from "./helpers";

const emptyArea = `
|     |
| ♀   |
|     |
`;
const ground = { x: 2, y: 1 };

describe("item pickup", () => {
  it("collects coins by walking onto them and merges them into one stack", () => {
    const area = `
|      |
| ♀∙∙  |
|      |
`;
    const world = createAreaWorld(area);
    const hero = setupHero(world);

    walk(world, "right", 2);
    finishCollecting(world, hero);

    expect(getItems(world, hero)).toEqual([
      expect.objectContaining({ stackable: "coin", amount: 2 }),
    ]);
    expect(playedSounds.filter((sound) => sound === "pickup")).toHaveLength(2);
  });

  it("removes an emptied drop from the map", () => {
    const area = `
|     |
| ♀∙  |
|     |
`;
    const world = createAreaWorld(area);
    const coin = findInArea(area, "∙");
    expect(findEntityAt(world, coin, [LOOTABLE])).toBeDefined();

    walk(world, "right");
    step(world, 30);

    expect(findEntityAt(world, coin, [LOOTABLE])).toBeUndefined();
  });

  it("adds picked up items to an existing stack", () => {
    const area = `
|     |
| ♀∙  |
|     |
`;
    const world = createAreaWorld(area);
    const hero = setupHero(world);
    giveItems(world, hero, [{ stackable: "coin", amount: 5 }]);

    walk(world, "right");
    finishCollecting(world, hero);

    expect(getItems(world, hero)).toEqual([
      expect.objectContaining({ stackable: "coin", amount: 6 }),
    ]);
  });

  it("keeps keys of different materials in separate stacks", () => {
    const world = createAreaWorld(emptyArea);
    const hero = setupHero(world);
    giveItems(world, hero, [{ consume: "key", material: "gold", amount: 1 }]);
    placeDrop(world, ground, [{ consume: "key", material: "iron", amount: 1 }]);

    walk(world, "right");
    finishCollecting(world, hero);

    expect(getItems(world, hero)).toEqual([
      expect.objectContaining({ consume: "key", material: "gold", amount: 1 }),
      expect.objectContaining({ consume: "key", material: "iron", amount: 1 }),
    ]);
  });

  it("takes one item per step from a drop holding several items", () => {
    const world = createAreaWorld(emptyArea);
    const hero = setupHero(world);
    const drop = placeDrop(world, ground, [
      { stackable: "coin", amount: 3 },
      { stackable: "berry", amount: 2 },
    ]);

    holdMove(world, ["right"]);
    advanceUntil(world, () => drop[INVENTORY].items.length === 1);
    holdMove(world, []);
    finishCollecting(world, hero);

    expect(getItems(world, hero)).toEqual([
      expect.objectContaining({ stackable: "berry", amount: 2 }),
    ]);
    expect(hero[POSITION]).toEqual({ x: 1, y: 1 });

    walk(world, "right");
    finishCollecting(world, hero);

    expect(countItems(world, hero, { stackable: "coin" })).toBe(3);
    expect(drop[INVENTORY].items).toHaveLength(0);
  });

  it("leaves bound items on the ground and stays blocked by them", () => {
    const world = createAreaWorld(emptyArea);
    const hero = setupHero(world);
    const drop = placeDrop(world, ground, [
      { stackable: "coin", amount: 3, bound: true },
    ]);

    holdMove(world, ["right"]);
    step(world, 30);
    holdMove(world, []);

    expect(hero[POSITION]).toEqual({ x: 1, y: 1 });
    expect(getItems(world, hero)).toEqual([]);
    expect(drop[INVENTORY].items).toHaveLength(1);
    expect(playedSounds).not.toContain("pickup");
  });
});

describe("pickup of resources", () => {
  it("collects berries and an iron key from the ground", () => {
    const area = `
|      |
| ♀'!  |
|      |
`;
    const world = createAreaWorld(area);
    const hero = setupHero(world);

    walk(world, "right", 2);
    finishCollecting(world, hero);

    expect(countItems(world, hero, { stackable: "berry" })).toBe(1);
    expect(countItems(world, hero, { consume: "key", material: "iron" })).toBe(
      1
    );
  });

  it("collects ore by bumping into the rock while it keeps blocking", () => {
    const area = `
|     |
| ♀◘  |
|     |
`;
    const world = createAreaWorld(area);
    const hero = setupHero(world);

    holdMove(world, ["right"]);
    step(world, 30);
    holdMove(world, []);
    finishCollecting(world, hero);

    expect(countItems(world, hero, { stackable: "ore" })).toBe(1);
    expect(hero[POSITION]).toEqual(findInArea(area, "♀"));
  });

  it("picks an apple from a tree without walking into it", () => {
    const area = `
|     |
| ♀.  |
|     |
`;
    const world = createAreaWorld(area);
    const hero = setupHero(world);

    holdMove(world, ["right"]);
    step(world, 30);
    holdMove(world, []);
    finishCollecting(world, hero);

    expect(countItems(world, hero, { stackable: "apple" })).toBe(1);
    expect(hero[POSITION]).toEqual(findInArea(area, "♀"));
  });

  it("equips a picked up compass", () => {
    const area = `
|     |
| ♀φ  |
|     |
`;
    const world = createAreaWorld(area);
    const hero = setupHero(world);

    walk(world, "right");
    finishCollecting(world, hero);

    const compass = world.assertByIdAndComponents(hero[EQUIPPABLE].compass, [
      ITEM,
    ]);
    expect(compass[ITEM]).toMatchObject({
      accessory: "compass",
      material: "iron",
    });
    expect(hero[INVENTORY].items).toContain(hero[EQUIPPABLE].compass);
  });
});
