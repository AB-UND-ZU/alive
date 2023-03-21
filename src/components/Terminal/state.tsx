import { Cell, Inventory, inventories, ShallowWater, Swimming } from "./entities";

const updateBoard = (board: Cell[][], x: number, y: number, value: Cell) => {
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

type MoveAction = {
  type: 'move',
  deltaX?: number,
  deltaY?: number,
};

type CollectAction = {
  type: 'collect',
  inventory: Inventory,
  amount: number,
};

type TerminalAction = MoveAction | CollectAction;

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
}

const wrapCoordinates = (state: TerminalState, x: number, y: number) => [
  (x + state.width) % state.width,
  (y + state.height) % state.height,
];
export const getCell = (state: TerminalState, x: number, y: number) => {
  const [newX, newY] = wrapCoordinates(state, x, y);
  return state.board[newY][newX];
};
const isWater = (state: TerminalState, x: number, y: number) => {
  const cell = getCell(state, x, y);
  return cell.grounds?.length === 1 && cell.grounds[0].type === ShallowWater && cell.grounds[0].props.amount === 4;
}
const isLand = (state: TerminalState, x: number, y: number) => [-1, 0, 1].map(deltaX => [-1, 0, 1].map(deltaY => !isWater(state, x + deltaX, y + deltaY))).flat().some(Boolean);

export const reducer = (state: TerminalState, action: TerminalAction): TerminalState => {
  switch (action.type) {
    case 'move': {
      const { deltaX = 0, deltaY = 0 } = action;
      let newState = { ...state };
      const [newX, newY] = wrapCoordinates(state, state.x + deltaX, state.y + deltaY);
      const cell = state.board[state.y][state.x];
      let newCell = { ...state.board[newY][newX] };
      let newBoard = newState.board;

      if (newCell.item) {
        newState = reducer(newState, { type: 'collect', inventory: inventories.get(newCell.item.type) || 'gold', amount: newCell.item.props.amount });
        newCell.item = undefined;
        newBoard = updateBoard(newBoard, newX, newY, newCell);
      } else if (!newCell.terrain && !newCell.creature && isLand(state, newX, newY)) {
        newCell.creature = cell.creature;
        newCell.equipments = cell.equipments;
        newBoard = updateBoard(newBoard, newX, newY, newCell);
        newBoard = updateBoard(newBoard, state.x, state.y, { ...cell, creature: undefined, equipments: undefined });
        newState.x = newX;
        newState.y = newY;

        if (isWater(state, newX, newY)) {
          newCell.particles = [...(newCell.particles || []), <Swimming />];
        }
        cell.particles = (cell.particles || []).filter(particle => particle.type !== Swimming);
      }

      return {
        ...newState,
        board: newBoard,
      };
    }

    case 'collect': {
      const { inventory, amount } = action;
      return {
        ...state,
        [inventory]: state[inventory] + amount,
      };
    }
  }

  return state;
}