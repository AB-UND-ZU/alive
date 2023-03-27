import { Creature, Entity, Equipment, Particle, Player, Unit } from "./entities";
import { Processor, TerminalState, wrapCoordinates } from "./utils";

export type UnitMap = Record<number, Record<number, Unit>>;
export type UnitList = (Processor<Equipment | Creature | Particle> & { id: number })[];


const setUnit = (state: TerminalState, unitMap: UnitMap, unitList: UnitList, x: number, y: number, unit: Unit) => {
  if (!unitMap[x]) unitMap[x] = {};
  if (!unitMap[x][y]) unitMap[x][y] = {};
  
  const currentUnit = getUnit(state, unitMap, unitList, x, y)!;
  currentUnit.creature = unit.creature || currentUnit.creature;
  currentUnit.equipments = [...(currentUnit.equipments || []), ...(unit.equipments || [])];
  currentUnit.particles = [...(currentUnit.particles || []), ...(unit.particles || [])];
}
export const getUnit = (state: TerminalState, unitMap: UnitMap, unitList: UnitList, x: number, y: number): Unit | undefined => {
  const [wrappedX, wrappedY] = wrapCoordinates(state, x, y);
  return unitMap[wrappedX]?.[wrappedY];
}

export const computeUnits = (state: TerminalState): [UnitMap, UnitList] => {
  const staticUnits: UnitMap = {};
  const movingUnits: UnitList = [];

  // render creatures, spells, equipments and particles
  state.creatures.forEach(processor => {
    movingUnits.push({
      x: processor.x,
      y: processor.y,
      entity: processor.entity,
      id: processor.entity.props.id
    });
    // setUnit(state, staticUnits, movingUnits, processor.x, processor.y, { creature: processor.entity });

    processor.entity.props.particles?.forEach(particle => {
      // if (processor.entity.type === Player) {
      //   setUnit(state, staticUnits, movingUnits, processor.x, processor.y, { particles: [particle] });
      // } else {}
      movingUnits.push({
        x: processor.x,
        y: processor.y,
        entity: particle,
        id: particle.props.id,
      });
    });

    processor.entity.props.equipments?.forEach(equipment => {
      movingUnits.push({
        x: processor.x,
        y: processor.y,
        entity: equipment,
        id: equipment.props.id,
      })

      equipment.props.particles?.forEach(particle => {
        movingUnits.push({
          x: particle.x,
          y: particle.y,
          entity: particle.entity,
          id: particle.entity.props.id,
        });
      })
    });
  });

  state.equipments?.forEach(processor => {
    setUnit(state, staticUnits, movingUnits, processor.x, processor.y, { equipments: [processor.entity] });
    // particles.push(...(processor.entity.props.particles || []));
    processor.entity.props.particles?.forEach(particle => {
      setUnit(state, staticUnits, movingUnits, particle.x, particle.y, { particles: [particle.entity] });
    })
  
    /*
    unitList.push({
      x: processor.x,
      y: processor.y,
      entity: processor.entity,
      id: processor.entity.props.id
    });
    */
  });

  state.particles?.forEach(processor => {
    setUnit(state, staticUnits, movingUnits, processor.x, processor.y, { particles: [processor.entity] });
  
    // unitList.push({
    //   x: processor.x,
    //   y: processor.y,
    //   entity: processor.entity,
    //   id: processor.entity.props.id
    // });
  });

  return [staticUnits, movingUnits];
};