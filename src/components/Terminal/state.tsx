import React, { ReactComponentElement } from "react";
import { tickCreature } from "../../engine/creatures";
import { Attacked, counters, Creature, Equipment, inventories, Item, Particle, Player, Shock, Spell, Sword, Wood  } from "../../engine/entities";
import { visibleFogOfWar } from "../../engine/fog";
import { tickParticle } from "../../engine/particles";
import { tickEquipment } from "../../engine/equipments";
import { center, directionOffset, getCell, getFog, isWalkable, Orientation, Point, pointRange, Processor, TerminalState, updateBoard, wrapCoordinates } from "../../engine/utils";
import produce from "immer";

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

type TerminalAction = MoveAction | AttackAction | SpellAction | CollectAction | FogAction | TickAction;

export const reducer = (state: TerminalState, action: TerminalAction): undefined => {
  switch (action.type) {
    case 'move': {
      const { orientation } = action;
      const [deltaX, deltaY] = directionOffset[orientation || center];
      state.orientation = orientation;
      const [newX, newY] = wrapCoordinates(state, state.x + deltaX, state.y + deltaY);
      const cell = state.board[newY][newX];

      const playerProcessor = state.creatures.find(processor => processor.entity.type === Player);
      if (!playerProcessor) return;

      const attackedCreature = state.creatures.find(creature => (
        creature.entity.type !== Player &&
        creature.x === newX &&
        creature.y === newY
      ));

      const equipmentIndex = state.equipments.findIndex(processor => (
        processor.x === newX &&
        processor.y === newY &&
        processor.entity.props.interaction === undefined
      ));

      // if walking into item, stop and collect instead
      if (cell.item || equipmentIndex !== -1) {
        reducer(state, { type: 'collect', itemX: newX, itemY: newY });

      } else if (attackedCreature) {
        // hit creature if found
        reducer(state, { type: 'attack', creatureX: newX, creatureY: newY });
        
      } else if (isWalkable(state, newX, newY)) {
        playerProcessor.x = newX;
        playerProcessor.y = newY;

        // process nested particles
        tickCreature(state, playerProcessor);

        state.x = newX;
        state.y = newY;
      }

      reducer(state, { type: 'fog' });
      return;
    }

    case 'collect': {
      const { itemX, itemY } = action;
      const collectCell = getCell(state, itemX, itemY);
      const equipmentIndex = state.equipments.findIndex(processor => processor.x === itemX && processor.y === itemY);
      const equipmentProcessor = state.equipments[equipmentIndex] || {};

      if (collectCell.item) {
        const ItemEntity = collectCell.item.type;
        const counter = counters.get(ItemEntity);
        const amount = collectCell.item.props.amount;

        if (amount > 1) {
          collectCell.item.props = produce(collectCell.item.props, props => {
            props.amount = amount - 1;
          });
        } else {
          collectCell.item = undefined;
        }

        // special case: first wood to be picked up can be used as sword
        if (!state.inventory.sword && ItemEntity === Wood) {
          equipmentProcessor.x = itemX;
          equipmentProcessor.y = itemY;
          equipmentProcessor.entity = <Sword amount={1} material="wood" />; 
        } else if (counter) {
          state[counter] = state[counter] + 1;
        }
      }

      if (equipmentProcessor.entity) {
        const inventory = inventories.get(equipmentProcessor.entity.type);
        
        if (inventory) {
          state.equipments.splice(equipmentIndex, 1);
          state.inventory[inventory] = equipmentProcessor.entity;

          const playerIndex = state.creatures.findIndex(processor => processor.entity.type === Player);
          const playerProcessor = state.creatures[playerIndex];

          equipmentProcessor.entity.props = produce(equipmentProcessor.entity.props, props => {
            props.interaction = 'equipped';
          });

          playerProcessor.entity.props = produce(playerProcessor.entity.props, props => {
            if (!props.equipments) {
              props.equipments = [];
            }
            
            props.equipments.push(equipmentProcessor);
          });
        }
      }
      
      return;
    }

    case 'fog': {
      // clear previous view with +1 overscan to compensate for player movement
      Array.from({ length: state.screenHeight + 2 }).forEach((_, offsetY) => {
        const row = pointRange(state.screenWidth + 2, offsetX => [
          state.x + offsetX - (state.screenWidth - 1) / 2 - 1,
          state.y + offsetY - (state.screenHeight - 1) / 2 - 1,
        ]);

        row.forEach(point => {
          if (getFog(state, ...point) === 'visible') {
            const [fogX, fogY] = wrapCoordinates(state, ...point);
            state.fog[fogY][fogX] = 'fog';
          }
        });
      });

      const fogOfWar = visibleFogOfWar(state);
      fogOfWar.forEach(([visibleX, visibleY]) => {
        const [fogX, fogY] = wrapCoordinates(state, state.x + visibleX, state.y + visibleY);
        state.fog[fogY][fogX] = 'visible';
      });


      return;
    }

    case 'tick': {
      state.orientation = undefined;

      state.equipments.forEach(processor => {
        tickEquipment(state, processor);
      });

      state.particles.forEach(processor => {
        tickParticle(state, processor);
      });

      state.creatures.forEach(processor => {
        tickCreature(state, processor);
      });

      return;
    }

    case 'attack': {
      const { creatureX, creatureY } = action;

      const attackedIndex = state.creatures.findIndex(creature => (
        creature.entity.type !== Player &&
        creature.x === creatureX &&
        creature.y === creatureY
      ));
      const attackedCreature = state.creatures[attackedIndex];

      if (!attackedCreature || !state.inventory.sword) return;

      const newAmount = attackedCreature.entity.props.amount - 1;

      if (newAmount > 0) {
        attackedCreature.entity.props = produce(attackedCreature.entity.props, props => {
          if (!props.particles) {
            props.particles = [];
          }
          const attackProcessor = {
            x: creatureX,
            y: creatureY,
            entity: <Attacked />,
          };
          props.particles.push(attackProcessor);
          props.amount = newAmount;
        });
      } else {
        state.creatures.splice(attackedIndex, 1);
      }
      
      return;
    }

    case 'spell': {
      if (!state.inventory.spell) return;

      const centerParticle = {
        x: state.x,
        y: state.y,
        entity: <Shock direction={center} />
      };
      const processor = {
        x: state.x,
        y: state.y,
        entity: <Spell amount={1} particles={[centerParticle]} material="ice" interaction="using" />,
      };
      state.equipments.push(processor);
      tickEquipment(state, processor);

      return;
    }

    default: {
      console.error('Invalid action!', { state, action });
    }
  }
}