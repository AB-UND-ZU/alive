import { tickCreature } from "../../engine/creatures";
import { Attacked, Collecting, counters, Wave, Spell, Sword, Wood, Player, Tree } from "../../engine/entities";
import { visibleFogOfWar } from "../../engine/fog";
import { attackCreature, tickParticle } from "../../engine/particles";
import { collectEquipment, tickEquipment } from "../../engine/equipments";
import { center, updateProcessorProps, Direction, directionOffset, getCell, getCreature, getEquipment, getFog, getPlayerProcessor, isWalkable, Orientation, pointRange, TerminalState, updateCell, wrapCoordinates, createParticle, createEquipment, updateProcessor, getParentEntity, resolveCompositeId, relativeDistance, pointToDegree, degreesToOrientation, getInteraction } from "../../engine/utils";
import React from "react";
import { creatureStats, equipmentStats } from "../../engine/balancing";
import { acceptQuest, finishQuest, quests } from "../../engine/quests";
import { gameLogic } from "../../engine/interactions";

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

type QuestAction = {
  type: 'quest',
};

type InteractAction = {
  type: 'interact',
  orientation?: Orientation,
  x: number,
  y: number,
};

type TerminalAction = QueueAction | MoveAction | AttackAction | SpellAction | CollectAction | FogAction | TickAction | QuestAction | InteractAction;

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

      // update compass
      if (state.inventory.compass) {
        const distance = relativeDistance(state, player, { x: 0, y: -3, id: -1, entity: <Tree /> });
        const degrees = pointToDegree(distance);
        const orientation = degreesToOrientation(degrees);
        state = updateProcessorProps(state, { container: 'equipments', id: state.inventory.compass }, { direction: orientation });
      }

      return state;
    };

    case 'move': {
      const { orientation } = action;
      const [deltaX, deltaY] = directionOffset[orientation || center];

      const player = getPlayerProcessor(state);
      const interaction = getInteraction(state, player.x, player.y);
      const [movedX, movedY] = [player.x + deltaX, player.y + deltaY];
      const [targetX, targetY] = wrapCoordinates(state, movedX, movedY);
      const targetCell = getCell(state, targetX, targetY);

      const attackedCreature = getCreature(state, targetX, targetY);
      const collectedEquipment = getEquipment(state, targetX, targetY, equipment => (
        !equipment.entity.props.mode &&
        !getParentEntity(state, equipment)
      ));

      // perform interactions
      if (interaction && orientation) {
        state = reducer(state, { type: 'interact', orientation, x: interaction.x, y: interaction.y });

      // if walking into item, stop and collect instead
      } else if (orientation && (targetCell.item || collectedEquipment)) {
        state = reducer(state, { type: 'collect', x: targetX, y: targetY, orientation });

      } else if (attackedCreature && state.inventory.sword) {
        // hit creature if found
        state = reducer(state, { type: 'attack', x: targetX, y: targetY });
        
      } else {
        if (isWalkable(state, targetX, targetY, player.id)) {
          // move both player and camera
          state = updateProcessor(state, { container: 'creatures', id: player.id }, { x: targetX, y: targetY });

          state.cameraX = targetX;
          state.cameraY = targetY;

          // to assign globally enumerated coordinates, keep track of number of overlaps
          state.repeatX = state.repeatX + Math.sign(movedX - targetX);
          state.repeatY = state.repeatY + Math.sign(movedY - targetY);

          if (interaction) {
            console.log('cancel')
            state = finishQuest(state, interaction.entity.props.quest);
          }
        }

        // process all player updates
        state = tickCreature(state, player.id);

        Object.values(getPlayerProcessor(state).entity.props.particles).forEach(particleId => {
          state = tickParticle(state, particleId);
        });

        // assign quest
        const targetInteraction = getInteraction(state, player.x, player.y);

        if (targetInteraction) {
          state = acceptQuest(state, targetInteraction.entity.props.quest);
        }
      } 

      state = reducer(state, { type: 'fog' });
      state = reducer(state, { type: 'quest' });
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

        // limit hp and mp stats
        if (
          (counter && state[counter] >= 99) ||
          (counter === 'hp' && state.hp >= state.xp + (creatureStats.get(Player)?.hp || 10)) ||
          (counter === 'mp' && state.mp >= state.xp)
        ) {
          return state;
        }

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
            { amount: 0, maximum: 0, level: 1, material: 'wood', particles: [] }
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
        state = collectEquipment(state, equipmentProcessor.id);
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
        if (particle.parent && resolveCompositeId(state, particle.parent)?.id === state.playerId) return;

        state = tickParticle(state, particle.id);
      });

      Object.values(state.equipments).forEach(equipment => {
        state = tickEquipment(state, equipment.id);
      });

      Object.values(state.creatures).forEach(creature => {
        if (creature.id === state.playerId) return;

        state = tickCreature(state, creature.id);
      });

      state.tick = state.tick + 1;

      return state;
    }

    case 'attack': {
      const { x, y } = action;
      const attackedCreature = getCreature(state, x, y);
      const player = getPlayerProcessor(state);

      if (!attackedCreature || !state.inventory.sword) return state;

      // get attacking angle
      const distance = relativeDistance(state, player, { x, y, id: -1, entity: <Tree /> });
      const attackingDirection = Object.entries(directionOffset).find(([_, [offsetX, offsetY]]) => (
        offsetX === distance[0] &&
        offsetY === distance[1]
      ))?.[0] as Direction | undefined;

      // update sword animation
      const sword = state.equipments[state.inventory.sword];
      state = updateProcessorProps(state, { container: 'equipments', id: sword.id }, { direction: attackingDirection });

      // reduce health or kill creature
      if (attackingDirection) {
        state = createParticle(
          state,
          { x: directionOffset[attackingDirection][0], y: directionOffset[attackingDirection][1], parent: { container: 'creatures', id: player.id } },
          Attacked,
          { material: sword.entity.props.material }
        )[0];
      }

      const dmg = equipmentStats.get(Sword)?.[0][sword.entity.props.material] || 1;
      state = attackCreature(state, attackedCreature.id, dmg)

      return state;
    }

    case 'spell': {
      // perform interactions
      const player = getPlayerProcessor(state);
      const interaction = getInteraction(state, player.x, player.y);
      if (interaction) {
        state = reducer(state, { type: 'interact', x: player.x, y: player.y });
        state = reducer(state, { type: 'quest' });
        return state
      }

      if (!state.inventory.spell) return state;
      if (state.mp <= 0) return state;

      state.mp = state.mp - 1;

      const spell = state.equipments[state.inventory.spell];

      // update equipped spell
      const level = spell.entity.props.level;
      const amount = equipmentStats.get(Spell)?.[level - 1][spell.entity.props.material] || 1;
      state = updateProcessorProps(state, { container: 'equipments', id: spell.id }, { amount, maximum: amount });

      // create spell and initial particle
      let wave, centerParticle;
      [state, wave] = createEquipment(state, { x: player.x, y: player.y }, Spell, {
        amount,
        maximum: amount,
        level,
        material: spell.entity.props.material,
        mode: 'using',
        particles: []
      });
      [state, centerParticle] = createParticle(state, { x: 0, y: 0, parent: { container: 'equipments', id: wave.id } }, Wave, { direction: 'center', material: spell.entity.props.material, amount: level });
      
      // start first tick
      state = tickParticle(state, centerParticle.id);
      state = tickCreature(state, player.id);
      state = tickEquipment(state, wave.id);

      return state;
    }

    case 'quest': {
      const quest = state.questStack.slice(-1)[0];
      if (quest) {
        state = quests[quest].tick(state);
      }
      return state;
    }

    case 'interact': {
      const { x, y, orientation } = action;
      const interaction = getInteraction(state, x, y);
      const logic = interaction && gameLogic.get(interaction.entity.type);

      if (!logic) return state;

      state = logic.execute(state, interaction.id, orientation);
      return state;
    }

    default: {
      console.error('Invalid action!', { state, action });
    }
  }

  return state;
}