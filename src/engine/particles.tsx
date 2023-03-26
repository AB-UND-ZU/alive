import { Attacked, Particle, Shock, Swimming, Water } from "./entities";
import { addPoints, center, directionOffset, getCell, isWater, Processor, TerminalState } from "./utils";

export const tickParticle = (state: TerminalState, processor: Processor<Particle>): [TerminalState, Processor<Particle> | undefined] => {
  const newState = { ...state };
  const newProcessor = { ...processor };
  const particle = newProcessor.entity;

  if (particle.type === Shock) {
    const [movedX, movedY] = addPoints(state, [newProcessor.x, newProcessor.y], directionOffset[particle.props.direction || center]);
    newProcessor.x = movedX;
    newProcessor.y = movedY;
  }

  if (particle.type === Attacked) {
    return [newState, undefined];
  }

  if (particle.type === Swimming) {
    if (!isWater(newState, newProcessor.x, newProcessor.y)) {
      return [newState, undefined];
    }
  }

  return [newState, newProcessor];
}