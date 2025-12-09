import { Entity } from "ecs";
import { World } from "../../engine";
import { LevelName } from "../../engine/components/level";
import { Light } from "../../engine/components/light";
import { Position } from "../../engine/components/position";
import {
  defaultLight,
  roomLight,
  spawnLight,
} from "../../engine/systems/consume";
import { forestName, forestSize, generateForest } from "./forest";
import { forestSpawn } from "./forest/areas";
import { generateMenu, menuName, menuSize } from "./menu";
import { menuSpawn } from "./menu/areas";
import { generateTutorial, tutorialName, tutorialSize } from "./tutorial";
import { overworldSpawn } from "./tutorial/areas";
import { getVerticalIndex } from "../../engine/systems/popup";

export const getSelectedLevel = (world: World, warpEntity: Entity) => {
  const verticalIndex = getVerticalIndex(world, warpEntity);

  if (verticalIndex < 4) return menuName;
  else if (verticalIndex < 10) return tutorialName;
  else return forestName;
};

export const levelConfig: Record<
  LevelName,
  {
    name: string;
    warps: LevelName[];
    mapOffsetX: number;
    mapOffsetY: number;
    size: number;
    generator: (world: World) => void;
    spawn: Position;
    light: Light;
  }
> = {
  LEVEL_MENU: {
    name: "Menu",
    warps: ["LEVEL_TUTORIAL"],
    mapOffsetX: 0,
    mapOffsetY: 3,
    size: menuSize,
    generator: generateMenu,
    spawn: menuSpawn,
    light: spawnLight,
  },
  LEVEL_TUTORIAL: {
    name: "Dungeon",
    warps: ["LEVEL_FOREST"],
    mapOffsetX: -3,
    mapOffsetY: 9,
    size: tutorialSize,
    generator: generateTutorial,
    spawn: overworldSpawn,
    light: roomLight,
  },
  LEVEL_FOREST: {
    name: "Island",
    warps: [],
    mapOffsetX: 3,
    mapOffsetY: 15,
    size: forestSize,
    generator: generateForest,
    spawn: forestSpawn,
    light: defaultLight,
  },
};
