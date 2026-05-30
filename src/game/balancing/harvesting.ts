import { CellType } from "../../bindings/creation";
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
  post: 1,
  stump: 1,
  husk: 1,
  desert_husk: 1,
  root: 1,

  grass: 1,
  bush: 1,
  flower: 1,
  berry: 1,
  leaf: 1,
  sapling: 1,

  sand: 1,
  beach: 1,
  path: 1,
  rubble: 1,

  palisade: 11,
  hinge: 1,
  path_hinge: 1,
  footing: 1,
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
  post: [{ stackable: "stick", amount: 1 }],
  stump: [{ stackable: "stick", amount: 1 }],
  husk: [{ stackable: "stick", amount: 1 }],
  desert_husk: [{ stackable: "stick", amount: 1 }],
  root: [{ stackable: "stick", amount: 1 }],

  grass: [{ stackable: "grain", amount: 1 }],
  bush: [{ stackable: "grain", amount: 2 }],
  flower: [{ stackable: "flower", amount: 1 }],
  berry: [{ stackable: "berry", amount: 1 }],
  leaf: [{ stackable: "leaf", amount: 1 }],
  sapling: [{ stackable: "sapling", amount: 1 }],

  sand: [{ stackable: "sand", amount: 1 }],
  beach: [{ stackable: "sand", amount: 1 }],
  path: [{ stackable: "gravel", amount: 1 }],
  rubble: [{ stackable: "gravel", amount: 1 }],

  footing: [{ stackable: "ore", amount: 1 }],
  hinge: [{ stackable: "ore", amount: 1 }],
  path_hinge: [{ stackable: "ore", amount: 1 }],
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
  post: colors.maroon,
  stump: colors.maroon,
  husk: colors.maroon,
  desert_husk: colors.maroon,
  root: colors.maroon,

  grass: colors.yellow,
  bush: colors.yellow,
  berry: colors.purple,
  flower: colors.teal,
  leaf: colors.lime,
  sapling: colors.lime,

  sand: colors.yellow,
  beach: colors.yellow,
  path: colors.silver,
  rubble: colors.silver,

  palisade: colors.silver,
  footing: colors.silver,
  hinge: colors.silver,
  path_hinge: colors.silver,
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
  post: "shovel",
  stump: "shovel",
  husk: "shovel",
  desert_husk: "shovel",
  root: "shovel",

  grass: "shovel",
  bush: "shovel",
  flower: "shovel",
  berry: "shovel",
  leaf: "shovel",
  sapling: "shovel",

  sand: "shovel",
  beach: "shovel",
  path: "shovel",
  rubble: "shovel",

  palisade: "pickaxe",
  footing: "shovel",
  hinge: "shovel",
  path_hinge: "shovel",
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
      crop?: Omit<Item, "carrier" | "bound">;
      cell?: CellType;
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
  leaf: {
    duration: 100,
    cell: "hedge",
    harvest: "leaf",
  },
  sapling: {
    duration: 300,
    cell: "apple",
    harvest: "sapling",
  },
};

export const harvestDurationFactor = 3;
export const trenchResources = ["sand", "beach"];
export const pavingResources = ["path", "rubble"];
export const fillItems: Record<
  "beach" | "path",
  Omit<Item, "carrier" | "bound">
> = {
  path: { stackable: "gravel", amount: 1 },
  beach: { stackable: "sand", amount: 3 },
};
export const soilWaterDistance = 3;
