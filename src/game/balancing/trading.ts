import { Gear } from "../../engine/components/equippable";
import {
  Active,
  Consumable,
  Item,
  Material,
  Passive,
  Stackable,
} from "../../engine/components/item";
import { Stats } from "../../engine/components/stats";
import { Tradable } from "../../engine/components/tradable";

export const itemPrices: Partial<
  Record<
    Gear | Active | Passive | Consumable | Stackable | keyof Stats,
    Partial<Record<Material | "default", Tradable["activation"]>>
  >
> = {
  sword: {
    // T1-T3
    wood: [],
    iron: [
      { equipment: "sword", material: "wood", amount: 1 },
      { stackable: "resource", material: "iron", amount: 5 },
    ],
    gold: [
      { equipment: "sword", material: "iron", amount: 1 },
      { stackable: "resource", material: "gold", amount: 5 },
    ],

    // T4
    diamond: [
      { equipment: "sword", material: "gold", amount: 1 },
      { stackable: "resource", material: "diamond", amount: 5 },
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
      { stackable: "resource", material: "ruby", amount: 5 },
    ],
    aether: [
      { equipment: "sword", material: "diamond", amount: 1 },
      { stackable: "resource", material: "aether", amount: 5 },
    ],
    void: [
      { equipment: "sword", material: "diamond", amount: 1 },
      { stackable: "resource", material: "void", amount: 5 },
    ],
    rainbow: [
      { equipment: "sword", material: "diamond", amount: 1 },
      { stackable: "resource", material: "rainbow", amount: 5 },
    ],
  },
  shield: {
    // T1-T3
    wood: [
      { stackable: "resource", material: "wood", amount: 5 },
      { stat: "coin", amount: 5 },
    ],
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
    default: [{ stat: 'xp', amount: 5 }, { stat: 'coin', amount: 10 }]
  },
  bow: {
    default: [{ stat: 'xp', amount: 5 }, { stat: 'coin', amount: 10 }]
  },
  block: {
    default: [{ stat: 'xp', amount: 5 }, { stat: 'coin', amount: 10 }]
  },

  // spells
  wave1: {
    default: [{ stat: 'xp', amount: 5 }, { stat: 'coin', amount: 3 }]
  },
  beam1: {
    default: [{ stat: 'xp', amount: 5 }, { stat: 'coin', amount: 3 }]
  },

  // tools
  torch: {
    default: [
      { stat: "stick", amount: 1 },
      { stat: "coin", amount: 3 },
    ],
  },

  // consumable
  potion1: {
    fire: [
      { stackable: "apple", amount: 3 },
      { stat: "stick", amount: 3 },
    ],
    water: [
      { stackable: "plum", amount: 3 },
      { stat: "stick", amount: 3 },
    ],
  },
  potion2: {
    fire: [
      { stackable: "apple", amount: 10 },
      { stackable: "resource", material: "wood", amount: 1 },
    ],
    water: [
      { stackable: "plum", amount: 10 },
      { stackable: "resource", material: "wood", amount: 1 },
    ],
  },

  // stackable
  arrow: {
    default: [
      { stat: "stick", amount: 10 },
      { stat: "ore", amount: 3 },
    ],
  },
  berry: { default: [
    { stat: "berry", amount: 10 },
      { stat: "coin", amount: 1 },
  ] },
  flower: { default: [
    { stat: "flower", amount: 10 },
      { stat: "coin", amount: 1 },
  ] },

  // resources
  resource: {
    wood: [
      { stat: "stick", amount: 10 },
      { stat: "coin", amount: 3 },
    ],
    iron: [
      { stat: "ore", amount: 10 },
      { stat: "coin", amount: 3 },
    ],
    gold: [
      { stackable: "resource", material: "iron", amount: 10 },
      { stat: "coin", amount: 5 },
    ],
    diamond: [
      { stackable: "resource", material: "iron", amount: 10 },
      { stat: "coin", amount: 10 },
    ],
    ruby: [
      { stackable: "resource", material: "diamond", amount: 10 },
      { stat: "coin", amount: 20 },
    ],
  },

  // stats
  maxHp: { default: [{ stat: "xp", amount: 5 }] },
  maxMp: { default: [{ stat: "xp", amount: 5 }] },
  power: { default: [{ stat: "xp", amount: 5 }] },
  magic: { default: [{ stat: "xp", amount: 5 }] },
  armor: { default: [{ stat: "xp", amount: 5 }] },
  haste: { default: [{ stat: "xp", amount: 5 }] },
};

export const getItemPrice = (
  item: Omit<Item, "amount" | "carrier" | "bound">
): Tradable["activation"] => {
  const material = item.material || "default";
  if (item.stackable) {
    const activations = itemPrices[item.stackable]?.[material];
    if (activations) return activations;
  }

  const lookup = item.equipment || item.consume || item.stat;

  if (!lookup) return [];

  if (lookup === "active")
    return (item.active && itemPrices[item.active]?.[material]) || [];
  if (lookup === "passive")
    return (item.passive && itemPrices[item.passive]?.[material]) || [];

  return itemPrices[lookup]?.[material] || [];
};
