import { Creature, Entity, Equipment, Particle, Unit } from "./entities";
import { Processor, TerminalState, wrapCoordinates } from "./utils";

export type UnitMap = Record<number, Record<number, Unit>>;
export type UnitList = (Processor<Equipment | Creature | Particle> & { id: number })[];


const setUnit = (state: TerminalState, unitMap: UnitMap, unitList: UnitList, x: number, y: number, unit: Unit) => {
  if (!unitMap[x]) unitMap[x] = {};
  if (!unitMap[x][y]) unitMap[x][y] = {};
  
  const currentUnit = getUnit(state, unitMap, unitList, x, y);
  currentUnit.creature = unit.creature || currentUnit.creature;
  currentUnit.equipments = [...(currentUnit.equipments || []), ...(unit.equipments || [])];
  currentUnit.particles = [...(currentUnit.particles || []), ...(unit.particles || [])];
}
export const getUnit = (state: TerminalState, unitMap: UnitMap, unitList: UnitList, x: number, y: number) => {
  const [wrappedX, wrappedY] = wrapCoordinates(state, x, y);
  return unitMap[wrappedX]?.[wrappedY];
}

export const computeUnits = (state: TerminalState): [UnitMap, UnitList] => {
  const unitList: UnitList = [];
  const unitMap: UnitMap = {};
  const particles = [...state.particles];
  const equipments: Processor<Equipment>[] = [...state.equipments];

  // render creatures, spells, equipments and particles
  state.creatures.forEach(processor => {
    setUnit(state, unitMap, unitList, processor.x, processor.y, { creature: processor.entity });
    particles.push(...(processor.entity.props.particles || []).map(particle => ({
      x: processor.x,
      y: processor.y,
      entity: particle,
    })));
    equipments.push(...(processor.entity.props.equipments || []).map(equipment => ({
      x: processor.x,
      y: processor.y,
      entity: equipment,
    })));
  
    unitList.push({
      x: processor.x,
      y: processor.y,
      entity: processor.entity,
      id: processor.entity.props.id
    });
  });

  equipments.forEach(processor => {
    setUnit(state, unitMap, unitList, processor.x, processor.y, { equipments: [processor.entity] });
    particles.push(...(processor.entity.props.particles || []));
  
    /*
    unitList.push({
      x: processor.x,
      y: processor.y,
      entity: processor.entity,
      id: processor.entity.props.id
    });
    */
  });

  particles.forEach(processor => {
    setUnit(state, unitMap, unitList, processor.x, processor.y, { particles: [processor.entity] });
  
    // unitList.push({
    //   x: processor.x,
    //   y: processor.y,
    //   entity: processor.entity,
    //   id: processor.entity.props.id
    // });
  });

  return [unitMap, unitList];
};