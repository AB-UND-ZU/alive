import { entities, World } from "../../../engine";
import { POSITION } from "../../../engine/components/position";
import { SPRITE } from "../../../engine/components/sprite";
import { RENDERABLE } from "../../../engine/components/renderable";
import { COLLIDABLE } from "../../../engine/components/collidable";
import {
  createDialog,
  createText,
  getOrientedSprite,
  heartUp,
  iron,
  ironKey,
  manaUp,
  path,
  questPointer,
} from "../../assets/sprites";
import { simplexNoiseMatrix, valueNoiseMatrix } from "../../math/noise";
import { LEVEL, LevelName } from "../../../engine/components/level";
import {
  iterateMatrix,
  matrixFactory,
  setMatrix,
  setPath,
} from "../../math/matrix";
import { FOG } from "../../../engine/components/fog";
import { ATTACKABLE } from "../../../engine/components/attackable";
import { ITEM } from "../../../engine/components/item";
import { orientationPoints } from "../../../engine/components/orientable";
import { aspectRatio } from "../../../components/Dimensions/sizing";
import { spawnArea, nomadArea, nomadOffset } from "./areas";
import {
  add,
  choice,
  copy,
  normalize,
  random,
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
  fenceBurnt1,
  fenceBurnt2,
  kettle,
  table,
} from "../../assets/sprites/structures";
import { SEQUENCABLE } from "../../../engine/components/sequencable";
import { createItemText, npcSequence, questSequence } from "../../assets/utils";
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
} from "./../../../bindings/creation";
import { getItemPrice } from "../../balancing/trading";
import { findPath, invertOrientation } from "../../math/path";
import { registerEntity } from "../../../engine/systems/map";
import { LAYER } from "../../../engine/components/layer";
import { createPopup } from "../../../engine/systems/popup";
import { Deal } from "../../../engine/components/popup";
import {
  assertIdentifierAndComponents,
  offerQuest,
  setIdentifier,
} from "../../../engine/utils";
import { BURNABLE } from "../../../engine/components/burnable";
import { forestNpcDistribution } from "./units";
import { craftingRecipes } from "../../balancing/crafting";

export const forestSize = 160;
export const forestName: LevelName = "LEVEL_FOREST";

