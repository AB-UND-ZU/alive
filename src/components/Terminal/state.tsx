import { tickCreature } from "./creatures";
import { counters, Creature, inventories, Particle, Player, Shock  } from "./entities";
import { visibleFogOfWar } from "./fog";
import { tickParticle } from "./particles";
import { addPoints, center, directionOffset, directions, getCell, getFog, isWalkable, Orientation, Point, pointRange, Processor, TerminalState, updateBoard, wrapCoordinates } from "./utils";

type MoveAction = {
  type: 'move',
  orientation?: Orientation,
};

type SpellAction = {
  type: 'spell',
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

type TerminalAction = MoveAction | SpellAction | CollectAction | FogAction | TickAction;

export const reducer = (state: TerminalState, action: TerminalAction): TerminalState => {
  switch (action.type) {
    case 'move': {
      const { orientation } = action;
      const [deltaX, deltaY] = directionOffset[orientation || center];
      let newState: TerminalState = { ...state, orientation };
      const [newX, newY] = wrapCoordinates(newState, newState.x + deltaX, newState.y + deltaY);
      let newCell = { ...newState.board[newY][newX] };

      const playerIndex = newState.creatures.findIndex(processor => processor.entity.type === Player);
      const newProcessor = { ...newState.creatures[playerIndex] };

      // if walking into item, stop and collect instead
      if (newCell.item) {
        newState = reducer(newState, { type: 'collect', itemX: newX, itemY: newY });
        
      } else if (isWalkable(state, newX, newY)) {
        newProcessor.x = newX;
        newProcessor.y = newY;
        // process nested particles
        const [creatureState, playerProcessor] = tickCreature(newState, newProcessor);
        newState.board = creatureState.board;

        const newCreatures = [...newState.creatures];
        newCreatures.splice(playerIndex, 1, playerProcessor);
        newState.creatures = newCreatures;
        newState.x = newX;
        newState.y = newY;
      }

      newState = reducer(newState, { type: 'fog' });
      return newState;
    }

    case 'collect': {
      const { itemX, itemY } = action;
      const newState = { ...state };
      const itemCell = { ...getCell(state, itemX, itemY) };

      if (!itemCell.item) return state;
      const ItemEntity = itemCell.item.type;
      const counter = counters.get(ItemEntity);
      const inventory = inventories.get(ItemEntity);
      const amount = itemCell.item.props.amount;

      if (counter) {
        if (amount > 1) {
          itemCell.item = <ItemEntity amount={amount - 1} />;
        } else {
          itemCell.item = undefined;
        }
        newState[counter] = newState[counter] + 1;
      } else if (inventory) {
        newState.inventory[inventory[0]] = {
          ...itemCell.item,
          type: inventory[1],
        };
        itemCell.item = undefined;
      }
        
      newState.board = updateBoard(state.board, itemX, itemY, itemCell);
      return newState;
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
      const newState = { ...state, orientation: undefined };

      newState.creatures = newState.creatures.map(processor => {
        const [creatureState, creatureProcessor] = tickCreature(newState, processor);
        newState.board = creatureState.board;
        return creatureProcessor;
      }).filter(Boolean) as Processor<Creature>[];
      newState.particles = newState.particles.map(processor => {
        const [particleState, particleProcessor] = tickParticle(newState, processor);
        newState.board = particleState.board;
        return particleProcessor;
      }).filter(Boolean) as Processor<Particle>[];

      return newState;
    }

    case 'spell': {
      const newState = { ...state };
      const newParticles = [...newState.particles];

      // create all shocks around player
      directions.forEach(direction => {
        const [shockX, shockY] = addPoints(newState, [newState.x, newState.y], directionOffset[direction]);
        newParticles.push({
          x: shockX,
          y: shockY,
          entity: <Shock direction={direction} />
        });
      });
      newState.particles = newParticles;

      return newState;
    }

    default: {
      console.error('Invalid action!', { state, action });
    }
  }

  return state;
}