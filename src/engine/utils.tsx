import React, { ReactComponentElement } from "react";
import { Cell, Creature, Particle, Water, Entity, Inventory, Equipment, Blocked, Interaction } from "./entities";

let lastId = 0;
export const getId = () => {
  lastId += 1;
  return lastId;
}
export const sum = (numbers: number[]) => numbers.reduce((total, number) => total + number, 0);

export const getDeterministicRandomInt = (minimum: number, maximum: number) => {
  return Math.floor(
    (window.Rune ? window.Rune.deterministicRandom () : Math.random()) * (maximum - minimum + 1) + minimum
  );
};

export const renderText = (text: string | string[], color: string = 'HUD', background: string = '') => {
  const layers = Array.isArray(text) ? [...text].reverse() : [text];

  return layers[0].split('').map((_, index) => (
    <span className="Cell" key={index}>
      {background && <span className={`Entity ${background}`}>{'█'}</span>}
      {layers.map((layer, layerIndex) => (
        <span key={layerIndex} className={`Entity ${layerIndex === layers.length - 1 ? color : 'HUD'}`}>{layer[index]}</span>
      ))}
    </span>
  ));
};

export const orientations = ['up', 'right', 'down', 'left'] as const;
export const corners = ['leftUp', 'upRight', 'downLeft', 'rightDown'] as const;
export const center = 'center';
export type Center = typeof center;
export const directions = [...orientations, ...corners] as const;
export const directionOffset: Record<Direction | Center, Point> = {
  up: [0, -1],
  upRight: [1, -1],
  right: [1, 0],
  rightDown: [1, 1],
  down: [0, 1],
  downLeft: [-1, 1],
  left: [-1, 0],
  leftUp: [-1, -1],
  [center]: [0, 0],
}
export type Direction = typeof directions[number];
export type Orientation = typeof orientations[number];

export const keyToOrientation: Record<KeyboardEvent["key"], Orientation>  = {
  ArrowUp: 'up',
  w: 'up',
  ArrowRight: 'right',
  d: 'right',
  ArrowDown: 'down',
  s: 'down',
  ArrowLeft: 'left',
  a: 'left',
};

// x, y
export type Point = [number, number];

export const addPoints = (state: TerminalState, left: Point, right: Point): Point => wrapCoordinates(state, left[0] + right[0], left[1] + right[1]);

// distance between two processors in an overlapping grid
export const relativeDistance = (state: TerminalState, source: Processor<Entity>, target: Processor<Entity>): Point => {
  const distanceX = target.x - source.x;
  const distanceY = target.y - source.y;

  return [
    distanceX - (Math.abs(distanceX) > state.width / 2 ? Math.sign(distanceX) * state.width : 0),
    distanceY - (Math.abs(distanceY) > state.height / 2 ? Math.sign(distanceY) * state.height : 0),
  ]
}

// degrees are counted from top center clockwise, from 0 to 360
export const pointToDegree = (point: Point) => {
  const radian = Math.atan2(point[1], point[0]);
  return (radian * 180 / Math.PI + 450) % 360;
};

export const degreesToOrientation = (degrees: number): Orientation => {
  const normalized = degrees % 360;

  if (45 < normalized && normalized <= 135) return 'right';
  if (135 < normalized && normalized <= 225) return 'down';
  if (225 < normalized && normalized <= 315) return 'left';
  return 'up';
}

// helper to create point ranges fast
export const pointRange = (length: number, generator: (index: number) => Point) =>
  Array.from({ length }).map<Point>((_, index) => generator(index));

export type Fog = 'visible' | 'fog' | 'dark';

export type CompositeId = {
  id: number,
  container: 'creatures' | 'equipments' | 'particles' | 'interactions',
};

export type Processor<T extends Entity> = {
  id: number,
  x: number,
  y: number,
  entity: ReactComponentElement<T>,
  parent?: CompositeId,
};

export type Container<T extends Entity> = Record<string, Processor<T>>;

export type TerminalState = {
  // display
  screenWidth: number,
  screenHeight: number,
  cameraX: number,
  cameraY: number,
  questStack: string[],

  // player
  repeatX: number,
  repeatY: number,
  inventory: Inventory,
  orientation?: Orientation,
  playerId: number,
  tick: number,

  // stats
  hp: number,
  mp: number,
  xp: number,

  // inventory
  gold: number,
  seed: number,
  herb: number,
  wood: number,
  iron: number,

  // board
  width: number,
  height: number,
  board: Cell[][],
  fog: Fog[][],
  creatures: Container<Creature>,
  equipments: Container<Equipment>,
  particles: Container<Particle>,
  interactions: Container<Interaction>,

  // maybe add some reverse index of mapping coordinates to entities
};

