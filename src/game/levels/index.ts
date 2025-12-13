import { Entity } from "ecs";
import { World } from "../../engine";
import { LevelName } from "../../engine/components/level";
import { Position } from "../../engine/components/position";
import { islandName, islandSize, generateIsland } from "./island";
import { islandSpawn } from "./island/areas";
import { generateMenu, menuName, menuSize } from "./menu";
import { menuSpawn } from "./menu/areas";
import { generateTutorial, tutorialName, tutorialSize } from "./tutorial";
import { tutorialSpawn } from "./tutorial/areas";
import { getVerticalIndex } from "../../engine/systems/popup";

export const getSelectedLevel = (world: World, warpEntity: Entity) => {
  const verticalIndex = getVerticalIndex(world, warpEntity);

  if (verticalIndex < 4) return menuName;
  else if (verticalIndex < 10) return tutorialName;
  else return islandName;
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
    vision: number;
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
    vision: 6,
  },
  LEVEL_TUTORIAL: {
    name: "Dungeon",
    warps: ["LEVEL_ISLAND"],
    mapOffsetX: -3,
    mapOffsetY: 9,
    size: tutorialSize,
    generator: generateTutorial,
    spawn: tutorialSpawn,
    vision: 23,
  },
  LEVEL_ISLAND: {
    name: "Island",
    warps: [],
    mapOffsetX: 3,
    mapOffsetY: 15,
    size: islandSize,
    generator: generateIsland,
    spawn: islandSpawn,
    vision: 0,
  },
};
