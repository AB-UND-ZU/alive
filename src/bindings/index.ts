import { entities, World, systems } from "../engine";
import { Position, POSITION } from "../engine/components/position";
import { SPRITE } from "../engine/components/sprite";
import { LIGHT } from "../engine/components/light";
import { RENDERABLE } from "../engine/components/renderable";
import { MOVABLE } from "../engine/components/movable";
import { COLLIDABLE } from "../engine/components/collidable";
import {
  berry,
  block,
  blockDown,
  blockUp,
  bush,
  campfire,
  coin,
  createDialog,
  doorClosedIron,
  doorClosedWood,
  doorOpen,
  flower,
  fog,
  grass,
  heartUp,
  ice,
  ironKey,
  ironMine,
  leaf,
  leaves,
  manaUp,
  none,
  oakBurnt,
  oreDrop,
  palm1,
  palm2,
  palmBurnt1,
  palmBurnt2,
  path,
  rock1,
  rock2,
  sand,
  shroom,
  stem,
  stick,
  tree1,
  tree2,
  treeBurnt1,
  treeBurnt2,
  wall,
  water,
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
import { IMMERSIBLE } from "../engine/components/immersible";
import { SWIMMABLE } from "../engine/components/swimmable";
import { BEHAVIOUR } from "../engine/components/behaviour";
import { ATTACKABLE } from "../engine/components/attackable";
import { MELEE } from "../engine/components/melee";
import { ITEM, Stackable } from "../engine/components/item";
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
  copy,
  distribution,
  normalize,
  random,
  sigmoid,
  signedDistance,
} from "../game/math/std";
import { LOOTABLE } from "../engine/components/lootable";
import { EQUIPPABLE } from "../engine/components/equippable";
import { INVENTORY } from "../engine/components/inventory";
import { emptyStats, STATS } from "../engine/components/stats";
import { LOCKABLE } from "../engine/components/lockable";
import { TRACKABLE } from "../engine/components/trackable";
import { FOCUSABLE } from "../engine/components/focusable";
import { VIEWABLE } from "../engine/components/viewable";
import { TOOLTIP } from "../engine/components/tooltip";
import { DROPPABLE } from "../engine/components/droppable";
import { ACTIONABLE } from "../engine/components/actionable";
import {
  anvil,
  basementLeftInside,
  basementRightInside,
  bedCenter,
  bedEndLeft,
  bedEndRight,
  bedHeadLeft,
  bedHeadRight,
  chairLeft,
  chairRight,
  fence,
  fenceBurnt1,
  fenceBurnt2,
  fenceDoor,
  fenceDoorBurnt,
  house,
  houseAid,
  houseArmor,
  houseLeft,
  houseMage,
  houseRight,
  houseTrader,
  kettle,
  roof,
  roofDown,
  roofDownLeft,
  roofLeft,
  roofLeftUp,
  roofLeftUpInside,
  roofRight,
  roofRightDown,
  roofUp,
  roofUpInside,
  roofUpRight,
  roofUpRightInside,
  sign,
  table,
  wallInside,
  window,
  windowInside,
} from "../game/assets/sprites/structures";
import { BURNABLE } from "../engine/components/burnable";
import { createItemAsDrop } from "../engine/systems/drop";
import { COLLECTABLE } from "../engine/components/collectable";
import { FocusSequence, SEQUENCABLE } from "../engine/components/sequencable";
import { createSequence } from "../engine/systems/sequence";
import { npcSequence, questSequence } from "../game/assets/utils";
import { SPAWNABLE } from "../engine/components/spawnable";
import { REFERENCE } from "../engine/components/reference";
import { generateUnitData, generateUnitKey } from "../game/balancing/units";
import { hillsUnitDistribution } from "../game/levels/hills";
import { BELONGABLE } from "../engine/components/belongable";
import { getHasteInterval } from "../engine/systems/movement";
import { SPIKABLE } from "../engine/components/spikable";
import { DISPLACABLE } from "../engine/components/displacable";
import generateTown from "../engine/wfc/town";
import { ENTERABLE } from "../engine/components/enterable";
import { AFFECTABLE } from "../engine/components/affectable";
import { assignBuilding, insertArea, populateInventory } from "./creation";
import {
  getItemPrice,
  itemPurchases,
  itemSales,
} from "../game/balancing/trading";
import { getGearStat } from "../game/balancing/equipment";
import { findPath, invertOrientation } from "../game/math/path";
import { FRAGMENT } from "../engine/components/fragment";
import { STRUCTURABLE } from "../engine/components/structurable";
import { registerEntity } from "../engine/systems/map";
import { ENVIRONMENT } from "../engine/components/environment";
import { TEMPO } from "../engine/components/tempo";
import { LAYER } from "../engine/components/layer";
import { sellItems } from "../engine/systems/shop";
import { Deal } from "../engine/components/popup";
import { FREEZABLE } from "../engine/components/freezable";
import { getSpellStat } from "../game/balancing/spells";
import {
  assertIdentifierAndComponents,
  offerQuest,
  setIdentifier,
} from "../engine/utils";
import { RECHARGABLE } from "../engine/components/rechargable";
import { createHero } from "../engine/systems/fate";

