import { Equipment } from "../../engine/components/equippable";
import {
  Consumable,
  Item,
  Material,
  Passive,
  Primary,
  Secondary,
  Stackable,
} from "../../engine/components/item";
import { Deal } from "../../engine/components/popup";
import { Stats } from "../../engine/components/stats";

export const itemPrices: Partial<
  Record<
    | Equipment
    | Primary
    | Secondary
    | Passive
    | Consumable
    | Stackable
    | keyof Stats,
    Partial<Record<Material | "default", Deal["price"]>>
  >
> = {
  sword: {
    // T1-T3
    wood: [{ stackable: "stick", amount: 1 }],
    iron: [
      { equipment: "sword", material: "wood", amount: 1 },
      { stackable: "resource", material: "iron", amount: 3 },
    ],
    gold: [
      { equipment: "sword", material: "iron", amount: 1 },
      { stackable: "resource", material: "gold", amount: 3 },
    ],

    // T4
    diamond: [
      { equipment: "sword", material: "gold", amount: 1 },
      { stackable: "resource", material: "diamond", amount: 3 },
    ],
    fire: [
      { equipment: "sword", material: "gold", amount: 1 },
      { stackable: "resource", material: "fire", amount: 1 },
    ],
    water: [
      { equipment: "sword", material: "gold", amount: 1 },
      { stackable: "resource", material: "water", amount: 1 },
    ],
    earth: [
      { equipment: "sword", material: "gold", amount: 1 },
      { stackable: "resource", material: "earth", amount: 1 },
    ],

    // T5
    ruby: [
      { equipment: "sword", material: "diamond", amount: 1 },
      { stackable: "resource", material: "ruby", amount: 3 },
    ],
    aether: [
      { equipment: "sword", material: "diamond", amount: 1 },
      { stackable: "resource", material: "aether", amount: 3 },
    ],
    void: [
      { equipment: "sword", material: "diamond", amount: 1 },
      { stackable: "resource", material: "void", amount: 3 },
    ],
    rainbow: [
      { equipment: "sword", material: "diamond", amount: 1 },
      { stackable: "resource", material: "rainbow", amount: 3 },
    ],
  },
  shield: {
    // T1-T3
    wood: [{ stackable: "resource", material: "wood", amount: 3 }],
    iron: [
      { equipment: "shield", material: "wood", amount: 1 },
      { stackable: "resource", material: "iron", amount: 5 },
    ],
    gold: [
      { equipment: "shield", material: "iron", amount: 1 },
      { stackable: "resource", material: "gold", amount: 5 },
    ],

    // T4
    diamond: [
      { equipment: "shield", material: "gold", amount: 1 },
      { stackable: "resource", material: "diamond", amount: 5 },
    ],
    fire: [
      { equipment: "shield", material: "gold", amount: 1 },
      { stackable: "resource", material: "fire", amount: 2 },
    ],
    water: [
      { equipment: "shield", material: "gold", amount: 1 },
      { stackable: "resource", material: "water", amount: 2 },
    ],
    earth: [
      { equipment: "shield", material: "gold", amount: 1 },
      { stackable: "resource", material: "earth", amount: 2 },
    ],

    // T5
    ruby: [
      { equipment: "shield", material: "diamond", amount: 1 },
      { stackable: "resource", material: "ruby", amount: 5 },
    ],
    aether: [
      { equipment: "shield", material: "diamond", amount: 1 },
      { stackable: "resource", material: "aether", amount: 5 },
    ],
    void: [
      { equipment: "shield", material: "diamond", amount: 1 },
      { stackable: "resource", material: "void", amount: 5 },
    ],
    rainbow: [
      { equipment: "shield", material: "diamond", amount: 1 },
      { stackable: "resource", material: "rainbow", amount: 5 },
    ],
  },

  // equipments
  slash: {
    default: [
      { stackable: "coin", amount: 5 },
      { stackable: "seed", amount: 1 },
    ],
  },
  bow: {
    default: [
      { stackable: "coin", amount: 5 },
      { stackable: "seed", amount: 1 },
    ],
  },
  block: {
    default: [
      { stackable: "coin", amount: 5 },
      { stackable: "seed", amount: 1 },
    ],
  },

  // spells
  wave1: {
    default: [
      { stackable: "coin", amount: 10 },
      { consume: "potion1", material: "water", amount: 1 },
    ],
    fire: [
      { equipment: "primary", primary: "wave1", amount: 1 },
      { stackable: "resource", material: "fire", amount: 1 },
    ],
    water: [
      { equipment: "primary", primary: "wave1", amount: 1 },
      { stackable: "resource", material: "water", amount: 1 },
    ],
    earth: [
      { equipment: "primary", primary: "wave1", amount: 1 },
      { stackable: "resource", material: "earth", amount: 1 },
    ],
  },
  beam1: {
    default: [
      { stackable: "coin", amount: 10 },
      { consume: "potion1", material: "water", amount: 1 },
    ],
    fire: [
      { equipment: "primary", primary: "beam1", amount: 1 },
      { stackable: "resource", material: "fire", amount: 1 },
    ],
    water: [
      { equipment: "primary", primary: "beam1", amount: 1 },
      { stackable: "resource", material: "water", amount: 1 },
    ],
    earth: [
      { equipment: "primary", primary: "beam1", amount: 1 },
      { stackable: "resource", material: "earth", amount: 1 },
    ],
  },

  // tools
  torch: {
    default: [
      { stackable: "stick", amount: 1 },
      { stackable: "resource", material: "fire", amount: 1 },
    ],
  },

  // consumable
  key: {
    iron: [{ stackable: "resource", material: "iron", amount: 1 }],
    gold: [{ stackable: "coin", amount: 25 }],
  },
  potion1: {
    fire: [
      { stackable: "fruit", amount: 1 },
      { stackable: "leaf", amount: 3 },
    ],
    water: [
      { stackable: "herb", amount: 1 },
      { stackable: "leaf", amount: 3 },
    ],
  },
  potion2: {
    fire: [
      { stackable: "fruit", amount: 3 },
      { stackable: "seed", amount: 1 },
    ],
    water: [
      { stackable: "herb", amount: 3 },
      { stackable: "seed", amount: 1 },
    ],
  },

  // stackable
  stick: {
    default: [{ stackable: "leaf", amount: 3 }],
  },
  arrow: {
    default: [
      { stackable: "stick", amount: 10 },
      { stackable: "resource", material: "iron", amount: 1 },
    ],
  },
  charge: {
    default: [
      { stackable: "ore", amount: 10 },
      { stackable: "resource", material: "wood", amount: 1 },
    ],
  },
  apple: {
    default: [{ stackable: "coin", amount: 3 }],
  },
  shroom: {
    default: [{ stackable: "coin", amount: 3 }],
  },
  fruit: {
    default: [{ stackable: "berry", amount: 10 }],
  },
  herb: {
    default: [{ stackable: "flower", amount: 10 }],
  },
  seed: {
    default: [{ stackable: "leaf", amount: 10 }],
  },
  ingot: {
    default: [{ stackable: "resource", material: "gold", amount: 10 }],
  },

  // resources
  resource: {
    wood: [{ stackable: "stick", amount: 10 }],
    iron: [{ stackable: "ore", amount: 10 }],
    gold: [{ stackable: "resource", material: "iron", amount: 5 }],
    diamond: [{ stackable: "resource", material: "gold", amount: 5 }],
    ruby: [{ stackable: "resource", material: "diamond", amount: 5 }],
    fire: [{ stackable: "fruit", amount: 5 }],
    water: [{ stackable: "herb", amount: 5 }],
    earth: [{ stackable: "seed", amount: 5 }],
  },

  // countables
  ore: { default: [{ stackable: "coin", amount: 2 }] },

  // stats
  maxHp: { default: [{ stackable: "coin", amount: 10 }] },
  maxMp: { default: [{ stackable: "coin", amount: 10 }] },
  power: { default: [{ stackable: "coin", amount: 10 }] },
  magic: { default: [{ stackable: "coin", amount: 10 }] },
  armor: { default: [{ stackable: "coin", amount: 10 }] },
  haste: { default: [{ stackable: "coin", amount: 10 }] },
};

