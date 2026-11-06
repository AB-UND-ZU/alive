import {
  act,
  countItems,
  createAreaWorld,
  findInArea,
  getItems,
  giveItems,
  step,
} from "../../testing/harness";
import { playedSounds } from "../../testing/env";
import { ACTIONABLE } from "../../engine/components/actionable";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { ITEM } from "../../engine/components/item";
import { Deal, POPUP } from "../../engine/components/popup";
import {
  getTab,
  getVerticalIndex,
  isInPopup,
} from "../../engine/systems/popup";
import {
  getItemBuyPrice,
  purchasableItems,
} from "../../game/balancing/trading";
import {
  closeStation,
  createShop,
  getShopper,
  getTraderDeal,
  openStation,
  selectRow,
} from "./helpers";

// ♀ hero, T trader
const area = `
|       |
|  ♀T   |
|       |
`;

const traderDeals = () => purchasableItems.map((item) => getTraderDeal(item));

const setup = (deals: Deal[] = traderDeals()) => {
  const world = createAreaWorld(area, { legend: { T: "air" } });
  const hero = getShopper(world);
  const trader = createShop(world, findInArea(area, "T"), {
    deals,
    tabs: ["buy", "sell"],
  });

  return { world, hero, trader };
};

const appleRow = purchasableItems.findIndex(
  (item) => item.stackable === "apple"
);
const applePrice = getItemBuyPrice(purchasableItems[appleRow])[0].amount;

