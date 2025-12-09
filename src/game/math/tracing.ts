import { Entity } from "ecs";
import { aspectRatio } from "../../components/Dimensions/sizing";
import { World } from "../../engine";
import { ENTERABLE } from "../../engine/components/enterable";
import { Level, LEVEL } from "../../engine/components/level";
import { LIGHT } from "../../engine/components/light";
import {
  Orientation,
  orientationPoints,
} from "../../engine/components/orientable";
import { getCell } from "../../engine/systems/map";
import { add, normalize, Point, reversed } from "./std";

type Interval = { start: number; end: number };
type Corner = { start: [Point, Point, Point]; end: [Point, Point, Point] };
type Iteration = {
  orientation: Orientation;
  direction: Point;
  normal: Point;
  corners: Corner;
  orientations: Record<Orientation, Corner>;
};

const corners = {
  upRight: { x: 0.5, y: -0.5 },
  rightDown: { x: 0.5, y: 0.5 },
  downLeft: { x: -0.5, y: 0.5 },
  leftUp: { x: -0.5, y: -0.5 },
};

const sides = {
  up: { x: 0, y: -0.5 },
  right: { x: 0.5, y: 0 },
  down: { x: 0, y: 0.5 },
  left: { x: -0.5, y: 0 },
};

export const iterations: Iteration[] = [
  // up
  {
    orientation: "up",
    direction: orientationPoints.up,
    normal: orientationPoints.right,
    corners: {
      start: [corners.downLeft, corners.downLeft, corners.leftUp],
      end: [corners.upRight, corners.rightDown, corners.rightDown],
    },
    orientations: {
      up: {
        start: [sides.left, sides.left, corners.leftUp],
        end: [corners.upRight, sides.right, sides.right],
      },
      right: {
        start: [sides.down, sides.down, sides.up],
        end: [corners.upRight, corners.rightDown, corners.rightDown],
      },
      down: {
        start: [corners.downLeft, corners.downLeft, sides.left],
        end: [sides.right, corners.rightDown, corners.rightDown],
      },
      left: {
        start: [corners.downLeft, corners.downLeft, corners.leftUp],
        end: [sides.up, sides.down, sides.down],
      },
    },
  },
  // right
  {
    orientation: "right",
    direction: orientationPoints.right,
    normal: orientationPoints.down,
    corners: {
      start: [corners.leftUp, corners.leftUp, corners.upRight],
      end: [corners.rightDown, corners.downLeft, corners.downLeft],
    },
    orientations: {
      up: {
        start: [corners.leftUp, corners.leftUp, corners.upRight],
        end: [sides.right, sides.left, sides.left],
      },
      right: {
        start: [sides.up, sides.up, corners.upRight],
        end: [corners.rightDown, sides.down, sides.down],
      },
      down: {
        start: [sides.left, sides.left, sides.right],
        end: [corners.rightDown, corners.downLeft, corners.downLeft],
      },
      left: {
        start: [corners.leftUp, corners.leftUp, sides.up],
        end: [sides.down, corners.downLeft, corners.downLeft],
      },
    },
  },
  // down
  {
    orientation: "down",
    direction: orientationPoints.down,
    normal: orientationPoints.left,
    corners: {
      start: [corners.upRight, corners.upRight, corners.rightDown],
      end: [corners.downLeft, corners.leftUp, corners.leftUp],
    },
    orientations: {
      up: {
        start: [corners.upRight, corners.upRight, sides.right],
        end: [sides.left, corners.leftUp, corners.leftUp],
      },
      right: {
        start: [corners.upRight, corners.upRight, corners.rightDown],
        end: [sides.down, sides.up, sides.up],
      },
      down: {
        start: [sides.right, sides.right, corners.rightDown],
        end: [corners.downLeft, sides.left, sides.left],
      },
      left: {
        start: [sides.up, sides.up, sides.down],
        end: [corners.downLeft, corners.leftUp, corners.leftUp],
      },
    },
  },
  // left
  {
    orientation: "left",
    direction: orientationPoints.left,
    normal: orientationPoints.up,
    corners: {
      start: [corners.rightDown, corners.rightDown, corners.downLeft],
      end: [corners.leftUp, corners.upRight, corners.upRight],
    },
    orientations: {
      up: {
        start: [sides.right, sides.right, sides.left],
        end: [corners.leftUp, corners.upRight, corners.upRight],
      },
      right: {
        start: [corners.rightDown, corners.rightDown, sides.down],
        end: [sides.up, corners.upRight, corners.upRight],
      },
      down: {
        start: [corners.rightDown, corners.rightDown, corners.downLeft],
        end: [sides.left, sides.right, sides.right],
      },
      left: {
        start: [sides.down, sides.down, corners.downLeft],
        end: [corners.leftUp, sides.up, sides.up],
      },
    },
  },
];

export const reversedIterations = [...iterations].reverse();

