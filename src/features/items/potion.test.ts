import {
  advance,
  advanceUntil,
  countItems,
  createAreaWorld,
  giveItems,
} from "../../testing/harness";
import { World } from "../../engine";
import { STATS } from "../../engine/components/stats";
import { INVENTORY } from "../../engine/components/inventory";
import { RENDERABLE } from "../../engine/components/renderable";
import { getSequence } from "../../engine/systems/sequence";
import { consumptionConfigs } from "../../engine/systems/consume";
import { setupHero } from "./helpers";

const area = `
|     |
| ♀   |
|     |
`;

const woodHealth = consumptionConfigs.potion!.wood!.hp!;
const woodMana = consumptionConfigs.potion!.wood!.mp!;

const setup = () => {
  const world = createAreaWorld(area);
  const hero = setupHero(world);
  hero[STATS].maxHp = 10;
  hero[STATS].hp = 3;
  hero[STATS].maxMp = 10;
  hero[STATS].mp = 10;
  return { world, hero };
};

const getWorldGeneration = (world: World) =>
  world.metadata.gameEntity[RENDERABLE].generation;

describe("potions", () => {
  it("drinks a health potion and removes the empty flask", () => {
    const { world, hero } = setup();
    giveItems(world, hero, [
      { consume: "potion", material: "wood", stat: "hp", amount: 1 },
    ]);

    advanceUntil(world, () => hero[STATS].hp > 3);

    expect(hero[STATS].hp).toBe(3 + woodHealth.amount);
    expect(hero[INVENTORY].items).toEqual([]);
  });

  it("waits for the cooldown before drinking", () => {
    const { world, hero } = setup();
    giveItems(world, hero, [
      { consume: "potion", material: "wood", stat: "hp", amount: 1 },
    ]);
    advance(world, 100);
    const start = getWorldGeneration(world);

    advanceUntil(world, () => !!getSequence(world, hero, "consume"));

    expect(getWorldGeneration(world) - start).toBeGreaterThanOrEqual(
      woodHealth.cooldown * 3 - 1
    );
  });

  it("uses one charge at a time and restores health after drinking", () => {
    const { world, hero } = setup();
    giveItems(world, hero, [
      { consume: "potion", material: "wood", stat: "hp", amount: 3 },
    ]);

    advanceUntil(world, () => !!getSequence(world, hero, "consume"));

    expect(countItems(world, hero, { consume: "potion" })).toBe(2);
    expect(hero[STATS].hp).toBe(3);

    advanceUntil(world, () => !getSequence(world, hero, "consume"));

    expect(hero[STATS].hp).toBe(3 + woodHealth.amount);
    expect(countItems(world, hero, { consume: "potion" })).toBe(2);
  });

  it("keeps drinking until health is close to maximum", () => {
    const { world, hero } = setup();
    giveItems(world, hero, [
      { consume: "potion", material: "wood", stat: "hp", amount: 5 },
    ]);

    advance(world, 20000);

    expect(hero[STATS].hp).toBe(7);
    expect(countItems(world, hero, { consume: "potion" })).toBe(3);
  });

  it("saves potions while health is within the buffer of maximum", () => {
    const { world, hero } = setup();
    hero[STATS].hp = 10 - woodHealth.amount - woodHealth.buffer + 1;
    giveItems(world, hero, [
      { consume: "potion", material: "wood", stat: "hp", amount: 1 },
    ]);

    advance(world, 5000);

    expect(countItems(world, hero, { consume: "potion" })).toBe(1);
    expect(getSequence(world, hero, "consume")).toBeUndefined();
  });

  it("drinks a mana potion when mana is low", () => {
    const { world, hero } = setup();
    hero[STATS].hp = 10;
    hero[STATS].mp = 2;
    giveItems(world, hero, [
      { consume: "potion", material: "wood", stat: "mp", amount: 1 },
    ]);

    advanceUntil(world, () => hero[STATS].mp > 2);

    expect(hero[STATS].mp).toBe(2 + woodMana.amount);
  });

  it("prefers the potion for the lower stat", () => {
    const { world, hero } = setup();
    hero[STATS].hp = 6;
    hero[STATS].mp = 2;
    giveItems(world, hero, [
      { consume: "potion", material: "wood", stat: "hp", amount: 1 },
      { consume: "potion", material: "wood", stat: "mp", amount: 1 },
    ]);

    advanceUntil(world, () => !!getSequence(world, hero, "consume"));

    expect(countItems(world, hero, { stat: "mp" })).toBe(0);
    expect(countItems(world, hero, { stat: "hp" })).toBe(1);
  });

  it("ignores potions without a consumption effect", () => {
    const { world, hero } = setup();
    giveItems(world, hero, [
      { consume: "potion", material: "diamond", stat: "hp", amount: 1 },
    ]);

    advance(world, 5000);

    expect(hero[STATS].hp).toBe(3);
    expect(countItems(world, hero, { consume: "potion" })).toBe(1);
  });
});
