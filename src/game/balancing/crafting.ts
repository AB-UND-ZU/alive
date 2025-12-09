import { Deal, Recipe } from "../../engine/components/popup";

export const craftingRecipes: Recipe[] = [
  {
    item: { stackable: "stick", amount: 1 },
    options: [[{ stackable: "leaf", amount: 3 }]],
  },
  {
    item: { stackable: "resource", material: "wood", amount: 1 },
    options: [[{ stackable: "stick", amount: 10 }]],
  },

  {
    item: { consume: "potion", material: "wood", element: "fire", amount: 10 },
    options: [
      [
        { stackable: "apple", amount: 1 },
        { stackable: "resource", material: "wood", amount: 1 },
      ],
      [
        { stackable: "berry", amount: 3 },
        { stackable: "resource", material: "wood", amount: 1 },
      ],
    ],
  },
  {
    item: { consume: "potion", material: "wood", element: "water", amount: 10 },
    options: [
      [
        { stackable: "shroom", amount: 1 },
        { stackable: "resource", material: "wood", amount: 1 },
      ],
      [
        { stackable: "flower", amount: 3 },
        { stackable: "resource", material: "wood", amount: 1 },
      ],
    ],
  },

  {
    item: { stackable: "fruit", amount: 1 },
    options: [[{ stackable: "berry", amount: 10 }]],
  },
  {
    item: { stackable: "herb", amount: 1 },
    options: [[{ stackable: "flower", amount: 10 }]],
  },
  {
    item: { stackable: "seed", amount: 1 },
    options: [[{ stackable: "leaf", amount: 10 }]],
  },

  {
    item: { stackable: "arrow", amount: 1 },
    options: [
      [
        { stackable: "stick", amount: 1 },
        { stackable: "ore", amount: 1 },
      ],
    ],
  },
  {
    item: { stackable: "charge", amount: 1 },
    options: [
      [
        { stackable: "stick", amount: 1 },
        { stackable: "ore", amount: 1 },
      ],
    ],
  },

  {
    item: { stackable: "resource", material: "iron", amount: 1 },
    options: [
      [{ stackable: "ore", amount: 10 }],
      [{ stackable: "resource", material: "wood", amount: 3 }],
    ],
  },

  {
    item: { consume: "potion", material: "iron", element: "fire", amount: 10 },
    options: [
      [
        { stackable: "fruit", amount: 1 },
        { stackable: "resource", material: "iron", amount: 1 },
      ],
      [
        { stackable: "banana", amount: 1 },
        { stackable: "resource", material: "iron", amount: 1 },
      ],
    ],
  },
  {
    item: { consume: "potion", material: "iron", element: "water", amount: 10 },
    options: [
      [
        { stackable: "herb", amount: 1 },
        { stackable: "resource", material: "iron", amount: 1 },
      ],
      [
        { stackable: "coconut", amount: 1 },
        { stackable: "resource", material: "iron", amount: 1 },
      ],
    ],
  },

  {
    item: { stackable: "resource", material: "gold", amount: 1 },
    options: [
      [{ stackable: "nugget", amount: 10 }],
      [{ stackable: "resource", material: "iron", amount: 5 }],
    ],
  },
];

export const getCraftingDeal = (recipe: Recipe, optionIndex: number): Deal => ({
  item: recipe.item,
  stock: Infinity,
  prices: recipe.options[optionIndex],
});

export const craftingDeals: Deal[] = craftingRecipes
  .map((recipe) =>
    recipe.options.map((option) => ({
      item: recipe.item,
      prices: option,
      stock: Infinity,
    }))
  )
  .flat();
