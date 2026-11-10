import { Entity } from "ecs";
import { World } from "../ecs";

export type Displacable = { pushSound?: boolean };

export const DISPLACABLE = "DISPLACABLE";

export default function addDisplacable(
  world: World,
  entity: Entity,
  displacable: Displacable
) {
  world.addComponentToEntity(entity, DISPLACABLE, displacable);
}
