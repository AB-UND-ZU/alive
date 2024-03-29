import { creatureStats, getRandomDistribution, terrainStats } from "./balancing";
import { tickCreature } from "./creatures";
import { Attacked, Burning, Collecting, Freezing, Ice, Player, Wave, Stub, Tree, Water, Equipment, Swimming } from "./entities";
import { CompositeId, createParticle, getAbsolutePosition, getCell, getCreature, getDeterministicRandomInt, getId, getPlayerProcessor, isOrphaned, isWater, Processor, removeProcessor, resolveCompositeId, TerminalState, updateCell, updateProcessor, updateProcessorProps } from "./utils";

export const attackCreature = (state: TerminalState, id: number, damage: number) => {
  const creature = state.creatures[id];
  const compositeId: CompositeId = { container: 'creatures', id };
  const newHp = creature.entity.props.amount - damage;

  // reduce hp
  if (newHp > 0) {
    state = updateProcessorProps(state, compositeId, { amount: newHp });
    return state;
  }

  // add drops
  const drops = creatureStats.get(creature.entity.type);
  const [Drop, props] = getRandomDistribution(drops?.drops || []);
  if (Drop) {
    state = updateCell(state, creature.x, creature.y, { item: <Drop {...props} /> });

    // add swimming
    if (isWater(state, creature.x, creature.y)) {
      state = updateCell(state, creature.x, creature.y, { sprite: <Swimming id={getId()} /> });
    }
  }

  // keep attack particles
  const attacked = creature.entity.props.particles.map(
    particleId => state.particles[particleId]
  ).filter(particle => particle.entity.type === Attacked);

  attacked.forEach(particle => {
    const [x, y] = getAbsolutePosition(state, particle);
    state = updateProcessor(state, { container: 'particles', id: particle.id }, { x, y, parent: undefined });
  })

  state = removeProcessor(state, { container: 'creatures', id });
  return state;
}

export const tickParticle = (prevState: TerminalState, id: number) => {
  let state = { ...prevState };

  const particleProcessor = state.particles[id];
  if (isOrphaned(state, { container: 'particles', id })) {
    state = removeProcessor(state, { container: 'particles', id });
    return state;
  }

  const [particleX, particleY] = getAbsolutePosition(state, particleProcessor);
  const cell = getCell(state, particleX, particleY);
  const affectedId = getCreature(state, particleX, particleY, creature => creature.entity.type !== Player)?.id;

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
    if (getDeterministicRandomInt(1, 2) !== 1) return state;

    // damage or kill creature
    if (particleProcessor.parent?.container === 'creatures') {
      state = attackCreature(state, particleProcessor.parent.id, 1);
    }

    const newAmount = (particleProcessor.entity.props.amount || 0) - 1;

    if (newAmount > 0) {
      state = updateProcessorProps(state, { container: 'particles', id }, { amount: newAmount });

    } else {
      // burn down tree
      if (cell.terrain?.type === Stub) {
        // add drops
        const drops = terrainStats.get(cell.terrain.type);
        const [Drop, props] = getRandomDistribution(drops?.drops || []);
        state = updateCell(state, particleX, particleY, { terrain: undefined, item: Drop ? <Drop {...props} /> : undefined });
      }

      state = removeProcessor(state, { container: 'particles', id });
    }
  }

  // apply freezing or burning wave
  if (particleProcessor.entity.type === Wave) {
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
      if (affectedId) {
        const affectedCreature = state.creatures[affectedId];
        const creatureParticles = [...affectedCreature.entity.props.particles];
        const frozenIndex = creatureParticles.findIndex(particleId => state.particles[particleId]?.entity.type === Freezing);

        // refresh freezing count
        if (frozenIndex !== -1) {
          state = updateProcessorProps(state, { container: 'particles', id: creatureParticles[frozenIndex] }, { amount: 12 });

        } else {
          state = createParticle(state, {
            x: 0,
            y: 0,
            parent: { container: 'creatures', id: affectedId }
          }, Freezing, { amount: 12 })[0];
        }
      }

    } else if (particleProcessor.entity.props.material === 'fire') {
      // thaw ground
      const thawed = cell.grounds?.map(
        ground => ground.type === Ice ? {
          ...ground,
          type: Water,
        } : ground,
      );

      // burn tree
      const isTree = cell.terrain?.type === Tree;
      if (isTree) {
        state = createParticle(state, {
          x: particleX,
          y: particleY,
        }, Burning, { amount: 3 })[0];
      }

      // burn plants and items
      state = updateCell(state, particleX, particleY, { grounds: thawed, sprite: undefined, item: undefined, terrain: isTree ? <Stub /> : cell.terrain });

      // update if player is standing on it
      const player = getPlayerProcessor(state);
      if (particleX === player.x && particleY === player.y) {
        state = tickCreature(state, state.playerId);
      }

      // burn creatures
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
    } else if (particleProcessor.entity.props.material === 'plant') {
      // 75% chance to do nothing
      if (getDeterministicRandomInt(1, 4) !== 1) return state;

      const spell = particleProcessor.parent && resolveCompositeId(state, particleProcessor.parent) as Processor<Equipment>;
      
      if (spell && spell.entity.props.level === 2 && affectedId) {
        state = createParticle(
          state,
          { x: 0, y: 0, parent: { container: 'creatures', id: affectedId } },
          Attacked,
          { material: particleProcessor.entity.props.material }
        )[0];
        state = attackCreature(state, affectedId, 1);
      }

      return state;
    }

    state = removeProcessor(state, { container: 'particles', id });
  }

  return state;
}