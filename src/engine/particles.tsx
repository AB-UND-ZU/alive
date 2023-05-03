import { creatureStats, getRandomDistribution } from "./balancing";
import { tickCreature } from "./creatures";
import { Attacked, Burning, Collecting, Creature, Freezing, Ice, Item, Player, Shock, Tree, Water } from "./entities";
import { createParticle, getAbsolutePosition, getCell, getCreature, getDeterministicRandomInt, getPlayerProcessor, isOrphaned, isWater, Processor, removeProcessor, resolveCompositeId, TerminalState, updateCell, updateProcessorProps } from "./utils";

export const tickParticle = (prevState: TerminalState, id: number) => {
  let state = { ...prevState };

  if (isOrphaned(state, { container: 'particles', id })) {
    state = removeProcessor(state, { container: 'particles', id });
    return state;
  }

  const particleProcessor = state.particles[id];
  const [particleX, particleY] = getAbsolutePosition(state, particleProcessor);
  const cell = getCell(state, particleX, particleY);

  // remove fading particles
  if (
    particleProcessor.entity.type === Attacked ||
    particleProcessor.entity.type === Collecting
  ) {
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

  // burn things
  if (particleProcessor.entity.type === Burning) {
    // 50% chance to do nothing
    if (getDeterministicRandomInt(0, 1) === 1) return state;

    // damage or kill creature
    if (particleProcessor.parent?.container === 'creatures') {
      const parent = resolveCompositeId(state, particleProcessor.parent) as Processor<Creature>;
      const newHp = parent.entity.props.amount - 1;
      if (newHp > 0) {
        state = updateProcessorProps(state, particleProcessor.parent, { amount: newHp });
      } else {
        // add drops
        const drops = creatureStats.get(parent.entity.type);
        if (drops) {
          const [Drop, props] = getRandomDistribution<Item>(drops.drops);
          state = updateCell(state, particleX, particleY, { item: <Drop {...props} /> });
        }

        state = removeProcessor(state, particleProcessor.parent);
      }
    }

    const newAmount = (particleProcessor.entity.props.amount || 0) - 1;

    if (newAmount > 0) {
      state = updateProcessorProps(state, { container: 'particles', id }, { amount: newAmount });

    } else {
      // burn down tree
      if (cell.terrain?.type === Tree) {
        state = updateCell(state, particleX, particleY, { terrain: undefined });
      }

      state = removeProcessor(state, { container: 'particles', id });
    }
  }

  // apply freezing or burning wave
  if (particleProcessor.entity.type === Shock) {
    if (particleProcessor.entity.props.material === 'ice') {
      // freeze ground
      const frozen = cell.grounds?.map(
        ground => ground.type === Water ? {
          ...ground,
          type: Ice,
        } : ground,
      );

      state = updateCell(state, particleX, particleY, { grounds: frozen });

      // update if player is standing on it
      const player = getPlayerProcessor(state);
      if (particleX === player.x && particleY === player.y) {
        state = tickCreature(state, state.playerId);
      }

      // freeze creatures
      const affectedId = getCreature(state, particleX, particleY, creature => creature.entity.type !== Player)?.id;

      if (affectedId) {
        const affectedCreature = state.creatures[affectedId];
        const creatureParticles = [...affectedCreature.entity.props.particles];
        const frozenIndex = creatureParticles.findIndex(particleId => state.particles[particleId]?.entity.type === Freezing);

        // refresh freezing count
        if (frozenIndex !== -1) {
          state = updateProcessorProps(state, { container: 'particles', id: creatureParticles[frozenIndex] }, { amount: 8 });

        } else {
          state = createParticle(state, {
            x: 0,
            y: 0,
            parent: { container: 'creatures', id: affectedId }
          }, Freezing, { amount: 8 })[0];
        }
      }

    } else if (particleProcessor.entity.props.material === 'fire') {
      // thaw ground and burn plants and items
      const thawed = cell.grounds?.map(
        ground => ground.type === Ice ? {
          ...ground,
          type: Water,
        } : ground,
      );

      state = updateCell(state, particleX, particleY, { grounds: thawed, sprite: undefined, item: undefined });

      // burn tree
      if (cell.terrain?.type === Tree) {
        state = createParticle(state, {
          x: particleX,
          y: particleY,
        }, Burning, { amount: 3 })[0];
      }

      // update if player is standing on it
      const player = getPlayerProcessor(state);
      if (particleX === player.x && particleY === player.y) {
        state = tickCreature(state, state.playerId);
      }

      // burn creatures
      const affectedId = getCreature(state, particleX, particleY, creature => creature.entity.type !== Player)?.id;

      if (affectedId && !isWater(state, particleX, particleY)) {
        const affectedCreature = state.creatures[affectedId];
        const creatureParticles = [...affectedCreature.entity.props.particles];
        const burningIndex = creatureParticles.findIndex(particleId => state.particles[particleId]?.entity.type === Burning);

        // refresh burning count
        if (burningIndex !== -1) {
          state = updateProcessorProps(state, { container: 'particles', id: creatureParticles[burningIndex] }, { amount: 3 });

        } else {
          state = createParticle(state, {
            x: 0,
            y: 0,
            parent: { container: 'creatures', id: affectedId }
          }, Burning, { amount: 3 })[0];
        }
      }
    }

    state = removeProcessor(state, { container: 'particles', id });
  }

  return state;
}