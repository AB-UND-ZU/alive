// @ts-ignore
import { Graph as GraphImpl, astar as astarImpl } from "javascript-astar";
import { World } from "../../engine";
import { Position } from "../../engine/components/position";
import { LEVEL } from "../../engine/components/level";
import { Matrix, matrixFactory } from "./matrix";
import { isWalkable } from "../../engine/systems/movement";
import { add, getDistance, normalize, signedDistance } from "./std";
import { degreesToOrientations, pointToDegree } from "./tracing";
import { aspectRatio } from "../../components/Dimensions/sizing";
import { Orientation, orientations } from "../../engine/components/orientable";

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

export const invertOrientation = (orientation: Orientation) =>
  orientations[(orientations.indexOf(orientation) + 2) % orientations.length];

// finds shortes path in overlapping weighted matrix
export const findPath = (
  matrix: Matrix<number>,
  origin: Position,
  target: Position,
  targetWalkable: boolean = false
) => {
  const width = matrix.length / 2;
  const height = matrix[0].length / 2;
  const graph = new GraphImpl(matrix) as Graph;
  const centeredOrigin = {
    x: width + signedDistance(width, origin.x, width),
    y: height + signedDistance(height, origin.y, height),
  };
  const originNode = graph.grid[centeredOrigin.x][
    centeredOrigin.y
  ] as GridNode & { weight: number };
  originNode.weight = 1;

  // find shortest distance to target
  const matrixTargets = [0, 1]
    .map((wrapX) =>
      [0, 1].map((wrapY) =>
        add(target, { x: wrapX * width, y: wrapY * height })
      )
    )
    .flat();
  const centeredTarget = [...matrixTargets].sort(
    (left, right) =>
      getDistance(centeredOrigin, left, width * 2, 1, false) -
      getDistance(centeredOrigin, right, width * 2, 1, false)
  )[0];
  
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
    x: normalize(node.x, width),
    y: normalize(node.y, height),
  }));
};

export const findPathSimple = (
  matrix: Matrix<number>,
  origin: Position,
  target: Position
) => {
  const graph = new GraphImpl(matrix) as Graph;
  const originNode = graph.grid[origin.x][origin.y];
  const targetNode = graph.grid[target.x][target.y];

  const path = (astarImpl as typeof astar).search(
    graph,
    originNode,
    targetNode
  );

  return path.map((node) => ({ x: node.x, y: node.y }));
};
