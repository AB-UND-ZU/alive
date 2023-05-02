import { Attacked, Freezing, Swimming, Triangle } from "./entities";
import { tickParticle } from "./particles";
import { isWalkable, getDeterministicRandomInt, TerminalState, wrapCoordinates, directionOffset, orientations, isWater, updateProcessorProps, getPlayerProcessor, Orientation, createParticle, removeProcessor, updateProcessor, isOrphaned } from "./utils";

export const tickCreature = (prevState: TerminalState, id: number): TerminalState => {
  let state = { ...prevState };

  if (isOrphaned(state, { container: 'creatures', id })) {
    state = removeProcessor(state, { container: 'creatures', id });
    return state;
  }

  const creatureProcessor = state.creatures[id];
  const creatureParticles = [...creatureProcessor.entity.props.particles];

  const player = getPlayerProcessor(state);

  // thaw creature
  const freezingIndex = creatureParticles.findIndex(particleId => state.particles[particleId]?.entity.type === Freezing);

  if (freezingIndex !== -1) {
    const freezingParticle = state.particles[creatureParticles[freezingIndex]];
    const newAmount = (freezingParticle.entity.props.amount || 0) - 1;

    if (newAmount > 0) {
      state = updateProcessorProps(state, { container: 'particles', id: freezingParticle.id }, { amount: newAmount });
    } else {
      state = removeProcessor(state, { container: 'particles', id: freezingParticle.id });
      creatureParticles.splice(freezingIndex, 1);
      state = updateProcessorProps(state, { container: 'creatures', id }, { particles: creatureParticles });
    }

  } else if (creatureProcessor.entity.type === Triangle) {
    // move triangle
    const orientation = creatureProcessor.entity.props.orientation;
    const [moveX, moveY] = directionOffset[orientation];
    const [targetX, targetY] = wrapCoordinates(state, creatureProcessor.x + moveX, creatureProcessor.y + moveY);

    // hit player
    if (targetX === player.x && targetY === player.y) {
      state.hp = state.hp - 3;
      state = updateProcessorProps(state, { container: 'creatures', id: player.id }, { amount: state.hp });

      // add attacked particle
      let attacked;
      [state, attacked] = createParticle(
        state,
        { x: moveX, y: moveY, parent: { container: 'creatures', id } },
        Attacked,
        {}
      );
      state = updateProcessorProps(state, { container: 'creatures', id: player.id }, {
        particles: [...player.entity.props.particles, attacked.id]
      });

    } else if (isWalkable(state, targetX, targetY)) {
      // move in straight line
      state = updateProcessor(state, { container: 'creatures', id }, { x: targetX, y: targetY });

    } else {
      // find first free cell (or player) in either counter- or clockwise orientation by random
      const rotation = getDeterministicRandomInt(0, 1) * 2 - 1;
      const newOrientation = Array.from({ length: 3 }).map((_, offset) => {
        const attemptOrientation: Orientation = orientations[(orientations.indexOf(orientation) + (offset + 1) * rotation + orientations.length) % orientations.length];
        const [attemptX, attemptY] = directionOffset[attemptOrientation];
        const [targetX, targetY] = wrapCoordinates(state, creatureProcessor.x + attemptX, creatureProcessor.y + attemptY);

        if ((targetX === player.x && targetY === player.y) || isWalkable(state, targetX, targetY)) {
          return attemptOrientation;
        }
        return undefined;
      }).filter(Boolean)[0];

      // if creature is stuck, make it circle around randomly
      const stuckOrientation = orientations[(orientations.indexOf(orientation) + getDeterministicRandomInt(1, orientations.length - 1)) % orientations.length];

      state = updateProcessorProps(state, { container: 'creatures', id }, { orientation: newOrientation || stuckOrientation });
    }
  }

  // add swimming state
  const swimmingIndex = creatureParticles.findIndex(particleId => state.particles[particleId]?.entity.type === Swimming);
  if (swimmingIndex === -1 && isWater(state, state.creatures[id].x, state.creatures[id].y)) {
    let swimming;
    [state, swimming] = createParticle(state, {
      x: 0,
      y: 0,
      parent: { container: 'creatures', id },
    }, Swimming, {});

    creatureParticles.push(swimming.id);
    state = updateProcessorProps(state, { container: 'creatures', id }, { particles: creatureParticles });
  };

  // process contained particles
  Object.values(state.creatures[id].entity.props.particles).forEach(particleId => {
    state = tickParticle(state, particleId);
  });

  return state;
}