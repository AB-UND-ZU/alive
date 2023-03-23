import React, { ReactComponentElement, ReactElement } from "react";
import { Cell, Inventory, inventories, ShallowWater, Swimming, Gold, Entity, Triangle, directionOffset, directions } from "./entities";
import { visibleFogOfWar } from "./fog";
import { getCell, getDeterministicRandomInt, getFog, Point, pointRange, TerminalState, wrapCoordinates } from "./utils";

type MoveAction = {
  type: 'move',
  deltaX?: number,
  deltaY?: number,
};

type CollectAction = {
  type: 'collect',
  itemX: number,
  itemY: number,
};

type FogAction = {
  type: 'fog',
};

type TickAction = {
  type: 'tick',
};

type TerminalAction = MoveAction | CollectAction | FogAction | TickAction;

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
const isWater = (state: TerminalState, x: number, y: number) => {
  const cell = getCell(state, x, y);
  return cell.grounds?.length === 1 && cell.grounds[0].type === ShallowWater && cell.grounds[0].props.amount === 4;
}
const isLand = (state: TerminalState, x: number, y: number) => [-1, 0, 1].map(deltaX => [-1, 0, 1].map(deltaY => !isWater(state, x + deltaX, y + deltaY))).flat().some(Boolean);
const isWalkable = (state: TerminalState, x: number, y: number) => {
  const cell = getCell(state, x, y);
  return isLand(state, x, y) && !cell.terrain && !cell.creature && !cell.item;
}

export const reducer = (state: TerminalState, action: TerminalAction): TerminalState => {
  switch (action.type) {
    case 'move': {
      const { deltaX = 0, deltaY = 0 } = action;
      let newState = { ...state };
      const [newX, newY] = wrapCoordinates(newState, newState.x + deltaX, newState.y + deltaY);
      const cell = newState.board[newState.y][newState.x];
      let newCell = { ...newState.board[newY][newX] };

      // if walking into item, stop and collect instead
      if (newCell.item) {
        newState = reducer(newState, { type: 'collect', itemX: newX, itemY: newY });
        
      } else if (isWalkable(state, newX, newY)) {
        newCell.creature = cell.creature;
        newCell.equipments = cell.equipments;
        newState.board = updateBoard(newState.board, newX, newY, newCell);
        newState.board = updateBoard(newState.board, newState.x, newState.y, { ...cell, creature: undefined, equipments: undefined });
        newState.x = newX;
        newState.y = newY;

        // update swimming display
        cell.particles = (cell.particles || []).filter(particle => particle.type !== Swimming);
        if (isWater(newState, newX, newY)) {
          newCell.particles = [...(newCell.particles || []), <Swimming />];
        }
      }

      newState = reducer(newState, { type: 'fog' });
      return newState;
    }

    case 'collect': {
      const { itemX, itemY } = action;
      const itemCell = { ...getCell(state, itemX, itemY) };
      const ItemEntity = itemCell.item?.type;
      const inventory = inventories.get(ItemEntity);
      const amount = itemCell.item?.props.amount || 0;

      if (!inventory || !ItemEntity) return state;
        
      if (amount <= 1) {
        itemCell.item = undefined;
      } else {
        itemCell.item = <ItemEntity amount={amount - 1} />;
      }
      return {
        ...state,
        board: updateBoard(state.board, itemX, itemY, itemCell),
        [inventory]: state[inventory] + 1,
      };
    }

    case 'fog': {
      let newState = { ...state, fog: [...state.fog] };

      // clear previous view with +1 overscan to compensate for player movement
      Array.from({ length: newState.screenHeight + 2 }).forEach((_, offsetY) => {
        const row = pointRange(newState.screenWidth + 2, offsetX => [
          newState.x + offsetX - (newState.screenWidth - 1) / 2 - 1,
          newState.y + offsetY - (newState.screenHeight - 1) / 2 - 1,
        ]);

        row.forEach(point => {
          if (getFog(newState, ...point) === 'visible') {
            const [fogX, fogY] = wrapCoordinates(newState, ...point);
            newState.fog[fogY][fogX] = 'fog';
          }
        });
      });

      const fogOfWar = visibleFogOfWar(newState);
      fogOfWar.forEach(([visibleX, visibleY]) => {
        const [fogX, fogY] = wrapCoordinates(newState, newState.x + visibleX, newState.y + visibleY);
        newState.fog[fogY][fogX] = 'visible';
      });


      return newState;
    }

    case 'tick': {
      const newState = { ...state };
      const newCreatures = newState.creatures.map<Point>(([creatureX, creatureY]) => {
        const creatureCell = getCell(newState, creatureX, creatureY);
        
        if (creatureCell.creature?.type === Triangle) {
          const direction = creatureCell.creature.props.direction;
          const [moveX, moveY] = directionOffset[direction];
          const [targetX, targetY] = wrapCoordinates(newState, creatureX + moveX, creatureY + moveY);
          const targetCell = getCell(newState, targetX, targetY);
          if (isWalkable(newState, targetX, targetY)) {
            newState.board = updateBoard(newState.board, targetX, targetY, {...targetCell, creature: creatureCell.creature});
            newState.board = updateBoard(newState.board, creatureX, creatureY, { ...creatureCell, creature: undefined });
            return [targetX, targetY];
          }

          const newDirection = directions[(directions.indexOf(direction) + getDeterministicRandomInt(1, directions.length - 1)) % directions.length];
          newState.board = updateBoard(newState.board, creatureX, creatureY, {
            ...creatureCell,
            creature: <Triangle direction={newDirection} />
          });
        }

        return [creatureX, creatureY];
      });

      return {
        ...newState,
        creatures: newCreatures,
      };
    }

    default: {
      console.error('Invalid action!', { state, action });
    }
  }

  return state;
}