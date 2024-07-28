import { Entity } from "ecs";
import { World } from "../ecs";

export type Position = {
  x: number;
  y: number;
};

export const POSITION = "POSITION";

export default function addPosition(world: World, entity: Entity, position: Position) {
  world.addComponentToEntity(entity, POSITION, position);
}
