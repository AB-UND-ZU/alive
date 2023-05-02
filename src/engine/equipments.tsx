import { Freezing, Ice, Player, Shock, Spell, Water } from "./entities";
import { CompositeId, createParticle, getAbsolutePosition, getCell, getCreature, isOrphaned, removeProcessor, TerminalState, updateCell, updateProcessorProps } from "./utils";

const SHOCK_RADIUS = 5;

export const tickEquipment = (prevState: TerminalState, id: number): TerminalState => {
  let state = { ...prevState };

  if (isOrphaned(state, { container: 'equipments', id })) {
    state = removeProcessor(state, { container: 'equipments', id });
    return state;
  }

  const equipmentProcessor = state.equipments[id];

  // apply effects of last wave
  equipmentProcessor.entity.props.particles.forEach(particleId => {
    const particle = state.particles[particleId];
    if (equipmentProcessor.entity.type === Spell && equipmentProcessor.entity.props.interaction === 'using') {
      // freeze grounds
      const [particleX, particleY] = getAbsolutePosition(state, particle);
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
          let frozen;
          [state, frozen] = createParticle(state, {
            x: 0,
            y: 0,
            parent: { container: 'creatures', id: affectedId }
          }, Freezing, { amount: 8 });

          creatureParticles.push(frozen.id);
          state = updateProcessorProps(state, { container: 'creatures', id: affectedId }, { particles: creatureParticles });
        }
      }

      state = removeProcessor(state, { container: 'particles', id: particleId });
    }
  });

  if (equipmentProcessor.entity.type === Spell && equipmentProcessor.entity.props.interaction === 'using') {
    const radius = equipmentProcessor.entity.props.amount;

    // clear equipment once radius is reached
    if (radius > SHOCK_RADIUS) {
      state = removeProcessor(state, { container: 'equipments', id });
      return state;
    }

    // create new wave
    type CreateParticles = Parameters<typeof createParticle>;
    const newWave: [CreateParticles[1], CreateParticles[2], CreateParticles[3]][] = [];

    // top row
    newWave.push(
      [{ x: -1, y: radius * -1 }, Shock, { direction: "leftUp" }],
      [{ x: 0, y: radius * -1 }, Shock, { direction: "up" }],
      [{ x: 1, y: radius * -1 }, Shock, { direction: "upRight" }],
    );

    // upper rows
    Array.from({ length: radius - 1 }).forEach((_, index) => {
      newWave.push(
        [{ x: (index + 2) * -1, y: (radius - index - 1) * -1 }, Shock, { direction: "leftUp" }],
        [{ x: (index + 1) * -1, y: (radius - index - 1) * -1 }, Shock, { direction: "rightDown" }],
        [{ x: index + 1, y: (radius - index - 1) * -1 }, Shock, { direction: "downLeft" }],
        [{ x: index + 2, y: (radius - index - 1) * -1 }, Shock, { direction: "upRight" }],
      );
    });

    // horizontal edges
    newWave.push(
      [{ x: radius * -1, y: 0 }, Shock, { direction: "left" }],
      [{ x: radius, y: 0 }, Shock, { direction: "right" }],
    );

    // lower rows
    Array.from({ length: radius - 1 }).forEach((_, index) => {
      newWave.push(
        [{ x: (index + 2) * -1, y: radius - index - 1 }, Shock, { direction: "downLeft" }],
        [{ x: (index + 1) * -1, y: radius - index - 1 }, Shock, { direction: "upRight" }],
        [{ x: index + 1, y: radius - index - 1 }, Shock, { direction: "leftUp" }],
        [{ x: index + 2, y: radius - index - 1 }, Shock, { direction: "rightDown" }],
      );
    });

    // bottom row
    newWave.push(
      [{ x: -1, y: radius }, Shock, { direction: "downLeft" }],
      [{ x: 0, y: radius }, Shock, { direction: "down" }],
      [{ x: 1, y: radius }, Shock, { direction: "rightDown" }],
    );

    // invisible particles to prevent mobs passing through
    newWave.push(
      [{ x: 0, y: (radius + 1) * -1 }, Shock, { direction: "center" }],
      [{ x: radius + 1, y: 0 }, Shock, { direction: "center" }],
      [{ x: 0, y: radius + 1 }, Shock, { direction: "center" }],
      [{ x: (radius + 1) * -1, y: 0 }, Shock, { direction: "center" }],
    );

    const parent: CompositeId = { container: 'equipments', id };
    const particleIds = newWave.map(([processor, ...wave]) => {
      let particle;
      [state, particle] = createParticle(state, { ...processor, parent }, ...wave);
      return particle.id;
    });

    state = updateProcessorProps(state, { container: 'equipments', id }, {
      amount: radius + 1,
      particles: particleIds
    });
  }

  return state;
}