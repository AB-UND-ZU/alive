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

export const getClosestQuadrant = (
  origin: Position,
  target: Position,
  size: number,
  ratio = aspectRatio,
  euclidean = true
) => {
  const gridOffset = { x: size, y: size };
  const gridTargets = [-1, 0, 1]
    .map((wrapX) =>
      [-1, 0, 1].map((wrapY) => ({
        point: add(target, { x: wrapX * size, y: wrapY * size }),
        quadrant: { x: wrapX, y: wrapY },
      }))
    )
    .flat();
  const closestQuadrants = gridTargets.sort(
    (left, right) =>
      getDistance(
        add(origin, gridOffset),
        add(left.point, gridOffset),
        size * 3,
        ratio,
        euclidean
      ) -
      getDistance(
        add(origin, gridOffset),
        add(right.point, gridOffset),
        size * 3,
        ratio,
        euclidean
      )
  );

  return closestQuadrants[0];
};

export const rotateOrientation = (orientation: Orientation, turns: number) =>
  orientations[
    normalize(orientations.indexOf(orientation) + turns, orientations.length)
  ];

export const invertOrientation = (orientation: Orientation) =>
  rotateOrientation(orientation, 2);

// finds shortes path in overlapping weighted matrix
export const findPath = (
  matrix: Matrix<number>,
  origin: Position,
  target: Position,
  targetWalkable: boolean = false,
  mustReach = false,
  quadrant?: Position
) => {
  const width = matrix.length / 2;
  const height = matrix[0].length / 2;
  const graph = new GraphImpl(matrix) as Graph;
  const normalizedOrigin = {
    x: normalize(origin.x, width),
    y: normalize(origin.y, height),
  };
  const normalizedTarget = {
    x: normalize(target.x, width),
    y: normalize(target.y, height),
  };

  // find shortest distance to target (assuming width === height)
  const closestQuadrant = quadrant
    ? { quadrant, point: normalizedTarget }
    : getClosestQuadrant(normalizedOrigin, normalizedTarget, width, 1, false);

  const shiftedOrigin = add(normalizedOrigin, {
    x: closestQuadrant.quadrant.x === -1 ? width : 0,
    y: closestQuadrant.quadrant.y === -1 ? height : 0,
  });
  const shiftedTarget = add(normalizedTarget, {
    x: Math.max(0, closestQuadrant.quadrant.x) * width,
    y: Math.max(0, closestQuadrant.quadrant.y) * height,
  });

  const targetNode = graph.grid[shiftedTarget.x][
    shiftedTarget.y
  ] as GridNode & { weight: number };
  if (targetWalkable) {
    targetNode.weight = 1;
  }

  const originNode = graph.grid[shiftedOrigin.x][
    shiftedOrigin.y
  ] as GridNode & { weight: number };
  originNode.weight = 1;
  const path = (astarImpl as typeof astar).search(
    graph,
    originNode,
    targetNode,
    { closest: !mustReach }
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
