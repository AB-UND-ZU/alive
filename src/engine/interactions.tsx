import { CharacterSelect, Interaction, Skin } from "./entities";
import { collectEquipment } from "./equipments";
import { Orientation, Processor, TerminalState, getEquipment, removeProcessor, updateProcessor, wrapCoordinates } from "./utils";

export type Interactions = Record<number, Record<number, Processor<Interaction>>>;

export type Logic = {
  execute: (state: TerminalState, id: number, orientation?: Orientation) => TerminalState
}

export const gameLogic: Map<Interaction, Logic> = new Map([
  [CharacterSelect, {
    execute: (state, interactionId, orientation) => {
      const interaction = state.interactions[interactionId];
      const offset = orientation === 'right' ? -3 : orientation === 'left' ? 3 : 0;

      const targetSkin = getEquipment(state, interaction.x - offset, interaction.y, equipment => equipment.entity.type === Skin);
      if (!targetSkin) return state;

      interaction.entity.props.equipments.forEach(equipmentId => {
        const equipment = state.equipments[equipmentId];

        // equip skin and clear interaction
        if (!orientation && equipment.x === 0) {
          state = collectEquipment(state, equipment.id);
          state = removeProcessor(state, { container: 'interactions', id: interaction.id });
          return state;
        }

        const [moveX] = wrapCoordinates(state, equipment.x + offset, 0);
        state = updateProcessor(state, { container: 'equipments', id: equipment.id }, { x: moveX });
      });

      return state;
    }
  }]
]); 