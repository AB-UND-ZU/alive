import { tickCreature } from "../../engine/creatures";
import { Attacked, Circle, Collecting, counters, Experience, Gold, inventories, Item, Life, Mana, Shock, Spell, Sword, Triangle, Wood } from "../../engine/entities";
import { visibleFogOfWar } from "../../engine/fog";
import { tickParticle } from "../../engine/particles";
import { tickEquipment } from "../../engine/equipments";
import { center, updateProcessorProps, Direction, directionOffset, getCell, getCreature, getEquipment, getFog, getPlayerProcessor, isWalkable, Orientation, pointRange, TerminalState, updateCell, wrapCoordinates, createParticle, createEquipment, updateProcessor, removeProcessor, updateInventory, getParentEntity, getDeterministicRandomInt } from "../../engine/utils";
import React from "react";
import { creatureStats, equipmentStats, getRandomDistribution } from "../../engine/balancing";

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
  x: number,
  y: number,
};

type SpellAction = {
  type: 'spell',
};

type CollectAction = {
  type: 'collect',
  orientation?: Orientation,
  x: number,
  y: number,
};

type FogAction = {
  type: 'fog',
};

type TickAction = {
  type: 'tick',
};

type TerminalAction = QueueAction | MoveAction | AttackAction | SpellAction | CollectAction | FogAction | TickAction;

