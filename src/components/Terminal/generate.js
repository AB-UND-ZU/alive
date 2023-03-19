import Dungeon from "dungeon-generator";
import { forestCells, Player, Equipment } from "./entities";

const getDeterministicRandomInt = (minimum, maximum) => {
  return Math.floor(
    window.Rune.deterministicRandom() * (maximum - minimum) + minimum
  );
};

function generateDungeon(state) {
  const dungeon = new Dungeon({
    size: [state.width, state.height],
    seed: window.Rune.getChallengeNumber(),
    rooms: {
      initial: {
        min_size: [3, 3],
        max_size: [3, 3],
        max_exits: 1
      },
      any: {
        min_size: [11, 11],
        max_size: [11, 11],
        max_exits: 2
      },
      food_house: {
        min_size: [7, 7],
        max_size: [7, 7],
        max_exits: 1
      },
      magic_house: {
        min_size: [7, 7],
        max_size: [7, 7],
        max_exits: 1
      },
      weapon_house: {
        min_size: [7, 7],
        max_size: [7, 7],
        max_exits: 1
      },
      armor_house: {
        min_size: [7, 7],
        max_size: [7, 7],
        max_exits: 1
      },
      chest: {
        min_size: [3, 3],
        max_size: [3, 3],
        max_exits: 1
      },
      exit: {
        min_size: [3, 3],
        max_size: [3, 3],
        max_exits: 1
      }
    },
    max_corridor_length: 15,
    min_corridor_length: 5,
    corridor_density: 3,
    symmetric_rooms: false,
    interconnects: 10,
    max_interconnect_length: 30,
    room_count: 50
  });

  return dungeon;
}

function generateLevel(state) {
  const rows = Array.from({ length: state.height }).map((_, rowIndex) => {
    const row = Array.from({ length: state.width }).map((_, columnIndex) => {
      return forestCells[getDeterministicRandomInt(0, forestCells.length)]();
    });
    return row;
  });

  rows[state.y][state.x] = [<Equipment type="Shield" />, <Player />, <Equipment type="Weapon" />];
  return { ...state, board: rows };
}


export { generateLevel, generateDungeon };