import { ReactComponentElement } from "react";
import { Cell, Creature, Particle, Water, Entity, Inventory, Equipment } from "./entities";

let lastId = -1;
export const getId = () => {
  lastId += 1;
  return lastId;
}
export const sum = (numbers: number[]) => numbers.reduce((total, number) => total + number, 0);

export const getDeterministicRandomInt = (minimum: number, maximum: number) => {
  return Math.floor(
    window.Rune.deterministicRandom() * (maximum - minimum + 1) + minimum
  );
};

export const renderText = (text: string, color: string = 'HUD') => text.split('').map((character, index) => (
  <span className="Cell" key={index}>
    <span className={`Entity ${color}`}>{character}</span>
  </span>
));

export const orientations = ['up', 'right', 'down', 'left'] as const;
export const corners = ['upRight', 'rightDown', 'downLeft', 'leftUp'] as const;
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

export type Processor<T extends Entity> = {
  x: number,
  y: number,
  entity: ReactComponentElement<T>,
}

export type TerminalState = {
  // player
  x: number,
  y: number,
  repeatX: number,
  repeatY: number,
  inventory: Inventory,
  orientation?: Orientation,

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

  // display
  screenWidth: number,
  screenHeight: number,

  // board
  width: number,
  height: number,
  board: Cell[][],
  fog: Fog[][],
  creatures: Processor<Creature>[],
  particles: Processor<Particle>[],
  equipments: Processor<Equipment>[],
};

export const defaultState: TerminalState = {
  width: 160,
  height: 160,
  screenWidth: 21,
  screenHeight: 13,
  x: 0,
  y: 0,
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
  creatures: [],
  particles: [],
  equipments: [],
  inventory: {},
};

export const wrapCoordinates = (state: TerminalState, x: number, y: number): Point => [
  ((x % state.width) + state.width) % state.width,
  ((y % state.height) + state.height) % state.height,
];

export const getCell = (state: TerminalState, x: number, y: number) => {
  const [newX, newY] = wrapCoordinates(state, x, y);
  return state.board[newY][newX];
};

export const getFog = (state: TerminalState, x: number, y: number) => {
  const [newX, newY] = wrapCoordinates(state, x, y);
  return state.fog[newY][newX];
};

export const updateBoard = (board: Cell[][], x: number, y: number, value: Cell) => {
  const newBoard = [
    ...board.slice(0, y),
    [
      ...board[y].slice(0, x),
      value,
      ...board[y].slice(x + 1),
    ],
    ...board.slice(y + 1),
  ];
  return newBoard;
}
export const isWater = (state: TerminalState, x: number, y: number) => {
  const cell = getCell(state, x, y);
  return cell.grounds?.length === 1 && cell.grounds[0].type === Water && cell.grounds[0].props.amount === 4;
}
export const isLand = (state: TerminalState, x: number, y: number) => [-1, 0, 1].map(deltaX => [-1, 0, 1].map(deltaY => !isWater(state, x + deltaX, y + deltaY))).flat().some(Boolean);
export const isWalkable = (state: TerminalState, x: number, y: number) => {
  const cell = getCell(state, x, y);
  const creature = state.creatures.find(processor => processor.x === x && processor.y === y);
  return isLand(state, x, y) && !cell.terrain && !creature && !cell.item;
}