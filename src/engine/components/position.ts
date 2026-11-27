import type { TypedEntity } from "../entities";
import { World } from "../ecs";

export type Position = {
  x: number;
  y: number;
};

export const POSITION = "POSITION";

export default function addPosition(world: World, entity: TypedEntity, position: Position) {
  world.addComponentToEntity(entity, POSITION, position);
}
