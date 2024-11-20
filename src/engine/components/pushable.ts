import { Entity } from "ecs";
import { World } from "../ecs";

export type Pushable = {};

export const PUSHABLE = "PUSHABLE";

export default function addPushable(
  world: World,
  entity: Entity,
  pushable: Pushable
) {
  world.addComponentToEntity(entity, PUSHABLE, pushable);
}