describe("buying from a trader", () => {
  it("offers the adjacent trader's shop", () => {
    const { world, hero, trader } = setup();

    step(world, 15);

    expect(hero[ACTIONABLE].popup).toBe(world.getEntityId(trader));
  });

  it("opens on the buy tab with every purchasable item", () => {
    const { world, hero, trader } = setup();

    const popup = openStation(world);

    expect(popup).toBe(trader);
    expect(getTab(world, popup)).toBe("buy");
    expect(popup[POPUP].deals).toHaveLength(purchasableItems.length);
    expect(hero[ACTIONABLE].trade).toBe(world.getEntityId(trader));
    expect(playedSounds).toContain("open");
  });

  it("browses rows and stops at the last deal", () => {
    const { world, trader } = setup();
    openStation(world);

    act(world, "down");
    expect(getVerticalIndex(world, trader)).toBe(1);
    expect(playedSounds).toContain("select");

    selectRow(world, trader, purchasableItems.length - 1);
    act(world, "down");
    expect(getVerticalIndex(world, trader)).toBe(purchasableItems.length - 1);

    act(world, "up");
    expect(getVerticalIndex(world, trader)).toBe(purchasableItems.length - 2);
  });

  it("buys the selected item for its coin price", () => {
    const { world, hero, trader } = setup();
    giveItems(world, hero, [{ stackable: "coin", amount: applePrice + 2 }]);
    openStation(world);
    selectRow(world, trader, appleRow);

    act(world, "right");

    expect(countItems(world, hero, { stackable: "apple" })).toBe(1);
    expect(countItems(world, hero, { stackable: "coin" })).toBe(2);
    expect(trader[POPUP].deals[appleRow].stock).toBe(Infinity);
    expect(playedSounds).toContain("pickup");
    expect(playedSounds).not.toContain("deny");
  });

  it("adds bought items to an existing stack", () => {
    const { world, hero, trader } = setup();
    giveItems(world, hero, [
      { stackable: "apple", amount: 3 },
      { stackable: "coin", amount: applePrice * 2 },
    ]);
    openStation(world);
    selectRow(world, trader, appleRow);

    act(world, "right");
    act(world, "right");

    const apples = getItems(world, hero).filter(
      (item) => item.stackable === "apple"
    );
    expect(apples).toHaveLength(1);
    expect(apples[0].amount).toBe(5);
    expect(countItems(world, hero, { stackable: "coin" })).toBe(0);
  });

  it("refuses a purchase without enough coins", () => {
    const { world, hero, trader } = setup();
    giveItems(world, hero, [{ stackable: "coin", amount: applePrice - 1 }]);
    openStation(world);
    selectRow(world, trader, appleRow);
    const before = getItems(world, hero);

    act(world, "right");

    expect(playedSounds).toContain("deny");
    expect(getItems(world, hero)).toEqual(before);
  });

  it("sells out a limited deal", () => {
    const keyDeal: Deal = {
      item: { consume: "key", material: "iron", amount: 1 },
      stock: 1,
      prices: [{ stackable: "coin", amount: 1 }],
    };
    const { world, hero, trader } = setup([keyDeal]);
    giveItems(world, hero, [{ stackable: "coin", amount: 2 }]);
    openStation(world);

    act(world, "right");

    expect(countItems(world, hero, { consume: "key" })).toBe(1);
    expect(trader[POPUP].deals[0].stock).toBe(0);
    expect(playedSounds).not.toContain("deny");

    act(world, "right");

    expect(playedSounds).toContain("deny");
    expect(countItems(world, hero, { consume: "key" })).toBe(1);
    expect(countItems(world, hero, { stackable: "coin" })).toBe(1);
  });

  it("equips bought equipment into a free slot", () => {
    const swordDeal: Deal = {
      item: { weapon: "sword", material: "iron", amount: 1 },
      stock: 1,
      prices: [{ stackable: "coin", amount: 3 }],
    };
    const { world, hero } = setup([swordDeal]);
    giveItems(world, hero, [{ stackable: "coin", amount: 3 }]);
    openStation(world);

    act(world, "right");

    const sword = world.assertByIdAndComponents(hero[EQUIPPABLE].weapon, [
      ITEM,
    ]);
    expect(sword[ITEM]).toMatchObject({ weapon: "sword", material: "iron" });
    expect(countItems(world, hero, { stackable: "coin" })).toBe(0);
  });

  it("keeps the equipped item when buying a second one", () => {
    const swordDeal: Deal = {
      item: { weapon: "sword", material: "iron", amount: 1 },
      stock: 1,
      prices: [{ stackable: "coin", amount: 3 }],
    };
    const { world, hero } = setup([swordDeal]);
    const [woodSword] = giveItems(world, hero, [
      { weapon: "sword", material: "wood", amount: 1 },
    ]);
    giveItems(world, hero, [{ stackable: "coin", amount: 3 }]);
    openStation(world);

    act(world, "right");

    expect(hero[EQUIPPABLE].weapon).toBe(world.getEntityId(woodSword));
    expect(countItems(world, hero, { weapon: "sword", material: "iron" })).toBe(
      1
    );
  });

  it("turns a bought stick into a wooden sword without a weapon", () => {
    const { world, hero, trader } = setup();
    const stickRow = purchasableItems.findIndex(
      (item) => item.stackable === "stick"
    );
    const stickPrice = getItemBuyPrice(purchasableItems[stickRow])[0].amount;
    giveItems(world, hero, [{ stackable: "coin", amount: stickPrice }]);
    openStation(world);
    selectRow(world, trader, stickRow);

    act(world, "right");

    expect(countItems(world, hero, { stackable: "stick" })).toBe(0);
    const weapon = world.assertByIdAndComponents(hero[EQUIPPABLE].weapon, [
      ITEM,
    ]);
    expect(weapon[ITEM]).toMatchObject({ weapon: "sword", material: "wood" });
  });

  it("switches to the sell tab and back", () => {
    const { world, trader } = setup();
    openStation(world);

    act(world, "tab");
    expect(getTab(world, trader)).toBe("sell");
    expect(playedSounds).toContain("tab");

    act(world, "backtab");
    expect(getTab(world, trader)).toBe("buy");
  });

  it("closes the shop without trading", () => {
    const { world, hero, trader } = setup();
    giveItems(world, hero, [{ stackable: "coin", amount: 5 }]);
    openStation(world);
    const before = getItems(world, hero);

    closeStation(world);

    expect(isInPopup(world, hero)).toBeFalsy();
    expect(trader[POPUP].active).toBe(false);
    expect(playedSounds).toContain("close");
    expect(getItems(world, hero)).toEqual(before);
    expect(hero[ACTIONABLE].trade).toBeUndefined();
    expect(hero[ACTIONABLE].popup).toBe(world.getEntityId(trader));
  });
});
