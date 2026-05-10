import { Matrix, matrixFactory } from "../../game/math/matrix";
import { add, Point, range } from "../../game/math/std";
import { Orientation } from "../components/orientable";
import { getDefinition } from "./utils";
import { Definition, Wave, WaveFunctionCollapse } from "./wfc";

const definition = getDefinition("air");
const havenDefinition: Definition = {
  ...definition,
  tiles: {
    ...definition.tiles,
    air: {
      weight: 400,
      tags: ["air"],
    },
    sand: {
      weight: 0,
      tags: ["sand"],
    },
    fountain: {
      weight: 0,
      tags: ["fountain"],
    },
  },
};

const mapTiles: Record<string, string> = {
  fountain: "air",
  air: "sand",
  sand: "",
  gap: "",
  hedge: "hedge",
  path: "path",

  potLeft: "pot",
  potRight: "pot",
  boxLeft: "box",
  boxRight: "box",

  doorLeft: "wood_door",
  doorCenter: "wood_door",
  doorRight: "wood_door",

  wallLeft4: "wall",
  wallLeft3: "wall",
  wallLeft2: "wall",
  wallLeft1: "wall",

  windowLeft3: "wall_window",
  windowLeft2: "wall_window",
  windowLeft1: "wall_window",

  cornerLeft0: "basement_left",

  wallRight4: "wall",
  wallRight3: "wall",
  wallRight2: "wall",
  wallRight1: "wall",

  windowRight3: "wall_window",
  windowRight2: "wall_window",
  windowRight1: "wall_window",

  cornerRight0: "basement_right",

  houseLeft: "house_left",
  houseRight: "house_right",
  house: "house",
  window: "house_window",

  lowerRoofLeft1: "roof_down_left",
  lowerRoof1: "roof_down",
  lowerRoofRight1: "roof_right_down",
  lowerRoofLeft0: "roof_down_left",
  lowerRoof0: "roof_down",
  lowerRoofRight0: "roof_right_down",

  upperRoofLeft: "roof_left_up",
  upperRoof: "roof_up",
  upperRoofRight: "roof_up_right",

  roofLeft: "roof_left",
  roof: "roof",
  roofRight: "roof_right",
};

const airWeight = 20;
const pathWeight = 1;
const HAVEN_TRIES = 5;
const minHouses = 3;
const doorOffsets = {
  doorLeft: { x: 2, y: -2 },
  doorCenter: { x: 0, y: -2 },
  doorRight: { x: -2, y: -2 },
};
const innRadius = 2;

export default function generateHaven(
  beachMap: Matrix<string>,
  innDelta: Point
) {
  let wave: Wave | undefined;
  const wfc = new WaveFunctionCollapse(havenDefinition);
  const width = beachMap.length;
  const height = beachMap[0].length;

  for (let attempt = 0; attempt < HAVEN_TRIES; attempt += 1) {
    const forced = [
      // free space in center
      ...range(-innRadius, innRadius)
        .map((offsetX) =>
          range(-innRadius, innRadius).map(
            (offsetY) =>
              [innDelta.x + offsetX, innDelta.y + offsetY, "fountain"] as [
                number,
                number,
                string
              ]
          )
        )
        .flat(),
      ...beachMap
        .map((column, x) =>
          column
            .map((cell, y) => [x, y, cell] as [number, number, string])
            .filter((cell) => !!cell[2])
        )
        .flat(),
    ];
    wave = wfc.generate(width, height, [...forced]);

    if (!wave) continue;

    const tileMatrix = wave.chosen;
    const paths: Point[] = [];
    let houses: {
      door: Point;
      position: Point;
      orientation?: Orientation;
      inn: boolean;
    }[] = [];

    // parse houses
    matrixFactory<number>(width, height, (x, y) => {
      if (
        (Math.abs(x - innDelta.x) < innRadius &&
          Math.abs(y - innDelta.y) < innRadius) ||
        (Math.abs(x - innDelta.x) === 1 && y - innDelta.y === innRadius)
      )
        return 0;

      const value = tileMatrix[x][y];
      const tile = wfc.tileNames[value];

      if (
        tile === "doorLeft" ||
        tile === "doorCenter" ||
        tile === "doorRight"
      ) {
        if (x !== innDelta.x || y !== innDelta.y) {
          paths.push({ x, y });
          houses.push({
            door: { x, y },
            position: add({ x, y }, doorOffsets[tile]),
            orientation:
              tile === "doorLeft"
                ? "left"
                : tile === "doorRight"
                ? "right"
                : undefined,
            inn: false,
          });
        }

        return airWeight;
      }
      return tile === "path" ? pathWeight : tile === "air" ? airWeight : 0;
    });

    if (houses.length < minHouses) continue;

    const havenMatrix = matrixFactory(
      width,
      height,
      (x, y) => mapTiles[wfc.tileNames[tileMatrix[x][y]]]
    );

    return {
      matrix: havenMatrix,
      houses,
    };
  }

  throw new Error("Could not generate haven!");
}
