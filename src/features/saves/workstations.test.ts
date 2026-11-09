import {
  act,
  advance,
  advanceUntil,
  countItems,
  createAreaWorld,
  findEntityAt,
  findInArea,
  getItems,
  giveItems,
  GivenItem,
  holdMove,
  step,
} from "../../testing/harness";
import { saveAndLoad } from "../../testing/saves";
import { playedSounds } from "../../testing/env";
import { World } from "../../engine";
import { BREWABLE } from "../../engine/components/brewable";
import { BURNABLE } from "../../engine/components/burnable";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { FORGABLE } from "../../engine/components/forgable";
import { INVENTORY } from "../../engine/components/inventory";
import { ITEM } from "../../engine/components/item";
import { PLAYER } from "../../engine/components/player";
import { Deal, POPUP, Recipe } from "../../engine/components/popup";
import { POSITION } from "../../engine/components/position";
import { REFERENCE } from "../../engine/components/reference";
import { SEQUENCABLE } from "../../engine/components/sequencable";
import { STATS } from "../../engine/components/stats";
import { getTab, isInPopup } from "../../engine/systems/popup";
import {
  brewingDurationFactor,
  brewingRecipes,
} from "../../game/balancing/brewing";
import {
  forgingCompleted,
  getForgeOptions,
} from "../../game/balancing/forging";
import {
  AnvilEntity,
  closeStation,
  createShop,
  getShopper,
  hitStep,
  openStation,
  selectRow,
} from "../workstations/helpers";

// ♀ hero, S station
const area = `
|       |
|  ♀S   |
|       |
`;

const station = findInArea(area, "S");

const quickest = brewingRecipes.reduce((quickest, recipe) =>
  recipe.duration < quickest.duration ? recipe : quickest
);
const quickestRow = brewingRecipes.indexOf(quickest);

const ironSword: GivenItem = { weapon: "sword", material: "iron", amount: 1 };
const upgrade = getForgeOptions({
  ...ironSword,
  bound: false,
  carrier: -1,
}).find((option) => !option.add.element)!;

const keyDeal: Deal = {
  item: { consume: "key", material: "iron", amount: 1 },
  stock: 1,
  prices: [{ stackable: "coin", amount: 1 }],
};

const countResult = (
  world: World,
  entity: Parameters<typeof countItems>[1],
  { amount, ...item }: Recipe["item"]
) => countItems(world, entity, item);

const getBrewingTime = (world: World) =>
  quickest.duration *
  brewingDurationFactor *
  world.metadata.gameEntity[REFERENCE].tick;

const getKettle = (world: World) =>
  findEntityAt(world, station, [BREWABLE, BURNABLE, INVENTORY])!;

const getAnvil = (world: World) =>
  findEntityAt(world, station, [
    FORGABLE,
    POPUP,
    POSITION,
    SEQUENCABLE,
  ]) as AnvilEntity;

const startBrewing = (times: number) => {
  const world = createAreaWorld(area, { legend: { S: "kettle" } });
  const hero = getShopper(world);
  const [ingredient] = quickest.options[0];
  giveItems(world, hero, [
    { ...ingredient, amount: ingredient.amount * times },
  ]);
  const popup = openStation(world);
  act(world, "right");
  selectRow(world, popup, quickestRow);
  act(world, "right");
  for (let time = 0; time < times; time += 1) act(world, "right");
  closeStation(world);
  advance(world, getBrewingTime(world) / 2);
  return world;
};

const brewAll = (world: World) => {
  const kettle = getKettle(world);
  return advanceUntil(
    world,
    () => kettle[BREWABLE].queue.length === 0 && !kettle[BURNABLE].simmer,
    getBrewingTime(world) * 3
  );
};

