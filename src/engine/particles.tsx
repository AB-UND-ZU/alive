import { Attacked, Freezing, Ice, Player, Shock, Water } from "./entities";
import { createParticle, getAbsolutePosition, getCell, getCreature, isOrphaned, removeProcessor, TerminalState, updateCell, updateProcessorProps } from "./utils";

export const tickParticle = (prevState: TerminalState, id: number) => {
  let state = { ...prevState };

  if (isOrphaned(state, { container: 'particles', id })) {
    state = removeProcessor(state, { container: 'particles', id });
    return state;
  }

  const particleProcessor = state.particles[id];

  // remove fading particles
  if (particleProcessor.entity.type === Attacked) {
    state = removeProcessor(state, { container: 'particles', id });
    return state;
  }

  // thaw ice
  if (particleProcessor.entity.type === Freezing) {
    const newAmount = (particleProcessor.entity.props.amount || 0) - 1;

    if (newAmount > 0) {
      state = updateProcessorProps(state, { container: 'particles', id }, { amount: newAmount });
    } else {
      state = removeProcessor(state, { container: 'particles', id });
    }
  }

  // apply freezing
  if (particleProcessor.entity.type === Shock) {
    // freeze ground
    const [particleX, particleY] = getAbsolutePosition(state, particleProcessor);
    const cell = getCell(state, particleX, particleY);
    const frozen = cell.grounds?.map(
      ground => ground.type === Water ? {
        ...ground,
        type: Ice,
      } : ground,
    );

    state = updateCell(state, particleX, particleY, { grounds: frozen });

    // freeze creatures
    const affectedId = getCreature(state, particleX, particleY, creature => creature.entity.type !== Player)?.id;

    if (affectedId) {
      const affectedCreature = state.creatures[affectedId];
      const creatureParticles = [...affectedCreature.entity.props.particles];
      const frozenIndex = creatureParticles.findIndex(particleId => state.particles[particleId]?.entity.type === Freezing);

      // refresh freezing count
      if (frozenIndex !== -1) {
        state = updateProcessorProps(state, { container: 'particles', id: creatureParticles[frozenIndex]}, { amount: 8 });

      } else {
        state = createParticle(state, {
          x: 0,
          y: 0,
          parent: { container: 'creatures', id: affectedId }
        }, Freezing, { amount: 8 })[0];
      }
    }

    state = removeProcessor(state, { container: 'particles', id });
  }

  return state;
}