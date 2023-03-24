import { tickCreature } from "./creatures";
import { inventories, Swimming, directionOffset, Direction, Water } from "./entities";
import { visibleFogOfWar } from "./fog";
import { tickParticles } from "./particles";
import { getCell, getFog, isWalkable, isWater, Point, pointRange, TerminalState, updateBoard, wrapCoordinates } from "./utils";

type MoveAction = {
  type: 'move',
  direction?: Direction,
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

export const reducer = (state: TerminalState, action: TerminalAction): TerminalState => {
  switch (action.type) {
    case 'move': {
      const { direction } = action;
      const [deltaX, deltaY] = direction ? directionOffset[direction] : [0, 0];
      let newState: TerminalState = { ...state, direction };
      const [newX, newY] = wrapCoordinates(newState, newState.x + deltaX, newState.y + deltaY);
      const playerCell = { ...newState.board[newState.y][newState.x] };
      let newCell = { ...newState.board[newY][newX] };

      // if walking into item, stop and collect instead
      if (newCell.item) {
        newState = reducer(newState, { type: 'collect', itemX: newX, itemY: newY });
        
      } else if (isWalkable(state, newX, newY)) {
        newCell.creature = playerCell.creature
        newCell.equipments = playerCell.equipments
        newState.board = updateBoard(newState.board, newX, newY, newCell);
        playerCell.creature = undefined;
        playerCell.equipments = undefined;
        newState.board = updateBoard(newState.board, newState.x, newState.y, playerCell);
        newState.x = newX;
        newState.y = newY;
      }

      const particleState = tickParticles(newState, newState.x, newState.y);
      newState.board = particleState.board;

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
      const newState = { ...state, direction: undefined };

      newState.creatures = newState.creatures.map<Point>(([creatureX, creatureY]) => {
        const [creatureState, [targetX, targetY]] = tickCreature(newState, creatureX, creatureY);
        newState.board = creatureState.board;
        
        // update swimming display
        const particleState = tickParticles(newState, targetX, targetY);
        newState.board = particleState.board;

        return [targetX, targetY];
      });

      return newState;
    }

    default: {
      console.error('Invalid action!', { state, action });
    }
  }

  return state;
}