import { entities, World } from "../../../engine";
import { Position, POSITION } from "../../../engine/components/position";
import { SPRITE } from "../../../engine/components/sprite";
import { RENDERABLE } from "../../../engine/components/renderable";
import {
  mapHouse,
  mapSpawn,
  none,
  path,
  questPointer,
  rock1,
  rock2,
  shadow,
} from "../../assets/sprites";
import {
  simplexNoiseFactory,
  simplexNoiseKernel,
  valueNoiseMatrix,
} from "../../math/noise";
import { BiomeName, LEVEL, LevelName } from "../../../engine/components/level";
import {
  circularKernel,
  createMatrix,
  getOverlappingCell,
  gradientKernel,
  iterateMatrix,
  mapMatrix,
  Matrix,
  matrixFactory,
  rectangleKernel,
  setMatrix,
  setPath,
} from "../../math/matrix";
import { FOG } from "../../../engine/components/fog";
import { ATTACKABLE } from "../../../engine/components/attackable";
import {
  ORIENTABLE,
  Orientation,
  orientationPoints,
} from "../../../engine/components/orientable";
import { ilexArea, oakArea, spawnArea, townSize } from "./areas";
import {
  add,
  angledOffset,
  choice,
  combine,
  copy,
  getDistance,
  lerp,
  normalize,
  random,
  range,
  sigmoid,
  signedDistance,
} from "../../math/std";
import { INVENTORY } from "../../../engine/components/inventory";
import { emptyUnitStats, STATS } from "../../../engine/components/stats";
import { VIEWABLE } from "../../../engine/components/viewable";
import { TOOLTIP } from "../../../engine/components/tooltip";
import { DROPPABLE } from "../../../engine/components/droppable";
import {
  SEQUENCABLE,
  TornadoSequence,
  WeatherSequence,
} from "../../../engine/components/sequencable";
import {
  createUnitName,
  frameWidth,
  getUnitSprite,
  npcSequence,
  questSequence,
} from "../../assets/utils";
import { createDialog, getOrientedSprite } from "../../assets/ui";
import { colors } from "../../assets/colors";
import { generateNpcKey, generateUnitData } from "../../balancing/units";
import { BELONGABLE } from "../../../engine/components/belongable";
import generateTown from "../../../engine/wfc/town";
import {
  assignBuilding,
  insertArea,
  createCell,
  populateInventory,
  createNpc,
  createSign,
  CellType,
  flipArea,
  marchLinePredicate,
  getWaterCell,
  smoothenWater,
  smoothenSand,
  smoothenBeaches,
} from "../../../bindings/creation";
import {
  findPath,
  getAbsoluteQuadrant,
  invertOrientation,
  relativeOrientations,
  rotateOrientation,
} from "../../math/path";
import { LAYER } from "../../../engine/components/layer";
import { createPopup } from "../../../engine/systems/popup";
import {
  assertIdentifierAndComponents,
  setIdentifier,
} from "../../../engine/utils";
import { islandNpcDistribution } from "./units";
import { snowFill } from "../../../engine/systems/freeze";
import { BEHAVIOUR } from "../../../engine/components/behaviour";
import { initializeArea } from "../../../engine/systems/initialize";
import { STICKY } from "../../../engine/components/sticky";
import { createSequence } from "../../../engine/systems/sequence";
import { SHOOTABLE } from "../../../engine/components/shootable";
import { getItemBuyPrice, purchasableItems } from "../../balancing/trading";
import { POI } from "../../../engine/components/poi";
import {
  CASTABLE,
  getEmptyCastable,
} from "../../../engine/components/castable";
import { MOVABLE } from "../../../engine/components/movable";
import { pixelCircle } from "../../math/tracing";
import { aspectRatio } from "../../../components/Dimensions/sizing";
import generateHaven from "../../../engine/wfc/haven";
import { disposeEntity } from "../../../engine/systems/map";
import { centerLayer } from "../../assets/pixels";
import { REMAINABLE } from "../../../engine/components/remainable";
import { LOCKABLE } from "../../../engine/components/lockable";
import { createText, mergeSprites } from "../../assets/ui";

export const islandSize = 240;
export const islandName: LevelName = "LEVEL_ISLAND";

