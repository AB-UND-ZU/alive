import { ConditionType } from "../../engine/components/conditionable";
import { Harvestable, Resource } from "../../engine/components/harvestable";
import { Item, Tool } from "../../engine/components/item";
import { colors } from "../assets/colors";

const harvestEfforts: Record<Resource, number> = {
  rotten: 1,
  hedge: 2,
  plant: 4,
  tree: 4,
  oak: 11,
  palm: 6,
  cactus: 4,
  sign: 6,
  fence: 11,

  rock: 2,
  mountain: 6,
  iron: 11,
  gold: 11,
};

const harvestYields: Record<Resource, Omit<Item, "carrier" | "bound">[]> = {
  rotten: [],
  hedge: [],
  plant: [],
  tree: [{ stackable: "stick", amount: 1 }],
  oak: [
    { stackable: "resource", material: "wood", amount: 1 },
    { stackable: "leaf", amount: 3 },
  ],
  cactus: [],
  palm: [{ stackable: "stick", amount: 2 }],
  sign: [],
  fence: [],

  rock: [],
  mountain: [{ stackable: "ore", amount: 1 }],
  iron: [{ stackable: "resource", material: "iron", amount: 1 }],
  gold: [{ stackable: "resource", material: "gold", amount: 1 }],
};

export const harvestScratches: Record<Resource, string> = {
  rotten: colors.maroon,
  hedge: colors.green,
  plant: colors.green,
  tree: colors.maroon,
  oak: colors.maroon,
  palm: colors.maroon,
  cactus: colors.green,
  sign: colors.maroon,
  fence: colors.maroon,

  rock: colors.silver,
  mountain: colors.silver,
  iron: colors.silver,
  gold: colors.yellow,
};

export const harvestConditions: Record<Tool, ConditionType> = {
  axe: "axe",
  pickaxe: "pickaxe",
  hook: "hook",
};

export const harvestTools: Record<Resource, Tool> = {
  rotten: "axe",
  hedge: "axe",
  plant: "axe",
  tree: "axe",
  oak: "axe",
  cactus: "axe",
  palm: "axe",
  sign: "axe",
  fence: "axe",

  rock: "pickaxe",
  mountain: "pickaxe",
  iron: "pickaxe",
  gold: "pickaxe",
};

export type HarvestConfig = {
  harvestable: Harvestable;
  yields: Omit<Item, "carrier" | "bound">[];
};

export const getHarvestConfig = (resource?: Resource): HarvestConfig => {
  if (!resource) {
    return {
      harvestable: {
        amount: 0,
        maximum: 0,
        resource: "tree",
      },
      yields: [],
    };
  }

  const effort = harvestEfforts[resource];
  const yields = harvestYields[resource];

  return {
    harvestable: {
      amount: effort,
      maximum: effort,
      resource,
    },
    yields,
  };
};