export const getItemPrice = (
  item: Omit<Item, "amount" | "carrier" | "bound">
): Deal["price"] => {
  const material = item.material || "default";
  if (item.stackable) {
    const activations = itemPrices[item.stackable]?.[material];
    if (activations) return activations;
  }

  const lookup = item.equipment || item.consume || item.stat;

  if (!lookup) return [];

  if (lookup === "primary")
    return (item.primary && itemPrices[item.primary]?.[material]) || [];
  if (lookup === "secondary")
    return (item.secondary && itemPrices[item.secondary]?.[material]) || [];
  if (lookup === "passive")
    return (item.passive && itemPrices[item.passive]?.[material]) || [];

  return itemPrices[lookup]?.[material] || [];
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
export const itemSales: Partial<Record<Stackable, number>> = {
  fruit: 2,
  apple: 1,
  gem: 4,
  coconut: 3,
  herb: 2,
  shroom: 1,
  crystal: 4,
  banana: 3,
  seed: 2,
};

export const itemPurchases: [Deal["item"], number][] = [
  [{ stat: "hp", amount: 1 }, 3],
  [{ stat: "mp", amount: 1 }, 2],
  [{ stackable: "leaf", amount: 1 }, 1],
  [{ stackable: "fruit", amount: 1 }, 10],
  [{ stackable: "herb", amount: 1 }, 10],
  [{ stackable: "seed", amount: 1 }, 10],
  [{ stackable: "resource", material: "wood", amount: 1 }, 15],
  [{ stackable: "resource", material: "iron", amount: 1 }, 20],
  [{ stackable: "resource", material: "gold", amount: 1 }, 99],
];
