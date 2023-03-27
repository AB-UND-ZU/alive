import { center, Center, Direction, Orientation, Point, TerminalState } from "./utils";

export const getSmoothStyle = (state: TerminalState, x: number, y: number, overscan: number = 0) => {
  const offsetX = (state.width * state.repeatX + x) * 18;
  const offsetY = (state.height * state.repeatY + y) * 32;

  const style = {
    transform: `translate(${offsetX * -1}px, ${offsetY * -1}px)`,
    marginLeft: `${offsetX - overscan * 18}px`,
    marginRight: `${offsetX * -1}px`,
  
    marginBottom: `${offsetY * -1}px`,
    marginTop: `${offsetY - overscan * 32}px`,
  };

  return style;
};

export const quarterCircle = [
  [  ,  ,  ,  ,  ,  ,  ,10,10,10,10],
  [  ,  ,  ,  , 10,10,10,8, 8, 8, 8],
  [  ,  , 10,10,9 ,8, 8, 7, 6, 6, 6],
  [  , 10,9, 9, 8, 7, 6, 6, 4, 4, 4],
  [  , 10,9, 8, 7, 6, 5, 4, 3, 2, 2],
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

// cellBoundaries[rockOrientation][direction]
export const cellBoundaries: Record<Orientation | Center, Record<Direction, [Point, Point]>> = {
  // "█"
  [center]: {
    up: [[-0.5, 0.5], [0.5, 0.5]],
    upRight: [[-0.5, -0.5], [0.5, 0.5]],
    right: [[-0.5, -0.5], [-0.5, 0.5]],
    rightDown: [[0.5, -0.5], [-0.5, 0.5]],
    down: [[0.5, -0.5], [-0.5, -0.5]],
    downLeft: [[0.5, 0.5], [-0.5, -0.5]],
    left: [[0.5, 0.5], [0.5, -0.5]],
    leftUp: [[-0.5, 0.5], [0.5, -0.5]],
  },

  // "▀"
  up: {
    up: [[-0.5, 0], [0.5, 0]],
    upRight: [[-0.5, 0], [0.5, 0.5]],
    right: [[-0.5, -0.5], [-0.5, 0]],
    rightDown: [[0.5, -0.5], [-0.5, 0]],
    down: [[0.5, -0.5], [-0.5, -0.5]],
    downLeft: [[0.5, 0], [-0.5, -0.5]],
    left: [[0.5, 0], [0.5, -0.5]],
    leftUp: [[-0.5, 0.5], [0.5, 0]],
  },

  // "▐"
  right: {
    up: [[0, 0.5], [0.5, 0.5]],
    upRight: [[0, -0.5], [0.5, 0.5]],
    right: [[0, -0.5], [0, 0.5]],
    rightDown: [[0.5, -0.5], [0, 0.5]],
    down: [[0.5, -0.5], [0, -0.5]],
    downLeft: [[0.5, 0.5], [0, -0.5]],
    left: [[0.5, 0.5], [0.5, -0.5]],
    leftUp: [[0, 0.5], [0.5, -0.5]],
  },

  // "▄"
  down: {
    up: [[-0.5, 0.5], [0.5, 0.5]],
    upRight: [[-0.5, 0], [0.5, 0.5]],
    right: [[-0.5, 0], [-0.5, 0.5]],
    rightDown: [[0.5, 0], [-0.5, 0.5]],
    down: [[0.5, 0], [-0.5, 0]],
    downLeft: [[0.5, 0.5], [-0.5, 0]],
    left: [[0.5, 0.5], [0.5, 0]],
    leftUp: [[-0.5, 0.5], [0.5, 0]],
  },

  // ▌
  left: {
    up: [[-0.5, 0.5], [0, 0.5]],
    upRight: [[-0.5, -0.5], [0, 0.5]],
    right: [[-0.5, -0.5], [-0.5, 0.5]],
    rightDown: [[0, -0.5], [-0.5, 0.5]],
    down: [[0, -0.5], [-0.5, -0.5]],
    downLeft: [[0, 0.5], [-0.5, -0.5]],
    left: [[0, 0.5], [0, -0.5]],
    leftUp: [[-0.5, 0.5], [0, -0.5]],
  },
};