import { Cell, Direction, Water } from "./entities";

export const sum = (numbers: number[]) => numbers.reduce((total, number) => total + number, 0);

export const getDeterministicRandomInt = (minimum: number, maximum: number) => {
  return Math.floor(
    window.Rune.deterministicRandom() * (maximum - minimum + 1) + minimum
  );
};

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
  direction?: Direction,

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
  creatures: Point[],
  particles: Point[],
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
  return isLand(state, x, y) && !cell.terrain && !cell.creature && !cell.item;
}