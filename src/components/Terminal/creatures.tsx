import { Cell, directionOffset, directions, Triangle } from "./entities";
import { isWalkable, updateBoard, getCell, getDeterministicRandomInt, Point, TerminalState, wrapCoordinates } from "./utils";

export const tickCreature = (state: TerminalState, x: number, y: number): [TerminalState, Point] => {
  const newState = { ...state };
  const cell = { ...getCell(newState, x, y) };
  if (cell.creature?.type === Triangle) {
    const direction = cell.creature.props.direction;
    const [moveX, moveY] = directionOffset[direction];
    const [targetX, targetY] = wrapCoordinates(newState, x + moveX, y + moveY);
    const targetCell = { ...getCell(newState, targetX, targetY) };
    if (isWalkable(newState, targetX, targetY)) {
      targetCell.creature = cell.creature;
      targetCell.particles = cell.particles;
      newState.board = updateBoard(newState.board, targetX, targetY, targetCell);
      cell.creature = undefined;
      cell.particles = undefined;
      newState.board = updateBoard(newState.board, x, y, cell);
      return [newState, [targetX, targetY]];
    }

    // find first free cell in either counter- or clockwise direction by random
    const rotation = getDeterministicRandomInt(0, 1) * 2 - 1;
    const newDirection = Array.from({ length: 3 }).map((_, offset) => {
      const attemptDirection = directions[(directions.indexOf(direction) + (offset + 1) * rotation + directions.length) % directions.length];
      const [attemptX, attemptY] = directionOffset[attemptDirection];
      if (isWalkable(newState, x + attemptX, y + attemptY)) {
        return attemptDirection;
      }
    }).filter(Boolean)[0];

    // if creature is stuck, make it circle around
    const stuckDirection = directions[(directions.indexOf(direction) + getDeterministicRandomInt(1, directions.length - 1)) % directions.length];

    cell.creature = <Triangle direction={newDirection || stuckDirection} />;
    newState.board = updateBoard(newState.board, x, y, cell);
  }

  return [newState, [x, y]];
}