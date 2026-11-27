import { createCell, createNpc } from "../../bindings/creation";
import {
  createPopup,
  getDeal,
  isQuestCompleted,
} from "../../engine/systems/popup";
import { assertHero, createAreaWorld, giveItems } from "../../testing/harness";
import { createText } from "../assets/ui";
import { createItemText } from "../assets/utils";
import { craftingIngredients } from "../balancing/crafting";
import { getTraderDeals } from "../balancing/trading";
import { upgradePopups } from "./upgradePopups";

describe("saved popup upgrades", () => {
  it("keeps the selected trader deal, its stock and its price when adding new goods", () => {
    const world = createAreaWorld("|♀   |");
    const trader = createNpc(world, "fireTrader", { x: 2, y: 0 });
    const oldDeals = getTraderDeals().filter(
      ({ item }) =>
        item.stackable !== "ingot" &&
        item.material !== "diamond" &&
        item.stackable !== "sand" &&
        item.stackable !== "gravel"
    );
    const charge = oldDeals.find(({ item }) => item.stackable === "charge")!;
    charge.stock = 0;
    charge.prices[0].amount = 7;
    const owner = createPopup(world, trader, {
      tabs: ["buy", "sell"],
      deals: oldDeals,
    });
    owner.POPUP.verticalIndezes = [oldDeals.indexOf(charge), 3];

    upgradePopups(world);
    upgradePopups(world);

    expect(owner.POPUP.deals.map(({ item }) => item)).toEqual(
      getTraderDeals().map(({ item }) => item)
    );
    expect(getDeal(world, assertHero(world), owner)).toBe(charge);
    expect(charge.stock).toBe(0);
    expect(charge.prices[0].amount).toBe(7);
    expect(owner.POPUP.verticalIndezes[1]).toBe(3);
  });

  it("adds the gem recipe without switching the selected bench recipe", () => {
    const world = createAreaWorld("|♀   |");
    const owner = world.assertComponents(
      createCell(world, { x: 2, y: 0 }, "bench", "visible").cell,
      ["POPUP"]
    );
    const popup = owner.POPUP;
    const old = craftingIngredients.filter(
      ({ item }) => item.stackable !== "gem"
    );
    popup.ingredients = old;
    const index = old.findIndex(({ item }) => item.consume === "bucket");
    popup.verticalIndezes = [index];
    popup.selections = [[index]];

    upgradePopups(world);
    upgradePopups(world);

    expect(popup.ingredients).toEqual(craftingIngredients);
    expect(getDeal(world, assertHero(world), owner)?.item).toEqual(
      old[index].item
    );
    expect(popup.ingredients[popup.selections[0][0]]).toBe(old[index]);
  });

  it("updates the Fire Druid's saved thorn request and keeps the chosen reward", () => {
    const world = createAreaWorld("|♀   |");
    const hero = assertHero(world);
    const druid = createNpc(world, "fireDruid", { x: 2, y: 0 });
    const thorns = { stackable: "thorn", amount: 10 } as const;
    const reward = {
      item: { stackable: "resource", material: "gold", amount: 1 },
      stock: 1,
      prices: [{ ...thorns }],
    } as const;
    const popup = createPopup(world, druid, {
      tabs: ["quest"],
      deals: [{ ...reward, prices: [...reward.prices] }],
      lines: [
        [
          createText("Cut some Cactus"),
          [
            ...createText("to get "),
            ...createItemText(thorns),
            ...createText("."),
          ],
        ],
      ],
    }).POPUP;
    const [carriedThorns] = giveItems(world, hero, [{ ...thorns }]);

    upgradePopups(world);

    expect(isQuestCompleted(world, hero, druid)).toBe(false);
    expect(popup.deals[0].item).toEqual(reward.item);
    expect(popup.lines[0]).toEqual([
      createText("Cut some Cactus"),
      [
        ...createText("to get "),
        ...createItemText({ ...thorns, amount: 30 }),
        ...createText("."),
      ],
    ]);
    carriedThorns.ITEM.amount = 30;
    expect(isQuestCompleted(world, hero, druid)).toBe(true);
  });

  it("preserves the Fire Druid's completed quest screen", () => {
    const world = createAreaWorld("|♀   |");
    const druid = createNpc(world, "fireDruid", { x: 2, y: 0 });
    const lines = [[createText("Quest complete!")]];
    const { POPUP: popup } = createPopup(world, druid, {
      tabs: ["quest"],
      lines,
    });

    upgradePopups(world);

    expect(popup.lines).toBe(lines);
    expect(popup.deals).toEqual([]);
  });
});
