import { matrixFactory } from "../../game/math/matrix";
import { findPathSimple } from "../../game/math/path";
import {
  add,
  choice,
  Point,
  random,
  range,
  shuffle,
} from "../../game/math/std";
import { Orientation } from "../components/orientable";
import { getDefinition } from "./utils";
import { Wave, WaveFunctionCollapse } from "./wfc";

const definition = getDefinition("air");
const mapTiles: Record<string, string> = {
  air: "",
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
const TOWN_TRIES = 5;
const minHouses = 3;
const grassChance = 0.3;
const doorOffsets = {
  doorLeft: { x: 2, y: -2 },
  doorCenter: { x: 0, y: -2 },
  doorRight: { x: -2, y: -2 },
};

export default function generateTown(width: number, height: number) {
  let wave: Wave | undefined;
  const wfc = new WaveFunctionCollapse(definition);
  const innerWidth = width - 2;
  const innerHeight = height - 2;

  for (let attempt = 0; attempt < TOWN_TRIES; attempt += 1) {
    const innX = Math.floor(innerWidth * choice(1 / 4, 3 / 4));
    const innY = Math.floor(innerHeight * choice(1 / 4, 3 / 4));
    const innRadius = 2;
    const exits: Point[] = [
      { x: random(3, width - 4), y: 0 },
      { x: random(3, width - 4), y: height - 1 },
    ];
    const exitAir: Point[] = [
      { x: exits[0].x - 1, y: 0 },
      { x: exits[1].x - 1, y: innerHeight - 1 },
    ];

    wave = wfc.generate(innerWidth, innerHeight, [
      // free space in center
      ...range(-innRadius, innRadius)
        .map((offsetX) =>
          range(-innRadius, innRadius).map(
            (offsetY) =>
              [innX + offsetX, innY + offsetY, "air"] as [
                number,
                number,
                string
              ]
          )
        )
        .flat(),
      [innX, innY + innRadius + 1, "air"],

      // clear entries
      ...exitAir.map(({ x, y }): [number, number, string] => [x, y, "air"]),
    ]);

    if (!wave) continue;

    const tileMatrix = wave.chosen;
    let paths = [...exitAir];
    let houses: {
      door: Point;
      position: Point;
      orientation?: Orientation;
      inn: boolean;
    }[] = [];

    // prefer reusing existing paths
    const walkableMatrix = matrixFactory<number>(
      innerWidth,
      innerHeight,
      (x, y) => {
        if (
          (Math.abs(x - innX) < innRadius && Math.abs(y - innY) < innRadius) ||
          (Math.abs(x - innX) === 1 && y - innY === innRadius)
        )
          return 0;

        const value = tileMatrix[x][y];
        const tile = wfc.tileNames[value];

        if (
          tile === "doorLeft" ||
          tile === "doorCenter" ||
          tile === "doorRight"
        ) {
          if (x !== innX || y !== innY) {
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
      }
    );

    if (houses.length < minHouses) continue;

    // randomize order of paths and adjusted houses but keep inn centered
    paths = shuffle(paths);
    houses = shuffle(houses).map((house) => ({
      ...house,
      door: add(house.door, { x: 1, y: 1 }),
      position: add(house.position, { x: 1, y: 1 }),
    }));

    // draw paths from exits and houses to center inn
    const innPath = { x: innX, y: innY + innRadius };
    const pathIndex = wfc.tileNames.indexOf("path");
    paths.forEach((path) => {
      const route = findPathSimple(walkableMatrix, path, innPath);

      route.forEach((point) => {
        tileMatrix[point.x][point.y] = pathIndex;
        walkableMatrix[point.x][point.y] = pathWeight;
      });
    });

    // replace free entry air with paths
    exitAir.forEach((point) => {
      tileMatrix[point.x][point.y] = pathIndex;
    });

    // draw fence around town
    const townMatrix = matrixFactory(width, height, (x, y) => {
      const horizontalEdge = x === 0 || x === width - 1;
      const verticalEdge = y === 0 || y === height - 1;

      if (exits.some((exit) => exit.x === x && exit.y === y))
        return "fence_door_path";

      if (horizontalEdge || verticalEdge) return "fence";

      const offsetX = innX - x + 1;
      const offsetY = innY - y + 1;
      if (offsetX === 0 && offsetY === 0) return "fountain";

      const cell = mapTiles[wfc.tileNames[tileMatrix[x - 1][y - 1]]];

      if (
        !cell &&
        Math.abs(offsetX) >= innRadius &&
        Math.abs(offsetY) >= innRadius &&
        Math.random() < grassChance
      )
        return "grass";

      return cell;
    });

    return {
      matrix: townMatrix,
      houses,
      exits,
      guards: exitAir.map((exit) => add(exit, { x: 1, y: 1 })),
      inn: { x: innX + 1, y: innY + 1 },
    };
  }

  throw new Error("Could not generate town!");
}
