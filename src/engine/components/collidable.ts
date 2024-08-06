import { Entity } from "ecs";
import { World } from "../ecs";

export type Collidable = {};

export const COLLIDABLE = "COLLIDABLE";

export default function addCollidable(
  world: World,
  entity: Entity,
  collidable: Collidable
) {
  world.addComponentToEntity(entity, COLLIDABLE, collidable);
}
