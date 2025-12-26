import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { LEVEL } from "../components/level";
import { VIEWABLE } from "../components/viewable";
import { getActiveViewable } from "../../bindings/hooks";
import { createCell } from "../../bindings/creation";
import { add, directedDistance, normalize } from "../../game/math/std";
import { registerEntity } from "./map";
import { getWalkableMatrix } from "../../game/math/path";

const initializeOverscan = { x: 10, y: 6 };

export const initializeCell = (world: World, x: number, y: number) => {
  if (world.metadata.gameEntity[LEVEL].initialized[x][y]) return;

  const cells = [
    world.metadata.gameEntity[LEVEL].cells[x][y],
    ...(world.metadata.gameEntity[LEVEL].objects[x][y] || []),
  ];

  for (const cell of cells) {
    const createdEntities = createCell(world, { x, y }, cell, "hidden").all;

    for (const createdEntity of createdEntities) {
      if (POSITION in createdEntity) {
        registerEntity(world, createdEntity);
      }
    }
  }

  world.metadata.gameEntity[LEVEL].initialized[x][y] = true;
};

export const initializeArea = (
  world: World,
  topLeft: Position,
  bottomRight: Position
) => {
  const size = world.metadata.gameEntity[LEVEL].size;
  const delta = {
    x: directedDistance(topLeft.x, bottomRight.x, size),
    y: directedDistance(topLeft.y, bottomRight.y, size),
  };

  for (let offsetX = 0; offsetX <= delta.x; offsetX += 1) {
    for (let offsetY = 0; offsetY <= delta.y; offsetY += 1) {
      initializeCell(
        world,
        normalize(topLeft.x + offsetX, size),
        normalize(topLeft.y + offsetY, size)
      );
    }
  }
};

export default function setupInitialize(world: World) {
  let viewablePosition: Position | undefined;
  let worldName = "";

  const onUpdate = (delta: number) => {
    const level = world.metadata.gameEntity[LEVEL];

    // reset tracked position on changing worlds
    if (worldName !== level.name) {
      worldName = level.name;
      viewablePosition = undefined;
    }

    const size = world.metadata.gameEntity[LEVEL].size;
    const viewables = world.getEntities([VIEWABLE, POSITION]);
    const viewable = getActiveViewable(viewables);
    const currentPosition = viewable[POSITION];

    if (
      currentPosition &&
      (!viewablePosition ||
        viewablePosition.x !== currentPosition.x ||
        viewablePosition.y !== currentPosition.y)
    ) {
      const initializeCorner = {
        x:
          currentPosition.x -
          Math.floor(world.metadata.dimensions.renderedColumns / 2) -
          initializeOverscan.x,
        y:
          currentPosition.y -
          Math.floor(world.metadata.dimensions.renderedRows / 2) -
          initializeOverscan.y,
      };
      const initializeSize = {
        x: Math.min(
          size - 1,
          world.metadata.dimensions.renderedColumns + initializeOverscan.x * 2
        ),
        y: Math.min(
          size - 1,
          world.metadata.dimensions.renderedRows + initializeOverscan.y * 2
        ),
      };

      initializeArea(
        world,
        initializeCorner,
        add(initializeCorner, initializeSize)
      );

      viewablePosition = { ...currentPosition };
    }

    // initally create walkable matrix
    if (level.walkable.length === 0) {
      level.walkable = getWalkableMatrix(world);
    }
  };

  return { onUpdate };
}
