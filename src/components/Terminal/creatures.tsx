import { Cell, Triangle } from "./entities";
import { isWalkable, updateBoard, getCell, getDeterministicRandomInt, Point, TerminalState, wrapCoordinates, directionOffset, orientations } from "./utils";

export const tickCreature = (state: TerminalState, x: number, y: number): [TerminalState, Point] => {
  const newState = { ...state };
  const cell = { ...getCell(newState, x, y) };
  if (cell.creature?.type === Triangle) {
    const orientation = cell.creature.props.orientation;
    const [moveX, moveY] = directionOffset[orientation];
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

    // find first free cell in either counter- or clockwise orientation by random
    const rotation = getDeterministicRandomInt(0, 1) * 2 - 1;
    const newOrientation = Array.from({ length: 3 }).map((_, offset) => {
      const attemptOrientation = orientations[(orientations.indexOf(orientation) + (offset + 1) * rotation + orientations.length) % orientations.length];
      const [attemptX, attemptY] = directionOffset[attemptOrientation];
      if (isWalkable(newState, x + attemptX, y + attemptY)) {
        return attemptOrientation;
      }
    }).filter(Boolean)[0];

    // if creature is stuck, make it circle around
    const stuckOrientation = orientations[(orientations.indexOf(orientation) + getDeterministicRandomInt(1, orientations.length - 1)) % orientations.length];

    cell.creature = <Triangle orientation={newOrientation || stuckOrientation} />;
    newState.board = updateBoard(newState.board, x, y, cell);
  }

  return [newState, [x, y]];
}