import { Deal, Recipe } from "../../engine/components/popup";

export const craftingRecipes: Recipe[] = [
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
    item: { stackable: "grain", amount: 5 },
    options: [[{ stackable: "wheat", amount: 1 }]],
  },
  {
    item: { stackable: "bread", amount: 1 },
    options: [[{ stackable: "wheat", amount: 3 }]],
  },

  {
    item: { consume: "potion", material: "wood", stat: "hp", amount: 10 },
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
    item: { consume: "potion", material: "iron", stat: "hp", amount: 10 },
    options: [
      [
        { stackable: "fruit", amount: 1 },
        { stackable: "resource", material: "wood", amount: 3 },
      ],
      [
        { stackable: "banana", amount: 1 },
        { stackable: "resource", material: "wood", amount: 3 },
      ],
      [
        { stackable: "salmon", amount: 1 },
        { stackable: "resource", material: "wood", amount: 3 },
      ],
    ],
  },
  {
    item: { consume: "potion", material: "gold", stat: "hp", amount: 10 },
    options: [
      [
        { stackable: "fruit", amount: 2 },
        { stackable: "plank", amount: 1 },
      ],
      [
        { stackable: "banana", amount: 2 },
        { stackable: "plank", amount: 1 },
      ],
      [
        { stackable: "salmon", amount: 2 },
        { stackable: "plank", amount: 1 },
      ],
      [
        { stackable: "tuna", amount: 1 },
        { stackable: "plank", amount: 1 },
      ],
    ],
  },
  {
    item: { consume: "potion", material: "wood", stat: "mp", amount: 10 },
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
    item: { consume: "potion", material: "iron", stat: "mp", amount: 10 },
    options: [
      [
        { stackable: "herb", amount: 1 },
        { stackable: "resource", material: "wood", amount: 3 },
      ],
      [
        { stackable: "coconut", amount: 1 },
        { stackable: "resource", material: "wood", amount: 3 },
      ],
      [
        { stackable: "pike", amount: 1 },
        { stackable: "resource", material: "wood", amount: 3 },
      ],
    ],
  },
  {
    item: { consume: "potion", material: "gold", stat: "mp", amount: 10 },
    options: [
      [
        { stackable: "herb", amount: 2 },
        { stackable: "plank", amount: 1 },
      ],
      [
        { stackable: "coconut", amount: 2 },
        { stackable: "plank", amount: 1 },
      ],
      [
        { stackable: "pike", amount: 2 },
        { stackable: "plank", amount: 1 },
      ],
      [
        { stackable: "cod", amount: 1 },
        { stackable: "plank", amount: 1 },
      ],
    ],
  },

  {
    item: { stackable: "stick", amount: 1 },
    options: [[{ stackable: "leaf", amount: 3 }]],
  },
  {
    item: { stackable: "resource", material: "wood", amount: 1 },
    options: [[{ stackable: "stick", amount: 10 }]],
  },
  {
    item: { stackable: "plank", amount: 1 },
    options: [[{ stackable: "resource", material: "wood", amount: 10 }]],
  },

  {
    item: { stackable: "resource", material: "iron", amount: 1 },
    options: [[{ stackable: "ore", amount: 10 }]],
  },

  {
    item: { stackable: "resource", material: "gold", amount: 1 },
    options: [[{ stackable: "nugget", amount: 10 }]],
  },

  {
    item: { consume: "bucket", material: "iron", amount: 1 },
    options: [
      [
        { stackable: "resource", material: "iron", amount: 1 },
        { stackable: "stick", amount: 1 },
      ],
    ],
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
    item: { stackable: "arrow", amount: 10 },
    options: [
      [
        { stackable: "resource", material: "wood", amount: 1 },
        { stackable: "resource", material: "iron", amount: 1 },
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
    item: { stackable: "charge", amount: 10 },
    options: [
      [
        { stackable: "resource", material: "wood", amount: 1 },
        { stackable: "resource", material: "iron", amount: 1 },
      ],
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
