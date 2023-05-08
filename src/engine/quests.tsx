import { getPlayerProcessor, TerminalState } from "./utils";

export type Quest = {
  display: [string[], string[][]],
  tick: (state: TerminalState) => TerminalState,
};

export const quests: Record<string, Quest> = {
  spawn: {
    display: [['\u011a\u25a0\u0119 Move using joystick'], [['HUD', 'White', 'HUD']]],
    tick: (state: TerminalState) => {
      const player = getPlayerProcessor(state);

      if (player.x !== 0 || player.y !== 0) return { ...state, quest: 'herb' };

      return state;
    }
  },

  herb: {
    display: [['· Pick up herb', ','], [['Herb'], ['Flower']]],
    tick: (state: TerminalState) => {
      if (state.herb > 0) return { ...state, quest: 'seed' };

      return state;
    }
  },

  seed: {
    display: [['\' Pick up seed', '\u03c4'], [['Seed'], ['Bush']]],
    tick: (state: TerminalState) => {
      if (state.seed > 0) return { ...state, quest: 'stick' };

      return state;
    }
  },

  stick: {
    display: [['1\u2261 Find a stick'], [['Wood', 'Wood']]],
    tick: (state: TerminalState) => {
      if (state.inventory.sword) return { ...state, quest: 'chest' };

      return state;
    }
  },

  chest: {
    display: [['\u011d Open the chest', '\u011f', '-'], [['Chest'], ['Frame'], ['Frame']]],
    tick: (state: TerminalState) => {
      if (state.xp > 0) return { ...state, quest: 'portal' };

      return state;
    }
  },

  portal: {
    display: [['10+ Collect experience'], [['Experience', 'Experience', 'Experience']]],
    tick: (state: TerminalState) => {

      return state;
    }
  },
}