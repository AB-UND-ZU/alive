import { ConditionType } from "../../engine/components/conditionable";
import { Harvestable, Resource } from "../../engine/components/harvestable";
import { Item, Stackable, Tool } from "../../engine/components/item";
import { colors } from "../assets/colors";

const harvestEfforts: Record<Resource, number> = {
  rotten: 1,
  hedge: 1,
  plant: 4,
  tree: 5,
  oak: 11,
  palm: 6,
  cactus: 4,
  box: 4,
  sign: 6,
  fence: 11,

  grass: 1,
  bush: 1,
  flower: 1,
  berry: 1,
  seed: 1,

  palisade: 11,
  rock: 1,
  mountain: 6,
  iron: 11,
  gold: 21,
};

const harvestYields: Partial<
  Record<Resource, Omit<Item, "carrier" | "bound">[]>
> = {
  tree: [{ stackable: "stick", amount: 1 }],
  oak: [
    { stackable: "resource", material: "wood", amount: 1 },
    { stackable: "leaf", amount: 3 },
  ],
  palm: [{ stackable: "stick", amount: 2 }],

  grass: [{ stackable: "grain", amount: 1 }],
  bush: [{ stackable: "grain", amount: 2 }],
  flower: [{ stackable: "flower", amount: 1 }],
  berry: [{ stackable: "berry", amount: 1 }],
  seed: [{ stackable: "seed", amount: 1 }],

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
  box: colors.maroon,
  sign: colors.maroon,
  fence: colors.maroon,

  grass: colors.yellow,
  bush: colors.yellow,
  berry: colors.purple,
  seed: colors.lime,
  flower: colors.teal,

  palisade: colors.silver,
  rock: colors.silver,
  mountain: colors.silver,
  iron: colors.silver,
  gold: colors.yellow,
};

export const harvestConditions: Record<Tool, ConditionType> = {
  axe: "axe",
  shovel: "shovel",
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
  box: "axe",
  palm: "axe",
  sign: "axe",
  fence: "axe",

  grass: "shovel",
  bush: "shovel",
  flower: "shovel",
  berry: "shovel",
  seed: "shovel",

  palisade: "pickaxe",
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
    yields: yields || [],
  };
};

export const plantConfigs: Partial<
  Record<
    Stackable,
    {
      duration: number;
      crop: Omit<Item, "carrier" | "bound">;
      harvest: Resource;
    }
  >
> = {
  berry: {
    duration: 150,
    crop: { stackable: "fruit", amount: 1 },
    harvest: "berry",
  },
  flower: {
    duration: 150,
    crop: { stackable: "herb", amount: 1 },
    harvest: "flower",
  },
  grain: {
    duration: 250,
    crop: { stackable: "wheat", amount: 1 },
    harvest: "grass",
  },
  seed: {
    duration: 250,
    crop: { stat: "mp", amount: 5 },
    harvest: "seed",
  },
};

export const harvestDurationFactor = 3;
