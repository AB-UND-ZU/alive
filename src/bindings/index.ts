import { entities, World, systems } from "../engine";
import { POSITION } from "../engine/components/position";
import { SPRITE } from "../engine/components/sprite";
import { LIGHT } from "../engine/components/light";
import { RENDERABLE } from "../engine/components/renderable";
import { MOVABLE } from "../engine/components/movable";
import { COLLIDABLE } from "../engine/components/collidable";
import {
  createDialog,
  heartUp,
  ironKey,
  manaUp,
  none,
} from "../game/assets/sprites";
import { simplexNoiseMatrix, valueNoiseMatrix } from "../game/math/noise";
import { LEVEL } from "../engine/components/level";
import {
  iterateMatrix,
  matrixFactory,
  setMatrix,
  setPath,
} from "../game/math/matrix";
import { FOG } from "../engine/components/fog";
import { NPC } from "../engine/components/npc";
import { SWIMMABLE } from "../engine/components/swimmable";
import { BEHAVIOUR } from "../engine/components/behaviour";
import { ATTACKABLE } from "../engine/components/attackable";
import { MELEE } from "../engine/components/melee";
import { Item, ITEM, Stackable } from "../engine/components/item";
import { ORIENTABLE, orientationPoints } from "../engine/components/orientable";
import { aspectRatio } from "../components/Dimensions/sizing";
import {
  guidePosition,
  keyPosition,
  menuArea,
  nomadArea,
  nomadOffset,
} from "../game/levels/areas";
import {
  add,
  choice,
  copy,
  normalize,
  random,
  sigmoid,
  signedDistance,
} from "../game/math/std";
import { EQUIPPABLE } from "../engine/components/equippable";
import { INVENTORY } from "../engine/components/inventory";
import { emptyStats, STATS } from "../engine/components/stats";
import { TRACKABLE } from "../engine/components/trackable";
import { FOCUSABLE } from "../engine/components/focusable";
import { VIEWABLE } from "../engine/components/viewable";
import { TOOLTIP } from "../engine/components/tooltip";
import { DROPPABLE } from "../engine/components/droppable";
import { ACTIONABLE } from "../engine/components/actionable";
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
  sign,
  table,
} from "../game/assets/sprites/structures";
import { COLLECTABLE } from "../engine/components/collectable";
import { FocusSequence, SEQUENCABLE } from "../engine/components/sequencable";
import { createSequence } from "../engine/systems/sequence";
import { npcSequence, questSequence } from "../game/assets/utils";
import { SPAWNABLE } from "../engine/components/spawnable";
import { generateNpcData, generateUnitData } from "../game/balancing/units";
import { BELONGABLE } from "../engine/components/belongable";
import generateTown from "../engine/wfc/town";
import { AFFECTABLE } from "../engine/components/affectable";
import {
  assignBuilding,
  insertArea,
  createCell,
  populateInventory,
} from "./creation";
import {
  getItemPrice,
  itemPurchases,
  itemSales,
} from "../game/balancing/trading";
import { getGearStat } from "../game/balancing/equipment";
import { findPath, invertOrientation } from "../game/math/path";
import { disposeEntity, getCell, registerEntity } from "../engine/systems/map";
import { LAYER } from "../engine/components/layer";
import { sellItems } from "../engine/systems/popup";
import { Deal } from "../engine/components/popup";
import {
  assertIdentifierAndComponents,
  offerQuest,
  setIdentifier,
} from "../engine/utils";
import { createHero } from "../engine/systems/fate";
import { spawnLight } from "../engine/systems/consume";
import { createItemAsDrop } from "../engine/systems/drop";
import { getItemSprite } from "../components/Entity/utils";

