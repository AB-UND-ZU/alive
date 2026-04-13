import { Entity } from "ecs";
import { World } from "../../engine";
import { LevelName } from "../../engine/components/level";
import { islandSize, generateIsland } from "./island";
import { generateMenu, menuSize } from "./menu";
import { generateTutorial, tutorialSize } from "./tutorial";
import { getVerticalIndex } from "../../engine/systems/popup";

export const getSelectedLevel = (world: World, warpEntity: Entity) => {
  const verticalIndex = getVerticalIndex(world, warpEntity);

  for (const key in levelConfig) {
    const levelName = key as LevelName;
    if (verticalIndex <= levelConfig[levelName].mapOffsetY) {
      return levelName;
    }
  }
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
    mapOffsetY: 2,
    size: menuSize,
    generator: generateMenu,
    vision: 6,
  },
  LEVEL_TUTORIAL: {
    name: "Dungeon",
    warps: ["LEVEL_ISLAND"],
    mapOffsetX: -3,
    mapOffsetY: 8,
    size: tutorialSize,
    generator: generateTutorial,
    vision: 23,
  },
  LEVEL_ISLAND: {
    name: "Island",
    warps: [],
    mapOffsetX: 3,
    mapOffsetY: 14,
    size: islandSize,
    generator: generateIsland,
    vision: 0,
  },
};
