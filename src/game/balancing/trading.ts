import {
  Consumable,
  Element,
  Item,
  Material,
  ResourceItem,
  Stackable,
} from "../../engine/components/item";
import { Deal } from "../../engine/components/popup";
import { UnitStats } from "../../engine/components/stats";

export const itemPrices: Partial<Record<Stackable, number>> = {
  worm: 1,
  thorn: 2,

  stick: 2,
  ore: 2,

  arrow: 3,
  charge: 3,

  apple: 3,
  shroom: 3,

  salmon: 8,
  pike: 8,

  coconut: 8,
  banana: 8,

  tuna: 12,
  cod: 12,

  algae: 15,
  eel: 30,

  pearl: 50,
  seastar: 30,

  sapling: 3,
  wheat: 3,
  bread: 8,
  fruit: 8,
  herb: 8,

  granola: 10,
  juice: 20,
  toast: 30,
  tea: 10,
  curry: 20,
  soup: 30,

  mineral: 20,
  crystal: 20,

  golem: 20,

  plank: 100,

  // exchange items
  nugget: 10,
  ingot: 1000,
};

export const itemMaterialPrices: Partial<
  Record<ResourceItem | Consumable, Partial<Record<Material, number>>>
> = {
  resource: {
    wood: 20,
    iron: 20,
    gold: 100,
    diamond: 500,
    ruby: 2500,
  },
  bucket: { iron: 22 },
};

export const itemElementPrices: Partial<
  Record<
    ResourceItem | Consumable,
    Partial<Record<Material, Partial<Record<Element, number>>>>
  >
> = {
  bucket: { iron: { water: 25 } },
};

export const itemStatPrices: Partial<
  Record<
    ResourceItem | Consumable,
    Partial<Record<Material, Partial<Record<keyof UnitStats, number>>>>
  >
> = {
  potion: {
    wood: {
      mp: 3,
      hp: 3,
    },
    iron: {
      mp: 8,
      hp: 8,
    },
    gold: {
      mp: 12,
      hp: 12,
    },
  },
};

const getItemPrice = (
  item: Omit<Item, "amount" | "carrier" | "bound">
): Deal["prices"] => {
  let price: number | undefined;
  if (item.stackable && item.stackable !== "resource") {
    price = itemPrices[item.stackable];
  } else {
    const material = item.material;
    const element = item.element;
    const stat = item.stat;
    const lookup = item.stackable || item.consume;

    if (lookup && material && stat) {
      price = itemStatPrices[lookup]?.[material]?.[stat];
    } else if (lookup && material && element) {
      price = itemElementPrices[lookup]?.[material]?.[element];
    } else if (lookup && material) {
      price = itemMaterialPrices[lookup]?.[material];
    }
  }

  return [{ stackable: "coin", amount: price || 0 }];
};

export const getItemBuyPrice = (
  item: Omit<Item, "amount" | "carrier" | "bound">
): Deal["prices"] => getItemPrice(item);

export const getItemSellPrice = (
  item: Omit<Item, "amount" | "carrier" | "bound">
): Deal["prices"] => {
  // prevent selling charges
  if (item.stackable === "charge") {
    return [{ stackable: "coin", amount: 0 }];
  }

  const prices = getItemPrice(item);
  const divisor =
    item.stackable === "nugget" ||
    (item.stackable === "resource" && item.material === "gold") ||
    item.stackable === "ingot"
      ? 1
      : 2;

  return prices.map((price) => {
    return {
      ...price,
      amount: Math.ceil(price.amount / divisor),
    };
  });
};

export const purchasableItems: Omit<Item, "amount" | "carrier" | "bound">[] = [
  { stackable: "apple" },
  { stackable: "shroom" },
  { stackable: "fruit" },
  { stackable: "herb" },
  { stackable: "banana" },
  { stackable: "coconut" },
  { stackable: "bread" },
  { stackable: "stick" },
  { stackable: "resource", material: "wood" },
  { stackable: "plank" },
  { stackable: "ore" },
  { stackable: "resource", material: "iron" },
  { stackable: "nugget" },
  { stackable: "resource", material: "gold" },
  { stackable: "arrow" },
  { stackable: "charge" },
  { stackable: "worm" },
  { stackable: "thorn" },
];

/* balance: <count> * <coins> ~= 20
- item <avg> * <freq> / <stack> = <count> → <coins>
- berry 70 * 1.25 / 10 = 9 → 2
- apple 22 * 1 = 22 → 1
- gem 16 * 0.3 = 5 → 4
- coconut 85 * 0.1 = 8 → 3
- flower 88 * 1.25 * 0.3 = 11 → 2
- shroom 22 * 1 = 22 → 1
- crystal 16 * 0.3 = 5 → 4
- banana 85 * 0.1 = 8 → 3
*/
