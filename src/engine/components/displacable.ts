import { Entity } from "ecs";
import { World } from "../ecs";

export type Displacable = {};

export const DISPLACABLE = "DISPLACABLE";

export default function addDisplacable(
  world: World,
  entity: Entity,
  displacable: Displacable
) {
  world.addComponentToEntity(entity, DISPLACABLE, displacable);
}
