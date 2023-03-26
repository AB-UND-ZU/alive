import { Attacked, Particle, Shock, Swimming, Water } from "./entities";
import { addPoints, center, directionOffset, getCell, isWater, Processor, TerminalState } from "./utils";

export const tickParticle = (state: TerminalState, processor: Processor<Particle>, parent: Processor<Particle>[] = state.particles) => {
  if (processor.entity.type === Shock) {
    const [movedX, movedY] = addPoints(state, [processor.x, processor.y], directionOffset[processor.entity.props.direction || center]);
    processor.x = movedX;
    processor.y = movedY;
  }

  if (processor.entity.type === Attacked) {
    parent.splice(parent.indexOf(processor));
    return;
  }

  if (processor.entity.type === Swimming) {
    if (!isWater(state, processor.x, processor.y)) {
      parent.splice(parent.indexOf(processor));
      return;
    }
  }
}