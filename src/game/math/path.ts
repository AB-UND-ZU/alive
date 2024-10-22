// @ts-ignore
import { Graph as GraphImpl, astar as astarImpl } from "javascript-astar";
import { World } from "../../engine";
import { Position } from "../../engine/components/position";
import { LEVEL } from "../../engine/components/level";
import { matrixFactory } from "./matrix";
import { isWalkable } from "../../engine/systems/movement";
import { normalize, signedDistance } from "./std";
import { degreesToOrientations, pointToDegree } from "./tracing";
import { aspectRatio } from "../../components/Dimensions/sizing";

export const getWalkableMatrix = (world: World) => {
  const size = world.metadata.gameEntity[LEVEL].size;

  return matrixFactory(size * 2, size * 2, (x, y) =>
    isWalkable(world, { x, y }) ? 1 : 0
  );
};

export const relativeOrientations = (
  world: World,
  origin: Position,
  target: Position,
  ratio: number = aspectRatio
) => {
  if (origin.x === target.x && origin.y === target.y) return [];

  const size = world.metadata.gameEntity[LEVEL].size;
  const delta = {
    x: signedDistance(origin.x, target.x, size) * ratio,
    y: signedDistance(origin.y, target.y, size),
  };
  return degreesToOrientations(pointToDegree(delta));
};

export const findPath = (
  world: World,
  origin: Position,
  target: Position,
  targetWalkable: boolean = false
) => {
  const size = world.metadata.gameEntity[LEVEL].size;
  const graph = new GraphImpl(
    world.metadata.gameEntity[LEVEL].walkable
  ) as Graph;
  const centeredOrigin = {
    x: size + signedDistance(size, origin.x, size),
    y: size + signedDistance(size, origin.y, size),
  };
  const originNode = graph.grid[centeredOrigin.x][
    centeredOrigin.y
  ] as GridNode & { weight: number };
  originNode.weight = 1;
  const centeredTarget = {
    x: size + signedDistance(size, target.x, size),
    y: size + signedDistance(size, target.y, size),
  };
  const targetNode = graph.grid[centeredTarget.x][
    centeredTarget.y
  ] as GridNode & { weight: number };
  if (targetWalkable) {
    targetNode.weight = 1;
  }

  const path = (astarImpl as typeof astar).search(
    graph,
    originNode,
    targetNode,
    { closest: true }
  );

  // normalize path values
  return path.map((node) => ({
    x: normalize(node.x, size),
    y: normalize(node.y, size),
  }));
};
