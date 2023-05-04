import { creatureStats, equipmentStats } from "./balancing";
import { Armor, Attacked, Burning, Circle, Creature, Freezing, Swimming, Triangle } from "./entities";
import { isWalkable, getDeterministicRandomInt, TerminalState, wrapCoordinates, directionOffset, orientations, isWater, updateProcessorProps, getPlayerProcessor, Orientation, createParticle, removeProcessor, updateProcessor, pointToDegree, degreesToOrientation, relativeDistance, CompositeId, resolveCompositeId, Processor } from "./utils";

export const attackPlayer = (state: TerminalState, compositeId: CompositeId) => {
  const player = getPlayerProcessor(state);
  const creature = resolveCompositeId(state, compositeId) as Processor<Creature>;

  const armor = state.inventory.armor ? (equipmentStats.get(Armor)?.[state.equipments[state.inventory.armor].entity.props.material] || 0) : 0;
  const dmg = Math.max((creatureStats.get(creature.entity.type)?.dmg || 1) - armor, 1);
  state.hp = Math.max(state.hp - dmg, 0);
  state = updateProcessorProps(state, { container: 'creatures', id: player.id }, { amount: state.hp });

  // add attacked particle
  state = createParticle(
    state,
    { x: player.x -  creature.x, y: player.y - creature.y, parent: compositeId },
    Attacked,
    {}
  )[0];

  return state;
}

export const tickCreature = (prevState: TerminalState, id: number): TerminalState => {
  let state = { ...prevState };

  const creatureProcessor = state.creatures[id];
  const creatureParticles = [...creatureProcessor.entity.props.particles];

  const player = getPlayerProcessor(state);

  // don't move frozen creatures
  const freezingIndex = creatureParticles.findIndex(particleId => state.particles[particleId]?.entity.type === Freezing);

  if (freezingIndex === -1) {
    if (creatureProcessor.entity.type === Triangle) {
      // move triangle
      const orientation = creatureProcessor.entity.props.orientation;
      const [moveX, moveY] = directionOffset[orientation];
      const [targetX, targetY] = wrapCoordinates(state, creatureProcessor.x + moveX, creatureProcessor.y + moveY);

      // hit player
      if (targetX === player.x && targetY === player.y) {
        state = attackPlayer(state, { container: 'creatures', id });

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

    } else if (creatureProcessor.entity.type === Circle) {
      // only move if visible
      if (state.fog[creatureProcessor.y][creatureProcessor.x] === 'visible') {
        const distance = relativeDistance(state, creatureProcessor, player);
        const degrees = pointToDegree(distance);
        const orientation = degreesToOrientation(degrees);

        const [attemptX, attemptY] = directionOffset[orientation];
        const [targetX, targetY] = wrapCoordinates(state, creatureProcessor.x + attemptX, creatureProcessor.y + attemptY);

        // hit player
        if (targetX === player.x && targetY === player.y) {
          state = attackPlayer(state, { container: 'creatures', id });

        } else if (isWalkable(state, targetX, targetY)) {
          // move in straight line
          state = updateProcessor(state, { container: 'creatures', id }, { x: targetX, y: targetY });
        }
      }
    }
  }

  // update swimming state
  const swimmingIndex = creatureParticles.findIndex(particleId => state.particles[particleId]?.entity.type === Swimming);
  const burningIndex = creatureParticles.findIndex(particleId => state.particles[particleId]?.entity.type === Burning);

  if (swimmingIndex === -1 && isWater(state, state.creatures[id].x, state.creatures[id].y)) {
    // in water, add swimming
    state = createParticle(state, {
      x: 0,
      y: 0,
      parent: { container: 'creatures', id },
    }, Swimming, {})[0];

    // remove burning
    state = removeProcessor(state, { container: 'particles', id: creatureParticles[burningIndex] })

  } else if (swimmingIndex !== -1 && !isWater(state, state.creatures[id].x, state.creatures[id].y)) {
    // not in water, remove swimming
    state = removeProcessor(state, { container: 'particles', id: creatureParticles[swimmingIndex] });
  }

  return state;
}