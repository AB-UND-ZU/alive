import { Entity } from "ecs";
import { World } from "../ecs";

export type Fishable = {
  population: number;
};

export const FISHABLE = "FISHABLE";

export default function addFishable(
  world: World,
  entity: Entity,
  fishable: Fishable
) {
  world.addComponentToEntity(entity, FISHABLE, fishable);
}
