import { ReactComponentElement } from "react";
import { tickCreature } from "../../engine/creatures";
import { Attacked, counters, Creature, Equipment, equipments, inventories, Item, Particle, Player, Shock, Spell, Sword, Wood  } from "../../engine/entities";
import { visibleFogOfWar } from "../../engine/fog";
import { tickParticle } from "../../engine/particles";
import { tickEquipment } from "../../engine/equipments";
import { center, Direction, directionOffset, getCell, getFog, getId, isWalkable, Orientation, pointRange, Processor, TerminalState, updateBoard, wrapCoordinates } from "../../engine/utils";
import React from "react";

type QueueAction = {
  type: 'queue',
  orientation?: Orientation,
};

type MoveAction = {
  type: 'move',
  orientation?: Orientation,
};

type AttackAction = {
  type: 'attack',
  creatureX: number,
  creatureY: number,
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

type TerminalAction = QueueAction | MoveAction | AttackAction | SpellAction | CollectAction | FogAction | TickAction;

export const reducer = (state: TerminalState, action: TerminalAction): TerminalState => {
  switch (action.type) {
    case 'queue': {
      const { orientation } = action;
      return { ...state, orientation };
    };

    case 'move': {
      const { orientation } = action;
      const [deltaX, deltaY] = directionOffset[orientation || center];
      let newState: TerminalState = { ...state };
      const [movedX, movedY] = [newState.x + deltaX, newState.y + deltaY];
      const [newX, newY] = wrapCoordinates(newState, movedX, movedY);
      let newCell = { ...newState.board[newY][newX] };

      const playerIndex = newState.creatures.findIndex(processor => processor.entity.type === Player);
      const newProcessor = { ...newState.creatures[playerIndex] };

      const attackedCreature = newState.creatures.find(creature => (
        creature.entity.type !== Player &&
        creature.x === newX &&
        creature.y === newY
      ));

      const equipmentIndex = newState.equipments.findIndex(processor => (
        processor.x === newX &&
        processor.y === newY &&
        processor.entity.props.interaction === undefined
      ));

      // if walking into item, stop and collect instead
      if (newCell.item || equipmentIndex !== -1) {
        newState = reducer(newState, { type: 'collect', itemX: newX, itemY: newY });

      } else if (attackedCreature && newState.inventory.sword) {
        // hit creature if found
        newState = reducer(newState, { type: 'attack', creatureX: newX, creatureY: newY });
        
      } else if (isWalkable(state, newX, newY)) {
        newProcessor.x = newX;
        newProcessor.y = newY;
        newState.repeatX = newState.repeatX + Math.sign(movedX - newX);
        newState.repeatY = newState.repeatY + Math.sign(movedY - newY);

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
      const collectCell = { ...getCell(state, itemX, itemY) };
      const newEquipments = [...newState.equipments];

      const equipmentIndex = newEquipments.findIndex(processor => processor.x === itemX && processor.y === itemY);
      const newProcessor = { ...newEquipments[equipmentIndex] };

      if (collectCell.item) {
        const item: ReactComponentElement<Item> = { ...collectCell.item };
        const ItemEntity = item.type;
        const counter = counters.get(ItemEntity);
        const amount = item.props.amount;

        if (amount > 1) {
          collectCell.item = {
            ...collectCell.item,
            props: {
              ...collectCell.item.props,
              amount: amount - 1,
            },
          };
        } else {
          collectCell.item = undefined;
        }

        // special case: first wood to be picked up can be used as sword
        if (!newState.inventory.sword && ItemEntity === Wood) {
          newProcessor.x = itemX;
          newProcessor.y = itemY;
          newProcessor.entity = <Sword amount={1} material="wood" id={getId()} />; 
        } else if (counter) {
          newState[counter] = newState[counter] + 1;
        }
      }

      if (newProcessor.entity) {
        const inventory = inventories.get(newProcessor.entity.type);
        
        if (inventory) {
          newEquipments.splice(equipmentIndex, 1);
          newState.inventory = {
            ...newState.inventory,
            [inventory]: newProcessor.entity
          };

          const playerIndex = newState.creatures.findIndex(processor => processor.entity.type === Player);
          const playerProcessor = { ...newState.creatures[playerIndex] };
          const newEquipment: ReactComponentElement<Equipment> = {
            ...newProcessor.entity,
            props: {
              ...newProcessor.entity.props,
              interaction: 'equipped',
            }
          };
          playerProcessor.entity = {
            ...playerProcessor.entity,
            props: {
              ...playerProcessor.entity.props,
              equipments: [...(playerProcessor.entity.props.equipments || []), newEquipment],
            }
          };
          const newCreatures = [...newState.creatures];
          newCreatures.splice(playerIndex, 1, playerProcessor);
          newState.creatures = newCreatures;
        }
      }
      
      newState.equipments = newEquipments;
      newState.board = updateBoard(state.board, itemX, itemY, collectCell);
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
      const newState = { ...state };

      newState.equipments = newState.equipments.map(processor => {
        const [equipmentState, equipmentProcessor] = tickEquipment(newState, processor);
        newState.board = equipmentState.board;
        newState.creatures = equipmentState.creatures;
        return equipmentProcessor;
      }).filter(Boolean) as Processor<Equipment>[];

      newState.particles = newState.particles.map(processor => {
        const [particleState, particleProcessor] = tickParticle(newState, processor);
        newState.board = particleState.board;
        return particleProcessor;
      }).filter(Boolean) as Processor<Particle>[];

      newState.creatures = newState.creatures.map(processor => {
        const [creatureState, creatureProcessor] = tickCreature(newState, processor);
        newState.board = creatureState.board;
        return creatureProcessor;
      }).filter(Boolean) as Processor<Creature>[];

      return newState;
    }

    case 'attack': {
      if (!state.inventory.sword) {
        return state;
      }

      const { creatureX, creatureY } = action;
      const newState = { ...state };
      const newCreatures = [...newState.creatures];
      const attackedIndex = newCreatures.findIndex(creature => (
        creature.entity.type !== Player &&
        creature.x === creatureX &&
        creature.y === creatureY
      ));
      const attackedCreature = newState.creatures[attackedIndex];

      if (!attackedCreature || !newState.inventory.sword) return newState;

      // get attacking angle
      const attackingDirection = Object.entries(directionOffset).find(([_, [offsetX, offsetY]]) => (
        offsetX === creatureX - newState.x &&
        offsetY === creatureY - newState.y
      ))?.[0] as Direction | undefined;

      // update sword animation
      const playerIndex = newCreatures.findIndex(processor => processor.entity.type === Player);
      const newProcessor = { ...newCreatures[playerIndex] };
      const newEquipments = [...(newProcessor.entity.props.equipments || [])];
      const swordIndex = newEquipments.findIndex(equipment => equipment.type === Sword);

      if (swordIndex === -1) return newState;

      newEquipments.splice(swordIndex, 1, React.cloneElement(newEquipments[swordIndex], { direction: attackingDirection }));
      newProcessor.entity = React.cloneElement(newProcessor.entity, { equipments: newEquipments });
      newCreatures.splice(playerIndex, 1, newProcessor);

      // reduce health or kill creature
      newCreatures.splice(attackedIndex, 1);
      const newAmount = attackedCreature.entity.props.amount - state.inventory.sword.props.amount;

      if (newAmount > 0) {
        newCreatures.push({
          ...attackedCreature,
          entity: {
            ...attackedCreature.entity,
            props: {
              ...attackedCreature.entity.props,
              particles: [...(attackedCreature.entity.props.particles || []), <Attacked id={getId()} material={state.inventory.sword.props.material} />],
              amount: newAmount
            }
          }
        });
      }
      newState.creatures = newCreatures;

      return newState;
    }

    case 'spell': {
      const newState = { ...state };
      
      if (!newState.inventory.spell) return newState;

      const centerParticle = {
        x: newState.x,
        y: newState.y,
        entity: <Shock direction={center} id={getId()} />
      };
      const processor = {
        x: newState.x,
        y: newState.y,
        entity: <Spell amount={1} particles={[centerParticle]} material="ice" interaction="using" id={getId()} />,
      };
      const [equipmentState, equipmentProcessor] = tickEquipment(newState, processor);
      newState.board = equipmentState.board;
      newState.creatures = equipmentState.creatures;

      if (equipmentProcessor) {
        newState.equipments = [...newState.equipments, equipmentProcessor];
      }

      return newState;
    }

    default: {
      console.error('Invalid action!', { state, action });
    }
  }

  return state;
}