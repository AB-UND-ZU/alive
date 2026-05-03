import { World } from "../../engine";
import { ConditionType } from "../../engine/components/conditionable";
import { Harvestable, Resource } from "../../engine/components/harvestable";
import { Item, Material, Tool } from "../../engine/components/item";
import { colors } from "../assets/colors";

const harvestEfforts: Record<Resource, number> = {
  hedge: 2,
  plant: 6,
  tree: 4,
  oak: 11,
  rock: 3,
  mountain: 6,
  iron: 11,
  gold: 11,
};

const harvestYields: Record<Resource, Omit<Item, "carrier" | "bound">[]> = {
  hedge: [{ stackable: "leaf", amount: 1 }],
  plant: [{ stackable: "seed", amount: 1 }],
  tree: [{ stackable: "stick", amount: 1 }],
  oak: [
    { stackable: "resource", material: "wood", amount: 1 },
    { stackable: "leaf", amount: 3 },
  ],
  rock: [{ stackable: "ore", amount: 1 }],
  mountain: [{ stackable: "ore", amount: 1 }],
  iron: [{ stackable: "resource", material: "iron", amount: 1 }],
  gold: [{ stackable: "resource", material: "gold", amount: 1 }],
};

export const harvestScratches: Record<Resource, string> = {
  hedge: colors.green,
  plant: colors.green,
  tree: colors.maroon,
  oak: colors.maroon,
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
  hedge: "axe",
  plant: "axe",
  tree: "axe",
  oak: "axe",
  rock: "pickaxe",
  mountain: "pickaxe",
  iron: "pickaxe",
  gold: "pickaxe",
};

export type HarvestConfig = {
  harvestable: Harvestable;
  yields: Omit<Item, "carrier" | "bound">[];
};

export const getHarvestConfig = (
  world: World,
  resource: Resource,
  material: Material
): HarvestConfig => {
  const effort = harvestEfforts[resource];
  const yields = harvestYields[resource];

  if (!effort || !yields) {
    return {
      harvestable: {
        amount: 0,
        maximum: 0,
        material: "wood",
        resource: "tree",
      },
      yields: [],
    };
  }

  return {
    harvestable: {
      amount: effort,
      maximum: effort,
      resource,
      material,
    },
    yields,
  };
};
