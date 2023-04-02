import { center, Center, Direction, Orientation, Point, TerminalState } from "./utils";

const getRelativePosition = (state: TerminalState, x: number, y: number) => {
  const relativeX = (x - state.x + state.width * 3 / 2) % state.width - state.width / 2;
  const relativeY = (y - state.y + state.height * 3 / 2) % state.height - state.height / 2;
  return [relativeX, relativeY];
}

export const getInfinitePosition = (state: TerminalState, x: number, y: number) => {
  const infiniteX = state.width * state.repeatX + x;
  const infiniteY = state.height * state.repeatY + y;
  return [infiniteX, infiniteY];
}

export const unitInViewport = (state: TerminalState, x: number, y: number, overscan: number): boolean => {
  const [relativeX, relativeY] = getRelativePosition(state, x, y);

  if (Math.abs(relativeX) > (state.screenWidth - 1 + overscan * 2) / 2) return false;
  if (Math.abs(relativeY) > (state.screenHeight - 1 + overscan * 2) / 2) return false;

  return true;
};

export const getStaticStyle = (state: TerminalState, x: number, y: number, overscan: number = 0) => {
  const [infinitePlayerX, infinitePlayerY] = getInfinitePosition(state, state.x, state.y);
  const [relativeTargetX, relativeTargetY] = getRelativePosition(state, x, y);
  const [infiniteTargetX, infiniteTargetY] = [infinitePlayerX + relativeTargetX, infinitePlayerY + relativeTargetY];

  // using margin instead of transform to avoid creating a new stacking layer
  const style = {
    marginLeft: `${infinitePlayerX * -18 + 180}px`,
    marginTop: `${infinitePlayerY * -32 + 192 + overscan * 32}px`,

    top: `${infiniteTargetY * 32}px`,
    left: `${infiniteTargetX * 18}px`,
  };

  return style;
}

export const quarterCircle = [
  [-1,-1,-1,-1,-1,-1,-1,10,10,10,10],
  [-1,-1,-1,-1, 10,10,10,8, 8, 8, 8],
  [-1,-1, 10,10,9 ,8, 8, 7, 6, 6, 6],
  [-1, 10,9, 9, 8, 7, 6, 6, 4, 4, 4],
  [-1, 10,9, 8, 7, 6, 5, 4, 3, 2, 2],
  [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1],
  [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

export const angleToCornerDirections = (angle: number): Direction => {
  const normalizedAngle = (angle + 360) % 360;
  if (normalizedAngle === 0) return 'up';
  else if (normalizedAngle < 90) return 'upRight'
  else if (normalizedAngle === 90) return 'right';
  else if (normalizedAngle < 180) return 'rightDown';
  else if (normalizedAngle === 180) return 'down';
  else if (normalizedAngle < 270) return 'downLeft';
  else if (normalizedAngle === 270) return 'left';
  else return 'leftUp';
}

// "█"
export const cellBoundaries: Record<Direction, [Point, Point]> = {
  up: [[-0.5, 0.5], [0.5, 0.5]],
  upRight: [[-0.5, -0.5], [0.5, 0.5]],
  right: [[-0.5, -0.5], [-0.5, 0.5]],
  rightDown: [[0.5, -0.5], [-0.5, 0.5]],
  down: [[0.5, -0.5], [-0.5, -0.5]],
  downLeft: [[0.5, 0.5], [-0.5, -0.5]],
  left: [[0.5, 0.5], [0.5, -0.5]],
  leftUp: [[-0.5, 0.5], [0.5, -0.5]],
};