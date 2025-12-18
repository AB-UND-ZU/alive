import { Entity } from "ecs";
import { World } from "../../engine";
import { LevelName } from "../../engine/components/level";
import { islandName, islandSize, generateIsland } from "./island";
import { generateMenu, menuName, menuSize } from "./menu";
import { generateTutorial, tutorialName, tutorialSize } from "./tutorial";
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
    vision: 6,
  },
  LEVEL_TUTORIAL: {
    name: "Dungeon",
    warps: ["LEVEL_ISLAND"],
    mapOffsetX: -3,
    mapOffsetY: 9,
    size: tutorialSize,
    generator: generateTutorial,
    vision: 23,
  },
  LEVEL_ISLAND: {
    name: "Island",
    warps: [],
    mapOffsetX: 3,
    mapOffsetY: 15,
    size: islandSize,
    generator: generateIsland,
    vision: 0,
  },
};
