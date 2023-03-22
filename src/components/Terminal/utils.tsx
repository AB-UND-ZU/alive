import { Cell } from "./entities";

// x, y
export type Point = [number, number];

// helper to create point ranges fast
export const pointRange = (length: number, generator: (index: number) => Point) =>
  Array.from({ length }).map<Point>((_, index) => generator(index));

export type Fog = 'visible' | 'fog' | 'dark';

export type TerminalState = {
  // player
  x: number,
  y: number,

  // inventory
  gold: number,
  food: number,
  mana: number,
  wood: number,
  iron: number,

  // board
  width: number,
  height: number,
  screenWidth: number,
  screenHeight: number,
  board: Cell[][],
  fog: Fog[][],
}

export const wrapCoordinates = (state: TerminalState, x: number, y: number) => [
  (x + state.width) % state.width,
  (y + state.height) % state.height,
];

export const getCell = (state: TerminalState, x: number, y: number) => {
  const [newX, newY] = wrapCoordinates(state, x, y);
  return state.board[newY][newX];
};

export const getFog = (state: TerminalState, x: number, y: number) => {
  const [newX, newY] = wrapCoordinates(state, x, y);
  return state.fog[newY][newX];
};