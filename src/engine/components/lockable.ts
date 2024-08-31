import { Entity } from "ecs";
import { World } from "../ecs";

export type Lockable = {
  locked: boolean;
};

export const LOCKABLE = "LOCKABLE";

export default function addLockable(
  world: World,
  entity: Entity,
  lockable: Lockable
) {
  world.addComponentToEntity(entity, LOCKABLE, lockable);
}