export const generateWorld = async (world: World) => {
  // track distribution of cell types
  const cellLocations: Record<string, Position[]> = {};

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
  const angleOffset = 60 * (random(0, 1) * 2 - 1);
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

    cellLocations[cell] = (cellLocations[cell] || []).concat([{ x, y }]);

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

  // create shortes path from spawn to town and nomad
  const signPosition = { x: normalize(random(0, 1) * 2 - 1, size), y: 10 };
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
  const elderOffset = random(0, 1) * 2 - 1;
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
    scoutHouse.position.x + random(0, 1) * 2 - 1,
    scoutHouse.position.y + 3,
    "campfire"
  );
  setMatrix(
    worldMatrix,
    smithHouse.position.x + random(0, 1) * 2 - 1,
    smithHouse.position.y + 2,
    "house_armor"
  );
  setMatrix(
    worldMatrix,
    traderHouse.position.x + random(0, 1) * 2 - 1,
    traderHouse.position.y + 2,
    "house_trader"
  );
  setMatrix(
    worldMatrix,
    druidHouse.position.x + random(0, 1) * 2 - 1,
    druidHouse.position.y + 2,
    "house_aid"
  );
  setMatrix(
    worldMatrix,
    mageHouse.position.x + random(0, 1) * 2 - 1,
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

    if (cell !== "") {
      entities.createGround(world, {
        [FOG]: { visibility, type: "air" },
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: fog,
      });
    }

    if (!cell) {
      return;
    } else if (cell === "player") {
      const heroEntity = createHero(world, {
        [POSITION]: { x, y },
        [BELONGABLE]: { faction: "settler" },
        [SPAWNABLE]: {
          classKey: "scout",
          position: { x, y },
          viewable: { active: false, priority: 50 },
          light: { brightness: 18, visibility: 18, darkness: 0 },
        },
      });

      // create spawn dummy to set needle target
      const spawnEntity = entities.createViewpoint(world, {
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [VIEWABLE]: { active: false, priority: 30 },
      });
      setIdentifier(world, spawnEntity, "spawn");

      questSequence(world, heroEntity, "spawnQuest", {});
    } else if (cell === "mountain") {
      entities.createMountain(world, {
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [SPRITE]: wall,
        [LIGHT]: { brightness: 0, darkness: 1, visibility: 0 },
        [RENDERABLE]: { generation: 0 },
        [COLLIDABLE]: {},
      });
    } else if (cell === "rock" || cell === "desert_rock") {
      const rock = (["rock1", "rock2"] as const)[random(0, 1)];
      const { items, sprite, stats, faction } = generateUnitData(rock);
      const sprites = {
        rock: { rock1, rock2 },
        desert_rock: { [rock]: sprite },
      };
      const rockEntity = entities.createDeposit(world, {
        [ATTACKABLE]: { shots: 0 },
        [BELONGABLE]: { faction },
        [COLLIDABLE]: {},
        [DROPPABLE]: {
          decayed: false,
          remains: cell === "desert_rock" ? sand : undefined,
        },
        [FOG]: { visibility, type: "terrain" },
        [INVENTORY]: { items: [], size: 20 },
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SEQUENCABLE]: { states: {} },
        [SPRITE]: sprites[cell][rock],
        [STATS]: { ...emptyStats, ...stats },
      });
      populateInventory(world, rockEntity, items);
      if (cell === "desert_rock") {
        entities.createArea(world, {
          [ENVIRONMENT]: { biomes: ["desert"] },
          [POSITION]: { x, y },
          [TEMPO]: { amount: -1 },
        });
      }
    } else if (cell === "iron") {
      entities.createMine(world, {
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SEQUENCABLE]: { states: {} },
        [SPRITE]: ironMine,
        [LIGHT]: { brightness: 0, darkness: 1, visibility: 0 },
        [COLLIDABLE]: {},
        [TOOLTIP]: { dialogs: [], persistent: false, nextDialog: -1 },
      });
    } else if (cell === "ore" || cell === "ore_one") {
      const oreEntity = entities.createOre(world, {
        [INVENTORY]: { items: [], size: 1 },
        [LOOTABLE]: { disposable: false },
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: wall,
        [LIGHT]: { brightness: 0, darkness: 1, visibility: 0 },
        [COLLIDABLE]: {},
      });
      populateInventory(
        world,
        oreEntity,
        [],
        [
          {
            amount: cell === "ore" ? distribution(80, 15, 5) + 1 : 1,
            stat: "ore",
            bound: false,
          },
        ]
      );
    } else if (cell === "stone") {
      entities.createTile(world, {
        [ENVIRONMENT]: { biomes: ["desert"] },
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: sand,
        [TEMPO]: { amount: -1 },
      });
      createItemAsDrop(world, { x, y }, entities.createItem, {
        [ITEM]: {
          stat: "ore",
          amount: 1,
          bound: false,
        },
        [SPRITE]: oreDrop,
      });
    } else if (cell === "block") {
      entities.createTerrain(world, {
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [SPRITE]: block,
        [RENDERABLE]: { generation: 0 },
        [COLLIDABLE]: {},
      });
    } else if (cell === "block_down") {
      entities.createTerrain(world, {
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [SPRITE]: blockDown,
        [RENDERABLE]: { generation: 0 },
        [COLLIDABLE]: {},
      });
    } else if (cell === "block_up") {
      entities.createTerrain(world, {
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [SPRITE]: blockUp,
        [RENDERABLE]: { generation: 0 },
        [COLLIDABLE]: {},
      });
    } else if (cell === "beach" || cell === "desert") {
      entities.createTile(world, {
        [ENVIRONMENT]: { biomes: [cell] },
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: sand,
        [TEMPO]: { amount: -1 },
      });
    } else if (cell === "path") {
      entities.createPath(world, {
        [ENVIRONMENT]: { biomes: ["path"] },
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: path,
        [TEMPO]: { amount: 2 },
      });
    } else if (cell === "water" || cell === "spring") {
      entities.createWater(world, {
        [FOG]: { visibility, type: "terrain" },
        [FREEZABLE]: { frozen: false, sprite: ice },
        [IMMERSIBLE]: {},
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: water,
        [TEMPO]: { amount: -2 },
      });
    } else if (cell === "wood" || cell === "wood_two") {
      const woodEntity = createItemAsDrop(
        world,
        { x, y },
        entities.createItem,
        {
          [ITEM]: {
            stat: "stick",
            amount: cell === "wood" ? distribution(80, 15, 5) + 1 : 2,
            bound: false,
          },
          [SPRITE]: stick,
        }
      );
      if (cell === "wood_two")
        setIdentifier(world, world.assertById(woodEntity[ITEM].carrier), cell);
    } else if (cell === "fruit" || cell === "fruit_one") {
      if (random(0, 1) === 0 || cell === "fruit_one") {
        const fruitEntity = entities.createFruit(world, {
          [BURNABLE]: {
            burning: false,
            eternal: false,
            combusted: false,
            decayed: false,
            remains: [treeBurnt1, treeBurnt2][random(0, 1)],
          },
          [COLLIDABLE]: {},
          [FOG]: { visibility, type: "terrain" },
          [INVENTORY]: { items: [], size: 1 },
          [LOOTABLE]: { disposable: false },
          [POSITION]: { x, y },
          [SEQUENCABLE]: { states: {} },
          [SPRITE]: tree2,
          [RENDERABLE]: { generation: 0 },
          [TOOLTIP]: { dialogs: [], persistent: false, nextDialog: -1 },
        });
        populateInventory(
          world,
          fruitEntity,
          [],
          [
            {
              amount: 1,
              stackable: "apple",
              bound: false,
            },
          ]
        );
      } else {
        createItemAsDrop(
          world,
          { x, y },
          entities.createItem,
          {
            [ITEM]: {
              amount: 1,
              stackable: "shroom",
              bound: false,
            },
            [SPRITE]: shroom,
          },
          false
        );
      }
    } else if (cell === "tree" || cell === "leaves") {
      if (
        cell === "leaves" ||
        (random(0, 29) === 0 &&
          y < size - 1 &&
          worldMatrix[x][y + 1] === "tree")
      ) {
        const rootEntity = entities.createRoot(world, {
          [BURNABLE]: {
            burning: false,
            eternal: false,
            combusted: false,
            decayed: false,
            remains: oakBurnt,
          },
          [COLLIDABLE]: {},
          [FOG]: { visibility, type: "terrain" },
          [FRAGMENT]: { structure: -1 },
          [POSITION]: { x, y: y + 1 },
          [RENDERABLE]: { generation: 0 },
          [SEQUENCABLE]: { states: {} },
          [SPRITE]: stem,
          [STRUCTURABLE]: {},
        });
        const rootId = world.getEntityId(rootEntity);
        rootEntity[FRAGMENT].structure = rootId;

        entities.createPlant(world, {
          [BURNABLE]: {
            burning: false,
            eternal: false,
            combusted: false,
            decayed: false,
          },
          [FOG]: { visibility, type: "terrain" },
          [FRAGMENT]: { structure: rootId },
          [COLLIDABLE]: {},
          [POSITION]: { x, y },
          [SEQUENCABLE]: { states: {} },
          [SPRITE]: leaves,
          [RENDERABLE]: { generation: 0 },
        });

        worldMatrix[x][y + 1] = "air";
      } else {
        entities.createOrganic(world, {
          [FOG]: { visibility, type: "terrain" },
          [BURNABLE]: {
            burning: false,
            eternal: false,
            combusted: false,
            decayed: false,
            remains: [treeBurnt1, treeBurnt2][random(0, 1)],
          },
          [COLLIDABLE]: {},
          [POSITION]: { x, y },
          [SPRITE]: [tree1, tree2][distribution(50, 50)],
          [RENDERABLE]: { generation: 0 },
          [SEQUENCABLE]: { states: {} },
        });
      }
    } else if (cell === "palm" || cell === "oasis") {
      const [stack, palm] = (
        [
          ["coconut", palm1],
          ["banana", palm2],
        ] as const
      )[random(0, 1)];

      if (random(0, 9) === 0) {
        const fruitEntity = entities.createFruit(world, {
          [BURNABLE]: {
            burning: false,
            eternal: false,
            combusted: false,
            decayed: false,
            remains: [palmBurnt1, palmBurnt2][random(0, 1)],
          },
          [COLLIDABLE]: {},
          [FOG]: { visibility, type: "terrain" },
          [INVENTORY]: { items: [], size: 1 },
          [LOOTABLE]: { disposable: false },
          [POSITION]: { x, y },
          [SEQUENCABLE]: { states: {} },
          [SPRITE]: palm,
          [RENDERABLE]: { generation: 0 },
          [TOOLTIP]: { dialogs: [], persistent: false, nextDialog: -1 },
        });
        populateInventory(
          world,
          fruitEntity,
          [],
          [
            {
              amount: 1,
              stackable: stack,
              bound: false,
            },
          ]
        );
        if (cell === "oasis") {
          entities.createArea(world, {
            [ENVIRONMENT]: { biomes: ["desert"] },
            [POSITION]: { x, y },
            [TEMPO]: { amount: -1 },
          });
        }
      } else {
        entities.createOrganic(world, {
          [BURNABLE]: {
            burning: false,
            eternal: false,
            combusted: false,
            decayed: false,
            remains: [palmBurnt1, palmBurnt2][random(0, 1)],
          },
          [FOG]: { visibility, type: "terrain" },
          [COLLIDABLE]: {},
          [POSITION]: { x, y },
          [SPRITE]: palm,
          [RENDERABLE]: { generation: 0 },
          [SEQUENCABLE]: { states: {} },
        });
      }
    } else if (cell === "hedge") {
      const { items, sprite, stats, faction } = generateUnitData(
        (["hedge1", "hedge2"] as const)[random(0, 1)]
      );
      const hedgeEntity = entities.createResource(world, {
        [ATTACKABLE]: { shots: 0 },
        [BELONGABLE]: { faction },
        [BURNABLE]: {
          burning: false,
          eternal: false,
          combusted: false,
          decayed: false,
        },
        [COLLIDABLE]: {},
        [DROPPABLE]: { decayed: false },
        [FOG]: { visibility, type: "terrain" },
        [INVENTORY]: { items: [], size: 20 },
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SEQUENCABLE]: { states: {} },
        [SPRITE]: sprite,
        [STATS]: { ...emptyStats, ...stats },
      });
      populateInventory(world, hedgeEntity, items);
    } else if (cell === "tumbleweed") {
      const { items, sprite, stats, faction, patterns } =
        generateUnitData("tumbleweed");
      const tumbleweedEntity = entities.createTumbleweed(world, {
        [ATTACKABLE]: { shots: 0 },
        [AFFECTABLE]: { dot: 0, burn: 0, freeze: 0 },
        [BEHAVIOUR]: { patterns },
        [BELONGABLE]: { faction },
        [COLLIDABLE]: {},
        [DROPPABLE]: { decayed: false },
        [FOG]: { visibility, type: "unit" },
        [INVENTORY]: { items: [], size: 20 },
        [MOVABLE]: {
          orientations: [],
          reference: world.getEntityId(world.metadata.gameEntity),
          spring: {
            duration: 200,
          },
          lastInteraction: 0,
          flying: true,
        },
        [ORIENTABLE]: {},
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SEQUENCABLE]: { states: {} },
        [SPRITE]: sprite,
        [STATS]: {
          ...emptyStats,
          ...stats,
        },
      });
      entities.createTile(world, {
        [ENVIRONMENT]: { biomes: ["desert"] },
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: sand,
        [TEMPO]: { amount: -1 },
      });
      populateInventory(world, tumbleweedEntity, items);
    } else if (cell === "bush" || cell === "berry" || cell === "berry_one") {
      entities.createWeeds(world, {
        [BURNABLE]: {
          burning: false,
          eternal: false,
          combusted: false,
          decayed: false,
        },
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [SPRITE]: bush,
        [RENDERABLE]: { generation: 0 },
        [SEQUENCABLE]: { states: {} },
      });

      if (cell === "berry" || cell === "berry_one") {
        createItemAsDrop(
          world,
          { x, y },
          entities.createItem,
          {
            [ITEM]: {
              stat: "berry",
              amount: cell === "berry" ? distribution(80, 15, 5) + 1 : 1,
              bound: false,
            },
            [SPRITE]: berry,
          },
          false
        );
      }
    } else if (cell === "grass" || cell === "flower" || cell === "flower_one") {
      entities.createWeeds(world, {
        [BURNABLE]: {
          burning: false,
          eternal: false,
          combusted: false,
          decayed: false,
        },
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [SPRITE]: grass,
        [RENDERABLE]: { generation: 0 },
        [SEQUENCABLE]: { states: {} },
      });
      if (cell === "flower" || cell === "flower_one") {
        createItemAsDrop(
          world,
          { x, y },
          entities.createItem,
          {
            [ITEM]: {
              stat: "flower",
              amount: cell === "flower" ? distribution(80, 15, 5) + 1 : 1,
              bound: false,
            },
            [SPRITE]: flower,
          },
          false
        );
      }
    } else if (cell === "leaf") {
      createItemAsDrop(world, { x, y }, entities.createItem, {
        [ITEM]: {
          stat: "leaf",
          amount: distribution(80, 15, 5) + 1,
          bound: false,
        },
        [SPRITE]: leaf,
      });
    } else if (cell === "coin_one") {
      const coinItem = createItemAsDrop(world, { x, y }, entities.createItem, {
        [ITEM]: {
          stat: "coin",
          amount: 1,
          bound: false,
        },
        [SPRITE]: coin,
      });
      setIdentifier(world, world.assertById(coinItem[ITEM].carrier), "coin");
    } else if (cell === "cactus") {
      const { sprite, stats, faction, items } = generateUnitData(
        (["cactus1", "cactus2"] as const)[random(0, 1)]
      );
      entities.createArea(world, {
        [ENVIRONMENT]: { biomes: ["desert"] },
        [POSITION]: { x, y },
        [TEMPO]: { amount: -1 },
      });
      const cactusEntity = entities.createCactus(world, {
        [ATTACKABLE]: { shots: 0 },
        [AFFECTABLE]: { dot: 0, burn: 0, freeze: 0 },
        [BELONGABLE]: { faction },
        [COLLIDABLE]: {},
        [DROPPABLE]: { decayed: false, remains: sand },
        [FOG]: { visibility, type: "terrain" },
        [INVENTORY]: { items: [], size: 20 },
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SEQUENCABLE]: { states: {} },
        [SPIKABLE]: { damage: stats.power },
        [SPRITE]: sprite,
        [STATS]: { ...emptyStats, ...stats },
      });
      populateInventory(world, cactusEntity, items);
    } else if (
      cell === "wood_door" ||
      cell === "guide_door" ||
      cell === "nomad_door" ||
      cell === "iron_door"
    ) {
      const doorEntity = entities.createDoor(world, {
        [ENTERABLE]: { sprite: doorOpen, orientation: "down" },
        [FOG]: { visibility, type: "float" },
        [LAYER]: {},
        [LIGHT]: { brightness: 0, darkness: 1, visibility: 0 },
        [LOCKABLE]: {
          locked: true,
          material: cell === "iron_door" ? "iron" : undefined,
        },
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SEQUENCABLE]: { states: {} },
        [SPRITE]: cell === "iron_door" ? doorClosedIron : doorClosedWood,
        [TOOLTIP]: {
          dialogs: cell === "iron_door" ? [createDialog("Locked")] : [],
          persistent: false,
          nextDialog: 0,
        },
      });
      if (["guide_door", "nomad_door"].includes(cell)) {
        setIdentifier(world, doorEntity, cell);
      }
    } else if (cell === "gate") {
      const doorEntity = entities.createPassage(world, {
        [FOG]: { visibility, type: "float" },
        [LIGHT]: { brightness: 0, darkness: 1, visibility: 0 },
        [LOCKABLE]: {
          locked: true,
          material: "iron",
        },
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SEQUENCABLE]: { states: {} },
        [SPRITE]: doorClosedIron,
        [TOOLTIP]: {
          dialogs: [createDialog("Locked")],
          persistent: false,
          nextDialog: 0,
        },
      });
      setIdentifier(world, doorEntity, "gate");
    } else if (cell === "campfire") {
      entities.createFire(world, {
        [BURNABLE]: {
          burning: true,
          eternal: true,
          combusted: false,
          decayed: false,
        },
        [FOG]: { visibility, type: "unit" },
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SEQUENCABLE]: { states: {} },
        [SPRITE]: campfire,
      });
    } else if (cell === "pot" || cell === "intro_pot") {
      const { sprite, stats, faction, items, equipments } =
        generateUnitData("pot");
      const potEntity = entities.createChest(world, {
        [ATTACKABLE]: { shots: 0 },
        [BELONGABLE]: { faction },
        [COLLIDABLE]: {},
        [DROPPABLE]: { decayed: false },
        [FOG]: { visibility, type: "terrain" },
        [INVENTORY]: { items: [], size: 20 },
        [LAYER]: {},
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SEQUENCABLE]: { states: {} },
        [SPRITE]: sprite,
        [STATS]: {
          ...emptyStats,
          ...stats,
          ...(cell === "intro_pot" ? { coin: 3 } : {}),
        },
        [TOOLTIP]: { dialogs: [], persistent: false, nextDialog: -1 },
      });
      if (cell === "intro_pot") {
        setIdentifier(world, potEntity, "pot");
      } else {
        populateInventory(world, potEntity, items, equipments);
      }
    } else if (cell === "fence") {
      entities.createOrganic(world, {
        [BURNABLE]: {
          burning: false,
          eternal: false,
          decayed: false,
          combusted: false,
          remains: [fenceBurnt1, fenceBurnt2][random(0, 1)],
        },
        [COLLIDABLE]: {},
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SEQUENCABLE]: { states: {} },
        [SPRITE]: fence,
      });
    } else if (cell === "fence_door") {
      entities.createPath(world, {
        [ENVIRONMENT]: { biomes: ["path"] },
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: none,
        [TEMPO]: { amount: 2 },
      });
      entities.createGate(world, {
        [BURNABLE]: {
          burning: false,
          eternal: false,
          decayed: false,
          combusted: false,
          remains: fenceDoorBurnt,
        },
        [FOG]: { visibility, type: "terrain" },
        [LOCKABLE]: { locked: true },
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SEQUENCABLE]: { states: {} },
        [SPRITE]: fenceDoor,
        [TOOLTIP]: {
          dialogs: [],
          persistent: false,
          nextDialog: 0,
        },
      });
    } else if (cell === "box") {
      const { items, equipments, sprite, stats, faction } =
        generateUnitData("box");
      const frameEntity = entities.createFrame(world, {
        [REFERENCE]: {
          tick: getHasteInterval(world, 7),
          delta: 0,
          suspended: true,
          suspensionCounter: -1,
        },
        [RENDERABLE]: { generation: 0 },
      });
      const boxEntity = entities.createBox(world, {
        [AFFECTABLE]: { dot: 0, burn: 0, freeze: 0 },
        [ATTACKABLE]: { shots: 0 },
        [BELONGABLE]: { faction },
        [COLLIDABLE]: {},
        [DROPPABLE]: { decayed: false },
        [DISPLACABLE]: {},
        [FOG]: { visibility, type: "terrain" },
        [INVENTORY]: { items: [], size: 20 },
        [LAYER]: {},
        [MOVABLE]: {
          orientations: [],
          reference: world.getEntityId(frameEntity),
          spring: {
            duration: frameEntity[REFERENCE].tick,
          },
          lastInteraction: 0,
          flying: false,
        },
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SEQUENCABLE]: { states: {} },
        [SPRITE]: sprite,
        [SWIMMABLE]: { swimming: false },
        [TOOLTIP]: { dialogs: [], persistent: false, nextDialog: -1 },
        [STATS]: { ...emptyStats, ...stats },
      });
      populateInventory(world, boxEntity, items, equipments);
    } else if (cell === "mob" || cell === "prism") {
      const { patterns, items, sprite, stats, faction, equipments, spring } =
        generateUnitData(
          cell === "prism" ? "prism" : generateUnitKey(hillsUnitDistribution)
        );

      const mobEntity = entities.createMob(world, {
        [ACTIONABLE]: { primaryTriggered: false, secondaryTriggered: false },
        [AFFECTABLE]: { dot: 0, burn: 0, freeze: 0 },
        [ATTACKABLE]: { shots: 0 },
        [BEHAVIOUR]: { patterns },
        [BELONGABLE]: { faction },
        [DROPPABLE]: { decayed: false },
        [EQUIPPABLE]: {},
        [FOG]: { visibility, type: "unit" },
        [INVENTORY]: { items: [], size: 20 },
        [LAYER]: {},
        [MELEE]: { bumpGeneration: 0 },
        [MOVABLE]: {
          orientations: [],
          reference: world.getEntityId(world.metadata.gameEntity),
          spring: spring || {
            duration: 200,
          },
          lastInteraction: 0,
          flying: false,
        },
        [NPC]: {},
        [ORIENTABLE]: {},
        [POSITION]: { x, y },
        [RECHARGABLE]: { hit: false },
        [RENDERABLE]: { generation: 0 },
        [SEQUENCABLE]: { states: {} },
        [SPRITE]: sprite,
        [STATS]: {
          ...emptyStats,
          ...stats,
          ...(cell === "prism" ? { coin: 1 } : {}),
        },
        [SWIMMABLE]: { swimming: false },
        [TOOLTIP]: { dialogs: [], persistent: true, nextDialog: -1 },
      });
      populateInventory(
        world,
        mobEntity,
        cell === "prism" ? [] : items,
        equipments
      );

      if (cell === "prism") setIdentifier(world, mobEntity, "spawn_prism");
    } else if (
      ["house_left", "house_right", "basement_left", "basement_right"].includes(
        cell
      )
    ) {
      entities.createWall(world, {
        [COLLIDABLE]: {},
        [ENTERABLE]: {
          sprite:
            {
              house_left: houseRight,
              house_right: houseLeft,
              basement_left: basementLeftInside,
              basement_right: basementRightInside,
            }[cell] || none,
          orientation:
            cell === "house_left" || cell === "basement_left"
              ? "right"
              : "left",
        },
        [FOG]: { visibility, type: "terrain" },
        [LAYER]: {},
        [LIGHT]: {
          brightness: 0,
          darkness: 1,
          visibility: 0,
          orientation:
            cell === "house_left" || cell === "basement_left"
              ? "right"
              : "left",
        },
        [POSITION]: { x, y },
        [SPRITE]:
          cell === "house_left" || cell === "basement_left"
            ? houseLeft
            : houseRight,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "wall") {
      entities.createWall(world, {
        [COLLIDABLE]: {},
        [ENTERABLE]: { sprite: wallInside, orientation: "down" },
        [FOG]: { visibility, type: "terrain" },
        [LAYER]: {},
        [LIGHT]: { brightness: 0, darkness: 1, visibility: 0 },
        [POSITION]: { x, y },
        [SPRITE]: house,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "wall_window") {
      entities.createWall(world, {
        [COLLIDABLE]: {},
        [ENTERABLE]: {
          sprite: windowInside,
          orientation: "down",
        },
        [FOG]: { visibility, type: "terrain" },
        [LAYER]: {},
        [LIGHT]: { brightness: 0, darkness: 1, visibility: 0 },
        [POSITION]: { x, y },
        [SPRITE]: window,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "house") {
      entities.createFloat(world, {
        [ENTERABLE]: { sprite: none },
        [FOG]: { visibility, type: "float" },
        [LAYER]: {},
        [POSITION]: { x, y },
        [SPRITE]: house,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "roof") {
      entities.createFloat(world, {
        [ENTERABLE]: { sprite: none },
        [FOG]: { visibility, type: "float" },
        [LAYER]: {},
        [POSITION]: { x, y },
        [SPRITE]: roof,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "roof_left") {
      entities.createWall(world, {
        [COLLIDABLE]: {},
        [ENTERABLE]: { sprite: houseRight },
        [FOG]: { visibility, type: "terrain" },
        [LAYER]: {},
        [LIGHT]: {
          brightness: 0,
          darkness: 1,
          visibility: 0,
          orientation: "right",
        },
        [POSITION]: { x, y },
        [SPRITE]: roofLeft,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "roof_right") {
      entities.createWall(world, {
        [COLLIDABLE]: {},
        [ENTERABLE]: { sprite: houseLeft },
        [FOG]: { visibility, type: "terrain" },
        [LAYER]: {},
        [LIGHT]: {
          brightness: 0,
          darkness: 1,
          visibility: 0,
          orientation: "left",
        },
        [POSITION]: { x, y },
        [SPRITE]: roofRight,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "roof_left_up") {
      entities.createWall(world, {
        [COLLIDABLE]: {},
        [ENTERABLE]: { sprite: roofLeftUpInside },
        [FOG]: { visibility, type: "float" },
        [LAYER]: {},
        [LIGHT]: { brightness: 0, darkness: 0, visibility: 0 },
        [POSITION]: { x, y },
        [SPRITE]: roofLeftUp,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "roof_up") {
      entities.createWall(world, {
        [COLLIDABLE]: {},
        [ENTERABLE]: { sprite: roofUpInside },
        [FOG]: { visibility, type: "float" },
        [LAYER]: {},
        [LIGHT]: {
          brightness: 0,
          darkness: 1,
          visibility: 0,
          orientation: "down",
        },
        [POSITION]: { x, y },
        [SPRITE]: roofUp,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "roof_up_right") {
      entities.createWall(world, {
        [COLLIDABLE]: {},
        [ENTERABLE]: { sprite: roofUpRightInside },
        [LAYER]: {},
        [LIGHT]: { brightness: 0, darkness: 0, visibility: 0 },
        [FOG]: { visibility, type: "float" },
        [POSITION]: { x, y },
        [SPRITE]: roofUpRight,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "roof_down_left") {
      entities.createWall(world, {
        [COLLIDABLE]: {},
        [ENTERABLE]: { sprite: houseRight },
        [FOG]: { visibility, type: "terrain" },
        [LAYER]: {},
        [LIGHT]: {
          brightness: 0,
          darkness: 1,
          visibility: 0,
          orientation: "right",
        },
        [POSITION]: { x, y },
        [SPRITE]: roofDownLeft,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "roof_down") {
      entities.createFloat(world, {
        [ENTERABLE]: { sprite: none },
        [FOG]: { visibility, type: "float" },
        [LAYER]: {},
        [POSITION]: { x, y },
        [SPRITE]: roofDown,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "roof_right_down") {
      entities.createWall(world, {
        [COLLIDABLE]: {},
        [ENTERABLE]: { sprite: houseLeft },
        [FOG]: { visibility, type: "terrain" },
        [LAYER]: {},
        [LIGHT]: {
          brightness: 0,
          darkness: 1,
          visibility: 0,
          orientation: "left",
        },
        [POSITION]: { x, y },
        [SPRITE]: roofRightDown,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "house_window") {
      entities.createFloat(world, {
        [ENTERABLE]: { sprite: none },
        [FOG]: { visibility, type: "float" },
        [LAYER]: {},
        [POSITION]: { x, y },
        [SPRITE]: window,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "house_aid") {
      entities.createWall(world, {
        [COLLIDABLE]: {},
        [ENTERABLE]: { sprite: wallInside },
        [FOG]: { visibility, type: "terrain" },
        [LAYER]: {},
        [LIGHT]: {
          brightness: 0,
          darkness: 1,
          visibility: 0,
          orientation: "down",
        },
        [POSITION]: { x, y },
        [SPRITE]: houseAid,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "house_armor") {
      entities.createWall(world, {
        [COLLIDABLE]: {},
        [ENTERABLE]: { sprite: wallInside },
        [FOG]: { visibility, type: "terrain" },
        [LAYER]: {},
        [LIGHT]: {
          brightness: 0,
          darkness: 1,
          visibility: 0,
          orientation: "down",
        },
        [POSITION]: { x, y },
        [SPRITE]: houseArmor,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "house_mage") {
      entities.createWall(world, {
        [COLLIDABLE]: {},
        [ENTERABLE]: { sprite: wallInside },
        [FOG]: { visibility, type: "terrain" },
        [LAYER]: {},
        [LIGHT]: {
          brightness: 0,
          darkness: 1,
          visibility: 0,
          orientation: "down",
        },
        [POSITION]: { x, y },
        [SPRITE]: houseMage,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "house_trader") {
      entities.createWall(world, {
        [COLLIDABLE]: {},
        [ENTERABLE]: { sprite: wallInside },
        [FOG]: { visibility, type: "terrain" },
        [LAYER]: {},
        [LIGHT]: {
          brightness: 0,
          darkness: 1,
          visibility: 0,
          orientation: "down",
        },
        [POSITION]: { x, y },
        [SPRITE]: houseTrader,
        [RENDERABLE]: { generation: 0 },
      });
    }
  });

  // postprocess spawn
  const guideDoor = assertIdentifierAndComponents(world, "guide_door", [
    POSITION,
  ]);
  const guideHouse = { position: add(guideDoor[POSITION], { x: 1, y: -1 }) };

  const guideEntityData = generateUnitData("guide");
  const guideEntity = entities.createVillager(world, {
    [ACTIONABLE]: { primaryTriggered: false, secondaryTriggered: false },
    [AFFECTABLE]: { dot: 0, burn: 0, freeze: 0 },
    [ATTACKABLE]: { shots: 0 },
    [BEHAVIOUR]: { patterns: guideEntityData.patterns },
    [BELONGABLE]: { faction: guideEntityData.faction },
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
    [NPC]: {},
    [ORIENTABLE]: {},
    [POSITION]: copy(guidePosition),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: guideEntityData.sprite,
    [STATS]: { ...emptyStats, ...guideEntityData.stats },
    [SWIMMABLE]: { swimming: false },
    [TOOLTIP]: {
      dialogs: [],
      persistent: true,
      nextDialog: -1,
    },
  });
  populateInventory(
    world,
    guideEntity,
    guideEntityData.items,
    guideEntityData.equipments
  );
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
      [POSITION]: { x: -1 + offset, y: 7 },
      [SPRITE]: none,
      [LIGHT]: { brightness: 0, darkness: 1, visibility: 0 },
      [RENDERABLE]: { generation: 0 },
      [COLLIDABLE]: {},
    });
    setIdentifier(world, mountainEntity, `mountain-${offset}`);
  }

  // add quest sign after exiting
  const signEntity = entities.createSign(world, {
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
  npcSequence(world, signEntity, "signNpc", {});
  setIdentifier(world, signEntity, "sign");
  offerQuest(world, signEntity, "waypointQuest", {
    identifier: "welcome",
    distance: 1.3,
  });

  // postprocess nomad
  const nomadHouse = { position: { x: nomadX - 1, y: nomadY - 1 } };
  const nomadUnit = generateUnitData("nomad");
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
    [NPC]: {},
    [ORIENTABLE]: {},
    [POSITION]: add(nomadHouse.position, { x: -1, y: 0 }),
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
  npcSequence(world, nomadEntity, "nomadNpc", {})

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
    [POSITION]: add(nomadHouse.position, { x: 2, y: 0 }),
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

  // postprocess town

  // 1. chief's house in center
  const chiefUnit = generateUnitData("chief");
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
    [NPC]: {},
    [ORIENTABLE]: {},
    [POSITION]: copy(chiefHouse.position),
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
  const chiefOffset = random(0, 1) * 4 - 2;
  const welcomeEntity = entities.createSign(world, {
    [COLLIDABLE]: {},
    [FOG]: { visibility: "hidden", type: "terrain" },
    [POSITION]: add(chiefHouse.position, { x: chiefOffset, y: 3 }),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: sign,
    [TOOLTIP]: {
      dialogs: [
        createDialog("Chief's house"),
        createDialog("Find the key"),
        createDialog("Follow the path"),
        createDialog("To nomad's house"),
      ],
      persistent: false,
      nextDialog: 0,
    },
  });
  setIdentifier(world, welcomeEntity, "welcome");

  // 2. elder's house
  const elderUnit = generateUnitData("elder");
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
    [NPC]: {},
    [ORIENTABLE]: {},
    [POSITION]: copy(elderHouse.position),
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
  const scoutUnit = generateUnitData("scout");
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
    [NPC]: {},
    [ORIENTABLE]: {},
    [POSITION]: copy(scoutHouse.position),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: scoutUnit.sprite,
    [STATS]: { ...emptyStats, ...scoutUnit.stats },
    [SWIMMABLE]: { swimming: false },
    [TOOLTIP]: {
      dialogs: [],
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
  const smithUnit = generateUnitData("smith");
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
    [NPC]: {},
    [ORIENTABLE]: {},
    [POSITION]: copy(smithHouse.position),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: smithUnit.sprite,
    [STATS]: { ...emptyStats, ...smithUnit.stats },
    [SWIMMABLE]: { swimming: false },
    [TOOLTIP]: {
      dialogs: [],
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
  const swordItem: Deal["item"] = {
    equipment: "sword",
    material: "wood",
    amount: getGearStat("sword", "wood"),
  };
  const shieldItem: Deal["item"] = {
    equipment: "shield",
    material: "wood",
    amount: getGearStat("shield", "wood"),
  };
  const torchItem: Deal["item"] = {
    equipment: "torch",
    amount: 1,
  };
  sellItems(
    world,
    smithEntity,
    [
      stickItem,
      woodItem,
      ironItem,
      goldItem,
      swordItem,
      shieldItem,
      torchItem,
    ].map((item) => ({
      item,
      stock: item.equipment ? 1 : Infinity,
      price: getItemPrice(item),
    })),
    "buy"
  );

  const smithAnvil = entities.createCrafting(world, {
    [COLLIDABLE]: {},
    [FOG]: { visibility: "hidden", type: "unit" },
    [POSITION]: add(smithHouse.position, { x: random(0, 1) * 4 - 2, y: 0 }),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: anvil,
    [TOOLTIP]: {
      dialogs: [],
      persistent: false,
      nextDialog: -1,
    },
  });
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
  sellItems(
    world,
    smithAnvil,
    [ironSwordItem, ironShieldItem].map((item) => ({
      item,
      stock: 1,
      price: getItemPrice(item),
    })),
    "craft"
  );

  // 5. trader's house
  const traderUnit = generateUnitData("trader");
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
    [NPC]: {},
    [ORIENTABLE]: {},
    [POSITION]: copy(traderHouse.position),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: traderUnit.sprite,
    [STATS]: { ...emptyStats, ...traderUnit.stats },
    [SWIMMABLE]: { swimming: false },
    [TOOLTIP]: {
      dialogs: [],
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
  const druidUnit = generateUnitData("druid");
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
    [NPC]: {},
    [ORIENTABLE]: {},
    [POSITION]: copy(druidHouse.position),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: druidUnit.sprite,
    [STATS]: { ...emptyStats, ...druidUnit.stats },
    [SWIMMABLE]: { swimming: false },
    [TOOLTIP]: {
      dialogs: [],
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
    [POSITION]: add(druidHouse.position, { x: random(0, 1) * 4 - 2, y: 0 }),
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
      stock: 1,
      price: getItemPrice(item),
    })),
    "craft"
  );

  // 7. mage's house
  const mageUnit = generateUnitData("mage");
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
    [NPC]: {},
    [ORIENTABLE]: {},
    [POSITION]: copy(mageHouse.position),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: mageUnit.sprite,
    [STATS]: { ...emptyStats, ...mageUnit.stats },
    [SWIMMABLE]: { swimming: false },
    [TOOLTIP]: {
      dialogs: [],
      persistent: false,
      nextDialog: -1,
    },
  });
  populateInventory(world, mageEntity, mageUnit.items, mageUnit.equipments);
  setIdentifier(world, mageEntity, "mage");
  const waveItem: Deal["item"] = {
    amount: getSpellStat("wave1").damage,
    equipment: "primary",
    primary: "wave1",
  };
  const beamItem: Deal["item"] = {
    amount: getSpellStat("beam1").damage,
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
        stock: item.stackable ? Infinity : 1,
        price: getItemPrice(item),
      })
    ),
    "buy"
  );

  // empty houses
  for (const emptyHouse of emptyHouses) {
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
          emptyHouse.position,
          orientationPoints[invertFurniture]
        ),
        [SPRITE]: bedHeadSprites[invertFurniture],
        [RENDERABLE]: { generation: 0 },
        [COLLIDABLE]: {},
      });
      entities.createTerrain(world, {
        [FOG]: { visibility: "hidden", type: "terrain" },
        [POSITION]: emptyHouse.position,
        [SPRITE]: bedCenter,
        [RENDERABLE]: { generation: 0 },
        [COLLIDABLE]: {},
      });
      entities.createTerrain(world, {
        [FOG]: { visibility: "hidden", type: "terrain" },
        [POSITION]: add(
          emptyHouse.position,
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
        [POSITION]: copy(emptyHouse.position),
        [SPRITE]: table,
        [RENDERABLE]: { generation: 0 },
        [COLLIDABLE]: {},
      });
      entities.createGround(world, {
        [FOG]: { visibility: "hidden", type: "terrain" },
        [POSITION]: add(
          emptyHouse.position,
          orientationPoints[furnitureOrientation]
        ),
        [SPRITE]: chairSprites[furnitureOrientation],
        [RENDERABLE]: { generation: 0 },
      });
      if (random(0, 1) === 0) {
        entities.createGround(world, {
          [FOG]: { visibility: "hidden", type: "terrain" },
          [POSITION]: add(
            emptyHouse.position,
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
      [POSITION]: add(emptyHouse.position, { x: random(0, 1) * 4 - 2, y: 0 }),
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

  // register all entities to allow post-processing
  const registerableEntites = world.getEntities([POSITION]);
  registerableEntites.forEach((registerableEntity) => {
    registerEntity(world, registerableEntity);
  });

  // assign buildings
  const buildings = [...houses, guideHouse, nomadHouse];
  buildings.forEach((building) => {
    assignBuilding(world, building.position);
  });

  // start ordered systems
  world.addSystem(systems.setupMap);
  world.addSystem(systems.setupTick);
  world.addSystem(systems.setupFreeze);
  world.addSystem(systems.setupAi);
  world.addSystem(systems.setupTrigger);
  world.addSystem(systems.setupShop);
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
