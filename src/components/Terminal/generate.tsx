import { forestCells, Player, Armor, Sword } from "./entities";
import { TerminalState } from "./state";

const getDeterministicRandomInt = (minimum: number, maximum: number) => {
  return Math.floor(
    window.Rune.deterministicRandom() * (maximum - minimum) + minimum
  );
};

function generateDungeon(state: TerminalState) {
}

function generateLevel(state: TerminalState): TerminalState {
  const rows = Array.from({ length: state.height }).map((_, rowIndex) => {
    const row = Array.from({ length: state.width }).map((_, columnIndex) => {
      return forestCells[getDeterministicRandomInt(0, forestCells.length)];
    });
    return row;
  });

  rows[state.y][state.x] = { creature: <Player direction="up" />, equipments: [<Armor material="wood" />, <Sword material="iron" />] };
  return { ...state, board: rows };
}


export { generateLevel, generateDungeon };