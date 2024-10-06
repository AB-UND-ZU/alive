import { Entity } from "ecs";
import { World } from "../ecs";
import { Material } from "./item";

export type Lockable = {
  locked: boolean;
  material: Material;
};

export const LOCKABLE = "LOCKABLE";

export default function addLockable(
  world: World,
  entity: Entity,
  lockable: Lockable
) {
  world.addComponentToEntity(entity, LOCKABLE, lockable);
}
