import { Sprite } from "../engine/components/sprite";
import { colors } from "../game/assets/colors";
import {
  grass,
  ice,
  ilex,
  mapFortress,
  mapHouse,
  mapNomad,
  mapSpawn,
  oakBossUnit,
  sand,
  wall,
  waterDeep,
  waterShallow,
} from "../game/assets/sprites";
import { Pixels, textSprites } from "./visuals";

const terrain: Record<string, Sprite> = {
  "~": waterDeep,
  ".": waterShallow,
  i: ice,
  ",": grass,
  "#": wall,
  ":": sand,
};

// The generator rotates the mainland and moves the settlements each game.
const layout = [
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~iiiiiiii~~~~~~~~~~~~~~~~~~~~~~",
  "~iiiiiiiiii~~~~~~~~~~~~~..~~~~~~",
  "~~iiiiiiii~~~~~~~~~~~~~~::~~~~~~",
  "~~~iiiiii~~~~~~....~~~~~~~~~~~~~",
  "~~~~~~~~~~...,,##::...~~~~~~~~~~",
  "~~~~~~~~..,,,,,##:::::..~~~~~~~~",
  "~~~~~~~.,,,,,,,##:::::::.~~~~~~~",
  "~~~~~~.,,,,,,,,##::::::::.~~~~~~",
  "~~~~~.,,,,,,,,,##:::::::::.~~~~~",
  "~~~~.,,,,,,,,,,##::::::::::.~~~~",
  "~~~~.,,,,,,,,,,,,,:::::::::.~~~~",
  "~~~~.,,,,,,,,,,##::::::::::.~~~~",
  "~~~~~.,,,,,,,,,##:::::::::.~~~~~",
  "~~~~~~.,,,,,,,,##::::::::.~~~~~~",
  "~~~~~~~.,,,,,,,##:::::::.~~~~~~~",
  "~~~~~~~~..,,,,,##:::::..~~~~~~~~",
  "~~~~~~~~~~...,,##::...~~~~~~~~~~",
  "~~~..~~~~~~~~~~....~~~~~~~~~~~~~",
  "~~~::~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
];

const rows = layout.map((row) => [...row].map((cell) => terrain[cell]));
const label = (x: number, y: number, title: string, sprite?: Sprite) => {
  const cells = [
    ...(sprite ? [sprite] : []),
    ...textSprites(title, colors.white),
  ];
  cells.forEach((cell, index) => {
    rows[y][x + index] = {
      ...cell,
      layers: [{ char: "█", color: colors.black }, ...cell.layers],
    };
  });
};

label(2, 2, "Glacier");
label(12, 0, "Ocean");
label(5, 7, "Ilex", ilex);
label(6, 9, "Jungle");
label(6, 11, "Earth Town", mapHouse);
label(14, 12, "Oak", oakBossUnit);
label(19, 8, "Desert");
label(19, 10, "Fire Haven", mapFortress);
label(7, 14, "Start", mapSpawn);
label(19, 15, "Nomad", mapNomad);

export function WorldMap() {
  return (
    <div className="InterfaceScroll WorldMap">
      <Pixels
        rows={rows}
        label="Island schematic: ocean and glacier; jungle with the start, Earth Town and Ilex; central mountains and Oak; desert with Fire Haven and the Nomad"
      />
    </div>
  );
}
