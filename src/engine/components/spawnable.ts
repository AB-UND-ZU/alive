import { Entity } from "ecs";
import { World } from "../ecs";
import { Position } from "./position";

export type Spawnable = {
  position: Position
};

export const SPAWNABLE = "SPAWNABLE";

export default function addSpawnable(
  world: World,
  entity: Entity,
  spawnable: Spawnable
) {
  world.addComponentToEntity(entity, SPAWNABLE, spawnable);
}
