import type { TypedEntity } from "../entities";
import { World } from "../ecs";
import { Matrix } from "../../game/math/matrix";
import { Position } from "./position";
import { CellType } from "../../bindings/creation";

export type LevelName = "LEVEL_MENU" | "LEVEL_TUTORIAL" | "LEVEL_ISLAND";

export type BiomeName = "jungle" | "desert" | "ocean" | "glacier";

export type Level = {
  name: LevelName;
  // map[x][y][entityId] = entity
  map: Record<number, Record<number, Record<string, TypedEntity<"POSITION">>>>;
  walkable: Matrix<0 | 1>;
  biomes: Matrix<BiomeName>;
  cells: Matrix<CellType>;
  objects: Matrix<CellType[] | undefined>;
  cellPositions: Record<string, Position[]>;
  size: number;
  initialized: Matrix<boolean>;
};

export const LEVEL = "LEVEL";

export default function addLevel(world: World, entity: TypedEntity, level: Level) {
  world.addComponentToEntity(entity, LEVEL, level);
}
