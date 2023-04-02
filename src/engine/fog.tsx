import { angleToCornerDirections, cellBoundaries, quarterCircle } from "./geometry";
import { Rock } from "./entities";
import { getCell, Point, TerminalState, Fog, pointToDegree } from "./utils";

// begin, end in degrees
type Interval = [number, number];

// to make code a bit more readable
const x = 0, y = 1, start = 0, end = 1;

// return the degree interval for the outermost visible corners relative from viewer.
// if it crosses 360°, create two separate intervals
const cellToIntervals = (cell: Point): [Interval] | [Interval, Interval] => {
  const direction = angleToCornerDirections(pointToDegree(cell));
  const visibleCorners = cellBoundaries[direction];

  const left = pointToDegree([cell[x] + visibleCorners[0][x], cell[y] + visibleCorners[0][y]]);
  const right = pointToDegree([cell[x] + visibleCorners[1][x], cell[y] + visibleCorners[1][y]]);

  return left <= right ? [[left, right]] : [[left, 360], [0, right]];
}

// given a list of angle intervals for visible ranges, determine if any part of the target is visible
const isVisible = (target: Point, visible: Interval[]) => {
  const targetIntervals = cellToIntervals(target);

  // check if start and end points are contained by any sub interval, inclusively
  return targetIntervals.some(targetInterval => visible.some(visibleInterval => (
    (visibleInterval[start] <= targetInterval[start] && targetInterval[start] <= visibleInterval[end]) ||
    (visibleInterval[start] <= targetInterval[end] && targetInterval[end] <= visibleInterval[end])
  )));
}

const getQuarterRing = (horizontalSign: number, verticalSign: number, distance: number) => {
  return quarterCircle.map(
    (row, rowIndex) => row.map(
      (column, columnIndex) => column === distance ? [
        (row.length - columnIndex - 1) * horizontalSign,
        (quarterCircle.length - rowIndex - 1) * verticalSign
      ] : null).filter(Boolean) as Point[]
    ).flat();
};

export const generateFog = (state: TerminalState, fog: Fog = 'dark'): Fog[][] => (
  Array.from({ length: state.height }).map(
    () => Array.from<Fog>({ length: state.width }).fill(fog)
  )
);


// this algorithm assumes screen width is larger than screen height
export const visibleFogOfWar = (state: TerminalState, distance: number = 1, visible: Interval[] = [[0, 360]], previousVisible: Point[] = [[0, 0]]): Point[] => {
  const maxHorizontal = (state.screenWidth - 1) / 2;
  const relativeRing: Point[] = [];

  // bail out if we reached outer boundaries
  if (distance > maxHorizontal) return previousVisible;

  // top left
  relativeRing.push(...getQuarterRing(-1, -1, distance));

  // other corners excluding center lines
  [[1, -1], [1, 1], [-1, 1]].forEach(([horizontal, vertical]) => {
    relativeRing.push(...getQuarterRing(horizontal, vertical, distance));
  });

  // add obstructed interval for each point that is not already obstructed
  const visibleCells = relativeRing.filter(relativePoint => isVisible(relativePoint, visible));
  const visibleRocks = visibleCells.map(visibleCell => ({
    point: visibleCell,
    terrain: getCell(state, state.x + visibleCell[x], state.y + visibleCell[y]).terrain
  })).filter(
    ({ terrain }) => terrain?.type === Rock
  );

  visibleRocks.forEach(({ point, terrain }) => {
    const terrainIntervals = cellToIntervals(point);

    terrainIntervals.forEach(terrainInterval => {
      const newVisible: Interval[] = [];

      // find first overlapping visible interval
      const firstOverlapping = visible.find(visibleInterval => (
        (visibleInterval[start] <= terrainInterval[start] && terrainInterval[start] <= visibleInterval[end]) ||
        (terrainInterval[start] <= visibleInterval[start] && visibleInterval[start] <= terrainInterval[end])
      ));

      if (firstOverlapping) {
        // add unchanged intervals and trim overlapping one
        const overlappingIndex = visible.indexOf(firstOverlapping);
        let remainingIndex = overlappingIndex + 1;
        newVisible.push(...visible.slice(0, overlappingIndex));

        if (firstOverlapping[start] < terrainInterval[start]) {
          newVisible.push([firstOverlapping[start], terrainInterval[start]]);
        }

        // add rest of overlapping interval if applicable
        if (terrainInterval[end] < firstOverlapping[end]) {
          newVisible.push([terrainInterval[end], firstOverlapping[end]]);

        } else {
          // skip contained intervals and trim last overlapping
          visible.slice(overlappingIndex + 1).forEach((visibleInterval, intervalIndex) => {
            // firstOverlapping[start] <= visibleInterval[start] && 
            if (visibleInterval[start] <= firstOverlapping[end] && firstOverlapping[end] <= visibleInterval[end]) {
              newVisible.push([visibleInterval[end], firstOverlapping[end]]);
              remainingIndex = intervalIndex + 1;
            }
          });
        }

        // add remaning intervals
        newVisible.push(...visible.slice(remainingIndex));
        visible = newVisible;
      }
    });
  });

  return [
    ...previousVisible,
    ...visibleFogOfWar(state, distance + 1, visible, visibleCells)
  ];
}