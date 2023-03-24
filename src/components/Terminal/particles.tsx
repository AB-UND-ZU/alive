import { ReactComponentElement } from "react";
import { Particle, Shock, Swimming, Water } from "./entities";
import { addPoints, center, directionOffset, getCell, isWater, Point, TerminalState, updateBoard } from "./utils";

export const tickParticle = (state: TerminalState, x: number, y: number): [TerminalState, Point] => {
  const newState = { ...state };
  let newLocation: Point = [x, y];
  const cell = { ...getCell(newState, x, y) };

  cell.particles = cell.particles?.reduce((cellParticles, particle) => {
    if (particle.type === Shock) {
      const [movedX, movedY] = addPoints(state, [x, y], directionOffset[particle.props.direction || center]);
      const movedCell = { ...getCell(newState, movedX, movedY) };
      movedCell.particles = [...(movedCell.particles || []), particle];
      newState.board = updateBoard(newState.board, movedX, movedY, movedCell);
      newLocation = [movedX, movedY];
    } else {
      cellParticles.push(particle);
    }
    return cellParticles;
  }, [] as ReactComponentElement<Particle>[]);

  if (
    isWater(newState, x, y) &&
    cell.grounds?.length === 1 &&
    cell.grounds[0].type === Water &&
    cell.grounds[0].props.amount === 4
  ) {
    cell.particles = [...(cell.particles || []), <Swimming />];
  } else {
    cell.particles = cell.particles?.filter(particle => particle.type !== Swimming);
  }
  newState.board = updateBoard(newState.board, x, y, cell);

  return [newState, newLocation];
}