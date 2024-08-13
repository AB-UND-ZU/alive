import { aspectRatio } from "../../components/Dimensions/sizing";
import { World } from "../../engine";
import { Level, LEVEL } from "../../engine/components/level";
import { LIGHT } from "../../engine/components/light";
import { Point } from "../../engine/components/movable";
import { normalize } from "./std";

type Interval = { start: number; end: number };
type Iteration = {
  direction: Point;
  normal: Point;
  corners: { start: Point[]; end: Point[] };
};

const corners = {
  upRight: { x: 0.5, y: -0.5 },
  rightDown: { x: 0.5, y: 0.5 },
  downLeft: { x: -0.5, y: 0.5 },
  leftUp: { x: -0.5, y: -0.5 },
};

const iterations: Iteration[] = [
  // up
  {
    direction: { x: 0, y: -1 },
    normal: { x: 1, y: 0 },
    corners: {
      start: [corners.downLeft, corners.downLeft, corners.leftUp],
      end: [corners.upRight, corners.rightDown, corners.rightDown],
    },
  },
  // right
  {
    direction: { x: 1, y: 0 },
    normal: { x: 0, y: 1 },
    corners: {
      start: [corners.leftUp, corners.leftUp, corners.upRight],
      end: [corners.rightDown, corners.downLeft, corners.downLeft],
    },
  },
  // down
  {
    direction: { x: 0, y: 1 },
    normal: { x: -1, y: 0 },
    corners: {
      start: [corners.upRight, corners.upRight, corners.rightDown],
      end: [corners.downLeft, corners.leftUp, corners.leftUp],
    },
  },
  // left
  {
    direction: { x: -1, y: 0 },
    normal: { x: 0, y: -1 },
    corners: {
      start: [corners.rightDown, corners.rightDown, corners.downLeft],
      end: [corners.leftUp, corners.upRight, corners.upRight],
    },
  },
];

// select respective corner along the direction of normal
const getCorner = (boundaries: Point[], normal: number, point: number) => {
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
const cellToIntervals = (iteration: Iteration, point: Point): Interval[] => {
  const startPoint = {
    x:
      point.x +
      getCorner(iteration.corners.start, iteration.normal.y, point.y).x,
    y:
      point.y +
      getCorner(iteration.corners.start, iteration.normal.x, point.x).y,
  };

  const endPoint = {
    x:
      point.x + getCorner(iteration.corners.end, iteration.normal.y, point.y).x,
    y:
      point.y + getCorner(iteration.corners.end, iteration.normal.x, point.x).y,
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

// given a list of angle intervals for visible ranges, determine if any part of the target is visible
const isVisible = (
  iteration: Iteration,
  point: Point,
  intervals: Interval[]
) => {
  const targetIntervals = cellToIntervals(iteration, point);

  // check if start and end points are contained by any sub interval, inclusively
  return targetIntervals.some((targetInterval) =>
    intervals.some(
      (visibleInterval) =>
        (visibleInterval.start <= targetInterval.start &&
          targetInterval.start <= visibleInterval.end) ||
        (visibleInterval.start <= targetInterval.end &&
          targetInterval.end <= visibleInterval.end)
    )
  );
};

const isObstructing = (world: World, point: Point) => {
  const level = world.metadata.gameEntity[LEVEL];
  const normalizedX = normalize(point.x, level.size);
  const normalizedY = normalize(point.y, level.size);
  const cell = level.map[normalizedX]?.[normalizedY];

  if (!cell) return false;

  for (const entityId in cell) {
    const entity = cell[entityId];

    if (LIGHT in entity && entity[LIGHT].darkness > 0) return true;
  }

  return false;
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

  if (isObstructing(world, normalized)) {
    const cellIntervals = cellToIntervals(iteration, delta);

    // we can assume that at least one interval overlaps because the cell is visible
    for (const cellInterval of cellIntervals) {
      // find overlapping visible interval
      const newIntervals: Interval[] = [];
      const startIndex = intervals.findIndex(
        (visibleInterval) =>
          visibleInterval.start <= cellInterval.start &&
          cellInterval.start <= visibleInterval.end
      );
      const endIndex = intervals.findIndex(
        (visibleInterval) =>
          visibleInterval.start <= cellInterval.end &&
          cellInterval.end <= visibleInterval.end
      );

      // add any previous intervals
      newIntervals.push(
        ...intervals.slice(0, startIndex === -1 ? endIndex : startIndex)
      );

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
      newIntervals.push(
        ...intervals.slice(endIndex === -1 ? startIndex + 1 : endIndex + 1)
      );

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
  const visibleCells: Point[] = [point];
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
