import { Entity } from "ecs";
import { World } from "../ecs";
import { Point } from "../../game/math/std";

export const orientations = ["up", "right", "down", "left"] as const;
export type Orientation = (typeof orientations)[number];
export const orientationPoints: Record<Orientation, Point> = {
  up: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
};

export type Orientable = {
  facing?: Orientation;
};

export const ORIENTABLE = "ORIENTABLE";

export default function addMovable(
  world: World,
  entity: Entity,
  orientable: Orientable
) {
  world.addComponentToEntity(entity, ORIENTABLE, orientable);
}
