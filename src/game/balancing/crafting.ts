import { Deal, Ingredients } from "../../engine/components/popup";

export const craftingIngredients: Ingredients[] = [
  {
    item: { stackable: "stick", amount: 1 },
    parts: [{ stackable: "leaf", amount: 3 }],
  },
  {
    item: { stackable: "resource", material: "wood", amount: 1 },
    parts: [{ stackable: "stick", amount: 10 }],
  },
  {
    item: { stackable: "plank", amount: 1 },
    parts: [{ stackable: "resource", material: "wood", amount: 5 }],
  },

  {
    item: { stackable: "resource", material: "iron", amount: 1 },
    parts: [{ stackable: "ore", amount: 10 }],
  },

  {
    item: { stackable: "resource", material: "gold", amount: 1 },
    parts: [{ stackable: "nugget", amount: 10 }],
  },
  {
    item: { stackable: "ingot", amount: 1 },
    parts: [{ stackable: "resource", material: "gold", amount: 10 }],
  },

  {
    item: { consume: "bucket", material: "iron", amount: 1 },
    parts: [
      { stackable: "resource", material: "iron", amount: 1 },
      { stackable: "stick", amount: 1 },
    ],
  },
  {
    item: { stackable: "arrow", amount: 1 },
    parts: [
      { stackable: "stick", amount: 1 },
      { stackable: "ore", amount: 1 },
    ],
  },
];

export const getCraftingDeal = (ingredients: Ingredients): Deal => ({
  item: ingredients.item,
  stock: Infinity,
  prices: ingredients.parts,
});

export const craftingDeals: Deal[] = craftingIngredients.map((ingredients) => ({
  item: ingredients.item,
  prices: ingredients.parts,
  stock: Infinity,
}));
