import { entities, World } from "../../../engine";
import { Position, POSITION } from "../../../engine/components/position";
import { SPRITE } from "../../../engine/components/sprite";
import { RENDERABLE } from "../../../engine/components/renderable";
import { COLLIDABLE } from "../../../engine/components/collidable";
import {
  craft,
  createDialog,
  createText,
  forge,
  getOrientedSprite,
  path,
  questPointer,
  swirl,
  times,
  underline,
} from "../../assets/sprites";
import {
  scalarMatrix,
  simplexNoiseMatrix,
  valueNoiseMatrix,
} from "../../math/noise";
import { BiomeName, LEVEL, LevelName } from "../../../engine/components/level";
import {
  addMatrices,
  circularMatrix,
  getOverlappingCell,
  gradientMatrix,
  iterateMatrix,
  mapMatrix,
  Matrix,
  matrixFactory,
  maxMatrices,
  multiplyMatrices,
  rectangleMatrix,
  setMatrix,
  setPath,
} from "../../math/matrix";
import { FOG } from "../../../engine/components/fog";
import { ATTACKABLE } from "../../../engine/components/attackable";
import { orientationPoints } from "../../../engine/components/orientable";
import { spawnArea } from "./areas";
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
  anvil,
  bedCenter,
  bedEndLeft,
  bedEndRight,
  bedHeadLeft,
  bedHeadRight,
  chairLeft,
  chairRight,
  kettle,
  table,
} from "../../assets/sprites/structures";
import { SEQUENCABLE } from "../../../engine/components/sequencable";
import {
  createItemName,
  createUnitName,
  frameWidth,
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
import { registerEntity } from "../../../engine/systems/map";
import { LAYER } from "../../../engine/components/layer";
import { createPopup } from "../../../engine/systems/popup";
import {
  assertIdentifierAndComponents,
  setIdentifier,
} from "../../../engine/utils";
import { islandNpcDistribution } from "./units";
import { snowFill } from "../../../engine/systems/freeze";
import { isTouch } from "../../../components/Dimensions";
import { getItemBuyPrice, purchasableItems } from "../../balancing/trading";
import { BEHAVIOUR } from "../../../engine/components/behaviour";

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
  const stoneDepth = 8;
  const stoneChance = 0.15;
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
  const townWidth = 26;
  const townHeight = 16;
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
    x: townWidth / -2,
    y: townHeight / -2,
  });

  // create world matrizes
  const oceanMatrix = matrixFactory(size, size, () => oceanDepth);
  const mainlandMatrix = circularMatrix(
    size,
    size,
    { x: 0, y: 0 },
    mainlandRadius,
    0,
    125,
    0.09,
    mainlandRatio
  );
  const glacierMatrix = circularMatrix(
    size,
    size,
    { x: size / 2, y: size / 2 },
    glacierRadius,
    0,
    225,
    0.1,
    glacierRatio
  );

  const hillsMatrix = simplexNoiseMatrix(size, size, 0, 0.3, 1.5, 0.25);
  const mountainMatrix = multiplyMatrices(
    hillsMatrix,
    rectangleMatrix(
      size,
      size,
      { x: 0, y: 0 },
      8,
      mainlandRadius * 2,
      islandAngle,
      0,
      200,
      0.8,
      mainlandRatio
    )
  );
  const passageMatrix = rectangleMatrix(
    size,
    size,
    { x: 0, y: 0 },
    3,
    30,
    islandAngle + 90,
    1,
    0,
    10,
    mainlandRatio
  );
  const spawnCircle = circularMatrix(size, size, spawnPoint, 8, 1, 0, 15, 1);
  const spawnWalk = rectangleMatrix(
    size,
    size,
    spawnPath,
    4,
    spawnWalkLength,
    spawnWalkAngle,
    1,
    0,
    5
  );
  const townSquare = rectangleMatrix(
    size,
    size,
    townPoint,
    townWidth + 7,
    townHeight + 7,
    0,
    1,
    0,
    1.5,
    1
  );
  const flattenedMatrix = multiplyMatrices(
    spawnCircle,
    spawnWalk,
    townSquare,
    passageMatrix
  );

  const beachesMatrix = simplexNoiseMatrix(size, size, 0, 0, 1, 0.7);
  const islandsMatrix = addMatrices(
    multiplyMatrices(
      addMatrices(
        oceanMatrix,
        mountainMatrix,
        multiplyMatrices(
          maxMatrices(mainlandMatrix, glacierMatrix),
          addMatrices(
            matrixFactory(size, size, () => 0.5),
            beachesMatrix
          )
        ),
        scalarMatrix(
          addMatrices(
            matrixFactory(size, size, () => -0.5),
            beachesMatrix
          ),
          30
        )
      ),
      flattenedMatrix
    ),
    scalarMatrix(flattenedMatrix, -(airDepth + 1)),
    matrixFactory(size, size, () => airDepth + 1)
  );
  const archipelagoMatrix = simplexNoiseMatrix(size, size, 0, -0.5, 0.9, 0.5);

  const elevationMatrix = matrixFactory(size, size, (x, y) => {
    const elevation = islandsMatrix[x][y];
    if (elevation > archipelagoDepth) return elevation;

    return (
      elevation +
      lerp(
        0,
        archipelagoMatrix[x][y] * 90 - elevation,
        (archipelagoDepth - elevation) / (archipelagoDepth - oceanDepth)
      )
    );
  });

  const freezingMatrix = scalarMatrix(
    maxMatrices(
      multiplyMatrices(
        circularMatrix(
          size,
          size,
          { x: size / 2, y: size / 2 },
          glacierRadius * 1.4,
          0,
          1,
          0.3,
          glacierRatio
        ),
        addMatrices(
          islandsMatrix,
          matrixFactory(size, size, () => 30)
        )
      ),
      matrixFactory(size, size, () => 0)
    ),
    -10
  );

  const temperatureMatrix = addMatrices(
    freezingMatrix,
    maxMatrices(
      addMatrices(
        multiplyMatrices(
          addMatrices(
            islandsMatrix,
            matrixFactory(size, size, () => heatTemperature)
          ),
          gradientMatrix(
            size,
            size,
            { x: 0, y: 0 },
            mainlandRadius * 1.14,
            islandAngle - 90,
            0,
            1,
            0.5,
            mainlandRatio
          )
        ),
        matrixFactory(size, size, () => heatTemperature / 2 - 10)
      ),
      matrixFactory(size, size, () => heatTemperature / 2)
    )
  );

  const terrainMatrix = simplexNoiseMatrix(size, size, 0, 0, 100, 0.175);
  const greensMatrix = valueNoiseMatrix(size, size, 1, 0, 100);
  const spawnMatrix = valueNoiseMatrix(size, size, 0, -100, 100);

  const pathMatrix = matrixFactory(size * 2, size * 2, () => 0);

  // first pass: set biomes, cell types and objects
  const objectsMap: Matrix<CellType[]> = matrixFactory(size, size, () => []);
  const biomeMap: Matrix<BiomeName> = matrixFactory(size, size, () => "jungle");
  world.metadata.gameEntity[LEVEL].biomes = biomeMap;

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

  // second pass: place shallow water and ensure is surrounded by sand
  const elevationMap = smoothenBeaches(rawMap, biomeMap);

  // third pass: process terrain based on biomes and spawn mobs or items
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
        elevation > airDepth &&
        elevation < stoneDepth &&
        Math.random() < stoneChance &&
        flattened > 0.95 &&
        getDistance({ x: 0, y: 0 }, { x, y }, size, mainlandRatio) <
          mainlandRadius * 0.8
      )
        cell = "stone";
      else if (terrain > treeDepth) cell = "tree";
      else if (terrain > hedgeDepth)
        cell = spawn > 94 ? "fruit" : spawn > 80 ? "wood" : "hedge";
      else if (greens > bushDepth)
        cell = spawn > 97 ? "leaf" : spawn > 88 ? "berry" : "bush";
      else if (greens > grassDepth)
        cell = spawn > 98 ? "leaf" : spawn > 93 ? "flower" : "grass";
      else if (spawn < -97) objects.push(generateNpcKey(distribution));
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

  const worldMap = terrainMap;

  // insert spawn
  insertArea(
    worldMap,
    flipArea(spawnArea, spawnInverted, choice(true, false)),
    spawnPoint.x,
    spawnPoint.y,
    true
  );
  const spawnLines = spawnArea.split("\n");
  const spawnWidth = spawnLines[0].length;
  const spawnHeight = spawnLines.length;
  matrixFactory(spawnWidth, spawnHeight, (x, y) => {
    setPath(
      pathMatrix,
      x + spawnPoint.x - (spawnWidth - 1) / 2,
      y + spawnPoint.y - (spawnHeight - 1) / 2,
      0
    );
  });

  // insert town
  const {
    matrix: townMatrix,
    houses: relativeHouses,
    exits: relativeExits,
    inn: relativeInn,
    guards: relativeGuards,
  } = generateTown(townWidth, townHeight);
  iterateMatrix(townMatrix, (offsetX, offsetY, value) => {
    const x = normalize(townPoint.x + offsetX - townWidth / 2, size);
    const y = normalize(townPoint.y + offsetY - townHeight / 2, size);

    worldMap[x][y] = value ? (value as CellType) : "air";
    setPath(pathMatrix, x, y, 0);
  });

  const houses = relativeHouses.map((house) => ({
    ...house,
    position: add(house.position, townCorner),
  }));
  const exits = relativeExits.map((exit) => add(exit, townCorner));
  const guards = relativeGuards.map((guest) => add(guest, townCorner));
  const inn = add(relativeInn, townCorner);

  // create shortest path from spawn to town and nomad
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

  // initialize cells and objects
  iterateMatrix(worldMap, (x, y, cell) => {
    createCell(world, worldMap, { x, y }, cell, "hidden");
    const objects = objectsMap[x][y];
    objects.forEach((objectCell) => {
      createCell(world, worldMap, { x, y }, objectCell, "hidden");
    });
  });

  // register all entities to allow post-processing
  const registerableEntites = world.getEntities([POSITION]);
  registerableEntites.forEach((registerableEntity) => {
    registerEntity(world, registerableEntity);
  });

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
        ...createText("Arrow", colors.grey),
        ...createText(" or "),
        path,
        ...createText("Path", colors.grey),
        ...createText("."),
      ],
    ],
  ]);
  setIdentifier(world, spawnSign, "spawn_sign");

  // postprocess town

  // place guards at exits
  guards.forEach((guard) => {
    const guardEntity = createNpc(world, "earthGuard", { ...guard });
    guardEntity[BEHAVIOUR].patterns.unshift({
      name: "watch",
      memory: {
        origin: guard,
        topLeft: townCorner,
        bottomRight: add(townCorner, { x: townWidth, y: townHeight }),
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
    lines: [
      [
        createText("Welcome to the"),
        createText("town, have a look"),
        createText("around."),
        [],
        createText("If you are ready,"),
        [
          ...createText("kill 3"),
          times,
          ...createUnitName("prism"),
          ...createText("."),
        ],
      ],
    ],
    tabs: ["talk"],
  });

  // smith's house
  const smithOffset = choice(-1, 1);
  const smithEntity = createNpc(
    world,
    "smith",
    add(smithBuilding.building[POSITION], { x: smithOffset, y: 0 })
  );
  smithEntity[TOOLTIP].dialogs = [
    createDialog("Hey mate"),
    createDialog("I am the Smith"),
    createDialog("Ask me how to forge"),
  ];
  createPopup(world, smithEntity, {
    lines: [
      [
        [forge, ...createText("Forging", colors.silver)],
        repeat(swirl, frameWidth - 2),
        [],
        createText("You can forge the"),
        createText("gear you hold."),
        [],
        [
          ...createText("View "),
          ...createText("╡", colors.silver),
          ...createText("GEAR", colors.lime),
          ...createText("╞", colors.silver),
          ...createText(" by"),
        ],
        isTouch
          ? [
              ...createText("tapping on "),
              ...createText("BAG", colors.black, colors.silver),
              ...createText("."),
            ]
          : [
              ...createText("pressing "),
              ...createText("[TAB]", colors.grey),
              ...createText("."),
            ],
        [],
        [...createText("Use the "), anvil, ...createText("Anvil", colors.grey)],
        createText("and choose gear."),
        [],
        createText("Try to add any"),
        createText("items until you"),
        createText("find a match."),
        [],
        [
          ...underline(createText("TIP", colors.silver)),
          ...createText(": "),
          ...createItemName({ stackable: "resource", material: "iron" }),
          ...createText(" can be"),
        ],
        createText("added to wooden"),
        createText("gear."),
      ],
    ],
    tabs: ["talk"],
  });

  createCell(
    world,
    worldMap,
    add(smithBuilding.building[POSITION], {
      x: smithOffset * -2,
      y: 0,
    }),
    "anvil",
    "hidden"
  );

  // druid's house
  const druidOffset = choice(-1, 1);
  const druidEntity = createNpc(
    world,
    "druid",
    add(druidBuilding.building[POSITION], { x: druidOffset, y: 0 })
  );
  druidEntity[TOOLTIP].dialogs = [
    createDialog("Hello there"),
    createDialog("My name is Druid"),
    createDialog("I explain crafting"),
  ];
  createPopup(world, druidEntity, {
    lines: [
      [
        [craft, ...createText("Crafting", colors.silver)],
        repeat(swirl, frameWidth - 2),
        [],
        createText("Gather some items"),
        [
          ...createText("like "),
          ...createItemName({ stackable: "leaf" }),
          ...createText(" and"),
        ],
        [...createItemName({ stackable: "apple" }), ...createText(".")],
        [],
        [
          ...createText("Use the "),
          kettle,
          ...createText("Kettle", colors.grey),
        ],
        createText("and pick the item"),
        createText("you want to make."),
        [],
        [
          ...underline(createText("TIP", colors.silver)),
          ...createText(": Some items"),
        ],
        createText("have few recipes."),
      ],
    ],
    tabs: ["talk"],
  });
  createCell(
    world,
    worldMap,
    add(druidBuilding.building[POSITION], {
      x: druidOffset * -2,
      y: 0,
    }),
    "kettle",
    "hidden"
  );

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
      const traderEntity = createNpc(world, "trader", objectPosition);
      traderEntity[TOOLTIP].dialogs = [
        createDialog("Hi, I'm the Trader"),
        createDialog("Nice to meet you"),
        createDialog("Well, I trade items"),
        createDialog("Wanna have a look?"),
      ];
      createPopup(world, traderEntity, {
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

  // queue all added entities to added listener
  world.cleanup();
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
      else if (cell === "stone") row += "∙";
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
