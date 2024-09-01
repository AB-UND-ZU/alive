import { Entity } from "ecs";
import { World } from "../ecs";

export type Focusable = {
  target?: number;
  pendingTarget?: number;
};

export const FOCUSABLE = "FOCUSABLE";

export default function addFocusable(
  world: World,
  entity: Entity,
  focusable: Focusable
) {
  world.addComponentToEntity(entity, FOCUSABLE, focusable);
}
