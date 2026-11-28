import type { Tameable } from "../../engine/components/tameable";

export const petLevels = [
  { hp: 20, maxXp: 3 },
  { hp: 30, maxXp: 10 },
  { hp: 40, maxXp: 25 },
  { hp: 50, maxXp: Infinity },
];

export const startingFavourites: Tameable["favourites"] = [
  { item: { stackable: "salmon" }, xp: 1 },
  { item: { stackable: "pike" }, xp: 1 },
];

export const fishFavourites: Tameable["favourites"] = [
  { item: { stackable: "tuna" }, xp: 2 },
  { item: { stackable: "cod" }, xp: 2 },
];

export const craftedFavourites: Tameable["favourites"] = [
  { item: { stackable: "soup" }, xp: 2 },
  { item: { stackable: "toast" }, xp: 2 },
  { item: { stackable: "curry" }, xp: 3 },
  { item: { stackable: "juice" }, xp: 3 },
  { item: { stackable: "tea" }, xp: 4 },
  { item: { stackable: "granola" }, xp: 4 },
  { item: { consume: "potion", material: "gold", stat: "hp" }, xp: 1 },
  { item: { consume: "potion", material: "gold", stat: "mp" }, xp: 1 },
];
