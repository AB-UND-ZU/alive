import { Entity } from "ecs";
import { World } from "../ecs";

export type Level = {
  // map[x][y][entityId] = entity
  map: Record<number, Entity>[][];
  size: number;
};

export const LEVEL = "LEVEL";

export default function addLevel(world: World, entity: Entity, level: Level) {
  world.addComponentToEntity(entity, LEVEL, level);
}
