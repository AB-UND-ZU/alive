import { Entity } from "ecs";
import { World } from "../ecs";
import { Material } from "./item";

export type Resource =
  | "hedge"
  | "plant"
  | "tree"
  | "oak"
  | "rock"
  | "mountain"
  | "iron"
  | "gold";

export type Harvestable = {
  resource: Resource;
  material: Material;
  amount: number;
  maximum: number;
};

export const HARVESTABLE = "HARVESTABLE";

export default function addHarvestable(
  world: World,
  entity: Entity,
  harvestable: Harvestable
) {
  world.addComponentToEntity(entity, HARVESTABLE, harvestable);
}
