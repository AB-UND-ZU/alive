import { Entity } from "ecs";
import { World } from "../ecs";
import { Matrix } from "../../game/math/matrix";
import { Position } from "./position";

export type LevelName = "LEVEL_MENU" | "LEVEL_TUTORIAL" | "LEVEL_ISLAND";

export type Level = {
  name: LevelName;
  // map[x][y][entityId] = entity
  map: Record<number, Record<number, Record<string, Entity>>>;
  walkable: Matrix<0 | 1>;
  cells: Record<string, Position[]>;
  size: number;
  initialized: boolean;
  weather?: "rain" | "snow";
};

export const LEVEL = "LEVEL";

export default function addLevel(world: World, entity: Entity, level: Level) {
  world.addComponentToEntity(entity, LEVEL, level);
}
