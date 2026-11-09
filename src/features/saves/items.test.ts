import {
  advance,
  advanceUntil,
  countItems,
  createAreaWorld,
  getItems,
  giveItems,
  holdMove,
  walk,
} from "../../testing/harness";
import { saveAndLoad } from "../../testing/saves";
import { playedSounds, resetPlayedSounds } from "../../testing/env";
import { World } from "../../engine";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { INVENTORY } from "../../engine/components/inventory";
import { PLAYER } from "../../engine/components/player";
import { RENDERABLE } from "../../engine/components/renderable";
import { STATS } from "../../engine/components/stats";
import { getEntityStats } from "../../engine/systems/damage";
import { assignQuickItem } from "../../engine/systems/popup";
import { getSequence } from "../../engine/systems/sequence";
import {
  consumptionConfigs,
  stackableConsumptions,
} from "../../engine/systems/consume";
import {
  finishCollecting,
  placeDrop,
  pressQuickKey,
  setupHero,
} from "../items/helpers";

const area = `
|      |
| ♀    |
|      |
`;
const ground = { x: 2, y: 1 };

const woodHealth = consumptionConfigs.potion!.wood!.hp!;

const setup = () => {
  const world = createAreaWorld(area);
  const hero = setupHero(world);
  hero[STATS].maxHp = 10;
  hero[STATS].hp = 3;
  return { world, hero };
};

const getWorldGeneration = (world: World) =>
  world.metadata.gameEntity[RENDERABLE].generation;

describe("saved items", () => {
  it("keeps stacks and equipment, and adds pickups to the stacks", () => {
    const { world, hero } = setup();
    giveItems(world, hero, [
      { stackable: "coin", amount: 5 },
      { weapon: "sword", material: "iron", amount: 1 },
      { accessory: "amulet", material: "iron", amount: 1 },
    ]);
    advance(world, 1000);
    const stats = getEntityStats(world, hero);
    const items = getItems(world, hero);
    placeDrop(world, ground, [
      { stackable: "coin", amount: 2 },
      { weapon: "sword", material: "gold", amount: 1 },
    ]);

    const loaded = saveAndLoad(world);
    const loadedHero = setupHero(loaded);
    expect(getItems(loaded, loadedHero)).toEqual(items);
    expect(getEntityStats(loaded, loadedHero)).toEqual(stats);

    walk(loaded, "right");
    finishCollecting(loaded, loadedHero);
    walk(loaded, "left");
    walk(loaded, "right");
    finishCollecting(loaded, loadedHero);

    expect(countItems(loaded, loadedHero, { stackable: "coin" })).toBe(7);
    expect(
      countItems(loaded, loadedHero, { weapon: "sword", material: "gold" })
    ).toBe(1);
    expect(loaded.assertById(loadedHero[EQUIPPABLE].weapon!)).toMatchObject({
      ITEM: { weapon: "sword", material: "iron" },
    });
    expect(getEntityStats(loaded, loadedHero)).toEqual(stats);
  });

  it("collects a drop that was being picked up without doubling it", () => {
    const collect = (save: boolean) => {
      const { world, hero } = setup();
      const drop = placeDrop(world, ground, [
        { stackable: "coin", amount: 3 },
        { stat: "hp", amount: 3 },
      ]);
      const dropId = world.getEntityId(drop);
      holdMove(world, ["right"]);
      advanceUntil(world, () => !!getSequence(world, hero, "collect"));
      holdMove(world, []);

      const loaded = save ? saveAndLoad(world) : world;
      const loadedHero = setupHero(loaded);
      finishCollecting(loaded, loadedHero);
      holdMove(loaded, ["right"]);
      advanceUntil(loaded, () => !loaded.getEntityById(dropId));
      holdMove(loaded, []);
      finishCollecting(loaded, loadedHero);
      advance(loaded, 2000);

      return {
        items: getItems(loaded, loadedHero),
        hp: loadedHero[STATS].hp,
        received: loadedHero[PLAYER].receivedStats.hp,
      };
    };

    const unsaved = collect(false);
    const saved = collect(true);

    expect(saved).toEqual(unsaved);
    expect(saved).toEqual({
      items: [expect.objectContaining({ stackable: "coin", amount: 3 })],
      hp: 6,
      received: 3,
    });
  });

  it("eats food from a quick slot", () => {
    const { world, hero } = setup();
    giveItems(world, hero, [{ stackable: "apple", amount: 2 }]);
    assignQuickItem(world, hero, { stackable: "apple" });

    const loaded = saveAndLoad(world);
    const loadedHero = setupHero(loaded);
    expect(loadedHero[PLAYER].quickItems[1]).toEqual({ stackable: "apple" });
    pressQuickKey(loaded, 1);

    expect(loadedHero[STATS].hp).toBe(3 + stackableConsumptions.apple!.amount);
    expect(countItems(loaded, loadedHero, { stackable: "apple" })).toBe(1);
  });

  it("finishes drinking a potion once", () => {
    const { world, hero } = setup();
    giveItems(world, hero, [
      { consume: "potion", material: "wood", stat: "hp", amount: 3 },
    ]);
    advanceUntil(world, () => !!getSequence(world, hero, "consume"));
    expect(countItems(world, hero, { consume: "potion" })).toBe(2);

    const loaded = saveAndLoad(world);
    const loadedHero = setupHero(loaded);
    advanceUntil(loaded, () => !getSequence(loaded, loadedHero, "consume"));

    expect(loadedHero[STATS].hp).toBe(3 + woodHealth.amount);
    expect(countItems(loaded, loadedHero, { consume: "potion" })).toBe(2);
  });

  it("waits for the potion cooldown and keeps drinking up to the buffer", () => {
    const drink = (save: boolean) => {
      const { world, hero } = setup();
      giveItems(world, hero, [
        { consume: "potion", material: "wood", stat: "hp", amount: 5 },
      ]);
      advance(world, 100);
      const loaded = save ? saveAndLoad(world) : world;
      const loadedHero = setupHero(loaded);
      resetPlayedSounds();
      const start = getWorldGeneration(loaded);
      advanceUntil(loaded, () => !!getSequence(loaded, loadedHero, "consume"));
      const waited = getWorldGeneration(loaded) - start;
      advance(loaded, 20000);
      return {
        waited,
        hp: loadedHero[STATS].hp,
        potions: countItems(loaded, loadedHero, { consume: "potion" }),
        sounds: [...playedSounds],
      };
    };

    const unsaved = drink(false);
    const saved = drink(true);

    expect(saved).toEqual(unsaved);
    expect(saved).toMatchObject({ hp: 7, potions: 3 });
  });

  it("keeps the inventory of a container on the ground", () => {
    const { world } = setup();
    const drop = placeDrop(world, ground, [{ stackable: "berry", amount: 2 }]);
    const dropId = world.getEntityId(drop);

    const loaded = saveAndLoad(world);
    const loadedHero = setupHero(loaded);
    expect(
      loaded.assertByIdAndComponents(dropId, [INVENTORY])[INVENTORY].items
    ).toHaveLength(1);

    walk(loaded, "right");
    finishCollecting(loaded, loadedHero);
    expect(countItems(loaded, loadedHero, { stackable: "berry" })).toBe(2);
  });
});
