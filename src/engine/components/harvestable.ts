import { Entity } from "ecs";
import { World } from "../ecs";

export type Resource =
  | "rotten"
  | "hedge"
  | "plant"
  | "tree"
  | "oak"
  | "palm"
  | "cactus"
  | "box"
  | "sign"
  | "fence"
  | "palisade"
  | "rock"
  | "mountain"
  | "iron"
  | "gold";

export type Harvestable = {
  resource: Resource;
  amount: number;
  maximum: number;
};

export type HarvestStats = {
  logging: number;
  mining: number;
  fishing: number;
};

export const emptyHarvestStats: HarvestStats = {
  logging: 0,
  mining: 0,
  fishing: 0,
};

export const HARVESTABLE = "HARVESTABLE";

export default function addHarvestable(
  world: World,
  entity: Entity,
  harvestable: Harvestable
) {
  world.addComponentToEntity(entity, HARVESTABLE, harvestable);
}
