import { Creature, Freezing, Swimming, Triangle } from "./entities";
import { tickEquipment } from "./equipments";
import { tickParticle } from "./particles";
import { isWalkable, getCell, getDeterministicRandomInt, TerminalState, wrapCoordinates, directionOffset, orientations, Processor, isWater } from "./utils";

export const tickCreature = (state: TerminalState, processor: Processor<Creature>, parent: Processor<Creature>[] = state.creatures) => {
  if (!processor.entity.props.particles) {
    processor.entity.props.particles = [];
  }

  if (!processor.entity.props.equipments) {
    processor.entity.props.equipments = [];
  }

  const freezingIndex = processor.entity.props.particles.findIndex(particle => particle.entity.type === Freezing);
  const freezingProcessor = processor.entity.props.particles[freezingIndex];

  if (freezingProcessor) {
    const newAmount = (freezingProcessor.entity.props.amount || 0) - 1;
    if (newAmount > 0) {
      freezingProcessor.entity.props.amount = newAmount;
    } else {
      processor.entity.props.particles.splice(freezingIndex, 1);
    }
  } else if (processor.entity.type === Triangle) {
    const orientation = processor.entity.props.orientation;
    const [moveX, moveY] = directionOffset[orientation];
    const [targetX, targetY] = wrapCoordinates(state, processor.x + moveX, processor.y + moveY);

    if (isWalkable(state, targetX, targetY)) {
      processor.x = targetX;
      processor.y = targetY;
    } else {
      // find first free cell in either counter- or clockwise orientation by random
      const rotation = getDeterministicRandomInt(0, 1) * 2 - 1;
      const newOrientation = Array.from({ length: 3 }).map((_, offset) => {
        const attemptOrientation = orientations[(orientations.indexOf(orientation) + (offset + 1) * rotation + orientations.length) % orientations.length];
        const [attemptX, attemptY] = directionOffset[attemptOrientation];
        if (isWalkable(state, processor.x + attemptX, processor.y + attemptY)) {
          return attemptOrientation;
        }
      }).filter(Boolean)[0];

      // if creature is stuck, make it circle around
      const stuckOrientation = orientations[(orientations.indexOf(orientation) + getDeterministicRandomInt(1, orientations.length - 1)) % orientations.length];

      processor.entity.props.orientation = newOrientation || stuckOrientation;
    }
  }

  // add swimming state
  const swimming = processor.entity.props.particles.find(particle => particle.entity.type === Swimming);
  if (!swimming && isWater(state, processor.x, processor.y)) {
    const swimmingProcessor = {
      x: processor.x,
      y: processor.y,
      entity: <Swimming />,
    };
    processor.entity.props.particles.push(swimmingProcessor);
  };

  // process contained equipments
  processor.entity.props.equipments.forEach(equipment => {
    equipment.x = processor.x;
    equipment.y = processor.y;
    tickEquipment(state, equipment, processor.entity.props.equipments);
  });

  // process contained particles
  processor.entity.props.particles.forEach(particle => {
    particle.x = processor.x;
    particle.y = processor.y;
    tickParticle(state, particle, processor.entity.props.particles);
  });
}