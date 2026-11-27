import type { TypedEntity } from "../entities";
import { World } from "../ecs";
import type { SpringConfig } from "@react-spring/three";
import { Orientation } from "./orientable";

export type Movable = {
  orientations: Orientation[];
  pendingOrientation?: Orientation;
  momentum?: Orientation;
  reference: number;
  spring?: SpringConfig;
  lastInteraction: number;
  flying: boolean;
  swimming: boolean;
};

export const MOVABLE = "MOVABLE";

export default function addMovable(
  world: World,
  entity: TypedEntity,
  movable: Movable
) {
  world.addComponentToEntity(entity, MOVABLE, movable);
}