export const defaultState: TerminalState = {
  width: 160,
  height: 160,
  screenWidth: 21,
  screenHeight: 13,
  cameraX: 0,
  cameraY: 0,
  questStack: ['spawn'],
  playerId: 0,
  repeatX: 0,
  repeatY: 0,
  orientation: undefined,
  tick: 0,
  hp: 10,
  mp: 0,
  xp: 0,
  gold: 0,
  seed: 0,
  herb: 0,
  wood: 0,
  iron: 0,
  board: [[{}]],
  fog: [[]],
  creatures: {},
  equipments: {},
  interactions: {},
  particles: {},
  inventory: {},
};

export const getAbsolutePosition = <T extends Entity>(state: TerminalState, processor: Processor<T>): Point => {
  if (!processor.parent) return [processor.x, processor.y];

  const directParent = resolveCompositeId(state, processor.parent)
  const [parentX, parentY] = getAbsolutePosition(state, directParent as Processor<T>);
  return wrapCoordinates(state, processor.x + parentX, processor.y + parentY);
};

export const wrapCoordinates = (state: TerminalState, x: number, y: number): Point => [
  ((x % state.width) + state.width) % state.width,
  ((y % state.height) + state.height) % state.height,
];

export const getCell = (state: TerminalState, x: number, y: number) => {
  const [wrappedX, wrappedY] = wrapCoordinates(state, x, y);
  return state.board[wrappedY][wrappedX];
};

export const getFog = (state: TerminalState, x: number, y: number) => {
  const [wrappedX, wrappedY] = wrapCoordinates(state, x, y);
  return state.fog[wrappedY][wrappedX];
};

export const getInteraction = (state: TerminalState, x: number, y: number, predicate: (creature: Processor<Interaction>) => boolean = () => true) => {
  const [wrappedX, wrappedY] = wrapCoordinates(state, x, y);
  return Object.values(state.interactions).find(interaction => (
    interaction.x === wrappedX &&
    interaction.y === wrappedY &&
    predicate(interaction)
  ));
};

export const getCreature = (state: TerminalState, x: number, y: number, predicate: (creature: Processor<Creature>) => boolean = () => true) => {
  const [wrappedX, wrappedY] = wrapCoordinates(state, x, y);
  return Object.values(state.creatures).find(creature => (
    creature.x === wrappedX &&
    creature.y === wrappedY &&
    predicate(creature)
  ));
};

export const getEquipment = (state: TerminalState, x: number, y: number, predicate: (creature: Processor<Equipment>) => boolean = () => true) => {
  const [wrappedX, wrappedY] = wrapCoordinates(state, x, y);
  return Object.values(state.equipments).find(equipment => {
    const [equipmentX, equipmentY] = getAbsolutePosition(state, equipment);
    return (
      equipmentX === wrappedX &&
      equipmentY === wrappedY &&
      predicate(equipment)
    );
  })
};

export const removeProcessor = (state: TerminalState, compositeId: CompositeId): TerminalState => {
  // remove reference from parent
  const removed = resolveCompositeId(state, compositeId);
  const parent = removed?.parent ? resolveCompositeId(state, removed.parent) : undefined;

  if (removed?.parent && parent && compositeId.container in parent.entity.props) {
    // @ts-ignore
    const parentContainer = [...parent.entity.props[compositeId.container]];

    if (parentContainer) {
      const childIndex = parentContainer.indexOf(compositeId.id);
      if (childIndex !== -1) {
        parentContainer.splice(childIndex, 1);
        state = updateProcessorProps(state, removed.parent, { [compositeId.container]: parentContainer });
      }
    }
  }

  // remove from root container
  const { [compositeId.id]: _, ...remaining } = state[compositeId.container];

  return {
    ...state,
    [compositeId.container]: remaining
  };
};

export const updateInventory = (state: TerminalState, inventory: keyof Inventory, id?: number) => {
  return {
    ...state,
    inventory: {
      ...state.inventory,
      [inventory]: id,
    }
  };
}

export const updateProcessor = <T extends Entity>(state: TerminalState, compositeId: CompositeId, processor: Partial<Processor<T>>): TerminalState => {
  return {
    ...state,
    [compositeId.container]: {
      ...state[compositeId.container],
      [compositeId.id]: {
        ...resolveCompositeId(state, compositeId),
        ...processor,
      }
    }
  };
}

export const updateProcessorProps = <T extends Entity>(state: TerminalState, compositeId: CompositeId, props: Partial<React.ComponentProps<T>>) => {
  const processor = resolveCompositeId(state, compositeId);

  if (!processor) return state;

  return updateProcessor(state, compositeId, {
    // didn't manage to convice TypeScript here
    // @ts-ignore
    entity: React.cloneElement(processor.entity, props)
  });
};

export const getPlayerProcessor = (state: TerminalState) => state.creatures[state.playerId];

export const resolveCompositeId = (state: TerminalState, compositeId: CompositeId) => state[compositeId.container][compositeId.id];

export const getParentEntity = (state: TerminalState, processor: Processor<Entity>): Processor<Creature> | Processor<Equipment> | Processor<Particle> | Processor<Interaction> | undefined => {
  if (!processor.parent) return undefined;

  const parent = resolveCompositeId(state, processor.parent)

  if (!parent) return undefined;
  
  return getParentEntity(state, parent) || parent;
};