export const generateIsland = (world: World) => {
  /* MAP GENERATION: Island

  Parameters:
  - A random angle is chosen
  - An offset between 30 and 60 is chosen
  - A spread between 60 and 90 is chosen
  - A boolean for clockwise is chosen
  - A boolean for twisted is chosen

  Elevation:
  - The main land is placed around 0,0 with a large radius
  - The glacier is placed at 50%,50% with small radius
  - Beaches and bays are added to diffuse the circular edges
  - The remaining ocean area is filled with small islands
  - A mountain range is erected along the chosen angle intersecting 0,0
  - The mountain range is diffused with a few hills and valleys
  - An passage is created orthogonally at 0,0

  Temperature:
  - The main land is split in two halves by the mountain range
  - Jungle side is moderate and desert side is hot
  - The glacier and margin around it are set to negative temperature
  */

  // fixed configuration values
  const size = world.metadata.gameEntity[LEVEL].size;
  const mainlandRadius = size * 0.34;
  const mainlandRatio = 0.8;
  const glacierRadius = size * 0.07;
  const glacierRatio = 0.3;
  const ilexRatio = 0.6;
  const oakRatio = 0.6;
  const oceanDepth = -70;
  const archipelagoDepth = -30;
  const palisadeDepth = -10;
  const sandDepth = 0;
  const havenDepth = 3;
  const airDepth = 6;
  const treeChance = 0.04;
  const rottenChance = 0.035;
  const stoneChance = 0.07;
  const oreChance = 0.1;
  const ironChance = 0.4;
  const mountainIronChance = 0.03;
  const terrainDepth = 10;
  const grassDepth = 50;
  const bushDepth = 65;
  const cactusDepth = 70;
  const rockDepth = 20;
  const palmDepth = 8;
  const palmChance = 0.3;
  const desertDepth = 60;
  const ironDepth = 100;
  const hedgeDepth = 55;
  const treeDepth = 60;
  const mountainDepth = 125;
  const freezeTemperature = 0;
  const heatTemperature = 40;
  const pathHeight = 50;
  const spawnWalkLength = 12;

  const ISLAND_TRIES = 5;

  const existingEntities = world.getEntities([]);

  for (let attempt = 0; attempt < ISLAND_TRIES; attempt += 1) {
    try {
      // randomize parameters
      const islandAngle = random(0, 360);
      const townFlipped = choice(true, false);
      const townOffset = townFlipped ? 90 : -90;
      const spawnAngle = islandAngle - random(30, 60) - (townFlipped ? 90 : 0);
      const ilexAngle = islandAngle - 90;
      const townAngle = spawnAngle + townOffset;

      // precalculated values
      const oakPoint = { x: 0, y: 0 };
      const spawnPoint = angledOffset(
        size,
        { x: 0, y: 0 },
        spawnAngle,
        mainlandRadius * 0.9,
        mainlandRatio
      );
      const townPoint = angledOffset(
        size,
        { x: 0, y: 0 },
        townAngle,
        mainlandRadius * 0.7,
        mainlandRatio
      );
      const spawnWalkAngle = spawnAngle + 180;
      const spawnInverted = signedDistance(spawnPoint.y, townPoint.y, size) < 0;
      const signPosition = combine(size, spawnPoint, {
        x: choice(-1, 1),
        y: spawnInverted ? -4 : 4,
      });
      const spawnExit = angledOffset(
        size,
        spawnPoint,
        spawnInverted ? 0 : 180,
        4,
        mainlandRatio
      );
      const spawnPath = angledOffset(
        size,
        spawnExit,
        spawnWalkAngle,
        spawnWalkLength / 2,
        mainlandRatio
      );
      const ilexPoint = angledOffset(
        size,
        { x: 0, y: 0 },
        ilexAngle,
        mainlandRadius * 0.8,
        mainlandRatio
      );
      const townCorner = combine(size, townPoint, {
        x: townSize.x / -2,
        y: townSize.y / -2,
      });

      // preload world matrizes
      const hillsFactory = simplexNoiseFactory();
      const beachesFactory = simplexNoiseFactory();
      const terrainFactory = simplexNoiseFactory();
      const archipelagoFactory = simplexNoiseFactory();
      const greensMatrix = valueNoiseMatrix(size, size, 1, 0, 100); // expensive
      const spawnMatrix = valueNoiseMatrix(size, size, 0, -100, 100); // expensive
      const pathMatrix = createMatrix(size * 2, size * 2, 0);

      // first pass: generate matrices from kernel values
      const elevationMatrix: Matrix<number> = new Array(size);
      const terrainMatrix: Matrix<number> = new Array(size);
      const temperatureMatrix: Matrix<number> = new Array(size);
      const islandsMatrix: Matrix<number> = new Array(size);
      const flattenedMatrix: Matrix<number> = new Array(size);
      const objectsMap: Matrix<CellType[]> = new Array(size);
      const biomeMap: Matrix<BiomeName> = new Array(size);

      for (let x = 0; x < size; x++) {
        elevationMatrix[x] = new Array(size);
        terrainMatrix[x] = new Array(size);
        temperatureMatrix[x] = new Array(size);
        islandsMatrix[x] = new Array(size);
        flattenedMatrix[x] = new Array(size);
        objectsMap[x] = new Array(size);
        biomeMap[x] = new Array(size);

        for (let y = 0; y < size; y++) {
          objectsMap[x][y] = [];
          biomeMap[x][y] = "jungle";

          const mainlandKernel = circularKernel(
            size,
            size,
            x,
            y,
            { x: 0, y: 0 },
            mainlandRadius,
            0,
            125,
            0.09,
            mainlandRatio
          );
          const glacierKernel = circularKernel(
            size,
            size,
            x,
            y,
            { x: size / 2, y: size / 2 },
            glacierRadius,
            0,
            225,
            0.1,
            glacierRatio
          );

          const hillsKernel = simplexNoiseKernel(
            hillsFactory,
            size,
            size,
            x,
            y,
            0,
            0.3,
            1.5,
            0.25
          );
          const mountainKernel =
            hillsKernel *
            rectangleKernel(
              size,
              size,
              x,
              y,
              { x: 0, y: 0 },
              8,
              mainlandRadius * 2,
              islandAngle,
              0,
              200,
              0.8,
              mainlandRatio
            );
          const passageKernel = rectangleKernel(
            size,
            size,
            x,
            y,
            { x: 0, y: 0 },
            3,
            30,
            islandAngle + 90,
            1,
            0,
            10,
            oakRatio
          );
          const spawnCircle = circularKernel(
            size,
            size,
            x,
            y,
            spawnPoint,
            8,
            1,
            0,
            15,
            1
          );
          const spawnWalk = rectangleKernel(
            size,
            size,
            x,
            y,
            spawnPath,
            4,
            spawnWalkLength,
            spawnWalkAngle,
            1,
            0,
            5
          );
          const ilexCircle = circularKernel(
            size,
            size,
            x,
            y,
            ilexPoint,
            5,
            1,
            0,
            15,
            ilexRatio
          );
          const oakCircle = circularKernel(
            size,
            size,
            x,
            y,
            oakPoint,
            6,
            1,
            0,
            15,
            oakRatio
          );
          const townSquare = rectangleKernel(
            size,
            size,
            x,
            y,
            townPoint,
            townSize.x + 7,
            townSize.y + 7,
            0,
            1,
            0,
            1.5,
            1
          );
          const flattenedKernel =
            spawnCircle *
            spawnWalk *
            ilexCircle *
            townSquare *
            oakCircle *
            passageKernel;

          const beachesKernel = simplexNoiseKernel(
            beachesFactory,
            size,
            size,
            x,
            y,
            0,
            0,
            1,
            0.7
          );
          const islandsKernel =
            (oceanDepth +
              mountainKernel +
              Math.max(mainlandKernel, glacierKernel) * (beachesKernel + 0.5) +
              (beachesKernel - 0.5) * 30) *
              flattenedKernel +
            (flattenedKernel * -(airDepth + 1) + airDepth + 1);

          const archipelagoKernel = simplexNoiseKernel(
            archipelagoFactory,
            size,
            size,
            x,
            y,
            0,
            -0.5,
            0.9,
            0.5
          );

          const freezingKernel =
            Math.max(
              circularKernel(
                size,
                size,
                x,
                y,
                { x: size / 2, y: size / 2 },
                glacierRadius * 1.4,
                0,
                1,
                0.3,
                glacierRatio
              ) *
                (islandsKernel + 30),
              0
            ) * -10;

          flattenedMatrix[x][y] = flattenedKernel;
          islandsMatrix[x][y] = islandsKernel;
          elevationMatrix[x][y] =
            islandsKernel > archipelagoDepth
              ? islandsKernel
              : islandsKernel +
                lerp(
                  0,
                  archipelagoKernel * 90 - islandsKernel,
                  (archipelagoDepth - islandsKernel) /
                    (archipelagoDepth - oceanDepth)
                );
          temperatureMatrix[x][y] =
            freezingKernel +
            Math.max(
              (islandsKernel + heatTemperature) *
                gradientKernel(
                  size,
                  size,
                  x,
                  y,
                  { x: 0, y: 0 },
                  mainlandRadius * 1.14,
                  islandAngle - 90,
                  0,
                  1,
                  0.5,
                  mainlandRatio
                ) +
                heatTemperature / 2 -
                10,
              heatTemperature / 2
            );

          terrainMatrix[x][y] = simplexNoiseKernel(
            terrainFactory,
            size,
            size,
            x,
            y,
            0,
            0,
            100,
            0.175
          );
        }
      }

      // second pass: set biomes, cell types and objects
      const rawMap = matrixFactory<CellType>(size, size, (x, y) => {
        let biome: BiomeName = "ocean";
        let cell: CellType = "air";
        const objects: CellType[] = [];
        const temperature = temperatureMatrix[x][y];
        const islands = islandsMatrix[x][y];

        if (islands > archipelagoDepth) biome = "jungle";
        if (temperature > heatTemperature) biome = "desert";
        else if (temperature < freezeTemperature) biome = "glacier";

        const elevation = elevationMatrix[x][y];

        if (elevation < sandDepth) cell = "water_deep";
        else if (elevation < airDepth) cell = "sand";
        else if (elevation > mountainDepth) cell = "mountain";

        // process biomes
        if (biome === "ocean") {
          const underwater =
            terrainMatrix[x][y] *
            (1 - sigmoid(elevation, archipelagoDepth, 0.6));
          if (underwater > 50) cell = "mountain";
        } else if (biome === "desert") {
          if (cell === "air") cell = "sand";
        } else if (biome === "glacier") {
          if (cell === "water_deep") {
            if (
              elevation > -5 ||
              Math.random() * (1 - sigmoid(elevation, -5, 0.4)) < 0.1
            ) {
              cell = "ice";
            }
          } else {
            if (cell === "sand") {
              cell = "ice";
            }

            if (Math.random() <= snowFill) {
              objects.push("snow");
            }
          }
        }

        biomeMap[x][y] = biome;
        objectsMap[x][y] = objects;
        return cell;
      });

      // third pass: place shallow water and ensure is surrounded by sand
      const elevationMap = smoothenWater(smoothenSand(rawMap, biomeMap));

      // fourth pass: process terrain based on biomes and spawn mobs or items
      const terrainMap = mapMatrix(elevationMap, (x, y, cell, matrix) => {
        const biome = biomeMap[x][y];
        const flattened = flattenedMatrix[x][y];
        const elevation = elevationMatrix[x][y];
        const temperature = temperatureMatrix[x][y];
        const objects = objectsMap[x][y];
        const elevationFactor =
          sigmoid(elevation, terrainDepth) *
          (1 - sigmoid(elevation, mountainDepth - 3));
        const greens = greensMatrix[x][y] * elevationFactor;
        const terrain = terrainMatrix[x][y] * elevationFactor;
        const spawn = spawnMatrix[x][y] * elevationFactor;
        const distribution = islandNpcDistribution[biome];

        // process biome's terrain
        if (biome === "ocean") {
          if (elevation > 6 && elevation < 10 && Math.random() < 0.4)
            cell = Math.random() < 0.25 ? "palm_fruit" : "palm";
          else if (elevation > 20 && elevation < 25) cell = "bush";
          else if (elevation >= 25 && elevation < 40 && spawn > 93)
            cell = "pot";
        } else if (biome === "jungle") {
          // spawn fish along coasts and lakes
          if (
            elevation > -15 &&
            elevation < -10 &&
            spawnMatrix[x][y] > 80 &&
            cell === "water_deep"
          ) {
            objects.push("habitat");
          }
          // spawn ore in inner part of jungle
          else if (
            cell === "mountain" &&
            temperature < heatTemperature - 10 &&
            Math.random() < oreChance * 2
          )
            cell = "ore";
          // spawn rocks around lakes but away from flattened areas
          else if (
            elevation > sandDepth &&
            elevation < airDepth &&
            Math.random() < stoneChance &&
            flattened > 0.95 &&
            getDistance({ x: 0, y: 0 }, { x, y }, size, mainlandRatio) <
              mainlandRadius * 0.8
          ) {
            objects.push("rock");
          } else if (terrain > treeDepth) {
            if (
              y > 0 &&
              Math.random() < treeChance &&
              matrix[x][y - 1] === "tree"
            ) {
              matrix[x][y - 1] = "leaves";
              cell = "stem";
            } else {
              cell = "tree";
            }
          } else if (terrain > hedgeDepth) {
            if (spawn > 95) cell = "fruit";
            else if (spawn > 80) cell = "wood";
            else if (
              x > 1 &&
              Math.random() < rottenChance &&
              ["hedge", "air", "grass", "bush"].includes(matrix[x - 1][y]) &&
              ["hedge", "air", "grass", "bush"].includes(matrix[x - 2][y])
            ) {
              if (Math.random() < 0.5) {
                objectsMap[x - 2][y] = [];
                objectsMap[x - 1][y] = [];
                matrix[x - 2][y] = "rotten_stem_right";
                matrix[x - 1][y] = "rotten_branch_right";
                cell = "rotten_leaves_right";
              } else {
                objectsMap[x - 2][y] = [];
                objectsMap[x - 1][y] = [];
                matrix[x - 2][y] = "rotten_leaves_left";
                matrix[x - 1][y] = "rotten_branch_left";
                cell = "rotten_stem_left";
              }
            } else cell = "hedge";
          } else if (greens > bushDepth)
            cell = spawn > 98 ? "leaf" : spawn > 89 ? "berry" : "bush";
          else if (greens > grassDepth)
            cell = spawn > 98 ? "leaf" : spawn > 95 ? "flower" : "grass";
          else if (spawn < -95) objects.push(generateNpcKey(distribution));
        } else if (biome === "desert") {
          // place mountains first
          if (terrain > desertDepth) cell = "mountain";

          // then process ores for previous cells
          matrix[x][y] = cell;
          if (x > 3 && y > 3) {
            // ensure iron is surrounded by mountains
            const targetDelta = [-1, -1];
            const largeTargetDelta = [-2, -2];
            const smallSquareDeltas = range(-2, 0)
              .map((deltaX) => range(-2, 0).map((deltaY) => [deltaX, deltaY]))
              .flat();
            const largeSquareDeltas = range(-4, 0)
              .map((deltaX) => range(-4, 0).map((deltaY) => [deltaX, deltaY]))
              .flat();
            const adjacentDeltas = Object.values(orientationPoints).map(
              (delta) => [delta.x - 1, delta.y - 1]
            );

            if (
              ((elevation < ironDepth && Math.random() < ironChance) ||
                (elevation > ironDepth &&
                  Math.random() < mountainIronChance)) &&
              smallSquareDeltas.every(
                ([deltaX, deltaY]) =>
                  matrix[x + deltaX][y + deltaY] === "mountain"
              )
            ) {
              // spawn iron only fully inside mountain
              matrix[x + targetDelta[0]][y + targetDelta[1]] = "iron";
            } else if (
              Math.random() < oreChance &&
              matrix[x + targetDelta[0]][y + targetDelta[1]] === "mountain" &&
              adjacentDeltas.some(
                ([deltaX, deltaY]) => matrix[x + deltaX][y + deltaY] === "sand"
              )
            ) {
              // spawn ore in mountain only if accessible from outside
              matrix[x + targetDelta[0]][y + targetDelta[1]] = "ore";
            } else if (
              spawn > 93 &&
              largeSquareDeltas.every(
                ([deltaX, deltaY]) => matrix[x + deltaX][y + deltaY] === "sand"
              )
            ) {
              // spawn golem only in cleared areas
              matrix[x + largeTargetDelta[0]][y + largeTargetDelta[1]] =
                "golem";
              smallSquareDeltas.forEach(([deltaX, deltaY]) => {
                objectsMap[x + deltaX + targetDelta[0]][
                  y + deltaY + targetDelta[1]
                ] = [];
              });
              objectsMap[x + largeTargetDelta[0]][y + largeTargetDelta[1]] = [
                "sand",
              ];
            }
          }

          if (
            terrain <= desertDepth &&
            terrain > rockDepth &&
            terrain < rockDepth + 5
          ) {
            cell = "sand";
            objects.push("rock");
          } else if (
            elevation < palmDepth &&
            elevation > palmDepth - 4 &&
            Math.random() < palmChance &&
            flattened > 0.95
          ) {
            // spawn palms around water level but avoid in flattened areas
            cell = "sand";
            objects.push(random(0, 9) === 0 ? "palm_fruit" : "palm");
          } else if (greens > cactusDepth && greens < cactusDepth + 2) {
            cell = "sand";
            objects.push("cactus");
          } else if (cell === "sand" && spawn < -97)
            objects.push(generateNpcKey(distribution));
          else if (cell === "sand" && spawn > 97) objects.push("tumbleweed");
        } else if (biome === "glacier") {
          // TODO: add terrain to glacier
        }

        // set path weight
        if (["air", "bush", "grass", "path", "sand", "hedge"].includes(cell)) {
          pathMatrix[x][y] =
            (Math.abs(elevation - pathHeight) + 4) ** 2 / 16 +
            (cell === "hedge" ? 100 : 0);
        }

        return cell;
      });

      // persist pre-processed matrizes for lazy initialization
      const worldMap = terrainMap;

      world.metadata.gameEntity[LEVEL].initialized = createMatrix(
        size,
        size,
        false
      );
      world.metadata.gameEntity[LEVEL].biomes = biomeMap;
      world.metadata.gameEntity[LEVEL].cells = worldMap;
      world.metadata.gameEntity[LEVEL].objects = objectsMap;

      // insert spawn
      insertArea(
        world,
        flipArea(spawnArea, spawnInverted, choice(true, false)),
        spawnPoint.x,
        spawnPoint.y,
        true
      );
      const spawnLines = spawnArea.split("\n");
      const spawnWidth = spawnLines[0].length;
      const spawnHeight = spawnLines.length;
      const spawnCorner = combine(size, spawnPoint, {
        x: -(spawnWidth - 1) / 2,
        y: -(spawnHeight - 1) / 2,
      });
      matrixFactory(spawnWidth, spawnHeight, (x, y) => {
        setPath(pathMatrix, x + spawnCorner.x, y + spawnCorner.y, 0);
      });

      // insert ilex
      insertArea(world, ilexArea, ilexPoint.x, ilexPoint.y, true);
      const ilexLines = ilexArea.split("\n");
      const ilexWidth = ilexLines[0].length;
      const ilexHeight = ilexLines.length;
      const ilexCorner = {
        x: ilexPoint.x - (ilexWidth - 1) / 2,
        y: ilexPoint.y - (ilexHeight - 1) / 2,
      };

      // insert oak
      insertArea(world, oakArea, oakPoint.x, oakPoint.y, true);
      const oakLines = oakArea.split("\n");
      const oakWidth = oakLines[0].length;
      const oakHeight = oakLines.length;
      const oakCorner = {
        x: oakPoint.x - (oakWidth - 1) / 2,
        y: oakPoint.y - (oakHeight - 1) / 2,
      };
      const oakEntrance = angledOffset(
        size,
        oakPoint,
        islandAngle - 90,
        6,
        oakRatio
      );
      const oakExit = angledOffset(
        size,
        oakPoint,
        islandAngle + 90,
        6,
        oakRatio
      );
      for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
        for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
          const entrancePoint = combine(size, oakEntrance, {
            x: offsetX,
            y: offsetY,
          });
          const exitPoint = combine(size, oakExit, { x: offsetX, y: offsetY });
          worldMap[entrancePoint.x][entrancePoint.y] = "air";
          worldMap[exitPoint.x][exitPoint.y] = "sand";
        }
      }
      matrixFactory(oakWidth, oakHeight, (offsetX, offsetY) => {
        const x = normalize(oakCorner.x + offsetX, size);
        const y = normalize(oakCorner.y + offsetY, size);
        if (oakLines[offsetY][offsetX] !== "?") {
          setPath(pathMatrix, x, y, 0);
          biomeMap[x][y] = "jungle";
          objectsMap[x][y] = [];
        }

        if (oakLines[offsetY][offsetX] === " ") {
          worldMap[x][y] = "air";
        } else if (
          oakLines[offsetY][offsetX] === "█" &&
          worldMap[x][y] !== "mountain"
        ) {
          worldMap[x][y] = worldMap[x][y] === "air" ? "hedge" : "cactus";
        }
      });

      // insert town
      const {
        matrix: townMatrix,
        houses: relativeEarthHouses,
        exits: relativeExits,
        inn: relativeInn,
        guards: relativeGuards,
      } = generateTown(townSize.x, townSize.y);
      iterateMatrix(townMatrix, (offsetX, offsetY, value) => {
        const x = normalize(townPoint.x + offsetX - townSize.x / 2, size);
        const y = normalize(townPoint.y + offsetY - townSize.y / 2, size);

        worldMap[x][y] = value ? (value as CellType) : "air";
        setPath(pathMatrix, x, y, 0);
      });

      const earthHouses = relativeEarthHouses.map((house) => ({
        ...house,
        position: combine(size, house.position, townCorner),
        door: combine(size, house.door, townCorner),
      }));
      const exits = relativeExits.map((exit) =>
        combine(size, exit, townCorner)
      );
      const guards = relativeGuards.map((guard) =>
        combine(size, guard, townCorner)
      );
      const inn = combine(size, relativeInn, townCorner);

      // create shortest path from spawn to town
      setPath(pathMatrix, spawnExit.x, spawnExit.y, 0, false);
      iterateMatrix(worldMap, (x, y) => {
        const height = pathMatrix[x][y];
        setPath(pathMatrix, x, y, height);
      });

      // select quadrant pairs manually to ensure path is contained by island
      const closestExit =
        exits[signedDistance(spawnExit.y, townPoint.y, size) > 0 ? 0 : 1];
      const townPath = findPath(
        pathMatrix,
        spawnExit,
        closestExit,
        false,
        false,
        getAbsoluteQuadrant(size, spawnPoint, closestExit)
      );

      townPath.forEach(({ x, y }) => {
        worldMap[x][y] = "path";
        objectsMap[x][y] = [];
        setPath(pathMatrix, x, y, 1);
      });

      // preprocess town
      const [
        earthTraderHouse,
        earthSmithHouse,
        earthDruidHouse,
        ...emptyEarthHouses
      ] = earthHouses;

      setMatrix(
        worldMap,
        earthSmithHouse.position.x +
          (earthSmithHouse.position.x === earthSmithHouse.door.x
            ? choice(-3, 3)
            : earthSmithHouse.position.x - earthSmithHouse.door.x),
        earthSmithHouse.position.y + 3,
        "campfire"
      );
      setMatrix(
        worldMap,
        earthSmithHouse.door.x,
        earthSmithHouse.door.y,
        "gold_door"
      );
      setMatrix(
        worldMap,
        earthSmithHouse.position.x + choice(-1, 1),
        earthSmithHouse.position.y + 2,
        "house_smith"
      );
      setMatrix(
        worldMap,
        earthTraderHouse.position.x + choice(-1, 1),
        earthTraderHouse.position.y + 2,
        "house_trader"
      );
      setMatrix(
        worldMap,
        earthDruidHouse.position.x + choice(-1, 1),
        earthDruidHouse.position.y + 2,
        "house_druid"
      );
      setMatrix(
        worldMap,
        earthDruidHouse.door.x,
        earthDruidHouse.door.y,
        "iron_door"
      );

      // mark entrance of desert for further processing
      const desertEntrance = angledOffset(
        size,
        oakExit,
        islandAngle + 90,
        2,
        oakRatio
      );
      worldMap[desertEntrance.x][desertEntrance.y] = "sand";
      objectsMap[desertEntrance.x][desertEntrance.y] = [];
      setPath(pathMatrix, desertEntrance.x, desertEntrance.y, 1);

      // find suitable angle for haven with largest distance to known neighbouring islands
      const havenAngles = [-45, 0, 45, 135, 180, 225];
      const closestHavenAngles = [...havenAngles].sort(
        (left, right) =>
          Math.abs(signedDistance(left, islandAngle + 90, 360)) -
          Math.abs(signedDistance(right, islandAngle + 90, 360))
      );
      const havenAngle = closestHavenAngles[0];

      // find haven point as first beach starting from ocean towards center
      const beachPoint = marchLinePredicate(
        world,
        desertEntrance,
        havenAngle,
        mainlandRadius * 1.25,
        mainlandRatio,
        (x, y) =>
          biomeMap[x][y] === "desert" &&
          elevationMatrix[x][y] > sandDepth &&
          findPath(pathMatrix, { x, y }, desertEntrance, false, true).length > 0
      );

      // move haven center to free area inwards
      const havenInnRadius = 3;
      const havenPoint = marchLinePredicate(
        world,
        desertEntrance,
        havenAngle,
        getDistance(desertEntrance, beachPoint, size, mainlandRatio) - 5,
        mainlandRatio,
        (x, y) =>
          range(-havenInnRadius, havenInnRadius).every((offsetX) =>
            range(-havenInnRadius, havenInnRadius).every((offsetY) => {
              const target = combine(size, { x: x + offsetX, y: y + offsetY });
              return elevationMatrix[target.x][target.y] > havenDepth;
            })
          )
      );

      // determine radius size for haven, ensuring sandy areas free from beach
      const havenRatio = aspectRatio;
      const havenCells = 475;
      let havenRadius = 11;
      let havenUsable = 0;
      do {
        havenUsable = 0;
        havenRadius += 1;

        for (const { x, y } of pixelCircle(
          havenPoint,
          havenRadius,
          havenRatio,
          true
        )) {
          const target = combine(size, { x, y });
          const elevation = elevationMatrix[target.x][target.y];
          const cell = worldMap[target.x][target.y];
          const biome = biomeMap[target.x][target.y];
          if (elevation > havenDepth && biome === "desert") havenUsable += 1;
          else if (cell === "water_shallow") havenUsable -= 1.5;
          else if (cell === "water_deep") havenUsable -= 0.05;
        }
      } while (havenUsable < havenCells);

      // create virtual map for filling haven town
      const havenWidth = Math.ceil(havenRadius / havenRatio) * 2 + 1;
      const havenHeight = Math.ceil(havenRadius) * 2 + 1;
      const havenCorner = combine(size, havenPoint, {
        x: (havenWidth - 1) / -2,
        y: (havenHeight - 1) / -2,
      });
      const havenArea: Record<number, Record<number, boolean>> = {};

      // clear area for haven
      for (const { x, y } of pixelCircle(
        havenPoint,
        havenRadius + 1,
        havenRatio,
        true
      )) {
        const target = combine(size, { x, y });
        const elevation = elevationMatrix[target.x][target.y];
        const biome = biomeMap[target.x][target.y];
        if (elevation > sandDepth && biome === "desert") {
          worldMap[target.x][target.y] = "sand";
          objectsMap[target.x][target.y] = [];

          // prevent paths going through town
          const distance = getDistance(havenPoint, target, size, havenRatio);
          if (distance < havenRadius - 1.5) {
            setPath(pathMatrix, target.x, target.y, 0);
          }

          // mark area as free if within zone
          const havenX = normalize(target.x - havenCorner.x, size);
          const havenY = normalize(target.y - havenCorner.y, size);

          const withinPalisades =
            distance < havenRadius - 2 && elevation > sandDepth;
          havenArea[havenX] = havenArea[havenX] || {};
          havenArea[havenX][havenY] = withinPalisades;
        }
      }

      // place palisades
      const palisadePositions: Position[] = [];
      for (const { x, y } of pixelCircle(
        havenPoint,
        havenRadius - 1,
        havenRatio
      )) {
        const target = combine(size, { x, y });
        const cell = worldMap[target.x][target.y];
        const elevation = elevationMatrix[target.x][target.y];
        const biome = biomeMap[target.x][target.y];

        if (
          biome === "desert" &&
          ((elevation > palisadeDepth && cell === "water_shallow") ||
            elevation > sandDepth)
        ) {
          worldMap[target.x][target.y] =
            elevation > sandDepth ? "sand" : "water_shallow";
          objectsMap[target.x][target.y] = ["palisade"];
          palisadePositions.push(target);

          setPath(pathMatrix, target.x, target.y, 0);

          // mark area as occupied
          const havenX = normalize(target.x - havenCorner.x, size);
          const havenY = normalize(target.y - havenCorner.y, size);
          havenArea[havenX] = havenArea[havenX] || {};
          havenArea[havenX][havenY] = false;
        }
      }

      // check if jetty is outside of haven, and extend palisades if needed
      const jettyInnDistance = getDistance(
        beachPoint,
        havenPoint,
        size,
        havenRatio
      );
      const jettyRadius = jettyInnDistance + 3 - havenRadius;
      if (jettyRadius > 0) {
        // clear existing palisades and area
        for (const { x, y } of pixelCircle(
          beachPoint,
          jettyRadius + 5,
          havenRatio,
          true
        )) {
          const target = combine(size, { x, y });
          const objects = objectsMap[target.x][target.y];
          const elevation = elevationMatrix[target.x][target.y];
          const biome = biomeMap[target.x][target.y];

          // prevent paths going through jetty
          setPath(pathMatrix, target.x, target.y, 0);

          if (
            biome === "desert" &&
            (elevation > sandDepth || objects.includes("palisade"))
          ) {
            worldMap[target.x][target.y] =
              elevation > sandDepth ? "sand" : "water_shallow";
            objectsMap[target.x][target.y] = [];
          }
        }

        // extend palisade by circle around jetty
        for (const { x, y } of pixelCircle(
          beachPoint,
          jettyRadius + 5,
          havenRatio
        )) {
          const target = combine(size, { x, y });
          const cell = worldMap[target.x][target.y];
          const elevation = elevationMatrix[target.x][target.y];
          const biome = biomeMap[target.x][target.y];

          if (
            biome === "desert" &&
            getDistance(havenPoint, target, size, havenRatio) >
              havenRadius - 1 &&
            ((elevation > palisadeDepth && cell === "water_shallow") ||
              elevation > sandDepth)
          ) {
            worldMap[target.x][target.y] =
              elevation > sandDepth ? "sand" : "water_shallow";
            objectsMap[target.x][target.y] = ["palisade"];
          }
        }
      }

      // find closest angle for jetty which has most water
      const jettyConfigurations: Record<
        Orientation,
        {
          cell: CellType;
          length: number;
        }
      > = {
        up: {
          cell: "jetty_vertical",
          length: 5,
        },
        right: {
          cell: "jetty_horizontal",
          length: 8,
        },
        down: {
          cell: "jetty_vertical",
          length: 5,
        },
        left: {
          cell: "jetty_horizontal",
          length: 8,
        },
      };
      const placementScores: Partial<Record<CellType, number>> = {
        sand: -5,
        water_shallow: 1,
        water_deep: 3,
      };
      const defaultScore = -3;
      const jettyOrientations = relativeOrientations(
        world,
        desertEntrance,
        beachPoint,
        mainlandRatio
      );
      const calculatePlacementScore = (
        orientation: Orientation,
        origin: Position
      ) => {
        let score = 0;
        const delta = orientationPoints[orientation];
        const leftDelta = orientationPoints[rotateOrientation(orientation, -1)];
        const rightDelta = orientationPoints[rotateOrientation(orientation, 1)];
        let placementCursor = origin;
        const range = jettyConfigurations[orientation].length + 2;
        for (let rangeOffset = 0; rangeOffset < range; rangeOffset += 1) {
          placementCursor = combine(size, placementCursor, delta);
          score +=
            placementScores[worldMap[placementCursor.x][placementCursor.y]] ||
            defaultScore;
          const leftPosition = combine(size, placementCursor, leftDelta);
          score +=
            placementScores[worldMap[leftPosition.x][leftPosition.y]] ||
            defaultScore;
          const rightPosition = combine(size, placementCursor, rightDelta);
          score +=
            placementScores[worldMap[rightPosition.x][rightPosition.y]] ||
            defaultScore;
        }
        return score;
      };
      const jettyOrientation =
        jettyOrientations.length === 1
          ? jettyOrientations[0]
          : [...jettyOrientations].sort(
              (left, right) =>
                calculatePlacementScore(right, beachPoint) -
                calculatePlacementScore(left, beachPoint)
            )[0];

      const jettyConfiguration = jettyConfigurations[jettyOrientation];
      const jettyDelta = orientationPoints[jettyOrientation];

      // place jetty and clear ocean area
      const oceanClear = 5;
      let jettyCursor = beachPoint;
      for (
        let jettyOffset = 0;
        jettyOffset < jettyConfiguration.length + oceanClear;
        jettyOffset += 1
      ) {
        const clearCell: CellType | undefined =
          jettyOffset === jettyConfiguration.length
            ? "water_shallow"
            : jettyOffset > jettyConfiguration.length
            ? "water_deep"
            : undefined;
        jettyCursor = combine(size, jettyCursor, jettyDelta);

        worldMap[jettyCursor.x][jettyCursor.y] =
          clearCell ?? jettyConfiguration.cell;
        objectsMap[jettyCursor.x][jettyCursor.y] = [];

        // place fences
        const leftFence = combine(
          size,
          jettyCursor,
          orientationPoints[rotateOrientation(jettyOrientation, -1)]
        );
        const rightFence = combine(
          size,
          jettyCursor,
          orientationPoints[rotateOrientation(jettyOrientation, 1)]
        );
        worldMap[leftFence.x][leftFence.y] = clearCell ?? "water_shallow";
        worldMap[rightFence.x][rightFence.y] = clearCell ?? "water_shallow";
        objectsMap[leftFence.x][leftFence.y] = clearCell ? [] : ["fence"];
        objectsMap[rightFence.x][rightFence.y] = clearCell ? [] : ["fence"];

        if (clearCell === "water_deep") {
          worldMap[jettyCursor.x][jettyCursor.y] = getWaterCell(
            worldMap,
            jettyCursor.x,
            jettyCursor.y
          );
          worldMap[leftFence.x][leftFence.y] = getWaterCell(
            worldMap,
            leftFence.x,
            leftFence.y
          );
          worldMap[rightFence.x][rightFence.y] = getWaterCell(
            worldMap,
            rightFence.x,
            rightFence.y
          );
        }
      }

      // add boat at end of jetty
      const boatPoint = combine(size, beachPoint, {
        x: jettyDelta.x * (jettyConfiguration.length + 1),
        y: jettyDelta.y * (jettyConfiguration.length + 1),
      });
      objectsMap[boatPoint.x][boatPoint.y] = ["boat"];

      const havenMap = matrixFactory<CellType | "">(
        havenWidth,
        havenHeight,
        (x, y) => {
          const hasAdjacentWater = Object.values(orientationPoints).some(
            (delta) => {
              const target = combine(size, havenCorner, { x, y }, delta);
              return ["water_deep", "water_shallow"].includes(
                worldMap[target.x][target.y]
              );
            }
          );
          if (havenArea[x]?.[y] && !hasAdjacentWater) {
            return "";
          }

          return "sand";
        }
      );

      // find gap for gate and guards
      const gatePositions: {
        gate: Position;
        guard: Position;
        orientation: Orientation;
      }[] = [];
      for (const position of palisadePositions) {
        if (objectsMap[position.x][position.y][0] !== "palisade") continue;

        const directions = relativeOrientations(
          world,
          position,
          havenPoint,
          havenRatio
        );
        for (const direction of directions) {
          const delta = orientationPoints[direction];
          const innerPoint = combine(size, position, delta);

          // ensure path is free inside and outside of gate
          if (
            range(-2, 2).every((offset) => {
              const offsetPoint = combine(size, position, {
                x: delta.x * offset,
                y: delta.y * offset,
              });
              return (
                offset === 0 ||
                (worldMap[offsetPoint.x][offsetPoint.y] === "sand" &&
                  objectsMap[offsetPoint.x][offsetPoint.y].length === 0)
              );
            })
          ) {
            gatePositions.push({
              gate: position,
              guard: innerPoint,
              orientation: direction,
            });
          }
        }
      }
      if (gatePositions.length === 0)
        throw new Error("Unable to create gate for haven.");
      const idealGatePosition = angledOffset(
        size,
        havenPoint,
        havenAngle + 180,
        havenRadius - 1,
        havenRatio
      );
      gatePositions.sort(
        (left, right) =>
          getDistance(idealGatePosition, left.gate, size) -
          getDistance(idealGatePosition, right.gate, size)
      );
      const gatePosition = gatePositions[0].gate;
      const guardPosition = gatePositions[0].guard;
      const guardDelta = orientationPoints[gatePositions[0].orientation];
      const guardPath = combine(size, guardPosition, guardDelta);
      const guardWait = combine(size, guardPath, guardDelta);
      const havenGate = combine(
        size,
        gatePosition,
        orientationPoints[invertOrientation(gatePositions[0].orientation)]
      );

      objectsMap[gatePosition.x][gatePosition.y] = [];
      worldMap[havenGate.x][havenGate.y] = "path";
      worldMap[gatePosition.x][gatePosition.y] = "palisade_door_path";
      worldMap[guardPosition.x][guardPosition.y] = "path";
      worldMap[guardPath.x][guardPath.y] = "path";
      worldMap[guardWait.x][guardWait.y] = "path";

      // insert haven
      const havenInnDelta = combine(size, havenPoint, {
        x: -havenCorner.x,
        y: -havenCorner.y,
      });
      const havenGuardDelta = combine(size, guardWait, {
        x: -havenCorner.x,
        y: -havenCorner.y,
      });
      const havenJettyDelta = combine(size, beachPoint, {
        x: -havenCorner.x,
        y: -havenCorner.y,
      });
      const { matrix: havenMatrix, houses: relativeFireHouses } = generateHaven(
        havenMap,
        havenInnDelta,
        havenGuardDelta,
        havenJettyDelta
      );

      iterateMatrix(havenMatrix, (offsetX, offsetY, value) => {
        const x = normalize(havenCorner.x + offsetX, size);
        const y = normalize(havenCorner.y + offsetY, size);

        if (value && value !== "sand") {
          worldMap[x][y] = value as CellType;
        }
      });

      // draw path from oak to haven gate
      const havenPath = findPath(
        pathMatrix,
        desertEntrance,
        havenGate,
        false,
        false,
        {
          x:
            Number(desertEntrance.x > size / 2) -
            Number(havenGate.x > size / 2),
          y:
            Number(desertEntrance.y > size / 2) -
            Number(havenGate.y > size / 2),
        }
      );
      havenPath.forEach(({ x, y }) => {
        worldMap[x][y] = "path";
        objectsMap[x][y] = [];
        setPath(pathMatrix, x, y, 1);
      });

      // fifth pass: ensure adjacent sand to water becomes
      world.metadata.gameEntity[LEVEL].cells = smoothenBeaches(
        world.metadata.gameEntity[LEVEL].cells
      );

      // preprocess haven
      const fireHouses = relativeFireHouses.map((house) => ({
        ...house,
        position: combine(size, house.position, havenCorner),
        door: combine(size, house.door, havenCorner),
      }));

      const [
        fireTraderHouse,
        fireSmithHouse,
        fireDruidHouse,
        ...emptyFireHouses
      ] = fireHouses;

      setMatrix(
        worldMap,
        fireSmithHouse.position.x + choice(-1, 1),
        fireSmithHouse.position.y + 3,
        "campfire"
      );
      setMatrix(
        worldMap,
        fireSmithHouse.position.x + choice(-1, 1),
        fireSmithHouse.position.y + 2,
        "fortress_smith"
      );
      setMatrix(
        worldMap,
        fireTraderHouse.position.x + choice(-1, 1),
        fireTraderHouse.position.y + 2,
        "fortress_trader"
      );
      setMatrix(
        worldMap,
        fireDruidHouse.position.x + choice(-1, 1),
        fireDruidHouse.position.y + 2,
        "fortress_druid"
      );

      // set rain for forest
      const mainlandStorm = entities.createAnchor(world, {
        [POSITION]: { x: 0, y: 0 },
        [RENDERABLE]: { generation: 0 },
        [SEQUENCABLE]: { states: {} },
        [STICKY]: {},
        [SPRITE]: none,
      });
      setIdentifier(world, mainlandStorm, "storm");
      createSequence<"weather", WeatherSequence>(
        world,
        mainlandStorm,
        "weather",
        "weatherStorm",
        {
          position: { x: 0, y: 0 },
          generation: 0,
          intensity: 20,
          drops: [],
          start: 0,
          end: 0,
          type: "rain",
          viewable: { x: 0, y: 0 },
          ratio: mainlandRatio,
        }
      );
      npcSequence(world, mainlandStorm, "oscillatingStormNpc", {
        center: angledOffset(
          size,
          { x: 0, y: 0 },
          islandAngle - 90,
          mainlandRadius / 2,
          mainlandRatio
        ),
        degrees: islandAngle - 90,
        amplitude: mainlandRadius * 0.8,
        frequency: 1 / 100,
        ratio: mainlandRatio,
      });

      // create tornados in desert
      for (let tornadoIndex = 0; tornadoIndex < 5; tornadoIndex += 1) {
        const tornadoEntity = entities.createTornado(world, {
          [BELONGABLE]: { faction: "hostile" },
          [CASTABLE]: {
            ...getEmptyCastable(world, world.metadata.gameEntity),
            reproc: 3,
          },
          [MOVABLE]: {
            orientations: [],
            reference: world.getEntityId(world.metadata.gameEntity),
            spring: {
              duration: 200,
            },
            lastInteraction: 0,
            flying: true,
            swimming: false,
          },
          [ORIENTABLE]: {},
          [POSITION]: { x: 13, y: 30 },
          [RENDERABLE]: { generation: 0 },
          [SEQUENCABLE]: { states: {} },
          [SPRITE]: none,
        });
        tornadoEntity[CASTABLE].caster = world.getEntityId(tornadoEntity);
        createSequence<"tornado", TornadoSequence>(
          world,
          tornadoEntity,
          "tornado",
          "tornadoSpin",
          {
            element: "air",
            position: copy(tornadoEntity[POSITION]),
            radius: 0,
            amount: 2,
            exertables: [],
            gusts: [],
            generation: 0,
          }
        );
        npcSequence(world, tornadoEntity, "wanderingTornadoNpc", {
          maximum: 3,
          lastMove: world.metadata.gameEntity[RENDERABLE].generation,
          lastGrow: world.metadata.gameEntity[RENDERABLE].generation,
          orientation: "right",
          growing: false,
          biome: "desert",
          center: copy(desertEntrance),
          angle: islandAngle + 90,
          radius: mainlandRadius,
          ratio: mainlandRatio,
        });
      }

      // set snow for glacier
      const glacierStorm = entities.createAnchor(world, {
        [POSITION]: { x: 0, y: 0 },
        [RENDERABLE]: { generation: 0 },
        [SEQUENCABLE]: { states: {} },
        [STICKY]: {},
        [SPRITE]: none,
      });
      createSequence<"weather", WeatherSequence>(
        world,
        glacierStorm,
        "weather",
        "weatherStorm",
        {
          position: { x: size / 2, y: size / 2 },
          generation: 0,
          intensity: glacierRadius * 0.9,
          drops: [],
          start: 0,
          end: Infinity,
          type: "snow",
          viewable: { x: 0, y: 0 },
          ratio: glacierRatio,
        }
      );

      // initialize spawn, town, ilex and oak
      initializeArea(
        world,
        spawnCorner,
        combine(size, spawnCorner, { x: spawnWidth, y: spawnHeight })
      );
      initializeArea(world, townCorner, combine(size, townCorner, townSize));
      initializeArea(
        world,
        ilexCorner,
        combine(size, ilexCorner, { x: ilexWidth, y: ilexHeight })
      );
      initializeArea(
        world,
        oakCorner,
        combine(size, oakCorner, { x: oakWidth, y: oakHeight })
      );
      initializeArea(
        world,
        havenCorner,
        combine(size, havenCorner, { x: havenWidth, y: havenHeight })
      );

      // adjust hero
      const heroEntity = assertIdentifierAndComponents(world, "hero", [
        POSITION,
        VIEWABLE,
      ]);
      questSequence(world, heroEntity, "spawnQuest", {});

      // assign buildings
      const [
        earthTraderBuilding,
        earthSmithBuilding,
        earthDruidBuilding,
        ...emptyEarthBuildings
      ] = [
        earthTraderHouse,
        earthSmithHouse,
        earthDruidHouse,
        ...emptyEarthHouses,
      ].map((building) => assignBuilding(world, building.position));

      const [
        fireTraderBuilding,
        fireSmithBuilding,
        fireDruidBuilding,
        ...emptyFireBuildings
      ] = [
        fireTraderHouse,
        fireSmithHouse,
        fireDruidHouse,
        ...emptyFireHouses,
      ].map((building) => assignBuilding(world, building.position));

      // add map markers
      entities.createMarker(world, {
        [FOG]: { visibility: "hidden", type: "terrain" },
        [POI]: { sprite: mapHouse },
        [POSITION]: townPoint,
        [RENDERABLE]: { generation: 0 },
      });
      entities.createMarker(world, {
        [FOG]: { visibility: "hidden", type: "terrain" },
        [POI]: { sprite: mapSpawn },
        [POSITION]: spawnPoint,
        [RENDERABLE]: { generation: 0 },
      });

      // add quest sign after exiting
      const spawnSign = createSign(world, signPosition, [
        [
          createText("Find the town and"),
          createText("speak with the"),
          [...createUnitName("earthChief"), ...createText(".")],
          [],
          createText("Follow either the"),
          [
            getOrientedSprite(questPointer, "right"),
            ...createText("Focus", colors.grey),
            ...createText(" or "),
            path,
            ...createText("Path", colors.grey),
            ...createText("."),
          ],
          [],
          createText("Be careful with"),
          [
            ...createText("the "),
            getUnitSprite("rose"),
            getUnitSprite("clover"),
            getUnitSprite("violet"),
            ...createText("Plants", colors.maroon),
            ...createText("."),
          ],
        ],
      ]);
      setIdentifier(world, spawnSign, "spawn_sign");

      // postprocess town

      const townEnd = combine(size, townCorner, {
        x: townSize.x - 1,
        y: townSize.y - 1,
      });
      const earthTown = entities.createProcessor(world, {
        [RENDERABLE]: { generation: 0 },
        [SEQUENCABLE]: { states: {} },
        [POSITION]: { ...townPoint },
      });
      setIdentifier(world, earthTown, "earth_town");
      npcSequence(world, earthTown, "earthTownNpc", {
        topLeft: townCorner,
        bottomRight: townEnd,
        spawn: combine(size, inn, { x: 0, y: 2 }),
      });

      // place guards at exits
      guards.forEach((guard, index) => {
        const guardEntity = createNpc(world, "earthGuard", { ...guard });
        guardEntity[BEHAVIOUR].patterns.unshift({
          name: "watch",
          memory: {
            origin: guard,
            topLeft: townCorner,
            bottomRight: townEnd,
          },
        });
        guardEntity[TOOLTIP].dialogs =
          [
            [
              createDialog("Welcome stranger"),
              createDialog("This is Earth Town"),
              createDialog("Stay safe!"),
            ],
            [
              createDialog("Hey there"),
              createDialog("Enjoy Earth Town"),
              createDialog("See you around!"),
            ],
          ][index] || [];
      });

      // chief next to fountain
      const chiefEntity = createNpc(
        world,
        "earthChief",
        combine(size, inn, { x: choice(-1, 1), y: 2 })
      );
      npcSequence(world, chiefEntity, "earthChiefNpc", {});

      // smith's house
      const earthSmithOffset = choice(-2, 2);
      createNpc(
        world,
        "earthSmith",
        combine(size, earthSmithBuilding.building[POSITION], {
          x: earthSmithOffset,
          y: 0,
        })
      );

      const earthAnvilEntity = createCell(
        world,
        add(earthSmithBuilding.building[POSITION], {
          x: earthSmithOffset * -1,
          y: 0,
        }),
        "anvil_passive",
        "hidden"
      ).cell;
      setIdentifier(world, earthAnvilEntity, "earth_anvil");

      // druid's house
      const earthDruidOffset = choice(-2, 2);
      createNpc(
        world,
        "earthDruid",
        combine(size, earthDruidBuilding.building[POSITION], {
          x: earthDruidOffset,
          y: 0,
        })
      );

      const earthKettleEntity = createCell(
        world,
        add(earthDruidBuilding.building[POSITION], {
          x: earthDruidOffset * -1,
          y: 0,
        }),
        "kettle_passive",
        "hidden"
      ).cell;
      setIdentifier(world, earthKettleEntity, "earth_kettle");

      // trader's house
      const earthTraderOffset = choice(-2, 2);
      const earthTraderEntity = createNpc(
        world,
        "earthTrader",
        combine(size, earthTraderBuilding.building[POSITION], {
          x: earthTraderOffset,
          y: 0,
        })
      );

      createPopup(world, earthTraderEntity, {
        deals: purchasableItems.map((item) => ({
          item: {
            ...item,
            amount: 1,
          },
          stock: Infinity,
          prices: getItemBuyPrice(item),
        })),

        tabs: ["buy", "sell"],
      });
      const earthBenchEntity = createCell(
        world,
        add(earthTraderBuilding.building[POSITION], {
          x: earthTraderOffset * -1,
          y: 0,
        }),
        "bench",
        "hidden"
      ).cell;
      setIdentifier(world, earthBenchEntity, "earth_bench");

      // postprocess haven

      // create sign at desert entrace
      const desertSign = createSign(world, desertEntrance, [
        [
          createText("Dangerous desert"),
          createText("ahead. Proceed at"),
          createText("own risk."),
          [],
          [
            ...createText("Follow the "),
            path,
            ...createText("Path", colors.grey),
          ],
          createText("to the haven."),
          [],
          createText("Watch out for the"),
          [
            ...createUnitName("golem"),
            ...createText("s", colors.maroon),
            ...createText(" in these"),
          ],
          [...createText("Rock", colors.grey), ...createText(" formations:")],
          [],
          ...centerLayer(
            [[rock1], [rock1, rock2, rock1], [rock1]],
            frameWidth - 2
          ),
          [],
        ],
      ]);
      desertSign[SPRITE] = mergeSprites(shadow, desertSign[SPRITE]);

      const fireHaven = entities.createProcessor(world, {
        [RENDERABLE]: { generation: 0 },
        [SEQUENCABLE]: { states: {} },
        [POSITION]: { ...havenPoint },
      });
      setIdentifier(world, fireHaven, "fire_haven");
      npcSequence(world, fireHaven, "fireHavenNpc", {
        center: havenPoint,
        radius: havenRadius - 1,
        ratio: havenRatio,
        spawn: combine(size, havenPoint, { x: 0, y: 2 }),
      });

      // fire chief next to inn
      const fireChief = createNpc(
        world,
        "fireChief",
        combine(size, havenPoint, { x: choice(-1, 1), y: 2 })
      );
      npcSequence(world, fireChief, "fireChiefNpc", {});

      // place first guard behind door and walk away when nearby
      const fireGateGuard = createNpc(world, "fireGateGuard", guardPosition);
      npcSequence(world, fireGateGuard, "fireGateGuardNpc", {});
      fireGateGuard[BEHAVIOUR].patterns.push(
        {
          name: "watch",
          memory: {
            origin: guardPosition,
            center: havenPoint,
            radius: havenRadius - 1,
            ratio: havenRatio,
          },
        },
        {
          name: "gate",
          memory: {
            origin: copy(guardPosition),
            target: guardWait,
            gate: gatePosition,
            inn: havenPoint,
            radius: havenRadius - 1,
          },
        }
      );

      // place second guard in front of jetty
      createNpc(world, "fireGuard", beachPoint);

      // smith's house
      const fireSmithOffset = choice(-2, 2);
      const fireSmith = createNpc(
        world,
        "fireSmith",
        combine(size, fireSmithBuilding.building[POSITION], {
          x: fireSmithOffset,
          y: 0,
        })
      );
      npcSequence(world, fireSmith, "fireSmithNpc", {});

      const fireAnvilEntity = createCell(
        world,
        add(fireSmithBuilding.building[POSITION], {
          x: fireSmithOffset * -1,
          y: 0,
        }),
        "anvil",
        "hidden"
      ).cell;
      setIdentifier(world, fireAnvilEntity, "fire_anvil");

      // druid's house
      const fireDruidOffset = choice(-2, 2);
      const fireDruid = createNpc(
        world,
        "fireDruid",
        combine(size, fireDruidBuilding.building[POSITION], {
          x: fireDruidOffset,
          y: 0,
        })
      );
      npcSequence(world, fireDruid, "fireDruidNpc", {});

      const fireKettleEntity = createCell(
        world,
        add(fireDruidBuilding.building[POSITION], {
          x: fireDruidOffset * -1,
          y: 0,
        }),
        "kettle",
        "hidden"
      ).cell;
      setIdentifier(world, fireKettleEntity, "fire_kettle");

      // trader's house
      const fireTraderOffset = choice(-2, 2);
      const fireTraderEntity = createNpc(
        world,
        "fireTrader",
        combine(size, fireTraderBuilding.building[POSITION], {
          x: fireTraderOffset,
          y: 0,
        })
      );

      createPopup(world, fireTraderEntity, {
        deals: purchasableItems.map((item) => ({
          item: {
            ...item,
            amount: 1,
          },
          stock: Infinity,
          prices: getItemBuyPrice(item),
        })),

        tabs: ["buy", "sell"],
      });
      const fireBenchEntity = createCell(
        world,
        add(fireTraderBuilding.building[POSITION], {
          x: fireTraderOffset * -1,
          y: 0,
        }),
        "bench",
        "hidden"
      ).cell;
      setIdentifier(world, fireBenchEntity, "fire_bench");

      // furnish houses of town and haven
      const furnishingBuildings = [
        earthTraderBuilding,
        earthSmithBuilding,
        earthDruidBuilding,
        ...emptyEarthBuildings,
        fireTraderBuilding,
        fireSmithBuilding,
        fireDruidBuilding,
        ...emptyFireBuildings,
      ];

      for (const furnishingBuilding of furnishingBuildings) {
        // add furniture
        const furnitureOrientation = (["left", "right"] as const)[random(0, 1)];
        const invertFurniture = invertOrientation(
          furnitureOrientation
        ) as typeof furnitureOrientation;
        if (random(0, 1) === 0) {
          // create bed
          createCell(
            world,
            furnishingBuilding.building[POSITION],
            "bed",
            "hidden"
          );
        } else {
          // create table and chairs
          createCell(
            world,
            furnishingBuilding.building[POSITION],
            "table",
            "hidden"
          );
          const chairCells = { left: "chair_left", right: "chair_right" };
          createCell(
            world,
            combine(
              size,
              furnishingBuilding.building[POSITION],
              orientationPoints[furnitureOrientation]
            ),
            chairCells[furnitureOrientation],
            "hidden"
          );
          if (random(0, 1) === 0) {
            createCell(
              world,
              combine(
                size,
                furnishingBuilding.building[POSITION],
                orientationPoints[invertFurniture]
              ),
              chairCells[invertFurniture],
              "hidden"
            );
          }
        }

        const objectPosition = combine(
          size,
          furnishingBuilding.building[POSITION],
          {
            x: random(0, 1) * 4 - 2,
            y: 0,
          }
        );

        if (
          !emptyEarthBuildings.includes(furnishingBuilding) &&
          !emptyFireBuildings.includes(furnishingBuilding)
        ) {
          continue;
        }

        // add chest
        const chestType =
          furnishingBuilding.door?.[LOCKABLE].type === "port"
            ? "ironChest"
            : "woodChest";
        const chestData = generateUnitData(chestType);
        const chestEntity = entities.createChest(world, {
          [ATTACKABLE]: {},
          [BELONGABLE]: { faction: chestData.faction },
          [DROPPABLE]: { decayed: false },
          [INVENTORY]: { items: [] },
          [FOG]: { visibility: "hidden", type: "terrain" },
          [LAYER]: {},
          [POSITION]: objectPosition,
          [REMAINABLE]: {},
          [RENDERABLE]: { generation: 0 },
          [SEQUENCABLE]: { states: {} },
          [SHOOTABLE]: { shots: 0 },
          [SPRITE]: chestData.sprite,
          [STATS]: { ...emptyUnitStats, ...chestData.stats },
          [TOOLTIP]: { dialogs: [], persistent: false, nextDialog: -1 },
        });
        populateInventory(
          world,
          chestEntity,
          chestData.items,
          chestData.equipments
        );
      }

      // console.log(
      //   stringifyMap(worldMap, { x: size / 2, y: size / 2 }, objectsMap)
      // );
      // console.log(stringifyMap(worldMap, { x: 0, y: 0 }, objectsMap));

      break;
    } catch (error) {
      console.error(
        `Failed island generation attempt ${attempt + 1} with error:`,
        error
      );

      // clear up all newly created entities
      world.getEntities([]).forEach((target) => {
        if (existingEntities.includes(target)) return;

        disposeEntity(world, target);
      });
    }
  }
};

