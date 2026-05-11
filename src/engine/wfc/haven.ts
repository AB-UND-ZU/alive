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
  boxLeft: "woodChest",
  boxRight: "woodChest",

  doorLeft: "wood_port",
  doorCenter: "wood_port",
  doorRight: "wood_port",

  wallLeft4: "fortress_wall",
  wallLeft3: "fortress_wall",
  wallLeft2: "fortress_wall",
  wallLeft1: "fortress_wall",

  windowLeft3: "fortress_wall_window",
  windowLeft2: "fortress_wall_window",
  windowLeft1: "fortress_wall_window",

  cornerLeft0: "fortress_basement_left",

  wallRight4: "fortress_wall",
  wallRight3: "fortress_wall",
  wallRight2: "fortress_wall",
  wallRight1: "fortress_wall",

  windowRight3: "fortress_wall_window",
  windowRight2: "fortress_wall_window",
  windowRight1: "fortress_wall_window",

  cornerRight0: "fortress_basement_right",

  houseLeft: "fortress_house_left",
  houseRight: "fortress_house_right",
  house: "fortress_house",
  window: "fortress_house_window",

  lowerRoofLeft1: "fortress_roof_down_left",
  lowerRoof1: "fortress_roof_down",
  lowerRoofRight1: "fortress_roof_right_down",
  lowerRoofLeft0: "fortress_roof_down_left",
  lowerRoof0: "fortress_roof_down",
  lowerRoofRight0: "fortress_roof_right_down",

  upperRoofLeft: "fortress_roof_left_up",
  upperRoof: "fortress_roof_up",
  upperRoofRight: "fortress_roof_up_right",

  roofLeft: "fortress_roof_left",
  roof: "fortress_roof",
  roofRight: "fortress_roof_right",
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
