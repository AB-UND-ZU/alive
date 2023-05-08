import { equipmentStats } from "./balancing";
import { Wave, Spell, Blocked, Compass } from "./entities";
import { CompositeId, createEquipment, createParticle, degreesToOrientation, Direction, directionOffset, getPlayerProcessor, isOrphaned, pointToDegree, relativeDistance, removeProcessor, TerminalState, updateProcessorProps } from "./utils";

const MAX_RADIUS = 7;

export const decayEquipment = (state: TerminalState, id: number) => {
  const equipmentProcessor = state.equipments[id];
  const amount = equipmentProcessor.entity.props.amount;
  state = updateProcessorProps(state, { container: 'equipments', id }, { amount: amount - 1 });

  // clear equipment once amount runs out
  if (amount <= 0) {
    state = removeProcessor(state, { container: 'equipments', id });
  }
  return state;
}

export const tickEquipment = (prevState: TerminalState, id: number): TerminalState => {
  let state = { ...prevState };

  if (isOrphaned(state, { container: 'equipments', id })) {
    state = removeProcessor(state, { container: 'equipments', id });
    return state;
  }

  const equipmentProcessor = state.equipments[id];

  if (equipmentProcessor.entity.type === Compass && !equipmentProcessor.entity.props.interaction) {
    // let compass needle follow player
    const player = getPlayerProcessor(state);
    const distance = relativeDistance(state, equipmentProcessor, player);
    const degrees = pointToDegree(distance);
    const orientation = degreesToOrientation(degrees);
    state = updateProcessorProps(state, { container: 'equipments', id }, { direction: orientation });

  } else if (equipmentProcessor.entity.type === Blocked && equipmentProcessor.entity.props.interaction === 'using') {
    // clear equipment once amount runs out
    state = decayEquipment(state, id);

  } else if (equipmentProcessor.entity.type === Spell) {
    if (equipmentProcessor.entity.props.interaction === 'equipped') {
      const amount = equipmentProcessor.entity.props.amount;
      if (amount > 0) {
        state = updateProcessorProps(state, { container: 'equipments', id }, { amount: amount - 1 });
      }
    }
    if (equipmentProcessor.entity.props.interaction !== 'using') return state;

    const amount = equipmentProcessor.entity.props.amount;
    const level = equipmentProcessor.entity.props.level;
    const maximum = equipmentStats.get(Spell)?.[level - 1][equipmentProcessor.entity.props.material] || 1;

    // clear equipment once amount runs out
    state = decayEquipment(state, id);

    // spawn bubble blockers
    if (equipmentProcessor.entity.props.material === 'plant') {
      if (amount === maximum) {
        const deltas = Object.entries(directionOffset);
        deltas.forEach(([direction, delta]) => {
          let blocker;
          [state, blocker] = createEquipment(state, { x: delta[0], y: delta[1], parent: { container: 'creatures', id: state.playerId } }, Blocked, {
            particles: [], amount: maximum, maximum, level, material: 'plant', interaction: 'using',
          });
          state = createParticle(state, { x: 0, y: 0, parent: { container: 'equipments', id: blocker.id } }, Wave, {
            direction: direction as Direction, material: equipmentProcessor.entity.props.material, amount: level
          })[0];
        });
      }
      return state;
    }

    let radius: number;
    if (maximum >= MAX_RADIUS) {
      radius = amount >= MAX_RADIUS ? MAX_RADIUS * 2 - amount : amount;
    } else {
      radius = maximum - amount + 1;
    }

    // create new wave
    type CreateParticles = Parameters<typeof createParticle>;
    const newWave: [CreateParticles[1], CreateParticles[3]][] = [];

    // top row
    newWave.push(
      [{ x: -1, y: radius * -1 }, { direction: "leftUp" }],
      [{ x: 0, y: radius * -1 }, { direction: "up" }],
      [{ x: 1, y: radius * -1 }, { direction: "upRight" }],
    );

    // upper rows
    Array.from({ length: radius - 1 }).forEach((_, index) => {
      newWave.push(
        [{ x: (index + 2) * -1, y: (radius - index - 1) * -1 }, { direction: "leftUp" }],
        [{ x: (index + 1) * -1, y: (radius - index - 1) * -1 }, { direction: "rightDown" }],
        [{ x: index + 1, y: (radius - index - 1) * -1 }, { direction: "downLeft" }],
        [{ x: index + 2, y: (radius - index - 1) * -1 }, { direction: "upRight" }],
      );
    });

    // horizontal edges
    newWave.push(
      [{ x: radius * -1, y: 0 }, { direction: "left" }],
      [{ x: radius, y: 0 }, { direction: "right" }],
    );

    // lower rows
    Array.from({ length: radius - 1 }).forEach((_, index) => {
      newWave.push(
        [{ x: (index + 2) * -1, y: radius - index - 1 }, { direction: "downLeft" }],
        [{ x: (index + 1) * -1, y: radius - index - 1 }, { direction: "upRight" }],
        [{ x: index + 1, y: radius - index - 1 }, { direction: "leftUp" }],
        [{ x: index + 2, y: radius - index - 1 }, { direction: "rightDown" }],
      );
    });

    // bottom row
    newWave.push(
      [{ x: -1, y: radius }, { direction: "downLeft" }],
      [{ x: 0, y: radius }, { direction: "down" }],
      [{ x: 1, y: radius }, { direction: "rightDown" }],
    );

    // invisible particles to prevent mobs passing through
    newWave.push(
      [{ x: 0, y: (radius + 1) * -1 }, { direction: "center" }],
      [{ x: radius + 1, y: 0 }, { direction: "center" }],
      [{ x: 0, y: radius + 1 }, { direction: "center" }],
      [{ x: (radius + 1) * -1, y: 0 }, { direction: "center" }],
    );

    const parent: CompositeId = { container: 'equipments', id };
    newWave.forEach(([processor, props]) => {
      state = createParticle(state, { ...processor, parent }, Wave, { ...props, material: equipmentProcessor.entity.props.material, amount: level })[0];
    });
  }

  return state;
}