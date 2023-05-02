import { Creature, Equipment, Particle } from "./entities";
import { getAbsolutePosition, isOrphaned, Processor, TerminalState } from "./utils";

export type Units = Processor<Equipment | Creature | Particle>[];

export const computeUnits = (state: TerminalState): Units => {
  const creatures = Object.values(state.creatures);
  const equipments = Object.values(state.equipments).filter(unit => !isOrphaned(state, { container: 'equipments', id: unit.id }));
  const particles = Object.values(state.particles).filter(unit => !isOrphaned(state, { container: 'particles', id: unit.id }));

  // calculate actual position of equipments or particles with parent
  const relativeUnits = [...equipments, ...particles].map(unit => {
    const [absoluteX, absoluteY] = getAbsolutePosition<Equipment | Particle>(state, unit);
    return {
      ...unit,
      x: absoluteX,
      y: absoluteY,
    }
  });

  return [...creatures, ...relativeUnits];
};