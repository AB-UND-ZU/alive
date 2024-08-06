import { Entity } from "ecs";
import { World } from "../ecs";
import { SpringConfig } from "@react-spring/three";

export type Point = { x: number; y: number };
export const orientations = ["up", "right", "down", "left"] as const;
export type Orientation = (typeof orientations)[number];
export const orientationPoints: Record<Orientation, Point> = {
  up: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
};

export type Movable = {
  orientations: Orientation[];
  pendingOrientation?: Orientation;
  reference: number;
  spring?: SpringConfig;
};

export const MOVABLE = "MOVABLE";

export default function addMovable(
  world: World,
  entity: Entity,
  movable: Movable
) {
  world.addComponentToEntity(entity, MOVABLE, movable);
}
