import { Direction } from "./entities";
import { Point } from "./utils";

export const angleToCornerDirections = (angle: number): [Direction, Direction] => {
  const normalizedAngle = (angle + 360) % 360;
  if (normalizedAngle === 0) return ['up', 'up'];
  else if (normalizedAngle < 90) return ['up', 'right'];
  else if (normalizedAngle === 90) return ['right', 'right'];
  else if (normalizedAngle < 180) return ['right', 'down'];
  else if (normalizedAngle === 180) return ['down', 'down'];
  else if (normalizedAngle < 270) return ['down', 'left'];
  else if (normalizedAngle === 270) return ['left', 'left'];
  else return ['left', 'up'];
}

// corners[rockPlacement][primaryDirection][secondaryDirection]
export const corners: Record<Direction | 'full', Record<Direction, Partial<Record<Direction, [Point, Point]>>>> = {
  // "█"
  full: {
    up: {
      up: [[-0.5, 0.5], [0.5, 0.5]],
      right: [[-0.5, -0.5], [0.5, 0.5]],
    },
    right: {
      right: [[-0.5, -0.5], [-0.5, 0.5]],
      down: [[0.5, -0.5], [-0.5, 0.5]],
    },
    down: {
      down: [[0.5, -0.5], [-0.5, -0.5]],
      left: [[0.5, 0.5], [-0.5, -0.5]],
    },
    left: {
      left: [[0.5, 0.5], [0.5, -0.5]],
      up: [[-0.5, 0.5], [0.5, -0.5]],
    },
  },

  // "▀"
  up: {
    up: {
      up: [[-0.5, 0], [0.5, 0]],
      right: [[-0.5, 0], [0.5, 0.5]],
    },
    right: {
      right: [[-0.5, -0.5], [-0.5, 0]],
      down: [[0.5, -0.5], [-0.5, 0]],
    },
    down: {
      down: [[0.5, -0.5], [-0.5, -0.5]],
      left: [[0.5, 0], [-0.5, -0.5]],
    },
    left: {
      left: [[0.5, 0], [0.5, -0.5]],
      up: [[-0.5, 0.5], [0.5, 0]],
    },
  },

  // "▐"
  right: {
    up: {
      up: [[0, 0.5], [0.5, 0.5]],
      right: [[0, -0.5], [0.5, 0.5]],
    },
    right: {
      right: [[0, -0.5], [0, 0.5]],
      down: [[0.5, -0.5], [0, 0.5]],
    },
    down: {
      down: [[0.5, -0.5], [0, -0.5]],
      left: [[0.5, 0.5], [0, -0.5]],
    },
    left: {
      left: [[0.5, 0.5], [0.5, -0.5]],
      up: [[0, 0.5], [0.5, -0.5]],
    },
  },

  // "▄"
  down: {
    up: {
      up: [[-0.5, 0.5], [0.5, 0.5]],
      right: [[-0.5, 0], [0.5, 0.5]],
    },
    right: {
      right: [[-0.5, 0], [-0.5, 0.5]],
      down: [[0.5, 0], [-0.5, 0.5]],
    },
    down: {
      down: [[0.5, 0], [-0.5, 0]],
      left: [[0.5, 0.5], [-0.5, 0]],
    },
    left: {
      left: [[0.5, 0.5], [0.5, 0]],
      up: [[-0.5, 0.5], [0.5, 0]],
    },
  },

  // ▌
  left: {
    up: {
      up: [[-0.5, 0.5], [0, 0.5]],
      right: [[-0.5, -0.5], [0, 0.5]],
    },
    right: {
      right: [[-0.5, -0.5], [-0.5, 0.5]],
      down: [[0, -0.5], [-0.5, 0.5]],
    },
    down: {
      down: [[0, -0.5], [-0.5, -0.5]],
      left: [[0, 0.5], [-0.5, -0.5]],
    },
    left: {
      left: [[0, 0.5], [0, -0.5]],
      up: [[-0.5, 0.5], [0, -0.5]],
    },
  },

}