export const stringifyMap = (
  cellMap: (CellType | "")[][],
  center: Position,
  objectsMap?: CellType[][][]
) => {
  const height = cellMap[0].length;
  const width = cellMap.length;

  let mapString = "";

  for (let y = 0; y < height; y++) {
    let row = "";
    for (let x = 0; x < width; x++) {
      const cell = getOverlappingCell(cellMap, x + center.x, y + center.y);
      const objects = objectsMap
        ? getOverlappingCell(objectsMap, x + center.x, y + center.y)
        : [];

      if (objects.includes("habitat")) row += "\u03b1";
      else if (objects.includes("palisade") || objects.includes("barrier"))
        row += "î";
      else if (cell === "water_shallow") row += "~";
      else if (cell === "water_deep") row += "≈";
      else if (cell === "snow" || objects.includes("snow")) row += "▒";
      else if (cell === "ice") row += "/";
      else if (cell === "grass") row += ",";
      else if (cell === "bush") row += "τ";
      else if (cell === "hedge") row += "ß";
      else if (cell === "tree") row += "#";
      else if (cell === "apple" || cell === "fruit") row += ".";
      else if (cell === "cactus" || objects.includes("cactus")) row += "¥";
      else if (cell === "mountain") row += "█";
      else if (cell === "ore") row += "◘";
      else if (cell === "iron") row += "+";
      else if (cell === "golem") row += "G";
      else if (cell === "stone") row += "∙";
      else if (objects.includes("rock")) row += "^";
      else if (objects.includes("palm")) row += "¶";
      else if (objects.includes("palm_fruit")) row += "«";
      else if (cell === "sand") row += "░";
      else if (cell === "beach") row += "▒";
      else if (cell === "fence") row += "±";
      else if (cell === "path") row += "▓";
      else if (cell === "jetty_vertical" || cell === "jetty_horizontal")
        row += "J";
      else if (cell === "box") row += "■";
      else if (cell.endsWith("pot")) row += "o";
      else if (cell.toLowerCase().endsWith("chest")) row += "π";
      else if (cell.includes("door")) row += "◙";
      else if (cell.endsWith("house_left")) row += "├";
      else if (cell.endsWith("basement_left")) row += "└";
      else if (cell.endsWith("house_right")) row += "┤";
      else if (cell.endsWith("basement_right")) row += "┘";
      else if (cell.endsWith("wall")) row += "┴";
      else if (cell.endsWith("wall_window")) row += "─";
      else if (cell.endsWith("house")) row += "┼";
      else if (cell.endsWith("house_window")) row += "┬";
      else if (cell.endsWith("roof")) row += "╬";
      else if (cell.endsWith("roof_left")) row += "╠";
      else if (cell.endsWith("roof_right")) row += "╣";
      else if (cell.endsWith("roof_left_up")) row += "╒";
      else if (cell.endsWith("roof_up")) row += "╦";
      else if (cell.endsWith("roof_up_right")) row += "╕";
      else if (cell.endsWith("roof_down_left")) row += "╞";
      else if (cell.endsWith("roof_down")) row += "╪";
      else if (cell.endsWith("roof_right_down")) row += "╡";
      else if (cell === "air" || cell === ("gap" as CellType)) row += " ";
      else row += "?";
    }
    mapString += row + "\n";
  }

  return mapString;
};
