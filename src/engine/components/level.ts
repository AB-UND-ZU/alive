import { Entity } from "ecs";
import { World } from "../ecs";
import { Matrix } from "../../game/math/matrix";

export type Level = {
  // map[x][y][entityId] = entity
  map: Record<string, Record<string, Record<string, Entity>>>;
  walkable: Matrix<0 | 1>;
  size: number;
  initialized: boolean;
};

export const LEVEL = "LEVEL";

export default function addLevel(world: World, entity: Entity, level: Level) {
  world.addComponentToEntity(entity, LEVEL, level);
}
