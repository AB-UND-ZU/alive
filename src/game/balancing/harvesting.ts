import { World } from "../../engine";
import { Harvestable, Resource } from "../../engine/components/harvestable";
import { Item, Material } from "../../engine/components/item";

const harvestEfforts: Record<Resource, Partial<Record<Material, number>>> = {
  tree: {
    wood: 4,
    iron: 6,
  },
  rock: {
    wood: 6,
  },
};

const harvestYields: Record<
  Resource,
  Partial<Record<Material, Omit<Item, "carrier" | "bound">[]>>
> = {
  tree: {
    wood: [{ stackable: "stick", amount: 1 }],
    iron: [{ stackable: "stick", amount: 1 }],
  },
  rock: {
    wood: [{ stackable: "ore", amount: 1 }],
  },
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
  const effort = harvestEfforts[resource]?.[material];
  const yields = harvestYields[resource]?.[material];
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
