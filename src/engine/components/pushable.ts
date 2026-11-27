import type { TypedEntity } from "../entities";
import { World } from "../ecs";

export type Pushable = {};

export const PUSHABLE = "PUSHABLE";

export default function addPushable(
  world: World,
  entity: TypedEntity,
  pushable: Pushable
) {
  world.addComponentToEntity(entity, PUSHABLE, pushable);
}
