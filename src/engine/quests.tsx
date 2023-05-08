import { getPlayerProcessor, TerminalState } from "./utils";

export type Quest = {
  render: (state: TerminalState) => [string[], string[][]],
  tick: (state: TerminalState) => TerminalState,
};

export const quests: Record<string, Quest> = {
  spawn: {
    render: () => [['\u011a\u25a0\u0119 Move using joystick'], [['HUD', 'White', 'HUD']]],
    tick: (state: TerminalState) => {
      const player = getPlayerProcessor(state);

      if (player.x !== 0 || player.y !== 0) return { ...state, quest: 'compass' };

      return state;
    }
  },

  compass: {
    render: () => [['\u0108 Pick up compass', '\u0117'], [['Compass'], ['Needle']]],
    tick: (state: TerminalState) => {
      if (state.inventory.compass) return { ...state, quest: 'stick' };

      return state;
    }
  },

  stick: {
    render: () => [['\u2261 Find a stick'], [['Wood']]],
    tick: (state: TerminalState) => {
      if (state.inventory.sword) return { ...state, quest: 'chest' };

      return state;
    }
  },

  chest: {
    render: () => [['\u011d Open a chest', '\u011f', '-'], [['Chest'], ['Frame'], ['Frame']]],
    tick: (state: TerminalState) => {
      if (state.xp > 0) return { ...state, quest: 'strength' };

      return state;
    }
  },

  strength: {
    render: (state) => [[`${10 - state.xp}+ Collect strength`], [['Experience', 'Experience', 'Experience']]],
    tick: (state: TerminalState) => {
      if (state.xp >= 10) return { ...state, quest: 'portal' };
      return state;
    }
  },

  portal: {
    render: () => [[`\u2229 Enter portal`], [['Water']]],
    tick: (state: TerminalState) => {
      return state;
    }
  },
}