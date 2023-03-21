import { angleToCornerDirections, corners, Point } from "./corners";
import { Direction, Rock } from "./entities";
import { getCell, TerminalState } from "./state";

// begin, end in degrees
type Interval = [number, number];

// to make code a bit more readable
const x = 0, y = 1, start = 0, end = 1;

// helper to create point ranges fast
const pointRange = (length: number, generator: (index: number) => Point) =>
  Array.from({ length }).map<Point>((_, index) => generator(index));

// degrees are counted from top center clockwise, from 0 to 360
const pointToDegree = (point: Point) => {
  const radian = Math.atan2(point[y], point[x]);
  return (radian * 180 / Math.PI + 450) % 360;
}

// return the degree interval for the outermost visible corners relative from viewer.
// if it crosses 360°, create two separate intervals
const cellToIntervals = (cell: Point, direction?: Direction): [Interval] | [Interval, Interval] => {
  const [primary, secondary] = angleToCornerDirections(pointToDegree(cell));
  const visibleCorners = corners[direction || 'full'][primary][secondary]!;

  const left = pointToDegree([cell[x] + visibleCorners[0][x], cell[y] + visibleCorners[0][y]]);
  const right = pointToDegree([cell[x] + visibleCorners[1][x], cell[y] + visibleCorners[1][y]]);

  return left <= right ? [[left, right]] : [[left, 360], [0, right]];
}

// given a list of angle intervals for visible ranges, determine if any part of the target is visible
const isVisible = (target: Point, visible: Interval[]) => {
  const targetIntervals = cellToIntervals(target);

  // check if start and end points are contained by any sub interval, inclusively
  return targetIntervals.some(targetInterval => visible.some(interval => (
    (interval[start] <= targetInterval[start] && targetInterval[start] <= interval[end]) ||
    (interval[start] <= targetInterval[end] && targetInterval[end] <= interval[end])
  )));
}

// this algorithm assumes screen width is larger than screen height
export const visibleFogOfWar = (state: TerminalState, distance: number = 1, visible: Interval[] = [[0, 360]]) => {
  const maxHorizontal = (state.screenWidth - 1) / 2;
  const maxVertical = (state.screenHeight - 1) / 2;
  const relativeRing: Point[] = [];

  // bail out if we reached outer boundaries
  if (distance > maxHorizontal) return;

  // add left and right sides
  const trimmedVertical = Math.min(maxVertical, distance);
  relativeRing.push(...pointRange(trimmedVertical * 2 + 1, index => [distance * -1, index - trimmedVertical]));
  relativeRing.push(...pointRange(trimmedVertical * 2 + 1, index => [distance, index - trimmedVertical]));

  // if not cut off, add top and bottom sides excluding corner
  if (distance <= maxVertical) {
    const trimmedHorizontal = distance - 1;
    relativeRing.push(...pointRange(trimmedHorizontal * 2 + 1, index => [index - trimmedHorizontal, distance * -1]));
    relativeRing.push(...pointRange(trimmedHorizontal * 2 + 1, index => [index - trimmedHorizontal, distance]));
  }

  // add obstructed interval for each point that is not already obstructed
  const visibleCells = relativeRing.filter(relativePoint => isVisible(relativePoint, visible));
  const visibleRocks = visibleCells.map(visibleCell => ({
    point: visibleCell,
    terrain: getCell(state, state.x + visibleCell[x], state.y + visibleCell[y]).terrain
  })).filter(
    ({ terrain }) => terrain?.type === Rock
  );

  visibleRocks.forEach(({ point, terrain }) => {
    const terrainIntervals = cellToIntervals(point, terrain!.props.direction);

    terrainIntervals.forEach(terrainInterval => {
      const newVisible: Interval[] = [];
      console.log({ copy: [...newVisible], terrainInterval, point})
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
      } else {
        console.log('This shouldn\'t happen!', { visible: [...newVisible], terrainInterval, point })
      }
    });
  });

  return { visibleCells, newVisible: [...visible] };
}