export const reducer = (prevState: TerminalState, action: TerminalAction): TerminalState => {
  let state = { ...prevState };

  switch (action.type) {
    case 'queue': {
      // enqueue next move orientation and display in controls pad
      const { orientation } = action;
      state.orientation = orientation;

      // reset hitting direction of sword
      if (state.inventory.sword) {
        state = updateProcessorProps(state, { container: 'equipments', id: state.inventory.sword }, { direction: undefined });
      }
      
      // reset attacking animations
      const player = getPlayerProcessor(state);
      Object.values(player.entity.props.particles).forEach(particleId => {
        state = tickParticle(state, particleId);
      });

      return state;
    };

    case 'move': {
      const { orientation } = action;
      const [deltaX, deltaY] = directionOffset[orientation || center];

      const player = getPlayerProcessor(state);
      const [movedX, movedY] = [player.x + deltaX, player.y + deltaY];
      const [targetX, targetY] = wrapCoordinates(state, movedX, movedY);

      const attackedCreature = getCreature(state, targetX, targetY);
      const collectedEquipment = getEquipment(state, targetX, targetY, equipment => !equipment.entity.props.interaction)

      // if walking into item, stop and collect instead
      const targetCell = getCell(state, targetX, targetY);
      if (targetCell.item || collectedEquipment) {
        state = reducer(state, { type: 'collect', x: targetX, y: targetY, orientation });

      } else if (attackedCreature && state.inventory.sword) {
        // hit creature if found
        state = reducer(state, { type: 'attack', x: targetX, y: targetY });
        
      } else {
        if (isWalkable(state, targetX, targetY)) {
          // move both player and camera
          state = updateProcessor(state, { container: 'creatures', id: player.id }, { x: targetX, y: targetY });

          state.cameraX = targetX;
          state.cameraY = targetY;

          // to assign globally enumerated coordinates, keep track of number of overlaps
          state.repeatX = state.repeatX + Math.sign(movedX - targetX);
          state.repeatY = state.repeatY + Math.sign(movedY - targetY);
        }

        // process nested particles
        state = tickCreature(state, player.id);
        Object.values(getPlayerProcessor(state).entity.props.particles).forEach(particleId => {
          state = tickParticle(state, particleId);
        });
      } 

      state = reducer(state, { type: 'fog' });
      return state;
    }

    case 'collect': {
      const { x, y, orientation } = action;
      const player = getPlayerProcessor(state);
      const collectCell = getCell(state, x, y);
      let equipmentProcessor = getEquipment(state, x, y);

      // remove item from cell once added to inventory
      if (collectCell.item) {
        const ItemEntity = collectCell.item.type;
        const counter = counters.get(ItemEntity);
        const amount = collectCell.item.props.amount;

        state = updateCell(state, x, y, {
          item: amount > 1
            ? React.cloneElement(collectCell.item, { amount: amount - 1 })
            : undefined
        });

        // special case: first wood to be picked up will be used as sword
        if (!state.inventory.sword && ItemEntity === Wood) {
          [state, equipmentProcessor] = createEquipment(
            state,
            { x, y },
            Sword,
            { amount: 1, material: 'wood', particles: [] }
          );

        } else if (counter) {
          // add collect animation
          state[counter] = state[counter] + 1;

          state = createParticle(
            state,
            { x: 0, y: 0, parent: { container: 'creatures', id: player.id } },
            Collecting,
            { counter, direction: orientation }
          )[0];
        }
      }

      // add to or replace equipment in player's inventory
      if (equipmentProcessor) {
        const inventoryKey = inventories.get(equipmentProcessor.entity.type);
        
        if (inventoryKey) {
          const existingInventory = state.inventory[inventoryKey];

          // remove previous equipment
          if (existingInventory) {
            state = removeProcessor(state, { container: 'equipments', id: existingInventory });
          }

          // equip in inventory
          state = updateProcessor(
            state,
            { container: 'equipments', id: equipmentProcessor.id },
            { parent: { container: 'creatures', id: player.id }, x: 0, y: 0 }
          );
          state = updateProcessorProps(state, { container: 'equipments', id: equipmentProcessor.id }, { interaction: 'equipped' });
          state = updateInventory(state, inventoryKey, equipmentProcessor.id);

          // equip on player
          state = updateProcessorProps(state, { container: 'creatures', id: player.id }, { equipments: [...getPlayerProcessor(state).entity.props.equipments, equipmentProcessor.id ] });
        }
      }
      
      return state;
    }

    case 'fog': {
      // clear previous view with +1 overscan to compensate for player movement
      Array.from({ length: state.screenHeight + 2 }).forEach((_, offsetY) => {
        const row = pointRange(state.screenWidth + 2, offsetX => [
          state.cameraX + offsetX - (state.screenWidth - 1) / 2 - 1,
          state.cameraY + offsetY - (state.screenHeight - 1) / 2 - 1,
        ]);

        row.forEach(point => {
          if (getFog(state, ...point) === 'visible') {
            const [fogX, fogY] = wrapCoordinates(state, ...point);
            state.fog[fogY][fogX] = 'fog';
          }
        });
      });

      // apply visible field of view
      const fogOfWar = visibleFogOfWar(state);
      fogOfWar.forEach(([visibleX, visibleY]) => {
        const [fogX, fogY] = wrapCoordinates(state, state.cameraX + visibleX, state.cameraY + visibleY);
        state.fog[fogY][fogX] = 'visible';
      });

      return state;
    }

    case 'tick': {
      // update particles, equipments and creatures except for player in that order 
      Object.values(state.particles).forEach(particle => {
        if (getParentEntity(state, particle)?.id === state.playerId) return;

        state = tickParticle(state, particle.id);
      });

      Object.values(state.equipments).forEach(equipment => {
        state = tickEquipment(state, equipment.id);
      });

      Object.values(state.creatures).forEach(creature => {
        if (creature.id === state.playerId) return;

        state = tickCreature(state, creature.id);
      });

      return state;
    }

    case 'attack': {
      const { x, y } = action;
      const attackedCreature = getCreature(state, x, y);
      const player = getPlayerProcessor(state);

      if (!attackedCreature || !state.inventory.sword) return state;

      // get attacking angle
      const attackingDirection = Object.entries(directionOffset).find(([_, [offsetX, offsetY]]) => (
        offsetX === x - player.x &&
        offsetY === y - player.y
      ))?.[0] as Direction | undefined;

      // update sword animation
      const sword = state.equipments[state.inventory.sword];
      state = updateProcessorProps(state, { container: 'equipments', id: sword.id }, { direction: attackingDirection });

      // reduce health or kill creature
      const dmg = equipmentStats.get(Sword)?.[sword.entity.props.material] || 1;
      const newAmount = attackedCreature.entity.props.amount - dmg;

      if (attackingDirection) {
        state = createParticle(
          state,
          { x: directionOffset[attackingDirection][0], y: directionOffset[attackingDirection][1], parent: { container: 'creatures', id: player.id } },
          Attacked,
          { material: sword.entity.props.material }
        )[0];
      }

      if (newAmount > 0) {
        state = updateProcessorProps(state, { container: 'creatures', id: attackedCreature.id }, { amount: newAmount });
      } else {
        // add drops
        const drops = creatureStats.get(attackedCreature.entity.type);
        if (drops) {
          const [Drop, props] = getRandomDistribution<Item>(drops.drops);
          state = updateCell(state, x, y, { item: <Drop {...props} /> });
        }

        state = removeProcessor(state, { container: 'creatures', id: attackedCreature.id });
      }

      return state;
    }

    case 'spell': {
      if (!state.inventory.spell) return state;
      if (state.mp <= 0) return state;

      state.mp = state.mp - 1;

      const player = getPlayerProcessor(state);
      const spell = state.equipments[state.inventory.spell];

      // create spell and initial particle
      let wave, centerParticle;
      [state, wave] = createEquipment(state, { x: player.x, y: player.y }, Spell, { amount: 1, material: spell.entity.props.material, interaction: 'using', particles: [] });
      [state, centerParticle] = createParticle(state, { x: 0, y: 0, parent: { container: 'equipments', id: wave.id } }, Shock, { direction: 'center' });
      
      // start first tick
      state = tickParticle(state, centerParticle.id);
      state = tickCreature(state, player.id);
      state = tickEquipment(state, wave.id);

      return state;
    }

    default: {
      console.error('Invalid action!', { state, action });
    }
  }

  return state;
}