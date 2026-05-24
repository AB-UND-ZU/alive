import { Deal, Recipe } from "../../engine/components/popup";

export const brewingRecipes: Recipe[] = [
  {
    item: { stackable: "fruit", amount: 1 },
    duration: 3,
    options: [[{ stackable: "berry", amount: 10 }]],
  },
  {
    item: { stackable: "herb", amount: 1 },
    duration: 3,
    options: [[{ stackable: "flower", amount: 10 }]],
  },
  {
    item: { stackable: "seed", amount: 1 },
    duration: 3,
    options: [[{ stackable: "leaf", amount: 10 }]],
  },

  {
    item: { stackable: "grain", amount: 5 },
    duration: 3,
    options: [[{ stackable: "wheat", amount: 1 }]],
  },
  {
    item: { stackable: "bread", amount: 1 },
    duration: 10,
    options: [[{ stackable: "wheat", amount: 3 }]],
  },

  {
    item: { consume: "potion", material: "wood", stat: "hp", amount: 10 },
    duration: 15,
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
    duration: 20,
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
    duration: 25,
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
    duration: 15,
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
    duration: 20,
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
    duration: 25,
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
    item: { stackable: "granola", amount: 1 },
    duration: 5,
    options: [
      [
        { stackable: "stick", amount: 3 },
        { stackable: "grain", amount: 5 },
        { stackable: "seed", amount: 1 },
      ],
    ],
  },
  {
    item: { stackable: "juice", amount: 1 },
    duration: 10,
    options: [
      [
        { stackable: "stick", amount: 3 },
        { stackable: "apple", amount: 2 },
        { stackable: "fruit", amount: 1 },
      ],
      [
        { stackable: "stick", amount: 3 },
        { stackable: "apple", amount: 2 },
        { stackable: "banana", amount: 1 },
      ],
      [
        { stackable: "stick", amount: 3 },
        { stackable: "banana", amount: 1 },
        { stackable: "fruit", amount: 1 },
      ],
    ],
  },
  {
    item: { stackable: "toast", amount: 1 },
    duration: 15,
    options: [
      [
        { stackable: "bread", amount: 1 },
        { stackable: "salmon", amount: 2 },
        { stackable: "leaf", amount: 2 },
      ],
      [
        { stackable: "bread", amount: 1 },
        { stackable: "tuna", amount: 1 },
        { stackable: "leaf", amount: 2 },
      ],
    ],
  },

  {
    item: { stackable: "tea", amount: 1 },
    duration: 5,
    options: [
      [
        { stackable: "ore", amount: 3 },
        { stackable: "herb", amount: 1 },
        { stackable: "leaf", amount: 5 },
      ],
      [
        { stackable: "ore", amount: 3 },
        { stackable: "algae", amount: 1 },
        { stackable: "leaf", amount: 5 },
      ],
    ],
  },
  {
    item: { stackable: "soup", amount: 1 },
    duration: 10,
    options: [
      [
        { stackable: "ore", amount: 3 },
        { stackable: "shroom", amount: 2 },
        { stackable: "coconut", amount: 1 },
      ],
    ],
  },
  {
    item: { stackable: "stew", amount: 1 },
    duration: 15,
    options: [
      [
        { stackable: "ore", amount: 3 },
        { stackable: "pike", amount: 2 },
        { stackable: "eel", amount: 1 },
      ],
      [
        { stackable: "ore", amount: 3 },
        { stackable: "cod", amount: 1 },
        { stackable: "eel", amount: 1 },
      ],
    ],
  },
];

export const getBrewingDeal = (recipe: Recipe, optionIndex: number): Deal => ({
  item: recipe.item,
  stock: Infinity,
  prices: recipe.options[optionIndex],
});

export const brewingDeals: Deal[] = brewingRecipes
  .map((recipe) =>
    recipe.options.map((option) => ({
      item: recipe.item,
      prices: option,
      stock: Infinity,
    }))
  )
  .flat();

export const brewingDurationFactor = 3;
