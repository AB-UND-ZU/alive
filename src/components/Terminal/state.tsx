import { Cell, Inventory, items } from "./entities";

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

export const reducer = (state: TerminalState, action: TerminalAction): TerminalState => {
  switch (action.type) {
    case 'move': {
      const { deltaX = 0, deltaY = 0 } = action;
      let newState = { ...state };
      const newX = (state.x + deltaX + state.width) % state.width;
      const newY = (state.y + deltaY + state.height) % state.height;
      const cell = state.board[state.y][state.x];
      let newCell = { ...state.board[newY][newX] };
      let newBoard = newState.board;

      if (newCell.item) {
        newState = reducer(newState, { type: 'collect', inventory: newCell.item.props.inventory, amount: newCell.item.props.amount });
        newCell.item = undefined;
        newBoard = updateBoard(newBoard, newX, newY, newCell);
      }

      if (!newCell.terrain && !newCell.creature) {
        newCell.creature = cell.creature;
        newCell.equipments = cell.equipments;
        newBoard = updateBoard(newBoard, newX, newY, newCell);
        newBoard = updateBoard(newBoard, state.x, state.y, { ...cell, creature: undefined, equipments: undefined });
        newState.x = newX;
        newState.y = newY;
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