export const generateForest = (world: World) => {
  const size = world.metadata.gameEntity[LEVEL].size;

  const elevationMatrix = simplexNoiseMatrix(size, size, 0, -50, 100, 1);
  const terrainMatrix = simplexNoiseMatrix(size, size, 0, -40, 100, 1 / 2);
  const temperatureMatrix = simplexNoiseMatrix(size, size, 0, -80, 100, 4);
  const greenMatrix = valueNoiseMatrix(size, size, 1, -80, 100);
  const spawnMatrix = valueNoiseMatrix(size, size, 0, -100, 100);
  const pathMatrix = matrixFactory(size * 2, size * 2, () => 0);
  const pathHeight = 16;

  const spawnRows = spawnArea.split("\n");
  const spawnWidth = spawnRows[0].length;
  const spawnHeight = spawnRows.length;
  const spawnX = 0;
  const spawnY = 0;

  const townWidth = 38;
  const townHeight = 24;
  const {
    matrix: townMatrix,
    houses: relativeHouses,
    exits: relativeExits,
  } = generateTown(townWidth, townHeight);

  // distribute three main world areas in similar distances to each other and from spawn
  // town and nomad at 45% size radius and 90° angle between them
  // small boss at 30% size radius at 225° offset (opposite between town and nomad)
  // try docs/grid.html for other values
  const outerRadius = 0.45;
  const angleDirection = choice(-1, 1);
  const townNomadAngle = 90;

  const townAngle = random(0, 359);
  const townX = normalize(
    Math.round(Math.sin((townAngle / 360) * Math.PI * 2) * outerRadius * size),
    size
  );
  const townY = normalize(
    Math.round(
      Math.cos((townAngle / 360) * Math.PI * 2) * -1 * outerRadius * size
    ),
    size
  );
  const townCorner = {
    x: townX - townWidth / 2,
    y: townY - townHeight / 2,
  };
  const houses = relativeHouses.map((house) => ({
    ...house,
    position: add(house.position, townCorner),
  }));
  const exits = relativeExits.map((exit) => add(exit, townCorner));

  // select nomad location in specified degrees offset from town angle
  const angleOffset = townNomadAngle * angleDirection;
  const nomadAngle = townAngle + angleOffset;
  const nomadX = normalize(
    Math.round(Math.sin((nomadAngle / 360) * Math.PI * 2) * outerRadius * size),
    size
  );
  const nomadY = normalize(
    Math.round(
      Math.cos((nomadAngle / 360) * Math.PI * 2) * -1 * outerRadius * size
    ),
    size
  );
  const nomadRadius = 3;

  const worldMatrix = matrixFactory<string>(size, size, (x, y) => {
    // distance from zero
    const spawnDeltaX = Math.abs(signedDistance(spawnX, x, size));
    const spawnDeltaY = Math.abs(signedDistance(spawnY, y, size));
    const townDeltaX = Math.abs(signedDistance(townX, x, size));
    const townDeltaY = Math.abs(signedDistance(townY, y, size));
    const nomadDeltaX = Math.abs(signedDistance(nomadX, x, size));
    const nomadDeltaY = Math.abs(signedDistance(nomadY, y, size));
    const nomadDistance = Math.sqrt(
      (nomadDeltaX * aspectRatio) ** 2 + nomadDeltaY ** 2
    );

    // clear square spawn and town areas, and circular nomad area
    if (
      (spawnDeltaX < spawnWidth / 2 && spawnDeltaY < spawnHeight / 2) ||
      (townDeltaX < townWidth / 2 && townDeltaY < townHeight / 2) ||
      nomadDistance < nomadRadius
    )
      return "air";

    const spawnDistance = Math.sqrt(
      (spawnDeltaX * aspectRatio) ** 2 + spawnDeltaY ** 2
    );

    // create clean elevation around spawn
    const spawnProximity = 25000 / spawnDistance ** 4;
    const spawnElevation = Math.min(15, spawnProximity * 3);
    const spawnDip = 1 / (1 + spawnProximity / 2);

    // clear edges of town
    const clampedX = Math.max(0, Math.min(townDeltaX, townWidth / 4));
    const clampedY = Math.max(0, Math.min(townDeltaY, townHeight / 4));
    const townDx = townDeltaX - clampedX;
    const townDy = townDeltaY - clampedY;
    const townDistance = Math.sqrt((townDx * aspectRatio) ** 2 + townDy ** 2);
    const townDip = sigmoid(townDistance, 10, 0.5);
    const townElevation = 17 * (1 - townDip);

    // clear area for nomad
    const nomadDip = sigmoid(nomadDistance, nomadRadius * 2, 1 / 2);
    const nomadElevation = 17 * (1 - nomadDip);

    // set spawn and town areas
    const elevation =
      elevationMatrix[x][y] * spawnDip * townDip * nomadDip +
      spawnElevation +
      townElevation +
      nomadElevation;
    const terrain =
      terrainMatrix[x][y] * spawnDip * townDip * nomadDip +
      spawnElevation +
      townElevation +
      nomadElevation;
    const temperature = temperatureMatrix[x][y] * spawnDip * townDip * nomadDip;
    const green = greenMatrix[x][y] * spawnDip * townDip * nomadDip;
    const spawn =
      spawnMatrix[x][y] * spawnDip ** 0.25 * townDip ** 0.25 * nomadDip ** 0.25;

    let cell = "air";
    // beach palms
    if (temperature < 65 && elevation < 7 && elevation > 3 && spawn > 65)
      cell = "palm";
    // beach and islands (if not desert)
    else if (
      temperature < 65 &&
      elevation < 0 &&
      (elevation > -32 || temperature > 0)
    )
      cell = "water";
    else if (
      temperature < 65 &&
      elevation < 6 &&
      (elevation > -35 || temperature > 0)
    )
      cell = "beach";
    // island palms
    else if (elevation <= -35 && temperature < 0 && green > 30) cell = "palm";
    // forest
    else if (elevation > 25 && terrain > 30)
      cell =
        temperature < 0 && terrain < 75 && spawnProximity < 5
          ? terrain > 37
            ? "tree"
            : spawn > 93
            ? "fruit"
            : spawn > 80
            ? "wood"
            : "hedge"
          : spawn > 99
          ? "iron"
          : spawn > 86
          ? "ore"
          : "mountain";
    // desert, oasis and cactus
    else if (temperature > 65 && terrain > 75) cell = "spring";
    else if (temperature > 65 && terrain > 70) cell = "oasis";
    else if (
      temperature > 65 &&
      ((-11 < terrain && terrain < -10) || (20 < terrain && terrain < 21))
    )
      cell = spawn > 60 ? "stone" : "desert_rock";
    else if (temperature > 65)
      cell =
        21 < green && green < 23
          ? "cactus"
          : spawn > 97
          ? "tumbleweed"
          : "desert";
    // greens
    else if (green > 37 && elevation > 17) cell = "tree";
    else if (green > 30 && elevation > 14)
      cell = spawn > 93 ? "fruit" : spawn > 80 ? "wood" : "hedge";
    else if (green > 20 && elevation > 11)
      cell = spawn > 96 ? "leaf" : spawn > 87 ? "berry" : "bush";
    else if (green > 10 && elevation > 8)
      cell = spawn > 97 ? "leaf" : spawn > 88 ? "flower" : "grass";
    // spawn
    else if (spawn < -96) cell = generateNpcKey(forestNpcDistribution);

    // set weighted elevation for curved pathfinding
    if (["air", "bush", "grass", "path", "desert", "hedge"].includes(cell)) {
      pathMatrix[x][y] =
        (Math.abs(elevation - pathHeight) + 4) ** 2 / 16 +
        (townDeltaX - townWidth / 2 < 2 ? 20 : 0) +
        (townDeltaY - townHeight / 2 < 2 ? 20 : 0);
    }

    // track distribution of cell types
    world.metadata.gameEntity[LEVEL].cells[cell] = (
      world.metadata.gameEntity[LEVEL].cells[cell] || []
    ).concat([{ x, y }]);

    return cell;
  });

  // insert spawn
  insertArea(worldMatrix, spawnArea, 0, 0);

  // insert town
  iterateMatrix(townMatrix, (offsetX, offsetY, value) => {
    const x = normalize(townX + offsetX - townWidth / 2, size);
    const y = normalize(townY + offsetY - townHeight / 2, size);

    if (!value) return;

    worldMatrix[x][y] = value;
    setPath(pathMatrix, x, y, 0);
  });

  // insert nomad
  insertArea(worldMatrix, nomadArea, nomadX, nomadY);

  // create shortest path from spawn to town and nomad
  const signPosition = { x: normalize(choice(-1, 1), size), y: 7 };
  pathMatrix[signPosition.x][signPosition.y] = 0;
  iterateMatrix(worldMatrix, (x, y) => {
    const height = pathMatrix[x][y];
    setPath(pathMatrix, x, y, height);
  });

  const spawnPath = { x: 0, y: 7 };
  const townPath = findPath(
    pathMatrix,
    spawnPath,
    exits[townAngle >= 90 && townAngle < 270 ? 0 : 1]
  );
  townPath.forEach(({ x, y }) => {
    worldMatrix[x][y] = "path";
    setPath(pathMatrix, x, y, 1);
  });
  const nomadPath = findPath(
    pathMatrix,
    exits[townAngle >= 90 && townAngle < 270 ? 1 : 0],
    add(
      {
        x: nomadX,
        y: nomadY,
      },
      nomadOffset
    )
  );
  nomadPath.forEach(({ x, y }) => {
    worldMatrix[x][y] = "path";
    setPath(pathMatrix, x, y, 1);
  });

  // preprocess town
  const [
    chiefHouse,
    elderHouse,
    scoutHouse,
    smithHouse,
    traderHouse,
    druidHouse,
    mageHouse,
    ...emptyHouses
  ] = houses;

  setMatrix(
    worldMatrix,
    chiefHouse.position.x,
    chiefHouse.position.y + 2,
    "iron_door"
  );
  const elderOffset = choice(-1, 1);
  setMatrix(
    worldMatrix,
    elderHouse.position.x + elderOffset,
    elderHouse.position.y + 3,
    "fruit_one"
  );
  setMatrix(
    worldMatrix,
    elderHouse.position.x - elderOffset,
    elderHouse.position.y + 3,
    "rock"
  );
  setMatrix(
    worldMatrix,
    scoutHouse.position.x + choice(-1, 1),
    scoutHouse.position.y + 3,
    "campfire"
  );
  setMatrix(
    worldMatrix,
    smithHouse.position.x + choice(-1, 1),
    smithHouse.position.y + 2,
    "house_armor"
  );
  setMatrix(
    worldMatrix,
    traderHouse.position.x + choice(-1, 1),
    traderHouse.position.y + 2,
    "house_trader"
  );
  setMatrix(
    worldMatrix,
    druidHouse.position.x + choice(-1, 1),
    druidHouse.position.y + 2,
    "house_aid"
  );
  setMatrix(
    worldMatrix,
    mageHouse.position.x + choice(-1, 1),
    mageHouse.position.y + 2,
    "house_mage"
  );

  iterateMatrix(worldMatrix, (x, y, cell) => {
    createCell(world, worldMatrix, { x, y }, cell, "hidden");
  });

  // adjust hero
  const heroEntity = assertIdentifierAndComponents(world, "hero", [
    POSITION,
    VIEWABLE,
  ]);
  questSequence(world, heroEntity, "spawnQuest", {});

  // register all entities to allow post-processing
  const registerableEntites = world.getEntities([POSITION]);
  registerableEntites.forEach((registerableEntity) => {
    registerEntity(world, registerableEntity);
  });

  // assign buildings
  const nomadHouse = { position: { x: nomadX - 1, y: nomadY - 1 } };

  const [
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    nomadBuilding,
    chiefBuilding,
    elderBuilding,
    scoutBuilding,
    smithBuilding,
    traderBuilding,
    druidBuilding,
    mageBuilding,
    ...emptyBuildings
  ] = [
    nomadHouse,
    chiefHouse,
    elderHouse,
    scoutHouse,
    smithHouse,
    traderHouse,
    druidHouse,
    mageHouse,
    ...emptyHouses,
  ].map((building) => assignBuilding(world, building.position));

  // add quest sign after exiting
  const spawnSignData = generateUnitData("sign");
  const spawnSign = entities.createSign(world, {
    [ATTACKABLE]: { shots: 0 },
    [BELONGABLE]: { faction: spawnSignData.faction },
    [BURNABLE]: {
      burning: false,
      eternal: false,
      simmer: false,
      decayed: false,
      combusted: false,
      remains: [fenceBurnt1, fenceBurnt2][random(0, 1)],
    },
    [DROPPABLE]: { decayed: false, remains: choice(fenceBurnt1, fenceBurnt2) },
    [FOG]: { visibility: "hidden", type: "terrain" },
    [INVENTORY]: { items: [] },
    [LAYER]: {},
    [POSITION]: copy(signPosition),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: spawnSignData.sprite,
    [STATS]: {
      ...emptyUnitStats,
      ...spawnSignData.stats,
    },
    [TOOLTIP]: { dialogs: [], persistent: false, nextDialog: -1 },
  });
  populateInventory(world, spawnSign, spawnSignData.items);
  setIdentifier(world, spawnSign, "spawn_sign");
  createPopup(world, spawnSign, {
    lines: [
      [
        createText("Find the town by"),
        createText("following either"),
        [
          getOrientedSprite(questPointer, "right"),
          ...createText("Arrow", colors.grey),
          ...createText(" or "),
          path,
          ...createText("Path", colors.grey),
          ...createText("."),
        ],
      ],
    ],
    tabs: ["info"],
  });

  // postprocess nomad
  const nomadEntity = createNpc(
    world,
    "nomad",
    add(nomadBuilding.building[POSITION], { x: -1, y: 0 })
  );
  npcSequence(world, nomadEntity, "nomadNpc", {});

  const ironKeyEntity = entities.createItem(world, {
    [ITEM]: {
      carrier: -1,
      consume: "key",
      material: "iron",
      amount: 1,
      bound: false,
    },
    [SPRITE]: ironKey,
    [RENDERABLE]: { generation: 0 },
  });
  createPopup(world, nomadEntity, {
    deals: [
      {
        item: ironKeyEntity[ITEM],
        stock: 1,
        prices: getItemPrice(ironKeyEntity[ITEM]),
      },
    ],
    tabs: ["buy"],
  });
  const nomadChestData = generateUnitData("uncommonChest");
  const nomadChest = entities.createChest(world, {
    [ATTACKABLE]: { shots: 0 },
    [BELONGABLE]: { faction: nomadChestData.faction },
    [DROPPABLE]: { decayed: false },
    [INVENTORY]: { items: [] },
    [FOG]: { visibility: "hidden", type: "terrain" },
    [LAYER]: {},
    [POSITION]: add(nomadBuilding.building[POSITION], { x: 2, y: 0 }),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: nomadChestData.sprite,
    [STATS]: { ...emptyUnitStats, ...nomadChestData.stats },
    [TOOLTIP]: { dialogs: [], persistent: false, nextDialog: -1 },
  });
  populateInventory(world, nomadChest, [
    { consume: "key", material: "iron", amount: 1 },
  ]);
  const nomadKeyEntity = world.assertById(nomadChest[INVENTORY].items[0]);
  setIdentifier(world, nomadKeyEntity, "nomad_key");

  const nomadSignData = generateUnitData("sign");
  const nomadSign = entities.createSign(world, {
    [ATTACKABLE]: { shots: 0 },
    [BELONGABLE]: { faction: nomadSignData.faction },
    [BURNABLE]: {
      burning: false,
      eternal: false,
      simmer: false,
      decayed: false,
      combusted: false,
      remains: [fenceBurnt1, fenceBurnt2][random(0, 1)],
    },
    [DROPPABLE]: { decayed: false, remains: choice(fenceBurnt1, fenceBurnt2) },
    [FOG]: { visibility: "hidden", type: "terrain" },
    [INVENTORY]: { items: [] },
    [LAYER]: {},
    [POSITION]: add(nomadBuilding.building[POSITION], { x: -1, y: 3 }),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: nomadSignData.sprite,
    [STATS]: { ...emptyUnitStats, ...nomadSignData.stats },
    [TOOLTIP]: {
      dialogs: [],
      persistent: false,
      nextDialog: 0,
    },
  });
  populateInventory(world, nomadSign, nomadSignData.items);
  setIdentifier(world, nomadSign, "nomad_sign");
  offerQuest(
    world,
    nomadSign,
    "nomadQuest",
    [
      [
        ...createText("Collect "),
        ...createItemText({ stackable: "ore", amount: 10 }),
        ...createText(" to"),
      ],
      [...createText("trade for "), iron, ...createText("Iron,")],
      createText("then exchange to"),
      [...createText("a "), ironKey, ...createText("Key")],
    ],
    {}
  );

  // postprocess town

  // 1. chief's house in center
  const chiefEntity = createNpc(
    world,
    "chief",
    chiefBuilding.building[POSITION]
  );
  const maxHpEntity = entities.createItem(world, {
    [ITEM]: {
      carrier: -1,
      stat: "maxHp",
      amount: 1,
      bound: false,
    },
    [SPRITE]: heartUp,
    [RENDERABLE]: { generation: 0 },
  });
  const maxMpEntity = entities.createItem(world, {
    [ITEM]: {
      carrier: -1,
      stat: "maxMp",
      amount: 1,
      bound: false,
    },
    [SPRITE]: manaUp,
    [RENDERABLE]: { generation: 0 },
  });
  createPopup(world, chiefEntity, {
    deals: [
      {
        item: maxHpEntity[ITEM],
        stock: Infinity,
        prices: getItemPrice(maxHpEntity[ITEM]),
      },
      {
        item: maxMpEntity[ITEM],
        stock: Infinity,
        prices: getItemPrice(maxMpEntity[ITEM]),
      },
    ],
    tabs: ["buy"],
  });
  const chiefOffset = choice(-2, 2);
  const chiefSignData = generateUnitData("sign");
  const chiefSign = entities.createSign(world, {
    [ATTACKABLE]: { shots: 0 },
    [BURNABLE]: {
      burning: false,
      eternal: false,
      simmer: false,
      decayed: false,
      combusted: false,
      remains: [fenceBurnt1, fenceBurnt2][random(0, 1)],
    },
    [BELONGABLE]: { faction: chiefSignData.faction },
    [DROPPABLE]: { decayed: false, remains: choice(fenceBurnt1, fenceBurnt2) },
    [FOG]: { visibility: "hidden", type: "terrain" },
    [INVENTORY]: { items: [] },
    [LAYER]: {},
    [POSITION]: add(chiefBuilding.building[POSITION], { x: chiefOffset, y: 3 }),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: chiefSignData.sprite,
    [STATS]: { ...emptyUnitStats, ...chiefSignData.stats },
    [TOOLTIP]: {
      dialogs: [],
      persistent: false,
      nextDialog: 0,
    },
  });
  populateInventory(world, chiefSign, chiefSignData.items);
  setIdentifier(world, chiefSign, "town_sign");
  offerQuest(
    world,
    chiefSign,
    "waypointQuest",
    [
      createText("Enter the Chief's"),
      createText("house by using"),
      [...createText("a "), ironKey, ...createText("Key. Find the")],
      createText("Nomad's house by"),
      createText("following the"),
      [path, ...createText("Path")],
    ],
    {
      identifier: "nomad_sign",
      distance: 0,
    }
  );
  setIdentifier(world, chiefBuilding.door!, "chief_door");

  // 2. elder's house
  createNpc(world, "elder", elderBuilding.building[POSITION]);

  // 3. scout's house
  const scoutEntity = createNpc(
    world,
    "scout",
    scoutBuilding.building[POSITION]
  );
  scoutEntity[TOOLTIP].dialogs = [
    createDialog("Hi there!"),
    createDialog("I'm the Scout"),
    createDialog("Sell your drops here"),
    createDialog("So you can buy items"),
    createDialog("Or not, up to you"),
  ];
  createPopup(world, scoutEntity, { tabs: ["sell"] });

  // 4. smith's house
  const smithOffset = choice(-1, 1);
  const smithEntity = createNpc(
    world,
    "smith",
    add(smithBuilding.building[POSITION], { x: smithOffset, y: 0 })
  );
  smithEntity[TOOLTIP].dialogs = [
    createDialog("Hey mate"),
    createDialog("My name is Smith"),
    createDialog("I sell resources"),
    createDialog("There's an anvil"),
    createDialog("For crafting items"),
    createDialog("To become stronger"),
    createDialog("Because why not"),
  ];
  createPopup(world, smithEntity, {
    deals: [
      // TODO: remove
      {
        item: {
          stackable: "resource",
          material: "iron",
          amount: 1,
        },
        stock: Infinity,
        prices: [{ stackable: "apple", amount: 0 }],
      },
      {
        item: {
          equipment: "sword",
          material: "wood",
          amount: 1,
        },
        stock: 1,
        prices: [{ stackable: "apple", amount: 0 }],
      },

      {
        item: {
          equipment: "torch",
          material: "wood",
          amount: 1,
        },
        stock: 1,
        prices: [{ stackable: "resource", material: "wood", amount: 1 }],
      },
      {
        item: {
          equipment: "shield",
          material: "wood",
          amount: 1,
        },
        stock: 1,
        prices: [{ stackable: "resource", material: "wood", amount: 3 }],
      },
    ],
    tabs: ["buy", "sell"],
  });

  const smithAnvil = entities.createForging(world, {
    [COLLIDABLE]: {},
    [FOG]: { visibility: "hidden", type: "unit" },
    [LAYER]: {},
    [POSITION]: add(smithBuilding.building[POSITION], {
      x: smithOffset * -2,
      y: 0,
    }),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: anvil,
    [TOOLTIP]: {
      dialogs: [],
      persistent: false,
      nextDialog: -1,
    },
  });
  createPopup(world, smithAnvil, { tabs: ["forge"] });

  // 5. trader's house
  const traderEntity = createNpc(
    world,
    "trader",
    traderBuilding.building[POSITION]
  );
  traderEntity[TOOLTIP].dialogs = [
    createDialog("Hi, I'm the Trader"),
    createDialog("Nice to meet you"),
    createDialog("Well, I trade items"),
    createDialog("For coins only"),
    createDialog("Wanna have a look?"),
  ];

  // 6. druid's house
  const druidOffset = choice(-1, 1);
  const druidEntity = createNpc(
    world,
    "druid",
    add(druidBuilding.building[POSITION], { x: druidOffset, y: 0 })
  );
  druidEntity[TOOLTIP].dialogs = [
    createDialog("Hello there"),
    createDialog("I am the Druid"),
    createDialog("Want some potions?"),
    createDialog("Or maybe elements?"),
    createDialog("To enchant items"),
    createDialog("In the kettle here"),
    createDialog("Incredibly powerful"),
  ];
  const healthItem: Deal["item"] = {
    consume: "potion",
    material: "wood",
    element: "fire",
    amount: 1,
  };
  const manaItem: Deal["item"] = {
    consume: "potion",
    material: "wood",
    element: "water",
    amount: 1,
  };
  const fruitItem: Deal["item"] = {
    stackable: "fruit",
    amount: 1,
  };
  const herbItem: Deal["item"] = {
    stackable: "herb",
    amount: 1,
  };
  const seedItem: Deal["item"] = {
    stackable: "seed",
    amount: 1,
  };
  createPopup(world, druidEntity, {
    deals: [healthItem, manaItem, fruitItem, herbItem, seedItem].map(
      (item) => ({
        item,
        stock: Infinity,
        prices: getItemPrice(item),
      })
    ),
    tabs: ["buy"],
  });

  const druidKettle = entities.createCrafting(world, {
    [BURNABLE]: {
      burning: true,
      eternal: true,
      simmer: true,
      decayed: false,
      combusted: false,
    },
    [COLLIDABLE]: {},
    [FOG]: { visibility: "hidden", type: "unit" },
    [LAYER]: {},
    [POSITION]: add(druidBuilding.building[POSITION], {
      x: druidOffset * -2,
      y: 0,
    }),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: kettle,
    [TOOLTIP]: {
      dialogs: [],
      persistent: false,
      nextDialog: -1,
    },
  });
  createPopup(world, druidKettle, {
    recipes: craftingRecipes,
    tabs: ["craft"],
  });

  // 7. mage's house
  const mageEntity = createNpc(world, "mage", mageBuilding.building[POSITION]);
  mageEntity[TOOLTIP].dialogs = [
    createDialog("Greetings traveler"),
    createDialog("I am the Mage"),
    createDialog("Get your spells here"),
    createDialog("And items too"),
    createDialog("They're fun actually"),
  ];
  const waveItem: Deal["item"] = {
    amount: 1,
    equipment: "primary",
    material: "wood",
    primary: "wave",
  };
  const beamItem: Deal["item"] = {
    amount: 1,
    equipment: "primary",
    material: "wood",
    primary: "beam",
  };
  const bowItem: Deal["item"] = {
    equipment: "secondary",
    secondary: "bow",
    material: "wood",
    amount: 1,
  };
  const arrowItem: Deal["item"] = {
    stackable: "arrow",
    amount: 10,
  };
  const slashItem: Deal["item"] = {
    equipment: "secondary",
    secondary: "slash",
    material: "wood",
    amount: 1,
  };
  const chargeItem: Deal["item"] = {
    stackable: "charge",
    amount: 10,
  };
  createPopup(world, mageEntity, {
    deals: [waveItem, beamItem, bowItem, arrowItem, slashItem, chargeItem].map(
      (item) => ({
        item,
        stock: Infinity,
        prices: getItemPrice(item),
      })
    ),
    tabs: ["buy"],
  });

  // empty houses
  for (const emptyBuilding of emptyBuildings) {
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
          emptyBuilding.building[POSITION],
          orientationPoints[invertFurniture]
        ),
        [SPRITE]: bedHeadSprites[invertFurniture],
        [RENDERABLE]: { generation: 0 },
        [COLLIDABLE]: {},
      });
      entities.createFurniture(world, {
        [FOG]: { visibility: "hidden", type: "terrain" },
        [LAYER]: {},
        [POSITION]: emptyBuilding.building[POSITION],
        [SPRITE]: bedCenter,
        [RENDERABLE]: { generation: 0 },
        [COLLIDABLE]: {},
      });
      entities.createFurniture(world, {
        [FOG]: { visibility: "hidden", type: "terrain" },
        [LAYER]: {},
        [POSITION]: add(
          emptyBuilding.building[POSITION],
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
        [POSITION]: copy(emptyBuilding.building[POSITION]),
        [SPRITE]: table,
        [RENDERABLE]: { generation: 0 },
        [COLLIDABLE]: {},
      });
      entities.createFloor(world, {
        [FOG]: { visibility: "hidden", type: "terrain" },
        [LAYER]: {},
        [POSITION]: add(
          emptyBuilding.building[POSITION],
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
            emptyBuilding.building[POSITION],
            orientationPoints[invertFurniture]
          ),
          [SPRITE]: chairSprites[invertFurniture],
          [RENDERABLE]: { generation: 0 },
        });
      }
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
      [POSITION]: add(emptyBuilding.building[POSITION], {
        x: random(0, 1) * 4 - 2,
        y: 0,
      }),
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

  // queue all added entities to added listener
  world.cleanup();
};
