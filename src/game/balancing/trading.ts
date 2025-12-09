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
  arrow: 1,
  charge: 1,

  apple: 2,
  shroom: 2,

  coconut: 5,
  banana: 5,

  fruit: 5,
  herb: 5,
  seed: 5,

  gem: 10,
  crystal: 10,
  nugget: 10,
};

export const itemMaterialPrices: Partial<
  Record<Resource | Consumable, Partial<Record<Material, number>>>
> = {
  resource: {
    wood: 7,
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
      fire: 1,
      water: 1,
    },
    iron: {
      fire: 3,
      water: 3,
    },
    gold: {
      fire: 15,
      water: 15,
    },
  },
};

export const getItemPrice = (
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
