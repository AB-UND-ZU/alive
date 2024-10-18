import { Entity } from "ecs";
import { World } from "../ecs";

export type Collectable = {};

export const COLLECTABLE = "COLLECTABLE";

export default function addCollectable(
  world: World,
  entity: Entity,
  collectable: Collectable
) {
  world.addComponentToEntity(entity, COLLECTABLE, collectable);
}