export const generateWorld = async (world: World) => {
  const size = world.metadata.gameEntity[LEVEL].size;

  const elevationMatrix = simplexNoiseMatrix(size, size, 0, -50, 100, 1);
  const terrainMatrix = simplexNoiseMatrix(size, size, 0, -40, 100, 1 / 2);
  const temperatureMatrix = simplexNoiseMatrix(size, size, 0, -80, 100, 4);
  const greenMatrix = valueNoiseMatrix(size, size, 1, -80, 100);
  const spawnMatrix = valueNoiseMatrix(size, size, 0, -100, 100);
  const pathMatrix = matrixFactory(size * 2, size * 2, () => 0);
  const pathHeight = 16;

  const menuRows = menuArea.split("\n");
  const menuWidth = menuRows[0].length;
  const menuHeight = menuRows.length;
  const menuX = 0;
  const menuY = 0;

  const townWidth = 38;
  const townHeight = 24;
  const {
    matrix: townMatrix,
    houses: relativeHouses,
    exits: relativeExits,
  } = await generateTown(townWidth, townHeight);

  // choose town position in 50% size distance from spawn at a random angle
  const townAngle = random(0, 359);
  const townX = normalize(
    Math.round((Math.sin((townAngle / 360) * Math.PI * 2) / 2) * size),
    size
  );
  const townY = normalize(
    Math.round(((Math.cos((townAngle / 360) * Math.PI * 2) * -1) / 2) * size),
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

  // select nomad location in a 60 degrees offset from town angle
  const angleOffset = 60 * choice(-1, 1);
  const nomadAngle = townAngle + angleOffset;
  const nomadX = normalize(
    Math.round((Math.sin((nomadAngle / 360) * Math.PI * 2) * size) / 2),
    size
  );
  const nomadY = normalize(
    Math.round((Math.cos((nomadAngle / 360) * Math.PI * 2) * -1 * size) / 2),
    size
  );
  const nomadRadius = 3;

  const worldMatrix = matrixFactory<string>(size, size, (x, y) => {
    // distance from zero
    const menuDeltaX = Math.abs(signedDistance(menuX, x, size));
    const menuDeltaY = Math.abs(signedDistance(menuY, y, size));
    const townDeltaX = Math.abs(signedDistance(townX, x, size));
    const townDeltaY = Math.abs(signedDistance(townY, y, size));
    const nomadDeltaX = Math.abs(signedDistance(nomadX, x, size));
    const nomadDeltaY = Math.abs(signedDistance(nomadY, y, size));
    const nomadDistance = Math.sqrt(
      (nomadDeltaX * aspectRatio) ** 2 + nomadDeltaY ** 2
    );

    // clear square menu and town areas, and circular nomad area
    if (
      (menuDeltaX < menuWidth / 2 && menuDeltaY < menuHeight / 2) ||
      (townDeltaX < townWidth / 2 && townDeltaY < townHeight / 2) ||
      nomadDistance < nomadRadius
    )
      return "air";

    // clear triangular exit and create path
    if (y > 4 && y < 13 && y > 3 + menuDeltaX) {
      pathMatrix[x][y] = 35 - menuDeltaX - menuDeltaY * 2;
      return x === 0 && y < 11 ? "path" : "air";
    }

    const menuDistance = Math.sqrt(
      (menuDeltaX * aspectRatio) ** 2 + menuDeltaY ** 2
    );

    // create clean elevation around menu
    const menu = 100000 / menuDistance ** 4;
    const menuElevation = Math.min(35, menu * 3);
    const menuDip = 1 / (1 + menu / 2);

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

    // set menu and town areas
    const elevation =
      elevationMatrix[x][y] * menuDip * townDip * nomadDip +
      menuElevation +
      townElevation +
      nomadElevation;
    const terrain =
      terrainMatrix[x][y] * menuDip * townDip * nomadDip +
      menuElevation +
      townElevation +
      nomadElevation;
    const temperature = temperatureMatrix[x][y] * menuDip * townDip * nomadDip;
    const green = greenMatrix[x][y] * menuDip * townDip * nomadDip;
    const spawn =
      spawnMatrix[x][y] * menuDip ** 0.25 * townDip ** 0.25 * nomadDip ** 0.25;

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
        temperature < 0 && terrain < 75 && menu < 5
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
    else if (spawn < -96) cell = "mob";

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

  // insert menu
  insertArea(worldMatrix, menuArea, 0, 0);

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
  const signPosition = { x: normalize(choice(-1, 1), size), y: 10 };
  pathMatrix[signPosition.x][signPosition.y] = 0;
  iterateMatrix(worldMatrix, (x, y) => {
    const height = pathMatrix[x][y];
    setPath(pathMatrix, x, y, height);
  });

  const spawnPath = { x: 0, y: 10 };
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
    spawnPath,
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
    const deltaX = size / 2 - Math.abs(x - size / 2);
    const deltaY = size / 2 - Math.abs(y - size / 2);
    const visibility =
      deltaX < menuRows[0].length / 2 &&
      deltaY < menuRows.length / 2 &&
      (y < menuRows.length / 2 - 3 || y > menuRows.length)
        ? "visible"
        : "hidden";

    createCell(world, worldMatrix, { x, y }, cell, visibility);
  });

  // spawn hero last to allow movement of boxes and mobs take precendence
  const spawnEntity = assertIdentifierAndComponents(world, "spawn", [POSITION]);
  const heroEntity = createHero(world, {
    [POSITION]: copy(spawnEntity[POSITION]),
    [BELONGABLE]: { faction: "settler" },
    [SPAWNABLE]: {
      classKey: "scout",
      position: copy(spawnEntity[POSITION]),
      viewable: { active: false, priority: 10 },
      light: { ...spawnLight },
    },
  });
  questSequence(world, heroEntity, "spawnQuest", {});

  // register all entities to allow post-processing
  const registerableEntites = world.getEntities([POSITION]);
  registerableEntites.forEach((registerableEntity) => {
    registerEntity(world, registerableEntity);
  });

  // assign buildings
  const guideDoor = assertIdentifierAndComponents(world, "guide_door", [
    POSITION,
  ]);
  const guideHouse = { position: add(guideDoor[POSITION], { x: 1, y: -1 }) };
  const nomadHouse = { position: { x: nomadX - 1, y: nomadY - 1 } };

  const [
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    guideBuilding,
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
    guideHouse,
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

  // postprocess spawn

  const guideUnit = generateNpcData("guide");
  const guideEntity = entities.createVillager(world, {
    [ACTIONABLE]: { primaryTriggered: false, secondaryTriggered: false },
    [AFFECTABLE]: { dot: 0, burn: 0, freeze: 0 },
    [ATTACKABLE]: { shots: 0 },
    [BEHAVIOUR]: { patterns: guideUnit.patterns },
    [BELONGABLE]: { faction: guideUnit.faction },
    [COLLECTABLE]: {},
    [DROPPABLE]: { decayed: false },
    [EQUIPPABLE]: {},
    [FOG]: { visibility: "hidden", type: "unit" },
    [INVENTORY]: { items: [], size: 5 },
    [LAYER]: {},
    [MELEE]: { bumpGeneration: 0 },
    [MOVABLE]: {
      orientations: [],
      reference: world.getEntityId(world.metadata.gameEntity),
      spring: {
        duration: 200,
      },
      lastInteraction: 0,
      flying: false,
    },
    [NPC]: { type: guideUnit.type },
    [ORIENTABLE]: {},
    [POSITION]: copy(guidePosition),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: guideUnit.sprite,
    [STATS]: { ...emptyStats, ...guideUnit.stats },
    [SWIMMABLE]: { swimming: false },
    [TOOLTIP]: {
      dialogs: [],
      persistent: true,
      nextDialog: -1,
    },
  });
  populateInventory(world, guideEntity, guideUnit.items, guideUnit.equipments);
  setIdentifier(world, guideEntity, "guide");

  npcSequence(world, guideEntity, "guideNpc", {});
  offerQuest(world, guideEntity, "introQuest", {});

  // identify compass for later use in quests
  const compassEntity = world.assertById(
    guideEntity[INVENTORY].items.find(
      (item) =>
        world.assertByIdAndComponents(item, [ITEM])[ITEM].equipment ===
        "compass"
    )!
  );
  setIdentifier(world, compassEntity, "compass");

  // create chest with key
  const spawnKeyEntity = entities.createItem(world, {
    [ITEM]: {
      carrier: -1,
      consume: "key",
      material: "iron",
      amount: 1,
      bound: false,
    },
    [RENDERABLE]: { generation: 0 },
    [SPRITE]: ironKey,
  });
  setIdentifier(world, spawnKeyEntity, "spawn_key");
  const guideChestData = generateUnitData("commonChest");
  const guideChestEntity = entities.createChest(world, {
    [ATTACKABLE]: { shots: 0 },
    [BELONGABLE]: { faction: guideChestData.faction },
    [COLLIDABLE]: {},
    [DROPPABLE]: { decayed: false },
    [INVENTORY]: { items: [world.getEntityId(spawnKeyEntity)], size: 20 },
    [FOG]: { visibility: "hidden", type: "terrain" },
    [LAYER]: {},
    [POSITION]: keyPosition,
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: guideChestData.sprite,
    [STATS]: { ...emptyStats, ...guideChestData.stats },
    [TOOLTIP]: { dialogs: [], persistent: false, nextDialog: -1 },
  });
  spawnKeyEntity[ITEM].carrier = world.getEntityId(guideChestEntity);

  // set initial focus on hero
  const highlighEntity = entities.createHighlight(world, {
    [FOCUSABLE]: {},
    [MOVABLE]: {
      orientations: [],
      reference: world.getEntityId(world.metadata.gameEntity),
      spring: {
        duration: 200,
      },
      lastInteraction: 0,
      flying: false,
    },
    [ORIENTABLE]: {},
    [POSITION]: copy(guidePosition),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: none,
    [TRACKABLE]: {},
  });
  createSequence<"focus", FocusSequence>(
    world,
    highlighEntity,
    "focus",
    "focusCircle",
    {}
  );
  setIdentifier(world, highlighEntity, "focus");

  // create viewpoint for menu area
  const viewpointEntity = entities.createWorld(world, {
    [POSITION]: { x: 0, y: 0 },
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [VIEWABLE]: { active: true, fraction: { x: 0, y: -0.5 }, priority: 60 },
  });
  npcSequence(world, viewpointEntity, "worldNpc", {
    townPosition: { x: townX, y: townY },
    townWidth,
    townHeight,
  });
  setIdentifier(world, viewpointEntity, "viewpoint");

  // prevent revealing fog with large menu light range
  for (let offset = 0; offset < 3; offset += 1) {
    const mountainEntity = entities.createMountain(world, {
      [FOG]: { visibility: "hidden", type: "terrain" },
      [POSITION]: { x: -1 + offset, y: 6 },
      [SPRITE]: none,
      [LIGHT]: { brightness: 0, darkness: 1, visibility: 0 },
      [RENDERABLE]: { generation: 0 },
      [COLLIDABLE]: {},
    });
    setIdentifier(world, mountainEntity, `mountain-${offset}`);
  }

  // add quest sign after exiting
  const spawnSign = entities.createSign(world, {
    [FOG]: { visibility: "hidden", type: "terrain" },
    [COLLIDABLE]: {},
    [POSITION]: copy(signPosition),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: sign,
    [TOOLTIP]: {
      dialogs: [],
      persistent: false,
      nextDialog: -1,
    },
  });
  npcSequence(world, spawnSign, "signNpc", {});
  setIdentifier(world, spawnSign, "spawn_sign");
  offerQuest(world, spawnSign, "waypointQuest", {
    identifier: "town_sign",
    distance: 0,
  });

  // postprocess nomad
  const nomadUnit = generateNpcData("nomad");
  const nomadEntity = entities.createVillager(world, {
    [ACTIONABLE]: { primaryTriggered: false, secondaryTriggered: false },
    [AFFECTABLE]: { dot: 0, burn: 0, freeze: 0 },
    [ATTACKABLE]: { shots: 0 },
    [BEHAVIOUR]: { patterns: nomadUnit.patterns },
    [BELONGABLE]: { faction: nomadUnit.faction },
    [COLLECTABLE]: {},
    [DROPPABLE]: { decayed: false },
    [EQUIPPABLE]: {},
    [FOG]: { visibility: "hidden", type: "unit" },
    [INVENTORY]: { items: [], size: 5 },
    [LAYER]: {},
    [MELEE]: { bumpGeneration: 0 },
    [MOVABLE]: {
      orientations: [],
      reference: world.getEntityId(world.metadata.gameEntity),
      spring: {
        duration: 200,
      },
      lastInteraction: 0,
      flying: false,
    },
    [NPC]: { type: nomadUnit.type },
    [ORIENTABLE]: {},
    [POSITION]: add(nomadBuilding.building[POSITION], { x: -1, y: 0 }),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: nomadUnit.sprite,
    [STATS]: { ...emptyStats, ...nomadUnit.stats },
    [SWIMMABLE]: { swimming: false },
    [TOOLTIP]: {
      dialogs: [],
      persistent: false,
      nextDialog: -1,
    },
  });
  populateInventory(world, nomadEntity, nomadUnit.items, nomadUnit.equipments);
  setIdentifier(world, nomadEntity, "nomad");
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
  sellItems(
    world,
    nomadEntity,
    [
      {
        item: ironKeyEntity[ITEM],
        stock: 1,
        price: getItemPrice(ironKeyEntity[ITEM]),
      },
    ],
    "buy"
  );
  const nomadChestData = generateUnitData("uncommonChest");
  const nomadChest = entities.createChest(world, {
    [ATTACKABLE]: { shots: 0 },
    [BELONGABLE]: { faction: nomadChestData.faction },
    [COLLIDABLE]: {},
    [DROPPABLE]: { decayed: false },
    [INVENTORY]: { items: [], size: 20 },
    [FOG]: { visibility: "hidden", type: "terrain" },
    [LAYER]: {},
    [POSITION]: add(nomadBuilding.building[POSITION], { x: 2, y: 0 }),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: nomadChestData.sprite,
    [STATS]: { ...emptyStats, ...nomadChestData.stats },
    [TOOLTIP]: { dialogs: [], persistent: false, nextDialog: -1 },
  });
  populateInventory(world, nomadChest, [
    { consume: "key", material: "iron", amount: 1, bound: false },
  ]);
  const nomadKeyEntity = world.assertById(nomadChest[INVENTORY].items[0]);
  setIdentifier(world, nomadKeyEntity, "nomad_key");

  const nomadSign = entities.createSign(world, {
    [COLLIDABLE]: {},
    [FOG]: { visibility: "hidden", type: "terrain" },
    [POSITION]: add(nomadBuilding.building[POSITION], { x: -1, y: 3 }),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: sign,
    [TOOLTIP]: {
      dialogs: [
        createDialog("Nomad's house"),
        createDialog("Collect 10 ore"),
        createDialog("Trade for iron"),
        createDialog("Exchange to key"),
      ],
      persistent: false,
      nextDialog: 0,
    },
  });
  setIdentifier(world, nomadSign, "nomad_sign");
  offerQuest(world, nomadSign, "nomadQuest", {});

  // postprocess town

  // 1. chief's house in center
  const chiefUnit = generateNpcData("chief");
  const chiefEntity = entities.createVillager(world, {
    [ACTIONABLE]: { primaryTriggered: false, secondaryTriggered: false },
    [AFFECTABLE]: { dot: 0, burn: 0, freeze: 0 },
    [ATTACKABLE]: { shots: 0 },
    [BEHAVIOUR]: { patterns: chiefUnit.patterns },
    [BELONGABLE]: { faction: chiefUnit.faction },
    [COLLECTABLE]: {},
    [DROPPABLE]: { decayed: false },
    [EQUIPPABLE]: {},
    [FOG]: { visibility: "hidden", type: "unit" },
    [INVENTORY]: { items: [], size: 5 },
    [LAYER]: {},
    [MELEE]: { bumpGeneration: 0 },
    [MOVABLE]: {
      orientations: [],
      reference: world.getEntityId(world.metadata.gameEntity),
      spring: {
        duration: 200,
      },
      lastInteraction: 0,
      flying: false,
    },
    [NPC]: { type: chiefUnit.type },
    [ORIENTABLE]: {},
    [POSITION]: copy(chiefBuilding.building[POSITION]),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: chiefUnit.sprite,
    [STATS]: { ...emptyStats, ...chiefUnit.stats },
    [SWIMMABLE]: { swimming: false },
    [TOOLTIP]: {
      dialogs: [],
      persistent: false,
      nextDialog: -1,
    },
  });
  populateInventory(world, chiefEntity, chiefUnit.items, chiefUnit.equipments);
  setIdentifier(world, chiefEntity, "chief");
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
  sellItems(
    world,
    chiefEntity,
    [
      {
        item: maxHpEntity[ITEM],
        stock: Infinity,
        price: getItemPrice(maxHpEntity[ITEM]),
      },
      {
        item: maxMpEntity[ITEM],
        stock: Infinity,
        price: getItemPrice(maxMpEntity[ITEM]),
      },
    ],
    "buy"
  );
  const chiefOffset = choice(-2, 2);
  const chiefSign = entities.createSign(world, {
    [COLLIDABLE]: {},
    [FOG]: { visibility: "hidden", type: "terrain" },
    [POSITION]: add(chiefBuilding.building[POSITION], { x: chiefOffset, y: 3 }),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: sign,
    [TOOLTIP]: {
      dialogs: [
        createDialog("Chief's house"),
        createDialog("Find the key"),
        createDialog("Follow the path"),
        createDialog("To Nomad's house"),
      ],
      persistent: false,
      nextDialog: 0,
    },
  });
  setIdentifier(world, chiefSign, "town_sign");
  offerQuest(world, chiefSign, "waypointQuest", {
    identifier: "nomad_sign",
    distance: 0,
  });
  setIdentifier(world, chiefBuilding.door!, "chief_door");

  // 2. elder's house
  const elderUnit = generateNpcData("elder");
  const elderEntity = entities.createVillager(world, {
    [ACTIONABLE]: { primaryTriggered: false, secondaryTriggered: false },
    [AFFECTABLE]: { dot: 0, burn: 0, freeze: 0 },
    [ATTACKABLE]: { shots: 0 },
    [BEHAVIOUR]: { patterns: elderUnit.patterns },
    [BELONGABLE]: { faction: elderUnit.faction },
    [COLLECTABLE]: {},
    [DROPPABLE]: { decayed: false },
    [EQUIPPABLE]: {},
    [FOG]: { visibility: "hidden", type: "unit" },
    [INVENTORY]: { items: [], size: 5 },
    [LAYER]: {},
    [MELEE]: { bumpGeneration: 0 },
    [MOVABLE]: {
      orientations: [],
      reference: world.getEntityId(world.metadata.gameEntity),
      spring: {
        duration: 200,
      },
      lastInteraction: 0,
      flying: false,
    },
    [NPC]: { type: elderUnit.type },
    [ORIENTABLE]: {},
    [POSITION]: copy(elderBuilding.building[POSITION]),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: elderUnit.sprite,
    [STATS]: { ...emptyStats, ...elderUnit.stats },
    [SWIMMABLE]: { swimming: false },
    [TOOLTIP]: {
      dialogs: [],
      persistent: false,
      nextDialog: -1,
    },
  });
  populateInventory(world, elderEntity, elderUnit.items, elderUnit.equipments);
  setIdentifier(world, elderEntity, "elder");

  // 3. scout's house
  const scoutUnit = generateNpcData("scout");
  const scoutEntity = entities.createVillager(world, {
    [ACTIONABLE]: { primaryTriggered: false, secondaryTriggered: false },
    [AFFECTABLE]: { dot: 0, burn: 0, freeze: 0 },
    [ATTACKABLE]: { shots: 0 },
    [BEHAVIOUR]: { patterns: scoutUnit.patterns },
    [BELONGABLE]: { faction: scoutUnit.faction },
    [COLLECTABLE]: {},
    [DROPPABLE]: { decayed: false },
    [EQUIPPABLE]: {},
    [FOG]: { visibility: "hidden", type: "unit" },
    [INVENTORY]: { items: [], size: 5 },
    [LAYER]: {},
    [MELEE]: { bumpGeneration: 0 },
    [MOVABLE]: {
      orientations: [],
      reference: world.getEntityId(world.metadata.gameEntity),
      spring: {
        duration: 200,
      },
      lastInteraction: 0,
      flying: false,
    },
    [NPC]: { type: scoutUnit.type },
    [ORIENTABLE]: {},
    [POSITION]: copy(scoutBuilding.building[POSITION]),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: scoutUnit.sprite,
    [STATS]: { ...emptyStats, ...scoutUnit.stats },
    [SWIMMABLE]: { swimming: false },
    [TOOLTIP]: {
      dialogs: [
        createDialog("Hi there!"),
        createDialog("I'm the Scout"),
        createDialog("Sell your drops here"),
        createDialog("So you can buy items"),
        createDialog("Or not, up to you"),
      ],
      persistent: false,
      nextDialog: -1,
    },
  });
  populateInventory(world, scoutEntity, scoutUnit.items, scoutUnit.equipments);
  setIdentifier(world, scoutEntity, "scout");
  sellItems(
    world,
    scoutEntity,
    Object.entries(itemSales).map(([stackable, coins]) => ({
      item: {
        stat: "coin",
        amount: coins,
      },
      stock: Infinity,
      price: [
        {
          stackable: stackable as Stackable,
          amount: 1,
        },
      ],
    })),
    "sell"
  );

  // 4. smith's house
  const smithOffset = choice(-1, 1);
  const smithUnit = generateNpcData("smith");
  const smithEntity = entities.createVillager(world, {
    [ACTIONABLE]: { primaryTriggered: false, secondaryTriggered: false },
    [AFFECTABLE]: { dot: 0, burn: 0, freeze: 0 },
    [ATTACKABLE]: { shots: 0 },
    [BEHAVIOUR]: { patterns: smithUnit.patterns },
    [BELONGABLE]: { faction: smithUnit.faction },
    [COLLECTABLE]: {},
    [DROPPABLE]: { decayed: false },
    [EQUIPPABLE]: {},
    [FOG]: { visibility: "hidden", type: "unit" },
    [INVENTORY]: { items: [], size: 5 },
    [LAYER]: {},
    [MELEE]: { bumpGeneration: 0 },
    [MOVABLE]: {
      orientations: [],
      reference: world.getEntityId(world.metadata.gameEntity),
      spring: {
        duration: 200,
      },
      lastInteraction: 0,
      flying: false,
    },
    [NPC]: { type: smithUnit.type },
    [ORIENTABLE]: {},
    [POSITION]: add(smithBuilding.building[POSITION], { x: smithOffset, y: 0 }),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: smithUnit.sprite,
    [STATS]: { ...emptyStats, ...smithUnit.stats },
    [SWIMMABLE]: { swimming: false },
    [TOOLTIP]: {
      dialogs: [
        createDialog("Hey mate"),
        createDialog("My name is Smith"),
        createDialog("I sell resources"),
        createDialog("There's an anvil"),
        createDialog("For crafting items"),
        createDialog("To become stronger"),
        createDialog("Because why not"),
      ],
      persistent: false,
      nextDialog: -1,
    },
  });
  populateInventory(world, smithEntity, smithUnit.items, smithUnit.equipments);
  setIdentifier(world, smithEntity, "smith");
  const stickItem: Deal["item"] = {
    stat: "stick",
    amount: 1,
  };
  const woodItem: Deal["item"] = {
    stackable: "resource",
    material: "wood",
    amount: 1,
  };
  const oreItem: Deal["item"] = {
    stat: "ore",
    amount: 1,
  };
  const ironItem: Deal["item"] = {
    stackable: "resource",
    material: "iron",
    amount: 1,
  };
  const goldItem: Deal["item"] = {
    stackable: "resource",
    material: "gold",
    amount: 1,
  };
  const torchItem: Deal["item"] = {
    equipment: "torch",
    amount: 1,
  };
  sellItems(
    world,
    smithEntity,
    [stickItem, woodItem, oreItem, ironItem, goldItem, torchItem].map(
      (item) => ({
        item,
        stock: Infinity,
        price: getItemPrice(item),
      })
    ),
    "buy"
  );

  const smithAnvil = entities.createCrafting(world, {
    [COLLIDABLE]: {},
    [FOG]: { visibility: "hidden", type: "unit" },
    [POSITION]: add(smithBuilding.building[POSITION], {
      x: -smithOffset,
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
  const woodSwordItem: Deal["item"] = {
    equipment: "sword",
    material: "wood",
    amount: getGearStat("sword", "wood"),
  };
  const woodShieldItem: Deal["item"] = {
    equipment: "shield",
    material: "wood",
    amount: getGearStat("shield", "wood"),
  };
  const ironSwordItem: Deal["item"] = {
    equipment: "sword",
    material: "iron",
    amount: getGearStat("sword", "iron"),
  };
  const ironShieldItem: Deal["item"] = {
    equipment: "shield",
    material: "iron",
    amount: getGearStat("shield", "iron"),
  };
  const goldSwordItem: Deal["item"] = {
    equipment: "sword",
    material: "gold",
    amount: getGearStat("sword", "gold"),
  };
  const goldShieldItem: Deal["item"] = {
    equipment: "shield",
    material: "gold",
    amount: getGearStat("shield", "gold"),
  };
  sellItems(
    world,
    smithAnvil,
    [
      woodSwordItem,
      woodShieldItem,
      ironSwordItem,
      ironShieldItem,
      goldSwordItem,
      goldShieldItem,
    ].map((item) => ({
      item,
      stock: Infinity,
      price: getItemPrice(item),
    })),
    "craft"
  );

  // 5. trader's house
  const traderUnit = generateNpcData("trader");
  const traderEntity = entities.createVillager(world, {
    [ACTIONABLE]: { primaryTriggered: false, secondaryTriggered: false },
    [AFFECTABLE]: { dot: 0, burn: 0, freeze: 0 },
    [ATTACKABLE]: { shots: 0 },
    [BEHAVIOUR]: { patterns: traderUnit.patterns },
    [BELONGABLE]: { faction: traderUnit.faction },
    [COLLECTABLE]: {},
    [DROPPABLE]: { decayed: false },
    [EQUIPPABLE]: {},
    [FOG]: { visibility: "hidden", type: "unit" },
    [INVENTORY]: { items: [], size: 5 },
    [LAYER]: {},
    [MELEE]: { bumpGeneration: 0 },
    [MOVABLE]: {
      orientations: [],
      reference: world.getEntityId(world.metadata.gameEntity),
      spring: {
        duration: 200,
      },
      lastInteraction: 0,
      flying: false,
    },
    [NPC]: { type: traderUnit.type },
    [ORIENTABLE]: {},
    [POSITION]: copy(traderBuilding.building[POSITION]),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: traderUnit.sprite,
    [STATS]: { ...emptyStats, ...traderUnit.stats },
    [SWIMMABLE]: { swimming: false },
    [TOOLTIP]: {
      dialogs: [
        createDialog("Hi, I'm the Trader"),
        createDialog("Nice to meet you"),
        createDialog("Well, I trade items"),
        createDialog("For coins only"),
        createDialog("Wanna have a look?"),
      ],
      persistent: false,
      nextDialog: -1,
    },
  });
  populateInventory(
    world,
    traderEntity,
    traderUnit.items,
    traderUnit.equipments
  );
  setIdentifier(world, traderEntity, "trader");
  sellItems(
    world,
    traderEntity,
    itemPurchases.map(([item, coins]) => ({
      item,
      stock: Infinity,
      price: [{ stat: "coin", amount: coins }],
    })),
    "buy"
  );

  // 6. druid's house
  const druidOffset = choice(-1, 1);
  const druidUnit = generateNpcData("druid");
  const druidEntity = entities.createVillager(world, {
    [ACTIONABLE]: { primaryTriggered: false, secondaryTriggered: false },
    [AFFECTABLE]: { dot: 0, burn: 0, freeze: 0 },
    [ATTACKABLE]: { shots: 0 },
    [BEHAVIOUR]: { patterns: druidUnit.patterns },
    [BELONGABLE]: { faction: druidUnit.faction },
    [COLLECTABLE]: {},
    [DROPPABLE]: { decayed: false },
    [EQUIPPABLE]: {},
    [FOG]: { visibility: "hidden", type: "unit" },
    [INVENTORY]: { items: [], size: 5 },
    [LAYER]: {},
    [MELEE]: { bumpGeneration: 0 },
    [MOVABLE]: {
      orientations: [],
      reference: world.getEntityId(world.metadata.gameEntity),
      spring: {
        duration: 200,
      },
      lastInteraction: 0,
      flying: false,
    },
    [NPC]: { type: druidUnit.type },
    [ORIENTABLE]: {},
    [POSITION]: add(druidBuilding.building[POSITION], { x: druidOffset, y: 0 }),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: druidUnit.sprite,
    [STATS]: { ...emptyStats, ...druidUnit.stats },
    [SWIMMABLE]: { swimming: false },
    [TOOLTIP]: {
      dialogs: [
        createDialog("Hello there"),
        createDialog("I am the Druid"),
        createDialog("Want some potions?"),
        createDialog("Or maybe elements?"),
        createDialog("To enchant items"),
        createDialog("In the kettle here"),
        createDialog("Incredibly powerful"),
      ],
      persistent: false,
      nextDialog: -1,
    },
  });
  populateInventory(world, druidEntity, druidUnit.items, druidUnit.equipments);
  setIdentifier(world, druidEntity, "druid");
  const healthItem: Deal["item"] = {
    consume: "potion1",
    material: "fire",
    amount: 10,
  };
  const manaItem: Deal["item"] = {
    consume: "potion1",
    material: "water",
    amount: 10,
  };
  const berryItem: Deal["item"] = {
    stackable: "berry",
    amount: 1,
  };
  const flowerItem: Deal["item"] = {
    stackable: "flower",
    amount: 1,
  };
  const seedItem: Deal["item"] = {
    stackable: "seed",
    amount: 1,
  };
  const fireEssenceItem: Deal["item"] = {
    stackable: "resource",
    material: "fire",
    amount: 1,
  };
  const waterEssenceItem: Deal["item"] = {
    stackable: "resource",
    material: "water",
    amount: 1,
  };
  const earthEssenceItem: Deal["item"] = {
    stackable: "resource",
    material: "earth",
    amount: 1,
  };
  sellItems(
    world,
    druidEntity,
    [
      healthItem,
      manaItem,
      berryItem,
      flowerItem,
      seedItem,
      fireEssenceItem,
      waterEssenceItem,
      earthEssenceItem,
    ].map((item) => ({
      item,
      stock: Infinity,
      price: getItemPrice(item),
    })),
    "buy"
  );

  const druidKettle = entities.createCrafting(world, {
    [COLLIDABLE]: {},
    [FOG]: { visibility: "hidden", type: "unit" },
    [POSITION]: add(druidBuilding.building[POSITION], {
      x: -druidOffset,
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
  const fireWaveItem: Deal["item"] = {
    amount: 2,
    equipment: "primary",
    primary: "wave1",
    material: "fire",
  };
  const waterWaveItem: Deal["item"] = {
    amount: 2,
    equipment: "primary",
    primary: "wave1",
    material: "water",
  };
  const earthWaveItem: Deal["item"] = {
    amount: 2,
    equipment: "primary",
    primary: "wave1",
    material: "earth",
  };
  const fireBeamItem: Deal["item"] = {
    amount: 5,
    equipment: "primary",
    primary: "beam1",
    material: "fire",
  };
  const waterBeamItem: Deal["item"] = {
    amount: 5,
    equipment: "primary",
    primary: "beam1",
    material: "water",
  };
  const earthBeamItem: Deal["item"] = {
    amount: 5,
    equipment: "primary",
    primary: "beam1",
    material: "earth",
  };
  sellItems(
    world,
    druidKettle,
    [
      fireWaveItem,
      waterWaveItem,
      earthWaveItem,
      fireBeamItem,
      waterBeamItem,
      earthBeamItem,
    ].map((item) => ({
      item,
      stock: Infinity,
      price: getItemPrice(item),
    })),
    "craft"
  );

  // 7. mage's house
  const mageUnit = generateNpcData("mage");
  const mageEntity = entities.createVillager(world, {
    [ACTIONABLE]: { primaryTriggered: false, secondaryTriggered: false },
    [AFFECTABLE]: { dot: 0, burn: 0, freeze: 0 },
    [ATTACKABLE]: { shots: 0 },
    [BEHAVIOUR]: { patterns: mageUnit.patterns },
    [BELONGABLE]: { faction: mageUnit.faction },
    [COLLECTABLE]: {},
    [DROPPABLE]: { decayed: false },
    [EQUIPPABLE]: {},
    [FOG]: { visibility: "hidden", type: "unit" },
    [INVENTORY]: { items: [], size: 5 },
    [LAYER]: {},
    [MELEE]: { bumpGeneration: 0 },
    [MOVABLE]: {
      orientations: [],
      reference: world.getEntityId(world.metadata.gameEntity),
      spring: {
        duration: 200,
      },
      lastInteraction: 0,
      flying: false,
    },
    [NPC]: { type: mageUnit.type },
    [ORIENTABLE]: {},
    [POSITION]: copy(mageBuilding.building[POSITION]),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: mageUnit.sprite,
    [STATS]: { ...emptyStats, ...mageUnit.stats },
    [SWIMMABLE]: { swimming: false },
    [TOOLTIP]: {
      dialogs: [
        createDialog("Greetings traveler"),
        createDialog("I am the Mage"),
        createDialog("Get your spells here"),
        createDialog("And abilities too"),
        createDialog("They're fun actually"),
      ],
      persistent: false,
      nextDialog: -1,
    },
  });
  populateInventory(world, mageEntity, mageUnit.items, mageUnit.equipments);
  setIdentifier(world, mageEntity, "mage");
  const waveItem: Deal["item"] = {
    amount: 1,
    equipment: "primary",
    primary: "wave1",
  };
  const beamItem: Deal["item"] = {
    amount: 1,
    equipment: "primary",
    primary: "beam1",
  };
  const bowItem: Deal["item"] = {
    equipment: "secondary",
    secondary: "bow",
    amount: 1,
  };
  const arrowItem: Deal["item"] = {
    stackable: "arrow",
    amount: 10,
  };
  const slashItem: Deal["item"] = {
    equipment: "secondary",
    secondary: "slash",
    amount: 1,
  };
  const chargeItem: Deal["item"] = {
    stackable: "charge",
    amount: 10,
  };
  sellItems(
    world,
    mageEntity,
    [waveItem, beamItem, bowItem, arrowItem, slashItem, chargeItem].map(
      (item) => ({
        item,
        stock: Infinity,
        price: getItemPrice(item),
      })
    ),
    "buy"
  );

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
      entities.createTerrain(world, {
        [FOG]: { visibility: "hidden", type: "terrain" },
        [POSITION]: add(
          emptyBuilding.building[POSITION],
          orientationPoints[invertFurniture]
        ),
        [SPRITE]: bedHeadSprites[invertFurniture],
        [RENDERABLE]: { generation: 0 },
        [COLLIDABLE]: {},
      });
      entities.createTerrain(world, {
        [FOG]: { visibility: "hidden", type: "terrain" },
        [POSITION]: emptyBuilding.building[POSITION],
        [SPRITE]: bedCenter,
        [RENDERABLE]: { generation: 0 },
        [COLLIDABLE]: {},
      });
      entities.createTerrain(world, {
        [FOG]: { visibility: "hidden", type: "terrain" },
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
      entities.createTerrain(world, {
        [FOG]: { visibility: "hidden", type: "terrain" },
        [POSITION]: copy(emptyBuilding.building[POSITION]),
        [SPRITE]: table,
        [RENDERABLE]: { generation: 0 },
        [COLLIDABLE]: {},
      });
      entities.createGround(world, {
        [FOG]: { visibility: "hidden", type: "terrain" },
        [POSITION]: add(
          emptyBuilding.building[POSITION],
          orientationPoints[furnitureOrientation]
        ),
        [SPRITE]: chairSprites[furnitureOrientation],
        [RENDERABLE]: { generation: 0 },
      });
      if (random(0, 1) === 0) {
        entities.createGround(world, {
          [FOG]: { visibility: "hidden", type: "terrain" },
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
      [COLLIDABLE]: {},
      [DROPPABLE]: { decayed: false },
      [INVENTORY]: { items: [], size: 20 },
      [FOG]: { visibility: "hidden", type: "terrain" },
      [LAYER]: {},
      [POSITION]: add(emptyBuilding.building[POSITION], {
        x: random(0, 1) * 4 - 2,
        y: 0,
      }),
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
      [SPRITE]: chestData.sprite,
      [STATS]: { ...emptyStats, ...chestData.stats },
      [TOOLTIP]: { dialogs: [], persistent: false, nextDialog: -1 },
    });
    populateInventory(
      world,
      chestEntity,
      chestData.items,
      chestData.equipments
    );
  }

  // temporary test mode
  if (window.location.search.substring(1) === "test") {
    // clear title
    const titleWidth = 17;
    const titleHeight = 3;
    const titleCenter = { x: 0, y: -4 };
    matrixFactory(titleWidth, titleHeight, (x, y) => {
      Object.values(
        getCell(
          world,
          add(titleCenter, {
            x: x - (titleWidth - 1) / 2,
            y: y - (titleHeight - 1) / 2,
          })
        )
      ).forEach((entity) => {
        if (entity[COLLIDABLE]) disposeEntity(world, entity);
      });
    });

    const itemColumns: Omit<Item, "bound" | "carrier">[][] = [
      [
        {
          stat: "hp",
          amount: Infinity,
        },
        {
          stat: "maxHp",
          amount: Infinity,
        },
        {
          stat: "mp",
          amount: Infinity,
        },
        {
          stat: "maxMp",
          amount: Infinity,
        },
      ],
      [
        {
          stat: "xp",
          amount: Infinity,
        },
        {
          stat: "coin",
          amount: Infinity,
        },
        {
          stat: "ore",
          amount: Infinity,
        },
        {
          stat: "stick",
          amount: Infinity,
        },
      ],
      [
        {
          consume: "potion1",
          material: "fire",
          amount: Infinity,
        },
        {
          consume: "potion1",
          material: "water",
          amount: Infinity,
        },
        {
          equipment: "torch",
          amount: Infinity,
        },
        {
          consume: "key",
          material: "iron",
          amount: Infinity,
        },
      ],
      [
        {
          equipment: "sword",
          material: "wood",
          amount: getGearStat("sword", "wood"),
        },
        {
          equipment: "sword",
          material: "iron",
          amount: getGearStat("sword", "iron"),
        },
        {
          equipment: "sword",
          material: "gold",
          amount: getGearStat("sword", "gold"),
        },
        {
          equipment: "sword",
          material: "aether",
          amount: 99,
        },
      ],
      [
        {
          equipment: "shield",
          material: "wood",
          amount: getGearStat("shield", "wood"),
        },
        {
          equipment: "shield",
          material: "iron",
          amount: getGearStat("shield", "iron"),
        },
        {
          equipment: "shield",
          material: "gold",
          amount: getGearStat("shield", "gold"),
        },
        {
          equipment: "shield",
          material: "aether",
          amount: 99,
        },
      ],
      [
        {
          equipment: "primary",
          primary: "wave1",
          amount: 1,
        },
        {
          equipment: "primary",
          primary: "wave1",
          material: "fire",
          amount: 1,
        },
        {
          equipment: "primary",
          primary: "wave1",
          material: "water",
          amount: 1,
        },
        {
          equipment: "primary",
          primary: "wave1",
          material: "earth",
          amount: 1,
        },
      ],
      [
        {
          equipment: "primary",
          primary: "beam1",
          amount: 1,
        },
        {
          equipment: "primary",
          primary: "beam1",
          material: "fire",
          amount: 1,
        },
        {
          equipment: "primary",
          primary: "beam1",
          material: "water",
          amount: 1,
        },
        {
          equipment: "primary",
          primary: "beam1",
          material: "earth",
          amount: 1,
        },
      ],
      [
        {
          equipment: "secondary",
          secondary: "bow",
          amount: 1,
        },
        {
          stackable: "arrow",
          amount: Infinity,
        },
        {
          equipment: "secondary",
          secondary: "slash",
          amount: 1,
        },
        {
          stackable: "charge",
          amount: Infinity,
        },
      ],
    ];

    const itemCorner = { x: -9, y: -6 };
    itemColumns.forEach((items, columnIndex) => {
      items.forEach((item, rowIndex) => {
        createItemAsDrop(
          world,
          add(itemCorner, { x: columnIndex * 2, y: rowIndex }),
          // @ts-ignore
          item.equipment === "sword"
            ? entities.createSword
            : entities.createItem,
          {
            [ITEM]: { ...item, bound: false },
            [SPRITE]: getItemSprite(item),
            ...(item.equipment === "sword"
              ? {
                  [SEQUENCABLE]: { states: [] },
                  [ORIENTABLE]: {},
                }
              : {}),
          }
        );
      });
    });
  }

  // start ordered systems
  world.addSystem(systems.setupMap);
  world.addSystem(systems.setupTick);
  world.addSystem(systems.setupFreeze);
  world.addSystem(systems.setupAi);
  world.addSystem(systems.setupTrigger);
  world.addSystem(systems.setupPopup);
  world.addSystem(systems.setupCollect);
  world.addSystem(systems.setupConsume);
  world.addSystem(systems.setupSpike);
  world.addSystem(systems.setupPush);
  world.addSystem(systems.setupDamage);
  world.addSystem(systems.setupBallistics);
  world.addSystem(systems.setupMovement);
  world.addSystem(systems.setupEnter);
  world.addSystem(systems.setupBurn);
  world.addSystem(systems.setupWater);
  world.addSystem(systems.setupAction);
  world.addSystem(systems.setupText);
  world.addSystem(systems.setupMagic);
  world.addSystem(systems.setupSequence);
  world.addSystem(systems.setupFocus);
  world.addSystem(systems.setupNeedle);
  world.addSystem(systems.setupFate);
  world.addSystem(systems.setupDrop);
  world.addSystem(systems.setupLeveling);
  world.addSystem(systems.setupImmersion);
  world.addSystem(systems.setupVisibility);
  world.addSystem(systems.setupRenderer);

  // queue all added entities to added listener
  world.cleanup();
};