describe("saved workstations", () => {
  it("finishes brewing queued recipes in the same time", () => {
    const unsaved = startBrewing(2);
    const loaded = saveAndLoad(startBrewing(2));
    const kettle = getKettle(loaded);
    expect(kettle[BREWABLE].queue).toHaveLength(2);

    expect(brewAll(loaded)).toBe(brewAll(unsaved));
    expect(countResult(loaded, kettle, quickest.item)).toBe(
      quickest.item.amount * 2
    );
  });

  it("collects brewed results from the kettle", () => {
    const loaded = saveAndLoad(startBrewing(1));
    const hero = getShopper(loaded);
    brewAll(loaded);

    holdMove(loaded, ["right"]);
    advanceUntil(
      loaded,
      () => countResult(loaded, hero, quickest.item) > 0,
      2000
    );
    holdMove(loaded, []);

    expect(countResult(loaded, hero, quickest.item)).toBe(quickest.item.amount);
    expect(getKettle(loaded)[INVENTORY].items).toHaveLength(0);
  });

  it("continues forging at an open anvil", () => {
    const world = createAreaWorld(area, { legend: { S: "anvil" } });
    const hero = getShopper(world);
    hero[STATS].maxHp = 10;
    hero[STATS].hp = 10;
    giveItems(world, hero, [ironSword, upgrade.add]);
    const anvil = getAnvil(world);
    openStation(world);
    selectRow(world, anvil, 0);
    act(world, "right");
    selectRow(world, anvil, 1);
    act(world, "right");
    act(world, "right");
    hitStep(world, anvil);
    expect(anvil[FORGABLE].progress).toBe(1);

    const loaded = saveAndLoad(world);
    const loadedHero = getShopper(loaded);
    const loadedAnvil = getAnvil(loaded);
    expect(loadedHero[PLAYER].popup).toBe(loaded.getEntityId(loadedAnvil));
    expect(loadedAnvil[FORGABLE].progress).toBe(1);

    for (let hit = 0; hit < 20 && !forgingCompleted(loadedAnvil); hit += 1) {
      hitStep(loaded, loadedAnvil);
    }
    step(loaded, 1);
    act(loaded, "right");

    expect(getItems(loaded, loadedHero)).toEqual([
      expect.objectContaining(upgrade.result),
    ]);
    expect(
      loaded.assertByIdAndComponents(loadedHero[EQUIPPABLE].weapon, [ITEM])[
        ITEM
      ]
    ).toMatchObject(upgrade.result);
  });

  it("keeps buying in an open shop", () => {
    const world = createAreaWorld(area, { legend: { S: "air" } });
    const hero = getShopper(world);
    const trader = createShop(world, station, {
      deals: [keyDeal],
      tabs: ["buy", "sell"],
    });
    const traderId = world.getEntityId(trader);
    giveItems(world, hero, [{ stackable: "coin", amount: 2 }]);
    openStation(world);

    const loaded = saveAndLoad(world);
    const loadedHero = getShopper(loaded);
    const loadedTrader = loaded.assertByIdAndComponents(traderId, [
      POPUP,
      POSITION,
      SEQUENCABLE,
    ]);
    expect(isInPopup(loaded, loadedHero)).toBeTruthy();
    expect(getTab(loaded, loadedTrader)).toBe("buy");

    act(loaded, "right");
    expect(countItems(loaded, loadedHero, { consume: "key" })).toBe(1);
    expect(countItems(loaded, loadedHero, { stackable: "coin" })).toBe(1);

    closeStation(loaded);
    expect(isInPopup(loaded, loadedHero)).toBeFalsy();
  });

  it("keeps a limited deal sold out", () => {
    const world = createAreaWorld(area, { legend: { S: "air" } });
    const hero = getShopper(world);
    const trader = createShop(world, station, {
      deals: [keyDeal],
      tabs: ["buy", "sell"],
    });
    const traderId = world.getEntityId(trader);
    giveItems(world, hero, [{ stackable: "coin", amount: 2 }]);
    openStation(world);
    act(world, "right");
    closeStation(world);

    const loaded = saveAndLoad(world);
    const loadedHero = getShopper(loaded);
    expect(
      loaded.assertByIdAndComponents(traderId, [POPUP])[POPUP].deals[0].stock
    ).toBe(0);

    openStation(loaded);
    act(loaded, "right");

    expect(playedSounds).toContain("deny");
    expect(countItems(loaded, loadedHero, { consume: "key" })).toBe(1);
    expect(countItems(loaded, loadedHero, { stackable: "coin" })).toBe(1);
  });
});
