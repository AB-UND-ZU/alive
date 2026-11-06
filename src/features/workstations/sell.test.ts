import {
  act,
  countItems,
  createAreaWorld,
  findInArea,
  getItems,
  giveItems,
  GivenItem,
} from "../../testing/harness";
import { playedSounds } from "../../testing/env";
import { ACTIONABLE } from "../../engine/components/actionable";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { getTab, getVerticalIndex } from "../../engine/systems/popup";
import {
  getItemBuyPrice,
  getItemSellPrice,
  purchasableItems,
} from "../../game/balancing/trading";
import {
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

const setup = (items: GivenItem[]) => {
  const world = createAreaWorld(area, { legend: { T: "air" } });
  const hero = getShopper(world);
  giveItems(world, hero, items);
  const trader = createShop(world, findInArea(area, "T"), {
    deals: purchasableItems.map((item) => getTraderDeal(item)),
    tabs: ["buy", "sell"],
  });
  const popup = openStation(world);
  act(world, "tab");

  return { world, hero, trader, popup };
};

const sellPrice = (item: GivenItem) => getItemSellPrice(item)[0].amount;

describe("selling to a trader", () => {
  it("lists the carried items on the sell tab", () => {
    const { world, hero, popup } = setup([
      { stackable: "apple", amount: 2 },
      { stackable: "ore", amount: 1 },
    ]);

    expect(getTab(world, popup)).toBe("sell");
    expect(hero[ACTIONABLE].trade).toBe(world.getEntityId(popup));

    act(world, "down");
    act(world, "down");
    expect(getVerticalIndex(world, popup)).toBe(1);
  });

  it("sells one item of the selected stack for half its price", () => {
    const apple = { stackable: "apple", amount: 3 } as const;
    const { world, hero } = setup([apple]);

    act(world, "right");

    expect(countItems(world, hero, { stackable: "apple" })).toBe(2);
    expect(countItems(world, hero, { stackable: "coin" })).toBe(
      sellPrice(apple)
    );
    expect(sellPrice(apple)).toBe(
      Math.ceil(getItemBuyPrice(apple)[0].amount / 2)
    );
    expect(playedSounds).not.toContain("deny");
  });

  it("removes the stack after selling the last item", () => {
    const shroom = { stackable: "shroom", amount: 1 } as const;
    const { world, hero } = setup([shroom]);

    act(world, "right");

    expect(getItems(world, hero)).toEqual([
      expect.objectContaining({ stackable: "coin", amount: sellPrice(shroom) }),
    ]);
  });

  it("pays the full price for gold", () => {
    const gold = {
      stackable: "resource",
      material: "gold",
      amount: 1,
    } as const;
    const { world, hero } = setup([gold]);

    act(world, "right");

    expect(countItems(world, hero, { stackable: "coin" })).toBe(
      getItemBuyPrice(gold)[0].amount
    );
    expect(countItems(world, hero, { stackable: "resource" })).toBe(0);
  });

  it("adds earned coins to the existing coins", () => {
    const ore = { stackable: "ore", amount: 2 } as const;
    const { world, hero, popup } = setup([
      { stackable: "coin", amount: 5 },
      ore,
    ]);
    selectRow(world, popup, 1);

    act(world, "right");
    act(world, "right");

    const coins = getItems(world, hero).filter(
      (item) => item.stackable === "coin"
    );
    expect(coins).toHaveLength(1);
    expect(coins[0].amount).toBe(5 + sellPrice(ore) * 2);
    expect(countItems(world, hero, { stackable: "ore" })).toBe(0);
  });

  it("sells the item in the selected row", () => {
    const { world, hero, popup } = setup([
      { stackable: "apple", amount: 1 },
      { stackable: "ore", amount: 1 },
    ]);
    selectRow(world, popup, 1);

    act(world, "right");

    expect(countItems(world, hero, { stackable: "apple" })).toBe(1);
    expect(countItems(world, hero, { stackable: "ore" })).toBe(0);
  });

  it("refuses to sell items without value", () => {
    const { world, hero } = setup([{ stackable: "berry", amount: 5 }]);
    const before = getItems(world, hero);

    act(world, "right");

    expect(playedSounds).toContain("deny");
    expect(getItems(world, hero)).toEqual(before);
  });

  it("refuses to sell equipment", () => {
    const { world, hero } = setup([
      { weapon: "sword", material: "iron", amount: 1 },
    ]);
    const sword = hero[EQUIPPABLE].weapon;

    act(world, "right");

    expect(playedSounds).toContain("deny");
    expect(hero[EQUIPPABLE].weapon).toBe(sword);
    expect(countItems(world, hero, { stackable: "coin" })).toBe(0);
  });

  it("does nothing with an empty bag", () => {
    const { world, hero } = setup([]);

    act(world, "right");

    expect(playedSounds).not.toContain("deny");
    expect(getItems(world, hero)).toEqual([]);
  });
});
