import { Entity } from "ecs";
import { World } from "../ecs";

export type Trackable = {
  target?: number;
};

export const TRACKABLE = "TRACKABLE";

export default function addMelee(
  world: World,
  entity: Entity,
  trackable: Trackable
) {
  world.addComponentToEntity(entity, TRACKABLE, trackable);
}
