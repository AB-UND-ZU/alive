import { Entity } from "ecs";
import { World } from "../ecs";
import { Position } from "./position";

export type Trackable = {
  target?: number;
  quadrant?: Position
};

export const TRACKABLE = "TRACKABLE";

export default function addMelee(
  world: World,
  entity: Entity,
  trackable: Trackable
) {
  world.addComponentToEntity(entity, TRACKABLE, trackable);
}