export const isOrphaned = (state: TerminalState, compositeId: CompositeId): boolean => {
  const unit = resolveCompositeId(state, compositeId);

  if (!unit) return true;
  if (unit.parent && !getParentEntity(state, unit)) return true;

  return false;
};

export const updateCell = (state: TerminalState, x: number, y: number, cell: Cell) => {
  return {
    ...state,
    board: [
      ...state.board.slice(0, y),
      [
        ...state.board[y].slice(0, x),
        {
          ...getCell(state, x, y),
          ...cell,
        },
        ...state.board[y].slice(x + 1),
      ],
      ...state.board.slice(y + 1),
    ]
  };
};

export const createParticle = (state: TerminalState, processor: Pick<Processor<Particle>, 'x' | 'y' | 'parent'>, component: Particle, props: Omit<React.ComponentProps<Particle>, 'id'>): [TerminalState, Processor<Particle>] => {
  const ParticleComponent = component;
  const id = getId();
  const [wrappedX, wrappedY] = wrapCoordinates(state, processor.x, processor.y);
  const particle = {
    x: wrappedX,
    y: wrappedY,
    parent: processor.parent,
    id,
    entity: <ParticleComponent {...props} id={id} />
  };
  state = updateProcessor(state, { container: 'particles', id }, particle);

  // add to parent
  const parent = particle.parent ? resolveCompositeId(state, particle.parent) : undefined
  if (particle.parent && parent && 'particles' in parent.entity.props) {
    state = updateProcessorProps(state, particle.parent, {
      particles: [...parent.entity.props.particles, id],
    });
  }

  return [state, particle];
};

export const createInteraction = (state: TerminalState, processor: Pick<Processor<Interaction>, 'x' | 'y' | 'parent'>, component: Interaction, props: Omit<React.ComponentProps<Interaction>, 'id'>): [TerminalState, Processor<Interaction>] => {
  const InteractionComponent = component;
  const id = getId();
  const [wrappedX, wrappedY] = wrapCoordinates(state, processor.x, processor.y);
  const interaction = {
    x: wrappedX,
    y: wrappedY,
    parent: processor.parent,
    id,
    entity: <InteractionComponent {...props} id={id} />
  };
  state = updateProcessor(state, { container: 'interactions', id }, interaction);

  return [state, interaction];
};

export const createEquipment = (state: TerminalState, processor: Pick<Processor<Equipment>, 'x' | 'y' | 'parent'>, component: Equipment, props: Omit<React.ComponentProps<Equipment>, 'id'>): [TerminalState, Processor<Equipment>] => {
  const EquipmentComponent = component;
  const id = getId();
  const [wrappedX, wrappedY] = wrapCoordinates(state, processor.x, processor.y);
  const equipment = {
    x: wrappedX,
    y: wrappedY,
    parent: processor.parent,
    id,
    entity: <EquipmentComponent {...props} id={id} />
  };
  state = updateProcessor(state, { container: 'equipments', id }, equipment);

  // add to parent
  const parent = equipment.parent ? resolveCompositeId(state, equipment.parent) : undefined
  if (equipment.parent && parent && 'equipments' in parent.entity.props) {
    state = updateProcessorProps(state, equipment.parent, {
      equipments: [...parent.entity.props.equipments, id],
    });
  }

  return [state, equipment];
};

export const createCreature = (state: TerminalState, processor: Pick<Processor<Creature>, 'x' | 'y' | 'parent'>, component: Creature, props: Omit<React.ComponentProps<Creature>, 'id'>): [TerminalState, Processor<Creature>] => {
  const CreatureComponent = component;
  const id = getId();
  const [wrappedX, wrappedY] = wrapCoordinates(state, processor.x, processor.y);
  const creature = {
    x: wrappedX,
    y: wrappedY,
    parent: processor.parent,
    id,
    entity: <CreatureComponent {...props} id={id} />
  };
  state = updateProcessor(state, { container: 'creatures', id }, creature);

  return [state, creature];
};

export const isWater = (state: TerminalState, x: number, y: number) => {
  const cell = getCell(state, x, y);
  return cell.grounds?.length === 1 && cell.grounds[0].type === Water && cell.grounds[0].props.amount === 4;
}
export const isLand = (state: TerminalState, x: number, y: number) => [-1, 0, 1].map(deltaX => [-1, 0, 1].map(deltaY => !isWater(state, x + deltaX, y + deltaY))).flat().some(Boolean);
export const isWalkable = (state: TerminalState, x: number, y: number, id: number) => {
  const cell = getCell(state, x, y);
  const creature = getCreature(state, x, y);
  const passableCreature = creature ? creature.id === state.playerId : true;
  const equipment = getEquipment(state, x, y, equipment => !equipment.entity.props.mode || equipment.entity.type === Blocked)
  const passableEquipment = equipment ? getParentEntity(state, equipment)?.id === id : true;
  return isLand(state, x, y) && !cell.terrain && !cell.item && passableCreature && passableEquipment;
}