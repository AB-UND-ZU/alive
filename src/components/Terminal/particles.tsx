import { Swimming, Water } from "./entities";
import { getCell, isWater, TerminalState, updateBoard } from "./utils";

export const tickParticles = (state: TerminalState, x: number, y: number) => {
  const newState = { ...state };
  const swimmingCell = { ...getCell(newState, x, y) };

  if (
    isWater(newState, x, y) &&
    swimmingCell.grounds?.length === 1 &&
    swimmingCell.grounds[0].type === Water &&
    swimmingCell.grounds[0].props.amount === 4
  ) {
    swimmingCell.particles = [...(swimmingCell.particles || []), <Swimming />];
  } else {
    swimmingCell.particles = swimmingCell.particles?.filter(cell => cell.type !== Swimming);
  }
  newState.board = updateBoard(newState.board, x, y, swimmingCell);

  return newState;
}