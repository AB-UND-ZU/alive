import { Sprite } from "../engine/components/sprite";
import { colors } from "../game/assets/colors";
import {
  boat,
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
import { Pixels, Text, Literal, UnitView, textSprites } from "./visuals";
import { useContext } from "react";
import { ReferenceContext, MentionStyle } from "./references";
import { levelConfig } from "../game/levels";
import "./WorldMap.css";

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
label(8, 7, "", ilex);
label(6, 9, "Jungle");
label(8, 11, "", mapHouse);
label(15, 10, "", oakBossUnit);
label(19, 8, "Desert");
label(24, 10, "", mapFortress);
label(7, 14, "", mapSpawn);
label(21, 15, "", mapNomad);
label(27, 10, "", boat);

export function WorldMap() {
  const { features = {}, link } = useContext(ReferenceContext);
  const mention = (
    sprite: Sprite,
    title: string,
    feature: string,
    anchor = ""
  ) => (
    <div>
      <Pixels rows={[[sprite]]} />
      {features[feature] ? (
        link(
          features[feature].href + anchor,
          <MentionStyle preserveColor>
            <Text color={colors.grey}>{title}</Text>
          </MentionStyle>,
          true
        )
      ) : (
        <Text>{title}</Text>
      )}
    </div>
  );
  return (
    <div className="InterfaceScroll WorldMap">
      <div className="WorldMapContent">
        <Pixels
          rows={rows}
          label="Island schematic: ocean and glacier; jungle with the start, Earth Town and Ilex; central mountains and Oak; desert with Fire Haven and the Nomad"
        />
        <div className="WorldMapLegend">
          <div>
            <Literal>{`${levelConfig.LEVEL_ISLAND.size} x ${levelConfig.LEVEL_ISLAND.size}`}</Literal>
          </div>
          <div>
            <UnitView unit="ilexElite" />
          </div>
          <div>
            <UnitView unit="oakBoss" />
          </div>
          {mention(mapSpawn, "Start", "respawn")}
          {mention(mapHouse, "Earth Town", "quests", "#earth-town")}
          {mention(mapFortress, "Fire Haven", "quests", "#fire-haven")}
          <div>
            <UnitView unit="fireNomad" />
          </div>
          {mention(boat, "Boat", "building", "#plan-boat")}
        </div>
      </div>
    </div>
  );
}
