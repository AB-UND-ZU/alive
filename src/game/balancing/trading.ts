import {
  Consumable,
  Element,
  Item,
  Material,
  Resource,
  Stackable,
} from "../../engine/components/item";
import { Deal } from "../../engine/components/popup";

export const itemPrices: Partial<Record<Stackable, number>> = {
  arrow: 3,
  charge: 3,

  apple: 3,
  shroom: 3,

  coconut: 8,
  banana: 8,

  fruit: 8,
  herb: 8,
  seed: 8,

  gem: 10,
  crystal: 10,
  nugget: 10,
};

export const itemMaterialPrices: Partial<
  Record<Resource | Consumable, Partial<Record<Material, number>>>
> = {
  resource: {
    wood: 10,
    iron: 20,
    gold: 100,
    diamond: 500,
    ruby: 2500,
  },
};

export const itemElementPrices: Partial<
  Record<
    Resource | Consumable,
    Partial<Record<Material, Partial<Record<Element, number>>>>
  >
> = {
  potion: {
    wood: {
      fire: 2,
      water: 2,
    },
    iron: {
      fire: 5,
      water: 5,
    },
    gold: {
      fire: 12,
      water: 12,
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
    const lookup = item.stackable || item.consume;

    if (lookup && material && element) {
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
  const prices = getItemPrice(item);
  return prices.map((price) => ({
    ...price,
    amount: Math.ceil(price.amount / 2),
  }));
};

export const purchasableItems: Omit<Item, "amount" | "carrier" | "bound">[] = [
  { consume: "potion", material: "wood", element: "fire" },
  { consume: "potion", material: "wood", element: "water" },
  { stackable: "apple" },
  { stackable: "shroom" },
  { stackable: "arrow" },
  { stackable: "charge" },
  { consume: "potion", material: "iron", element: "fire" },
  { consume: "potion", material: "iron", element: "water" },
  { stackable: "seed" },
  { stackable: "banana" },
  { stackable: "coconut" },
  { stackable: "resource", material: "wood" },
  { stackable: "resource", material: "iron" },
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
