import type { TypedEntity } from "../entities";
import { World } from "../ecs";
import { Position } from "./position";

export type Trackable = {
  target?: number;
  quadrant?: Position
};

export const TRACKABLE = "TRACKABLE";

export default function addMelee(
  world: World,
  entity: TypedEntity,
  trackable: Trackable
) {
  world.addComponentToEntity(entity, TRACKABLE, trackable);
}
