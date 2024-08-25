import { Entity } from "ecs";
import { World } from "../ecs";
import { SpringConfig } from "@react-spring/three";
import { Orientation } from "./orientable";

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
