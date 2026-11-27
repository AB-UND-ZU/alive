import type { TypedEntity } from "../entities";
import { World } from "../ecs";

export type Collectable = {};

export const COLLECTABLE = "COLLECTABLE";

export default function addCollectable(
  world: World,
  entity: TypedEntity,
  collectable: Collectable
) {
  world.addComponentToEntity(entity, COLLECTABLE, collectable);
}
