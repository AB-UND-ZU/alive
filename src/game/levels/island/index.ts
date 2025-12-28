import { entities, World } from "../../../engine";
import { Position, POSITION } from "../../../engine/components/position";
import { SPRITE } from "../../../engine/components/sprite";
import { RENDERABLE } from "../../../engine/components/renderable";
import { COLLIDABLE } from "../../../engine/components/collidable";
import {
  createText,
  getOrientedSprite,
  none,
  parseSprite,
  path,
  questPointer,
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
import { orientationPoints } from "../../../engine/components/orientable";
import { spawnArea, townSize } from "./areas";
import {
  add,
  angledOffset,
  choice,
  copy,
  getDistance,
  lerp,
  normalize,
  random,
  repeat,
  sigmoid,
  signedDistance,
} from "../../math/std";
import { INVENTORY } from "../../../engine/components/inventory";
import { emptyUnitStats, STATS } from "../../../engine/components/stats";
import { VIEWABLE } from "../../../engine/components/viewable";
import { TOOLTIP } from "../../../engine/components/tooltip";
import { DROPPABLE } from "../../../engine/components/droppable";
import {
  bedCenter,
  bedEndLeft,
  bedEndRight,
  bedHeadLeft,
  bedHeadRight,
  chairLeft,
  chairRight,
  table,
} from "../../assets/sprites/structures";
import {
  SEQUENCABLE,
  WeatherSequence,
} from "../../../engine/components/sequencable";
import {
  createUnitName,
  getUnitSprite,
  npcSequence,
  questSequence,
} from "../../assets/utils";
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
  smoothenBeaches,
  CellType,
  flipArea,
} from "../../../bindings/creation";
import { findPath, invertOrientation } from "../../math/path";
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
  const oceanDepth = -70;
  const archipelagoDepth = -30;
  const sandDepth = 0;
  const airDepth = 6;
  const stoneChance = 0.08;
  const oreChance = 0.05;
  const terrainDepth = 10;
  const grassDepth = 50;
  const bushDepth = 65;
  const cactusDepth = 70;
  const rockDepth = 20;
  const palmDepth = 8;
  const palmChance = 0.3;
  const desertDepth = 60;
  const hedgeDepth = 55;
  const treeDepth = 60;
  const mountainDepth = 125;
  const freezeTemperature = 0;
  const heatTemperature = 40;
  const pathHeight = 50;
  const spawnWalkLength = 12;

  // randomize parameters
  const islandAngle = random(0, 360);
  const townFlipped = choice(true, false);
  const townOffset = townFlipped ? 90 : -90;
  const spawnAngle = islandAngle - random(30, 60) - (townFlipped ? 90 : 0);
  const townAngle = spawnAngle + townOffset;

  // precalculated values
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
  const signPosition = add(spawnPoint, {
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
  const townCorner = add(townPoint, {
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
      const passageMatrix = rectangleKernel(
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
        mainlandRatio
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
        spawnCircle * spawnWalk * townSquare * passageMatrix;

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
    const flattened = flattenedMatrix[x][y];

    if (elevation < sandDepth) cell = "water_deep";
    else if (elevation < airDepth) cell = "sand";
    else if (elevation > mountainDepth) cell = "mountain";

    // process biomes
    if (biome === "ocean") {
      const underwater =
        terrainMatrix[x][y] * (1 - sigmoid(elevation, archipelagoDepth, 0.6));
      if (underwater > 50) cell = "mountain";
    } else if (biome === "desert") {
      if (cell === "air") cell = "sand";

      // spawn palms around water level but avoid in flattened areas
      if (
        elevation < palmDepth &&
        elevation > palmDepth - 4 &&
        Math.random() < palmChance &&
        flattened > 0.95
      )
        cell = "desert_palm";
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
  const elevationMap = smoothenBeaches(rawMap, biomeMap);

  // fourth pass: process terrain based on biomes and spawn mobs or items
  const terrainMap = mapMatrix(elevationMap, (x, y, cell) => {
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
      else if (elevation < 40 && spawn > 93) cell = "pot";
    } else if (biome === "jungle") {
      // spawn ore in inner part of jungle
      if (
        cell === "mountain" &&
        temperature < heatTemperature - 10 &&
        Math.random() < oreChance * 2
      )
        cell = "ore";
      // spawn stones around lakes but away from flattened areas
      else if (
        elevation > sandDepth &&
        elevation < airDepth &&
        Math.random() < stoneChance &&
        flattened > 0.95 &&
        getDistance({ x: 0, y: 0 }, { x, y }, size, mainlandRatio) <
          mainlandRadius * 0.8
      )
        cell = cell === "sand" ? "desert_stone" : "stone";
      else if (terrain > treeDepth) cell = "tree";
      else if (terrain > hedgeDepth)
        cell = spawn > 95 ? "fruit" : spawn > 80 ? "wood" : "hedge";
      else if (greens > bushDepth)
        cell = spawn > 98 ? "leaf" : spawn > 89 ? "berry" : "bush";
      else if (greens > grassDepth)
        cell = spawn > 98 ? "leaf" : spawn > 95 ? "flower" : "grass";
      else if (spawn < -95) objects.push(generateNpcKey(distribution));
    } else if (biome === "desert") {
      if (terrain > desertDepth)
        cell = Math.random() < oreChance ? "ore" : "mountain";
      else if (terrain > rockDepth && terrain < rockDepth + 5)
        cell = "desert_rock";
      else if (greens > cactusDepth && greens < cactusDepth + 2)
        cell = "cactus";
      else if (cell === "sand" && spawn < -97)
        objects.push(generateNpcKey(distribution));
      else if (cell === "sand" && spawn > 97) objects.push("tumbleweed");
      else if (cell === "desert_palm" && random(0, 9) === 0)
        cell = "desert_palm_fruit";
    } else if (biome === "glacier") {
    }

    // set path weight
    if (["air", "bush", "grass", "path", "desert", "hedge"].includes(cell)) {
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
  const spawnCorner = {
    x: spawnPoint.x - (spawnWidth - 1) / 2,
    y: spawnPoint.y - (spawnHeight - 1) / 2,
  };
  matrixFactory(spawnWidth, spawnHeight, (x, y) => {
    setPath(pathMatrix, x + spawnCorner.x, y + spawnCorner.y, 0);
  });

  // insert town
  const {
    matrix: townMatrix,
    houses: relativeHouses,
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

  const houses = relativeHouses.map((house) => ({
    ...house,
    position: add(house.position, townCorner),
    door: add(house.door, townCorner),
  }));
  const exits = relativeExits.map((exit) => add(exit, townCorner));
  const guards = relativeGuards.map((guard) => add(guard, townCorner));
  const inn = add(relativeInn, townCorner);

  // create shortest path from spawn to town
  setPath(pathMatrix, spawnExit.x, spawnExit.y, 0, false);
  iterateMatrix(worldMap, (x, y) => {
    const height = pathMatrix[x][y];
    setPath(pathMatrix, x, y, height);
  });

  // select quadrant pairs as closest distance might be contained by island
  const townPath = findPath(
    pathMatrix,
    spawnExit,
    exits[signedDistance(spawnExit.y, townPoint.y, size) > 0 ? 0 : 1],
    false,
    false,
    {
      x: Number(spawnPoint.x > size / 2) - Number(townPoint.x > size / 2),
      y: Number(spawnPoint.y > size / 2) - Number(townPoint.y > size / 2),
    }
  );
  townPath.forEach(({ x, y }) => {
    worldMap[x][y] = "path";
    objectsMap[x][y] = [];
    setPath(pathMatrix, x, y, 1);
  });

  // preprocess town
  const [traderHouse, smithHouse, druidHouse, ...emptyHouses] = houses;

  setMatrix(
    worldMap,
    smithHouse.position.x + choice(-1, 1),
    smithHouse.position.y + 3,
    "campfire"
  );
  setMatrix(worldMap, smithHouse.door.x, smithHouse.door.y, "iron_door");
  setMatrix(
    worldMap,
    smithHouse.position.x + choice(-1, 1),
    smithHouse.position.y + 2,
    "house_smith"
  );
  setMatrix(
    worldMap,
    traderHouse.position.x + choice(-1, 1),
    traderHouse.position.y + 2,
    "house_trader"
  );
  setMatrix(
    worldMap,
    druidHouse.position.x + choice(-1, 1),
    druidHouse.position.y + 2,
    "house_druid"
  );

  // set weather
  const mainlandStorm = entities.createAnchor(world, {
    [POSITION]: { x: 0, y: 0 },
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [STICKY]: {},
    [SPRITE]: none,
  });
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

  // initialize spawn and town
  initializeArea(
    world,
    spawnCorner,
    add(spawnCorner, { x: spawnWidth, y: spawnHeight })
  );
  initializeArea(world, townCorner, add(townCorner, townSize));

  // adjust hero
  const heroEntity = assertIdentifierAndComponents(world, "hero", [
    POSITION,
    VIEWABLE,
  ]);
  questSequence(world, heroEntity, "spawnQuest", {});

  // assign buildings
  const [traderBuilding, smithBuilding, druidBuilding, ...emptyBuildings] = [
    traderHouse,
    smithHouse,
    druidHouse,
    ...emptyHouses,
  ].map((building) => assignBuilding(world, building.position));

  // add quest sign after exiting
  const spawnSign = createSign(world, copy(signPosition), [
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

  const townEnd = add(townCorner, { x: townSize.x - 1, y: townSize.y - 1 });
  const earthTown = entities.createProcessor(world, {
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [POSITION]: { ...townPoint },
  });
  setIdentifier(world, earthTown, "earth_town");
  npcSequence(world, earthTown, "earthTownNpc", {
    topLeft: townCorner,
    bottomRight: townEnd,
    spawn: add(inn, { x: 0, y: 2 }),
  });

  // place guards at exits
  guards.forEach((guard) => {
    const guardEntity = createNpc(world, "earthGuard", { ...guard });
    guardEntity[BEHAVIOUR].patterns.unshift({
      name: "watch",
      memory: {
        origin: guard,
        topLeft: townCorner,
        bottomRight: townEnd,
      },
    });
  });

  // chief next to fountain
  const chiefEntity = createNpc(
    world,
    "earthChief",
    add(inn, { x: choice(-1, 1), y: 2 })
  );
  createPopup(world, chiefEntity, {
    targets: [{ amount: 1, unit: "oakBoss" }],
    objectives: [
      {
        identifier: "earthDruid",
        title: [...createUnitName("earthDruid")],
        description: [
          [
            ...createText("Set "),
            getOrientedSprite(questPointer, "right"),
            ...createText("Focus", colors.grey),
            ...createText(" to the"),
          ],
          [...createUnitName("earthDruid"), ...createText(" to start")],
          createText("crafting."),
        ],
        available: true,
      },
      {
        identifier: "earthTrader",
        title: [...createUnitName("earthTrader")],
        description: [
          [
            ...createText("Set "),
            getOrientedSprite(questPointer, "right"),
            ...createText("Focus", colors.grey),
            ...createText(" to the"),
          ],
          [...createUnitName("earthTrader"), ...createText(" to buy")],
          createText("and sell items."),
        ],
        available: true,
      },
      {
        identifier: "earthSmith",
        title: [...createUnitName("earthSmith")],
        description: [
          [
            ...createText("Set "),
            getOrientedSprite(questPointer, "right"),
            ...createText("Focus", colors.grey),
            ...createText(" to the"),
          ],
          [...createUnitName("earthSmith"), ...createText(" to forge")],
          createText("stronger gear."),
        ],
        available: true,
      },
      {
        identifier: "oakBoss",
        title: [...createUnitName("oakBoss")],
        description: [
          [
            ...createText("Set "),
            getOrientedSprite(questPointer, "right"),
            ...createText("Focus", colors.grey),
            ...createText(" to the"),
          ],
          [...createUnitName("oakBoss"), ...createText(" to challenge")],
          createText("the boss."),
        ],
        available: true,
      },
    ],
    deals: [],
    choices: [
      { equipment: "shield", material: "wood", amount: 1 },
      { equipment: "primary", primary: "wave", material: "wood", amount: 1 },
    ],
    lines: [
      [
        createText("Welcome to the"),
        [...createText("earth", colors.lime), ...createText(" town! I am")],
        [
          ...createText("the "),
          ...createText("Chief", colors.green),
          ...createText("."),
        ],
        [],
        createText("Can you help us"),
        [
          ...createText("defeat the "),
          ...createText("Oak", colors.maroon),
          ...createText("?"),
        ],
        [],
        [
          ...repeat(none, 3),
          parseSprite("\x02▄▐\x00░"),
          parseSprite("\x02█\x00░"),
          parseSprite("\x02▄▌\x00░"),
        ],
        [
          ...repeat(none, 2),
          parseSprite("\x02▄▐\x00░"),
          parseSprite("\x02█\x00░\x00\u0108\u0106\x09∙"),
          parseSprite("\x02█\x00░"),
          parseSprite("\x02█\x00░\x00\u0108\u0106\x09∙"),
          parseSprite("\x02▄▌\x00░"),
        ],
        [
          ...repeat(none, 2),
          parseSprite("\x02▀\x00░"),
          parseSprite("\x02█\x00░"),
          parseSprite("\x02█\x00░"),
          parseSprite("\x02█\x00░"),
          parseSprite("\x02▀\x00░"),
          ...createText(" <- evil", colors.red),
        ],
        [...repeat(none, 4), parseSprite("\x01╣")],
        [...repeat(none, 4), parseSprite("\x01╩\x00─")],
        [],
        [
          ...createText("Talk to "),
          ...createUnitName("earthTrader"),
          ...createText(","),
        ],
        [
          ...createUnitName("earthDruid"),
          ...createText(" and "),
          ...createUnitName("earthSmith"),
        ],
        createText("to get stronger"),
        createText("before fighting."),
      ],
    ],
    tabs: ["quest"],
  });
  npcSequence(world, chiefEntity, "earthChiefNpc", {});

  // smith's house
  const smithOffset = choice(-1, 1);
  createNpc(
    world,
    "earthSmith",
    add(smithBuilding.building[POSITION], { x: smithOffset, y: 0 })
  );

  const anvilEntity = createCell(
    world,
    add(smithBuilding.building[POSITION], {
      x: smithOffset * -2,
      y: 0,
    }),
    "anvil_passive",
    "hidden"
  ).cell;
  setIdentifier(world, anvilEntity, "earth_anvil");

  // druid's house
  const druidOffset = choice(-1, 1);
  createNpc(
    world,
    "earthDruid",
    add(druidBuilding.building[POSITION], { x: druidOffset, y: 0 })
  );

  const kettleEntity = createCell(
    world,
    add(druidBuilding.building[POSITION], {
      x: druidOffset * -2,
      y: 0,
    }),
    "kettle_passive",
    "hidden"
  ).cell;
  setIdentifier(world, kettleEntity, "earth_kettle");

  // furnish houses
  const furnishingBuildings = [traderBuilding, ...emptyBuildings];
  for (const furnishingBuilding of furnishingBuildings) {
    // add furniture
    const furnitureOrientation = (["left", "right"] as const)[random(0, 1)];
    const invertFurniture = invertOrientation(
      furnitureOrientation
    ) as typeof furnitureOrientation;
    const chairSprites = { left: chairLeft, right: chairRight };
    const bedHeadSprites = { left: bedHeadLeft, right: bedHeadRight };
    const bedEndSprites = { left: bedEndLeft, right: bedEndRight };
    if (random(0, 1) === 0) {
      // create bed
      entities.createFurniture(world, {
        [FOG]: { visibility: "hidden", type: "terrain" },
        [LAYER]: {},
        [POSITION]: add(
          furnishingBuilding.building[POSITION],
          orientationPoints[invertFurniture]
        ),
        [SPRITE]: bedHeadSprites[invertFurniture],
        [RENDERABLE]: { generation: 0 },
        [COLLIDABLE]: {},
      });
      entities.createFurniture(world, {
        [FOG]: { visibility: "hidden", type: "terrain" },
        [LAYER]: {},
        [POSITION]: furnishingBuilding.building[POSITION],
        [SPRITE]: bedCenter,
        [RENDERABLE]: { generation: 0 },
        [COLLIDABLE]: {},
      });
      entities.createFurniture(world, {
        [FOG]: { visibility: "hidden", type: "terrain" },
        [LAYER]: {},
        [POSITION]: add(
          furnishingBuilding.building[POSITION],
          orientationPoints[furnitureOrientation]
        ),
        [SPRITE]: bedEndSprites[furnitureOrientation],
        [RENDERABLE]: { generation: 0 },
        [COLLIDABLE]: {},
      });
    } else {
      // create table and chairs
      entities.createFurniture(world, {
        [FOG]: { visibility: "hidden", type: "terrain" },
        [LAYER]: {},
        [POSITION]: copy(furnishingBuilding.building[POSITION]),
        [SPRITE]: table,
        [RENDERABLE]: { generation: 0 },
        [COLLIDABLE]: {},
      });
      entities.createFloor(world, {
        [FOG]: { visibility: "hidden", type: "terrain" },
        [LAYER]: {},
        [POSITION]: add(
          furnishingBuilding.building[POSITION],
          orientationPoints[furnitureOrientation]
        ),
        [SPRITE]: chairSprites[furnitureOrientation],
        [RENDERABLE]: { generation: 0 },
      });
      if (random(0, 1) === 0) {
        entities.createFloor(world, {
          [FOG]: { visibility: "hidden", type: "terrain" },
          [LAYER]: {},
          [POSITION]: add(
            furnishingBuilding.building[POSITION],
            orientationPoints[invertFurniture]
          ),
          [SPRITE]: chairSprites[invertFurniture],
          [RENDERABLE]: { generation: 0 },
        });
      }
    }

    const objectPosition = add(furnishingBuilding.building[POSITION], {
      x: random(0, 1) * 4 - 2,
      y: 0,
    });

    if (furnishingBuilding === traderBuilding) {
      // trader's house
      createNpc(world, "earthTrader", objectPosition);
    }

    // add chest
    const chestData = generateUnitData("commonChest");
    const chestEntity = entities.createChest(world, {
      [ATTACKABLE]: { shots: 0 },
      [BELONGABLE]: { faction: chestData.faction },
      [DROPPABLE]: { decayed: false },
      [INVENTORY]: { items: [] },
      [FOG]: { visibility: "hidden", type: "terrain" },
      [LAYER]: {},
      [POSITION]: objectPosition,
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
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

  // console.log(stringifyMap(worldMap, objectsMap, { x: size / 2, y: size / 2 }));
  // console.log(stringifyMap(worldMap, objectsMap, { x: 0, y: 0 }));
};

export const stringifyMap = (
  cellMap: CellType[][],
  objectsMap: CellType[][][],
  center: Position
) => {
  const height = cellMap[0].length;
  const width = cellMap.length;

  let mapString = "";

  for (let y = 0; y < height; y++) {
    let row = "";
    for (let x = 0; x < width; x++) {
      const cell = getOverlappingCell(cellMap, x + center.x, y + center.y);
      const objects = getOverlappingCell(
        objectsMap,
        x + center.x,
        y + center.y
      );

      if (cell === "water_shallow") row += "~";
      else if (cell === "water_deep") row += "≈";
      else if (cell === "snow" || objects.includes("snow")) row += ".";
      else if (cell === "ice") row += "/";
      else if (cell === "grass") row += ",";
      else if (cell === "bush") row += "τ";
      else if (cell === "hedge") row += "ß";
      else if (cell === "tree") row += "#";
      else if (cell === "cactus" || objects.includes("cactus")) row += "¥";
      else if (cell === "mountain") row += "█";
      else if (cell === "ore") row += "◘";
      else if (cell === "stone" || cell === "desert_stone") row += "∙";
      else if (cell === "desert_rock" || objects.includes("rock")) row += "^";
      else if (cell === "palm" || cell === "desert_palm") row += "¶";
      else if (cell === "palm_fruit" || cell === "desert_palm_fruit")
        row += "«";
      else if (cell === "sand") row += "▒";
      else if (cell === "fence") row += "±";
      else if (cell === "path") row += "░";
      else if (cell === "pot") row += "o";
      else if (cell.includes("door")) row += "D";
      else row += " ";
    }
    mapString += row + "\n";
  }

  return mapString;
};
