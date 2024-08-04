import { Entity } from "ecs";
import { World } from "../ecs";

export type Point = [number, number];
export const orientations = ["up", "right", "down", "left"] as const;
export type Orientation = (typeof orientations)[number];
export const orientationPoints: Record<Orientation, Point> = {
  up: [0, -1],
  right: [1, 0],
  down: [0, 1],
  left: [-1, 0],
};

export type Movable = {
  orientations: Orientation[];
  pendingOrientation?: Orientation;
  reference: Entity;
};

export const MOVABLE = "MOVABLE";

export default function addMovable(
  world: World,
  entity: Entity,
  movable: Movable
) {
  world.addComponentToEntity(entity, MOVABLE, movable);
}
