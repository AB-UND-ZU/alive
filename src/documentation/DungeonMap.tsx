import { useContext } from "react";
import { tutorialRooms, roomSize } from "../game/levels/tutorial/areas";
import { Sprite } from "../engine/components/sprite";
import { UnitKey } from "../game/balancing/units";
import { fishItems } from "./catalog";
import { getUnitSprite, getItemSprite } from "../game/assets/utils";
import { pixelFrame, centerSprites } from "../game/assets/pixels";
import { createText, mergeSprites } from "../game/assets/ui";
import { colors } from "../game/assets/colors";
import {
  mapSpawn,
  none,
  portal,
  sign,
  woodChest,
  dummy,
} from "../game/assets/sprites";
import {
  Pixels,
  Text,
  Literal,
  UnitView,
  ItemView,
  PlainTable,
} from "./visuals";
import { ReferenceContext } from "./references";
import "./WorldMap.css";

const roomNotes: Record<
  string,
  {
    title: string;
    icons: Sprite[];
    features?: [string, string][];
    units?: UnitKey[];
    items?: Parameters<typeof ItemView>[0]["item"][];
  }
> = {
  center: {
    title: "Start",
    icons: [mapSpawn, sign],
    features: [["signs", "Signs"]],
    items: [{ consume: "key", material: "iron", amount: 1 }],
  },
  north1: {
    title: "Guide",
    icons: [getUnitSprite("guide"), dummy],
    units: ["dummy"],
    features: [
      ["shops", "Shops"],
      ["crafting", "Crafting"],
    ],
  },
  north2: {
    title: "Fruit",
    icons: [sign, woodChest],
    features: [
      ["consumables", "Fruit"],
      ["signs", "Signs"],
    ],
  },
  north2east1: {
    title: "Pond",
    icons: [getItemSprite(fishItems[0], "display"), woodChest],
    features: [
      ["animals", "Animals"],
      ["consumables", "Potions"],
    ],
  },
  north3: { title: "Waves", icons: [], units: ["eye", "prism", "orb"] },
  north4: { title: "Boss", icons: [], units: ["tutorialBoss"] },
  north5: {
    title: "Exit",
    icons: [portal],
    features: [["levels", "Portals"]],
  },
};

export function dungeonMapRows() {
  const rows: Sprite[][] = Array.from({ length: 13 }, () =>
    Array.from({ length: 13 }, () => none)
  );
  const put = (x: number, y: number, sprite: Sprite) => {
    rows[y][x] = sprite;
  };
  [...tutorialRooms]
    .sort((a, b) => a.offsetY - b.offsetY || a.offsetX - b.offsetX)
    .forEach((room) => {
      const index = tutorialRooms.indexOf(room);
      const x = (room.offsetX / roomSize.x) * 6;
      const y = (5 + room.offsetY / roomSize.y) * 2;
      const frame = pixelFrame(
        7,
        3,
        colors.grey,
        "thick",
        [],
        createText(String(index + 1), colors.white, colors.black)
      );
      frame.forEach((line, dy) =>
        line.forEach((cell, dx) =>
          put(x + dx, y + dy, mergeSprites(rows[y + dy][x + dx], cell))
        )
      );
      const note = roomNotes[room.name];
      const icons = room.waves
        ? [
            ...new Set(
              room.waves.flatMap((wave) => wave.types).filter(Boolean)
            ),
          ].map((unit) => getUnitSprite(unit!))
        : note.icons;
      centerSprites(icons, 5).forEach((sprite, i) =>
        put(x + 1 + i, y + 1, sprite)
      );
    });
  return rows;
}

export function DungeonMap() {
  const { features = {}, link } = useContext(ReferenceContext);
  return (
    <div className="InterfaceScroll DungeonMap">
      <div className="WorldMapContent">
        <Pixels
          rows={dungeonMapRows()}
          label="Dungeon rooms and points of interest"
        />
        <PlainTable
          headers={["Room", "Points Of Interest"]}
          rows={tutorialRooms.map((room) => {
            const index = tutorialRooms.indexOf(room);
            const note = roomNotes[room.name];
            return [
              <span className="DungeonLegendEntry">
                <Literal>{String(index + 1)}</Literal>{" "}
                <Text color={colors.white}>{note.title}</Text>
              </span>,
              <span className="DungeonLegendDetails">
                {note.items?.map((item, i) => (
                  <ItemView key={i} item={item} />
                ))}
                {note.units?.map((unit) => (
                  <UnitView key={unit} unit={unit} />
                ))}
                {note.features?.map(([key, title]) =>
                  features[key] ? (
                    link(features[key].href, <Text>{title}</Text>, true)
                  ) : (
                    <Text key={key}>{title}</Text>
                  )
                )}
              </span>,
            ];
          })}
        />
      </div>
    </div>
  );
}
