export type Point = [number, number];
export const orientations = ['up', 'right', 'down', 'left'] as const;
export type Orientation = typeof orientations[number];
export const orientationPoints: Record<Orientation, Point> = {
  up: [0, -1],
  right: [1, 0],
  down: [0, 1],
  left: [-1, 0],
}

export const keyToOrientation: Record<KeyboardEvent["key"], Orientation>  = {
  ArrowUp: 'up',
  w: 'up',
  ArrowRight: 'right',
  d: 'right',
  ArrowDown: 'down',
  s: 'down',
  ArrowLeft: 'left',
  a: 'left',
};