const getOrientedBoundaries = (
  iteration: Iteration,
  orientation?: Orientation
) => (orientation ? iteration.orientations[orientation] : iteration.corners);

// select respective corner along the direction of normal
const getCorner = (
  iteration: Iteration,
  segment: keyof Corner,
  orientation: Orientation | undefined,
  normal: number,
  point: number
) => {
  const boundaries = getOrientedBoundaries(iteration, orientation)[segment];
  if (normal * point < 0) return boundaries[0];
  if (normal * point > 0) return boundaries[2];
  return boundaries[1];
};

// degrees are counted from top center clockwise, from 0 to 360
export const pointToDegree = (point: Point) => {
  const radian = Math.atan2(point.y, point.x);
  return ((radian * 180) / Math.PI + 450) % 360;
};

// return the degree interval for the outermost visible corners relative from viewer.
// if it crosses 360°, create two separate intervals
const cellToIntervals = (
  iteration: Iteration,
  point: Point,
  orientation?: Orientation
): Interval[] => {
  const startPoint = {
    x:
      point.x +
      getCorner(iteration, "start", orientation, iteration.normal.y, point.y).x,
    y:
      point.y +
      getCorner(iteration, "start", orientation, iteration.normal.x, point.x).y,
  };

  const endPoint = {
    x:
      point.x +
      getCorner(iteration, "end", orientation, iteration.normal.y, point.y).x,
    y:
      point.y +
      getCorner(iteration, "end", orientation, iteration.normal.x, point.x).y,
  };

  const start = pointToDegree(startPoint);
  const end = pointToDegree(endPoint);

  return start <= end
    ? [{ start, end }]
    : [
        { start: 0, end },
        { start, end: 360 },
      ];
};

export const degreesToOrientations = (degrees: number): Orientation[] => {
  const normalized = degrees % 360;

  const step = 360 / 16;

  if (normalized <= step) return ["up"];
  if (normalized <= step * 2) return ["up", "right"];
  if (normalized <= step * 3) return ["right", "up"];
  if (normalized <= step * 5) return ["right"];
  if (normalized <= step * 6) return ["right", "down"];
  if (normalized <= step * 7) return ["down", "right"];
  if (normalized <= step * 9) return ["down"];
  if (normalized <= step * 10) return ["down", "left"];
  if (normalized <= step * 11) return ["left", "down"];
  if (normalized <= step * 13) return ["left"];
  if (normalized <= step * 14) return ["left", "up"];
  if (normalized <= step * 15) return ["up", "left"];
  return ["up"];
};

// given a list of angle intervals for visible ranges, determine if any part of the target is visible
const isVisible = (
  iteration: Iteration,
  point: Point,
  intervals: Interval[]
) => {
  const targetIntervals = cellToIntervals(iteration, point);

  // check if start and end points are contained by any sub interval, inclusively
  // or if any interval is only within the cell's boundaries
  return targetIntervals.some((targetInterval) =>
    intervals.some(
      (visibleInterval) =>
        (visibleInterval.start <= targetInterval.start &&
          targetInterval.start <= visibleInterval.end) ||
        (visibleInterval.start <= targetInterval.end &&
          targetInterval.end <= visibleInterval.end) ||
        (targetInterval.start <= visibleInterval.start &&
          visibleInterval.end <= targetInterval.end)
    )
  );
};

const getObstructing = (world: World, point: Point) => {
  const cell = getCell(world, point);

  if (!cell) return;

  for (const entityId in cell) {
    const entity = cell[entityId];

    if (LIGHT in entity && entity[LIGHT].darkness > 0) return entity;
  }

  return;
};

export const getOpaqueOrientation = (world: World, entity: Entity) => {
  if (entity[ENTERABLE]?.inside) {
    const insideOrientation = entity[ENTERABLE].orientation;
    if (insideOrientation === null) return undefined;
    if (insideOrientation) return insideOrientation;
  }

  return entity[LIGHT].orientation;
};

// manually adjusted extension of radius
const bias = 0.25;

const isInRadius = (delta: Point, radius: number) =>
  Math.sqrt((delta.x * aspectRatio) ** 2 + delta.y ** 2) <= radius + bias;

