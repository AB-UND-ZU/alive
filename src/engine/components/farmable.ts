import { Entity } from "ecs";
import { World } from "../ecs";
import { Stackable } from "./item";

export type Farmable = {
  watered: boolean;
  planted?: Stackable;
  sapling?: number;
  progress?: number;
  nextGeneration?: number;
};

export const FARMABLE = "FARMABLE";

export default function addFarmable(
  world: World,
  entity: Entity,
  farmable: Farmable
) {
  world.addComponentToEntity(entity, FARMABLE, farmable);
}
