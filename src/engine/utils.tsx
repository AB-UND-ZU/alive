import React, { ReactComponentElement } from "react";
import { Cell, Creature, Particle, Water, Entity, Inventory, Equipment, equipments } from "./entities";

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
  ArrowRight: 'right',
  ArrowDown: 'down',
  ArrowLeft: 'left',
};

// x, y
export type Point = [number, number];

export const addPoints = (state: TerminalState, left: Point, right: Point): Point => wrapCoordinates(state, left[0] + right[0], left[1] + right[1]);

// degrees are counted from top center clockwise, from 0 to 360
export const pointToDegree = (point: Point) => {
  const radian = Math.atan2(point[1], point[0]);
  return (radian * 180 / Math.PI + 450) % 360;
}

// helper to create point ranges fast
export const pointRange = (length: number, generator: (index: number) => Point) =>
  Array.from({ length }).map<Point>((_, index) => generator(index));

export type Fog = 'visible' | 'fog' | 'dark';

export type CompositeId = {
  id: number,
  container: 'creatures' | 'equipments' | 'particles',
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

  // player
  repeatX: number,
  repeatY: number,
  inventory: Inventory,
  orientation?: Orientation,
  playerId: number,

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

  // maybe add some reverse index of mapping coordinates to entities
};

export const defaultState: TerminalState = {
  width: 160,
  height: 160,
  screenWidth: 21,
  screenHeight: 13,
  cameraX: 0,
  cameraY: 0,
  playerId: 0,
  repeatX: 0,
  repeatY: 0,
  orientation: undefined,
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
  return Object.values(state.equipments).find(equipment => (
    equipment.x === wrappedX &&
    equipment.y === wrappedY &&
    predicate(equipment)
  ));
};

export const removeProcessor = (state: TerminalState, compositeId: CompositeId): TerminalState => {
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

  return updateProcessor(state, compositeId, {
    // didn't manage to convice TypeScript here
    // @ts-ignore
    entity: React.cloneElement(processor.entity, props)
  });
};

export const getPlayerProcessor = (state: TerminalState) => state.creatures[state.playerId];

export const resolveCompositeId = (state: TerminalState, compositeId: CompositeId) => state[compositeId.container][compositeId.id];

export const getParentEntity = (state: TerminalState, processor: Processor<Entity>): Processor<Creature> | Processor<Equipment> | Processor<Particle> | undefined => {
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
  const particle = {
    ...processor,
    id,
    entity: <ParticleComponent {...props} id={id} />
  };
  state = updateProcessor(state, { container: 'particles', id }, particle);
  return [state, particle];
};

export const createEquipment = (state: TerminalState, processor: Pick<Processor<Equipment>, 'x' | 'y' | 'parent'>, component: Equipment, props: Omit<React.ComponentProps<Equipment>, 'id'>): [TerminalState, Processor<Equipment>] => {
  const EquipmentComponent = component;
  const id = getId();
  const equipment = {
    ...processor,
    id,
    entity: <EquipmentComponent {...props} id={id} />
  };
  state = updateProcessor(state, { container: 'equipments', id }, equipment);
  return [state, equipment];
};

export const createCreature = (state: TerminalState, processor: Pick<Processor<Creature>, 'x' | 'y' | 'parent'>, component: Creature, props: Omit<React.ComponentProps<Creature>, 'id'>): [TerminalState, Processor<Creature>] => {
  const CreatureComponent = component;
  const id = getId();
  const creature = {
    ...processor,
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
export const isWalkable = (state: TerminalState, x: number, y: number) => {
  const cell = getCell(state, x, y);
  const creature = Object.values(state.creatures).find(processor => processor.x === x && processor.y === y);
  return isLand(state, x, y) && !cell.terrain && !creature && !cell.item;
}