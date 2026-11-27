import type { TypedEntity } from "../entities";
import { World } from "../ecs";

export type Focusable = {
  target?: number;
  pendingTarget?: number;
  highlight?: "quest" | "tombstone" | "enemy";
};

export const FOCUSABLE = "FOCUSABLE";

export default function addFocusable(
  world: World,
  entity: TypedEntity,
  focusable: Focusable
) {
  world.addComponentToEntity(entity, FOCUSABLE, focusable);
}
