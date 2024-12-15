import { Gear, Tools } from "../../engine/components/equippable";
import {
  Active,
  Consumable,
  Item,
  Material,
  Passive,
  Stackable,
} from "../../engine/components/item";
import { Tradable } from "../../engine/components/tradable";

export const itemPrices: Partial<
  Record<
    Gear | Tools | Active | Passive | Consumable | Stackable,
    Partial<Record<Material | "default", Tradable["activation"]>>
  >
> = {
  melee: {
    // T1-T3
    wood: [],
    iron: [
      { equipment: "melee", material: "wood", amount: 1 },
      { stackable: "resource", material: "iron", amount: 5 },
    ],
    gold: [
      { equipment: "melee", material: "iron", amount: 1 },
      { stackable: "resource", material: "gold", amount: 5 },
    ],

    // T4
    diamond: [
      { equipment: "melee", material: "gold", amount: 1 },
      { stackable: "resource", material: "diamond", amount: 5 },
    ],
    fire: [
      { equipment: "melee", material: "gold", amount: 1 },
      { stackable: "resource", material: "fire", amount: 1 },
    ],
    water: [
      { equipment: "melee", material: "gold", amount: 1 },
      { stackable: "resource", material: "water", amount: 1 },
    ],
    earth: [
      { equipment: "melee", material: "gold", amount: 1 },
      { stackable: "resource", material: "earth", amount: 1 },
    ],

    // T5
    ruby: [
      { equipment: "melee", material: "diamond", amount: 1 },
      { stackable: "resource", material: "ruby", amount: 5 },
    ],
    aether: [
      { equipment: "melee", material: "diamond", amount: 1 },
      { stackable: "resource", material: "aether", amount: 5 },
    ],
    void: [
      { equipment: "melee", material: "diamond", amount: 1 },
      { stackable: "resource", material: "void", amount: 5 },
    ],
    rainbow: [
      { equipment: "melee", material: "diamond", amount: 1 },
      { stackable: "resource", material: "rainbow", amount: 5 },
    ],
  },
  armor: {
    // T1-T3
    wood: [{ stackable: "resource", material: "wood", amount: 5 }],
    iron: [
      { equipment: "armor", material: "wood", amount: 1 },
      { stackable: "resource", material: "iron", amount: 5 },
    ],
    gold: [
      { equipment: "armor", material: "iron", amount: 1 },
      { stackable: "resource", material: "gold", amount: 5 },
    ],

    // T4
    diamond: [
      { equipment: "armor", material: "gold", amount: 1 },
      { stackable: "resource", material: "diamond", amount: 5 },
    ],
    fire: [
      { equipment: "armor", material: "gold", amount: 1 },
      { stackable: "resource", material: "fire", amount: 2 },
    ],
    water: [
      { equipment: "armor", material: "gold", amount: 1 },
      { stackable: "resource", material: "water", amount: 2 },
    ],
    earth: [
      { equipment: "armor", material: "gold", amount: 1 },
      { stackable: "resource", material: "earth", amount: 2 },
    ],

    // T5
    ruby: [
      { equipment: "armor", material: "diamond", amount: 1 },
      { stackable: "resource", material: "ruby", amount: 5 },
    ],
    aether: [
      { equipment: "armor", material: "diamond", amount: 1 },
      { stackable: "resource", material: "aether", amount: 5 },
    ],
    void: [
      { equipment: "armor", material: "diamond", amount: 1 },
      { stackable: "resource", material: "void", amount: 5 },
    ],
    rainbow: [
      { equipment: "armor", material: "diamond", amount: 1 },
      { stackable: "resource", material: "rainbow", amount: 5 },
    ],
  },

  // equipments
  slash: {
    default: [{ stat: "xp", amount: 5 }],
  },
  bow: {
    default: [{ stat: "xp", amount: 5 }],
  },
  block: {
    default: [{ stat: "xp", amount: 5 }],
  },

  // tools
  haste: {
    default: [
      { stackable: "flower", amount: 1 },
      { stackable: "berry", amount: 1 },
    ],
  },
  torch: {
    default: [
      { stat: "stick", amount: 1 },
      { stat: "gold", amount: 3 },
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
  berry: { default: [{stat:'berry', amount: 10}] },
  flower: { default: [{stat:'flower', amount: 10}] },

  // resources
  resource: {
    wood: [{ stat: "stick", amount: 10 }],
    iron: [{ stat: "ore", amount: 10 }],
    gold: [{ stackable: "resource", material: "iron", amount: 10 }],
    diamond: [{ stackable: "resource", material: "iron", amount: 10 }],
    ruby: [{ stackable: "resource", material: "diamond", amount: 10 }],
  },
};

export const getItemPrice = (
  item: Omit<Item, "amount" | "carrier" | "bound">
): Tradable["activation"] => {
  const material = item.material || "default";
  if (item.stackable) {
    const activations = itemPrices[item.stackable]?.[material];
    if (activations) return activations;
  }

  const lookup = item.equipment || item.consume;

  if (!lookup) return [];

  if (lookup === "active")
    return (item.active && itemPrices[item.active]?.[material]) || [];
  if (lookup === "passive")
    return (item.passive && itemPrices[item.passive]?.[material]) || [];

  return itemPrices[lookup]?.[material] || [];
};
