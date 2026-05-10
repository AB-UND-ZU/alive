import { Entity } from "ecs";
import { World } from "../ecs";
import { Element, Material, Materialized } from "./item";
import { Sprite } from "./sprite";

export type Lockable = {
  locked: boolean;
  material?: Material;
  element?: Element;
  sprite?: Sprite;
  type: Materialized;
};

export const LOCKABLE = "LOCKABLE";

export default function addLockable(
  world: World,
  entity: Entity,
  lockable: Lockable
) {
  world.addComponentToEntity(entity, LOCKABLE, lockable);
}
