import { Entity } from "ecs";
import { World } from "../ecs";

export type Movable = {
  dx: number;
  dy: number;
};

export const MOVABLE = "MOVABLE";

export default function addMovable(world: World, entity: Entity, movable: Movable) {
  world.addComponentToEntity(entity, MOVABLE, movable);
}
