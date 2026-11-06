import {
  advanceUntil,
  countItems,
  createAreaWorld,
  findInArea,
  getHero,
  getItems,
  giveItems,
  step,
  walk,
} from "../../testing/harness";
import { World } from "../../engine";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { FOCUSABLE } from "../../engine/components/focusable";
import { INVENTORY } from "../../engine/components/inventory";
import { ITEM } from "../../engine/components/item";
import { LOOTABLE } from "../../engine/components/lootable";
import { PLAYER } from "../../engine/components/player";
import { POSITION } from "../../engine/components/position";
import { REVIVABLE } from "../../engine/components/revivable";
import { SOUL } from "../../engine/components/soul";
import { STATS } from "../../engine/components/stats";
import { TOOLTIP } from "../../engine/components/tooltip";
import { TypedEntity } from "../../engine/entities";
import { isGhost } from "../../engine/systems/fate";
import { getIdentifierAndComponents } from "../../engine/utils";
import { assertPlayer, assertUnit, interactAsPlayer, tryMove } from "./helpers";

// ♀ hero
const area = `
|           |
|           |
|  ♀        |
|           |
|           |
`;

// φ compass
const compassArea = `
|           |
|           |
|  ♀φ       |
|           |
|           |
`;

const spawn = findInArea(area, "♀");
const grave = { x: spawn.x + 4, y: spawn.y };

const getTombstone = (world: World) =>
  world.getEntity([REVIVABLE, POSITION, TOOLTIP]) as
    | TypedEntity<"REVIVABLE" | "POSITION" | "TOOLTIP">
    | undefined;

const isTombstoneReady = (world: World) =>
  !!getTombstone(world)?.[REVIVABLE].available;

const getDrops = (world: World) =>
  world.getEntities([LOOTABLE, INVENTORY, POSITION]).flatMap((drop) =>
    drop[INVENTORY].items.map((itemId) => ({
      position: drop[POSITION],
      item: world.assertByIdAndComponents(itemId, [ITEM])[ITEM],
    }))
  );

// walk away from spawn and die there
const die = (world: World) => {
  const hero = assertUnit(world);
  walk(world, "right", 4);
  hero[STATS].hp = 0;
  return hero;
};

const respawn = (world: World) => {
  advanceUntil(world, () => isTombstoneReady(world));
  advanceUntil(world, () => !!world.metadata.interact.active, 1000);
  interactAsPlayer(world);
  advanceUntil(world, () => !!getHero(world));
  return assertUnit(world);
};

describe("death and respawn", () => {
  it("replaces the dead hero by a tombstone and a ghost", () => {
    const world = createAreaWorld(area);
    const hero = die(world);

    advanceUntil(world, () => !!getTombstone(world));

    const ghost = world.assertComponents(assertPlayer(world), [SOUL]);
    expect(getHero(world)).toBeUndefined();
    expect(world.getEntityId(hero)).toBeUndefined();
    expect(getTombstone(world)?.[POSITION]).toEqual(grave);
    expect(isGhost(world, ghost)).toBe(true);
    expect(ghost[POSITION]).toEqual(grave);
    expect(ghost[SOUL].tombstoneId).toBe(
      world.getEntityId(getTombstone(world)!)
    );
  });

  it("shows RIP before the tombstone can be used to respawn", () => {
    const world = createAreaWorld(area);
    die(world);

    advanceUntil(
      world,
      () => getTombstone(world)?.[TOOLTIP].dialogs.length === 1
    );
    expect(isTombstoneReady(world)).toBe(false);

    advanceUntil(world, () => isTombstoneReady(world));
    expect(getTombstone(world)?.[TOOLTIP].dialogs).toHaveLength(0);
  });

  it("keeps the ghost waiting until it interacts with its tombstone", () => {
    const world = createAreaWorld(area);
    die(world);
    advanceUntil(world, () => isTombstoneReady(world));

    step(world, 100);

    expect(getHero(world)).toBeUndefined();
    expect(isGhost(world, assertPlayer(world))).toBe(true);
  });

  it("cannot walk as a ghost", () => {
    const world = createAreaWorld(area);
    die(world);
    advanceUntil(world, () => isTombstoneReady(world));

    tryMove(world, "left");

    expect(assertPlayer(world)[POSITION]).toEqual(grave);
  });

  it("respawns a fresh hero at the spawn point", () => {
    const world = createAreaWorld(area);
    const hero = die(world);
    const stats = { ...hero[STATS] };

    const revived = respawn(world);

    expect(revived).not.toBe(hero);
    expect(revived[POSITION]).toEqual(spawn);
    expect(revived[STATS]).toEqual({ ...stats, hp: stats.maxHp });
    expect(isGhost(world, revived)).toBe(false);
    expect(world.getEntities([PLAYER])).toEqual([revived]);
    expect(getTombstone(world)?.[REVIVABLE].available).toBe(false);
  });

  it("keeps defeated units but drops carried items at the grave", () => {
    const world = createAreaWorld(area);
    const hero = assertUnit(world);
    hero[PLAYER].defeatedUnits = { prism: 2 };
    giveItems(world, hero, [
      { stackable: "stick", amount: 3 },
      { weapon: "sword", material: "iron", amount: 2 },
    ]);

    die(world);
    const revived = respawn(world);

    expect(getItems(world, revived)).toEqual([]);
    expect(revived[PLAYER].defeatedUnits).toEqual({ prism: 2 });

    const drops = getDrops(world);
    expect(drops.map(({ item }) => item)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ stackable: "stick", amount: 3 }),
        expect.objectContaining({ weapon: "sword", material: "iron" }),
      ])
    );
    drops.forEach(({ position }) => {
      expect(Math.abs(position.x - grave.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(position.y - grave.y)).toBeLessThanOrEqual(1);
    });
  });

  it("loses bound items instead of dropping them", () => {
    const world = createAreaWorld(area);
    const hero = assertUnit(world);
    giveItems(world, hero, [
      { consume: "key", material: "iron", amount: 1, bound: true },
    ]);

    die(world);
    const revived = respawn(world);

    expect(countItems(world, revived, { consume: "key" })).toBe(0);
    expect(getDrops(world)).toEqual([]);
  });

  it("guides the respawned hero back to the grave until reaching it", () => {
    const world = createAreaWorld(area);
    die(world);
    respawn(world);
    step(world, 5);

    const focus = getIdentifierAndComponents(world, "focus", [
      FOCUSABLE,
      POSITION,
    ])!;
    expect(focus[FOCUSABLE]).toMatchObject({
      highlight: "tombstone",
      target: world.getEntityId(getTombstone(world)!),
    });
    expect(focus[POSITION]).toEqual(grave);

    walk(world, "right", 3);
    step(world, 5);

    expect(focus[FOCUSABLE].highlight).toBeUndefined();
    expect(focus[FOCUSABLE].target).toBeUndefined();
  });

  it("returns a carried compass to the respawned hero", () => {
    const world = createAreaWorld(compassArea);
    const hero = assertUnit(world);
    tryMove(world, "right");
    const compassId = hero[EQUIPPABLE].compass;
    expect(compassId).toBeDefined();
    walk(world, "left");

    die(world);
    const revived = respawn(world);

    expect(revived[EQUIPPABLE].compass).toBe(compassId);
    expect(revived[INVENTORY].items).toEqual([compassId]);
    expect(getDrops(world)).toEqual([]);
  });
});
