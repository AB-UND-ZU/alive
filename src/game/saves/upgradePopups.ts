import { Popup } from "../../engine/components/popup";
import type { World } from "../../engine/ecs";
import { matchesItem } from "../../engine/systems/popup";
import { bench } from "../assets/sprites";
import { createText } from "../assets/ui";
import { createItemText } from "../assets/utils";
import { craftingIngredients } from "../balancing/crafting";
import { getTraderDeal } from "../balancing/trading";

function preserveRows<T>(popup: Popup, tab: number, before: T[], after: T[]) {
  const indexAfter = (index: number) => {
    const row = before[index];
    return row === undefined ? index : after.indexOf(row);
  };
  popup.verticalIndezes[tab] = indexAfter(popup.verticalIndezes[tab]);
  popup.selections[tab] = popup.selections[tab].map(indexAfter);
}

function upgradeTrader(world: World, popup: Popup, tab: number) {
  const saved = popup.deals;
  const dealFor = (item: Parameters<typeof getTraderDeal>[0]) =>
    saved.find((deal) => matchesItem(world, deal.item, item)) ??
    getTraderDeal(item);
  const grounds = [
    dealFor({ stackable: "sand" }),
    dealFor({ stackable: "gravel" }),
  ];
  const merchandise = saved.filter((deal) => !grounds.includes(deal));
  // The released town catalog placed Charge immediately after Gold.
  const gold = merchandise.find(
    (deal) =>
      deal.item.stackable === "resource" && deal.item.material === "gold"
  );
  if (gold && merchandise.some((deal) => deal.item.stackable === "charge")) {
    const additions = [
      dealFor({ stackable: "ingot" }),
      dealFor({ stackable: "resource", material: "diamond" }),
    ];
    const other = merchandise.filter((deal) => !additions.includes(deal));
    other.splice(other.indexOf(gold) + 1, 0, ...additions);
    popup.deals = [...other, ...grounds];
  } else {
    popup.deals = [...merchandise, ...grounds];
  }
  preserveRows(popup, tab, saved, popup.deals);
}

export function upgradePopups(world: World) {
  for (const entity of world.metadata.ecs.entities) {
    const popup = entity.POPUP;
    if (!popup) continue;

    const buyTab = popup.tabs.indexOf("buy");
    if (entity.NPC?.type.endsWith("Trader") && buyTab >= 0)
      upgradeTrader(world, popup, buyTab);

    const craftTab = popup.tabs.indexOf("craft");
    if (entity.SPRITE?.id === bench.id && craftTab >= 0) {
      const saved = popup.ingredients;
      if (!saved.some(({ item }) => item.stackable === "gem")) {
        const gem = craftingIngredients.find(
          ({ item }) => item.stackable === "gem"
        )!;
        const ingot = saved.findIndex(({ item }) => item.stackable === "ingot");
        const position = ingot >= 0 ? ingot + 1 : saved.length;
        popup.ingredients = [
          ...saved.slice(0, position),
          gem,
          ...saved.slice(position),
        ];
        preserveRows(popup, craftTab, saved, popup.ingredients);
      }
    }

    if (entity.NPC?.type === "fireDruid" && popup.tabs.includes("quest")) {
      const price = popup.deals[0]?.prices[0];
      if (price?.stackable === "thorn" && price.amount === 10) {
        price.amount = 30;
        const page = popup.lines[0];
        if (page?.length)
          page[page.length - 1] = [
            ...createText("to get "),
            ...createItemText(price),
            ...createText("."),
          ];
      }
    }
  }
}
