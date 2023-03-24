import { Unit } from "./entities";
import { TerminalState, wrapCoordinates } from "./utils";

export type Units = Record<number, Record<number, Unit>>;


export const setUnit = (state: TerminalState, units: Units, x: number, y: number, unit: Unit) => {
  if (!units[x]) units[x] = {};
  if (!units[x][y]) units[x][y] = {};
  
  const currentUnit = getUnit(state, units, x, y);
  currentUnit.creature = unit.creature || currentUnit.creature;
  currentUnit.equipments = [...(currentUnit.equipments || []), ...(unit.equipments || [])];
  currentUnit.particles = [...(currentUnit.particles || []), ...(unit.particles || [])];
  return currentUnit;

}
export const getUnit = (state: TerminalState, units: Units, x: number, y: number) => {
  const [wrappedX, wrappedY] = wrapCoordinates(state, x, y);
  return units[wrappedX]?.[wrappedY];
}

export const computeUnits = (state: TerminalState) => {
  const units: Units = {};
  const particles = [...state.particles];

  // render creatures, equipments and particles
  state.creatures.forEach(processor => {
    setUnit(state, units, processor.x, processor.y, { creature: processor.entity });
    particles.push(...(processor.entity.props.particles || []).map(particle => ({
      x: processor.x,
      y: processor.y,
      entity: particle,
    })));

  });
  particles.forEach(processor => {
    setUnit(state, units, processor.x, processor.y, { particles: [processor.entity] });
  });

  return units;
};