const processCell = ({
  world,
  level,
  visibleCells,
  radius,
  direction,
  normal,
  iteration,
  intervals,
  cell,
}: {
  world: World;
  level: Level;
  visibleCells: Point[];
  radius: number;
  direction: number;
  normal: number;
  iteration: Iteration;
  intervals: Interval[];
  cell: Point;
}) => {
  const delta = {
    x: direction * iteration.direction.x + normal * iteration.normal.x,
    y: direction * iteration.direction.y + normal * iteration.normal.y,
  };

  // break if out of radius or already obstructed
  if (!isInRadius(delta, radius) || !isVisible(iteration, delta, intervals)) {
    return intervals;
  }

  const normalized = {
    x: normalize(cell.x + delta.x, level.size),
    y: normalize(cell.y + delta.y, level.size),
  };

  visibleCells.push(normalized);

  const obstructingEntity = getObstructing(world, normalized);
  if (obstructingEntity) {
    const opaqueOrientation = getOpaqueOrientation(world, obstructingEntity);
    const cellIntervals = cellToIntervals(iteration, delta, opaqueOrientation);

    // the cell is visible therefore there is at least one overlap, or an interval within the cell boundaries
    for (const cellInterval of cellIntervals) {
      // find overlapping visible interval
      const newIntervals: Interval[] = [];
      const startIndex = intervals.findIndex(
        (visibleInterval) =>
          visibleInterval.start <= cellInterval.start &&
          cellInterval.start <= visibleInterval.end
      );
      const endIndex = intervals.findLastIndex(
        (visibleInterval) =>
          visibleInterval.start <= cellInterval.end &&
          cellInterval.end <= visibleInterval.end
      );

      // add any previous intervals
      for (const interval of intervals) {
        // entered the cell interval
        if (cellInterval.start <= interval.end) break;

        newIntervals.push(interval);
      }

      // add trimmed start interval
      if (
        startIndex !== -1 &&
        intervals[startIndex].start < cellInterval.start
      ) {
        newIntervals.push({
          start: intervals[startIndex].start,
          end: cellInterval.start,
        });
      }

      // add trimmed end interval
      if (endIndex !== -1 && cellInterval.end < intervals[endIndex].end) {
        newIntervals.push({
          start: cellInterval.end,
          end: intervals[endIndex].end,
        });
      }

      // add any following intervals
      const followingIntervals = [];
      for (const interval of reversed(intervals)) {
        // entered the cell interval
        if (interval.start <= cellInterval.end) break;

        followingIntervals.unshift(interval);
      }
      newIntervals.push.apply(newIntervals, followingIntervals);

      intervals = newIntervals;
    }
  }

  return intervals;
};

export const traceCircularVisiblity = (
  world: World,
  point: Point,
  radius: number
) => {
  if (radius === 0) return [];

  const visibleCells: Point[] = [point];
  // if standing within full obstructed terrain
  const obstructingCenter = getObstructing(world, point);
  if (obstructingCenter && !obstructingCenter[LIGHT].orientation)
    return visibleCells;

  const level = world.metadata.gameEntity[LEVEL];
  let visibleIntervals: Interval[] = [{ start: 0, end: 360 }];
  const args = { world, level, visibleCells, radius };

  for (let direction = 1; direction <= radius / aspectRatio; direction += 1) {
    // process side normals before corners
    for (const iteration of iterations) {
      // center
      visibleIntervals = processCell({
        ...args,
        direction,
        normal: 0,
        iteration,
        intervals: visibleIntervals,
        cell: point,
      });

      for (let normal = 1; normal < direction; normal += 1) {
        // forwards
        visibleIntervals = processCell({
          ...args,
          direction,
          normal,
          iteration,
          intervals: visibleIntervals,
          cell: point,
        });
        // backwards
        visibleIntervals = processCell({
          ...args,
          direction,
          normal: -normal,
          iteration,
          intervals: visibleIntervals,
          cell: point,
        });
      }
    }

    // process corners
    for (const iteration of iterations) {
      visibleIntervals = processCell({
        ...args,
        direction,
        normal: direction,
        iteration,
        intervals: visibleIntervals,
        cell: point,
      });
    }
  }

  return visibleCells;
};

export const cellIntersectsCircle = (
  cell: Point,
  circle: Point,
  radius: number,
  ratio = aspectRatio
) => {
  const closestX = Math.max(cell.x, Math.min(circle.x, cell.x + ratio));
  const closestY = Math.max(cell.y, Math.min(circle.y, cell.y + 1));

  const delta = { x: closestX - circle.x, y: closestY - circle.y };
  const distance = delta.x * delta.x + delta.y * delta.y;

  return distance <= radius * radius;
};

export const pixelCircle = (
  center: Point,
  radius: number,
  ratio = aspectRatio
) => {
  const width = Math.ceil(ratio * radius);
  const height = Math.ceil(radius);
  const points: Point[] = [];

  for (let x = -width; x <= width; x += 1) {
    for (let y = -height; y <= height; y += 1) {
      const point = { x, y };
      const offset = {
        x: Math.sign(x) * 0.5,
        y: Math.sign(y) * 0.5,
      };
      const outer = add(point, offset);
      const outerRadius = Math.sqrt(outer.x ** 2 + outer.y ** 2);
      const inner = add(point, { x: -offset.x, y: -offset.y });
      const innerRadius = Math.sqrt(inner.x ** 2 + inner.y ** 2);

      if (innerRadius <= radius && radius <= outerRadius) {
        points.push(add(center, point));
      }
    }
  }

  return points;
};
