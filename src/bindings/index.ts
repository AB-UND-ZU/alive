import { entities, World, systems } from "../engine";
import { POSITION } from "../engine/components/position";
import { SPRITE } from "../engine/components/sprite";
import { LIGHT } from "../engine/components/light";
import { PLAYER } from "../engine/components/player";
import { RENDERABLE } from "../engine/components/renderable";
import { MOVABLE } from "../engine/components/movable";
import { COLLIDABLE } from "../engine/components/collidable";
import {
  beamSpell,
  berry,
  berryStack,
  block,
  blockDown,
  blockUp,
  bush,
  campfire,
  coin,
  compass,
  createDialog,
  doorClosedGold,
  doorClosedIron,
  doorClosedWood,
  doorOpen,
  flower,
  flowerStack,
  fog,
  ghost,
  goldKey,
  grass,
  haste,
  heartUp,
  hpFlask1,
  iron,
  ironKey,
  ironMine,
  ironSword,
  leaves,
  manaUp,
  mpFlask1,
  none,
  oreDrop,
  palm1,
  palm2,
  path,
  rock1,
  rock2,
  sand,
  shroom,
  stem,
  stick,
  torch,
  tree1,
  tree2,
  wall,
  water,
  waveSpell,
  wood,
  woodShield,
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
import { ITEM } from "../engine/components/item";
import { ORIENTABLE, orientationPoints } from "../engine/components/orientable";
import { aspectRatio } from "../components/Dimensions/sizing";
import {
  initialPosition,
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
  house,
  houseAid,
  houseArmor,
  houseLeft,
  houseMage,
  houseRight,
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
import { createItemAsDrop, sellItem } from "../engine/systems/drop";
import { COLLECTABLE } from "../engine/components/collectable";
import { SOUL } from "../engine/components/soul";
import { FocusSequence, SEQUENCABLE } from "../engine/components/sequencable";
import { createSequence } from "../engine/systems/sequence";
import { npcSequence } from "../game/assets/utils";
import { SPAWNABLE } from "../engine/components/spawnable";
import { REFERENCE } from "../engine/components/reference";
import { generateUnitData, generateUnitKey } from "../game/balancing/units";
import { hillsUnitDistribution } from "../game/levels/hills";
import { BELONGABLE } from "../engine/components/belongable";
import { SHOOTABLE } from "../engine/components/shootable";
import { getHasteInterval } from "../engine/systems/movement";
import { SPIKABLE } from "../engine/components/spikable";
import { DISPLACABLE } from "../engine/components/displacable";
import generateTown from "../engine/wfc/town";
import { ENTERABLE } from "../engine/components/enterable";
import { AFFECTABLE } from "../engine/components/affectable";
import { assignBuilding, insertArea, populateInventory } from "./creation";
import { getItemPrice } from "../game/balancing/trading";
import { getGearStat } from "../game/balancing/equipment";
import { findPath, invertOrientation } from "../game/math/path";
import { FRAGMENT } from "../engine/components/fragment";
import { STRUCTURABLE } from "../engine/components/structurable";
import { registerEntity } from "../engine/systems/map";
import { ENVIRONMENT } from "../engine/components/environment";
import { TEMPO } from "../engine/components/tempo";

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
  const { matrix: townMatrix, houses: relativeHouses } = await generateTown(
    townWidth,
    townHeight
  );

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
  const houses = relativeHouses.map((house) => ({
    ...house,
    position: add(house.position, {
      x: townX - townWidth / 2,
      y: townY - townHeight / 2,
    }),
  }));

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
    if (y > 5 && y < 14 && y > 4 + menuDeltaX) {
      pathMatrix[x][y] = 35 - menuDeltaX - menuDeltaY * 2;
      return x === 0 && y < 12 ? "path" : "air";
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
    else if (green > 20 && elevation > 11) cell = spawn > 91 ? "berry" : "bush";
    else if (green > 10 && elevation > 8)
      cell = spawn > 92 ? "flower" : "grass";
    // spawn
    else if (spawn < -96) cell = "mob";

    // set weighted elevation for curved pathfinding
    if (["air", "bush", "grass", "path", "desert", "hedge"].includes(cell)) {
      pathMatrix[x][y] =
        (Math.abs(elevation - pathHeight) + 4) ** 2 / 16 +
        (townDeltaX - townWidth / 2 < 2 ? 20 : 0) +
        (townDeltaY - townHeight / 2 < 2 ? 20 : 0);
    }

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
  const signPosition = { x: normalize(random(0, 1) * 2 - 1, size), y: 11 };
  pathMatrix[signPosition.x][signPosition.y] = 0;
  iterateMatrix(worldMatrix, (x, y) => {
    const height = pathMatrix[x][y];
    setPath(pathMatrix, x, y, height);
  });

  const spawnPath = { x: 0, y: 11 };
  const townExits = [
    { x: townX - townWidth / 2, y: townY },
    { x: townX + townWidth / 2, y: townY },
  ];
  const townPath = findPath(
    pathMatrix,
    spawnPath,
    townExits[townAngle < 180 ? 0 : 1]
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
  setMatrix(
    worldMatrix,
    elderHouse.position.x + random(0, 1) * 2 - 1,
    elderHouse.position.y + 2,
    "house_aid"
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
  const traderOffset = random(0, 1) * 2 - 1;
  setMatrix(
    worldMatrix,
    traderHouse.position.x + traderOffset,
    traderHouse.position.y + 3,
    "fruit_one"
  );
  setMatrix(
    worldMatrix,
    traderHouse.position.x - traderOffset,
    traderHouse.position.y + 3,
    "rock"
  );
  const druidOffset = random(0, 1) * 2 - 1;
  setMatrix(
    worldMatrix,
    druidHouse.position.x + druidOffset,
    druidHouse.position.y + 3,
    "flower"
  );
  setMatrix(
    worldMatrix,
    druidHouse.position.x - druidOffset,
    druidHouse.position.y + 3,
    "berry"
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
    } else if (cell === "alive") {
      const frameId = world.getEntityId(
        entities.createFrame(world, {
          [REFERENCE]: {
            tick: getHasteInterval(world, -1),
            delta: 0,
            suspended: true,
            suspensionCounter: -1,
          },
          [RENDERABLE]: { generation: 0 },
        })
      );
      entities.createHalo(world, {
        [ACTIONABLE]: { triggered: false },
        [BELONGABLE]: { faction: "settler" },
        [EQUIPPABLE]: {},
        [INVENTORY]: { items: [], size: 10 },
        [LIGHT]: { brightness: 18, visibility: 18, darkness: 0 },
        [MOVABLE]: {
          orientations: [],
          reference: frameId,
          spring: {
            mass: 5,
            friction: 100,
            tension: 200,
          },
          lastInteraction: 0,
          flying: false,
        },
        [POSITION]: copy(initialPosition),
        [PLAYER]: { ghost: true, damageReceived: 0, healingReceived: 0 },
        [RENDERABLE]: { generation: 0 },
        [SEQUENCABLE]: { states: {} },
        [SOUL]: { ready: true },
        [SPAWNABLE]: {
          classKey: "scout",
          position: copy(initialPosition),
          viewable: { active: false },
          light: { brightness: 18, visibility: 18, darkness: 0 },
        },
        [SPRITE]: ghost,
        [VIEWABLE]: { active: false },
      });

      // create spawn dummy to set needle target
      const spawnEntity = entities.createViewpoint(world, {
        [POSITION]: copy(initialPosition),
        [RENDERABLE]: { generation: 0 },
        [SEQUENCABLE]: { states: {} },
        [SPRITE]: none,
        [VIEWABLE]: { active: false },
      });
      world.setIdentifier(spawnEntity, "spawn");

      entities.createTerrain(world, {
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [SPRITE]: block,
        [RENDERABLE]: { generation: 0 },
        [COLLIDABLE]: {},
      });
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
      const rockEntity = entities.createResource(world, {
        [ATTACKABLE]: {},
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
        world.setIdentifier(world.assertById(woodEntity[ITEM].carrier), cell);
    } else if (cell === "fruit" || cell === "fruit_one") {
      if (random(0, 1) === 0 || cell === "fruit_one") {
        const fruitEntity = entities.createFruit(world, {
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
          [COLLIDABLE]: {},
          [FOG]: { visibility, type: "terrain" },
          [FRAGMENT]: { structure: -1 },
          [POSITION]: { x, y: y + 1 },
          [RENDERABLE]: { generation: 0 },
          [SPRITE]: stem,
          [STRUCTURABLE]: {},
        });
        const rootId = world.getEntityId(rootEntity);
        rootEntity[FRAGMENT].structure = rootId;

        entities.createPlant(world, {
          [FOG]: { visibility, type: "terrain" },
          [FRAGMENT]: { structure: rootId },
          [COLLIDABLE]: {},
          [POSITION]: { x, y },
          [SPRITE]: leaves,
          [RENDERABLE]: { generation: 0 },
        });

        worldMatrix[x][y + 1] = "air";
      } else {
        entities.createTerrain(world, {
          [FOG]: { visibility, type: "terrain" },
          [COLLIDABLE]: {},
          [POSITION]: { x, y },
          [SPRITE]: [tree1, tree2][distribution(50, 50)],
          [RENDERABLE]: { generation: 0 },
        });
      }
    } else if (cell === "stem") {
      entities.createTerrain(world, {
        [FOG]: { visibility, type: "terrain" },
        [COLLIDABLE]: {},
        [POSITION]: { x, y },
        [SPRITE]: stem,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "palm" || cell === "oasis") {
      const [stack, palm] = (
        [
          ["coconut", palm1],
          ["banana", palm2],
        ] as const
      )[random(0, 1)];

      if (random(0, 19) === 0) {
        const fruitEntity = entities.createFruit(world, {
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
        entities.createTerrain(world, {
          [FOG]: { visibility, type: "terrain" },
          [COLLIDABLE]: {},
          [POSITION]: { x, y },
          [SPRITE]: palm,
          [RENDERABLE]: { generation: 0 },
        });
      }
    } else if (cell === "hedge") {
      const { items, sprite, stats, faction } = generateUnitData(
        (["hedge1", "hedge2"] as const)[random(0, 1)]
      );
      const hedgeEntity = entities.createResource(world, {
        [ATTACKABLE]: {},
        [BELONGABLE]: { faction },
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
        [ATTACKABLE]: {},
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
      entities.createGround(world, {
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [SPRITE]: bush,
        [RENDERABLE]: { generation: 0 },
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
      entities.createGround(world, {
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [SPRITE]: grass,
        [RENDERABLE]: { generation: 0 },
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
    } else if (cell === "coin_one") {
      const coinItem = createItemAsDrop(world, { x, y }, entities.createItem, {
        [ITEM]: {
          stat: "coin",
          amount: 1,
          bound: false,
        },
        [SPRITE]: coin,
      });
      world.setIdentifier(world.assertById(coinItem[ITEM].carrier), "coin");
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
        [ATTACKABLE]: {},
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
        [ENTERABLE]: { inside: false, sprite: doorOpen, orientation: "down" },
        [FOG]: { visibility, type: "float" },
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
        world.setIdentifier(doorEntity, cell);
      }
    } else if (cell === "gate") {
      const doorEntity = entities.createGate(world, {
        [FOG]: { visibility, type: "float" },
        [LIGHT]: { brightness: 0, darkness: 1, visibility: 0 },
        [LOCKABLE]: {
          locked: true,
          material: "gold",
        },
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SEQUENCABLE]: { states: {} },
        [SPRITE]: doorClosedGold,
        [TOOLTIP]: {
          dialogs: [createDialog("Locked")],
          persistent: false,
          nextDialog: 0,
        },
      });
      world.setIdentifier(doorEntity, "gate");
    } else if (cell === "campfire") {
      entities.createFire(world, {
        [BURNABLE]: { burning: true, eternal: true },
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SEQUENCABLE]: { states: {} },
        [SPRITE]: campfire,
      });
    } else if (cell === "pot" || cell === "intro_pot") {
      const { sprite, stats, faction, items, equipments } =
        generateUnitData("pot");
      const potEntity = entities.createChest(world, {
        [ATTACKABLE]: {},
        [BELONGABLE]: { faction },
        [COLLIDABLE]: {},
        [DROPPABLE]: { decayed: false },
        [FOG]: { visibility, type: "terrain" },
        [INVENTORY]: { items: [], size: 20 },
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
        world.setIdentifier(potEntity, "pot");
      } else {
        populateInventory(world, potEntity, items, equipments);
      }
    } else if (cell === "fence") {
      entities.createTerrain(world, {
        [FOG]: { visibility, type: "terrain" },
        [COLLIDABLE]: {},
        [POSITION]: { x, y },
        [SPRITE]: fence,
        [RENDERABLE]: { generation: 0 },
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
        [AFFECTABLE]: {},
        [BELONGABLE]: { faction },
        [COLLIDABLE]: {},
        [DROPPABLE]: { decayed: false },
        [DISPLACABLE]: {},
        [FOG]: { visibility, type: "terrain" },
        [INVENTORY]: { items: [], size: 20 },
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
        [SHOOTABLE]: { hits: 0 },
        [SPRITE]: sprite,
        [SWIMMABLE]: { swimming: false },
        [TOOLTIP]: { dialogs: [], persistent: false, nextDialog: -1 },
        [STATS]: { ...emptyStats, ...stats },
      });
      populateInventory(world, boxEntity, items, equipments);
    } else if (cell === "compass") {
      const compassEntity = entities.createCompass(world, {
        [ITEM]: { amount: 1, equipment: "compass", carrier: -1, bound: false },
        [ORIENTABLE]: {},
        [RENDERABLE]: { generation: 0 },
        [SEQUENCABLE]: { states: {} },
        [SPRITE]: compass,
        [TRACKABLE]: {},
      });
      world.setIdentifier(compassEntity, "compass");
      const { sprite, stats, faction } = generateUnitData("commonChest");
      const chestEntity = entities.createChest(world, {
        [ATTACKABLE]: {},
        [BELONGABLE]: { faction },
        [COLLIDABLE]: {},
        [DROPPABLE]: { decayed: false },
        [INVENTORY]: { items: [world.getEntityId(compassEntity)], size: 20 },
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SEQUENCABLE]: { states: {} },
        [SPRITE]: sprite,
        [STATS]: { ...emptyStats, ...stats },
        [TOOLTIP]: { dialogs: [], persistent: false, nextDialog: -1 },
      });
      compassEntity[ITEM].carrier = world.getEntityId(chestEntity);
      world.setIdentifier(chestEntity, "compass_chest");
    } else if (cell === "guide") {
      const { sprite, items, stats, faction, patterns, equipments } =
        generateUnitData("guide");
      const guideEntity = entities.createVillager(world, {
        [ACTIONABLE]: { triggered: false },
        [AFFECTABLE]: {},
        [ATTACKABLE]: {},
        [BEHAVIOUR]: { patterns },
        [BELONGABLE]: { faction },
        [COLLECTABLE]: {},
        [DROPPABLE]: { decayed: false },
        [EQUIPPABLE]: {},
        [FOG]: { visibility, type: "unit" },
        [INVENTORY]: { items: [], size: 5 },
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
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SEQUENCABLE]: { states: {} },
        [SHOOTABLE]: { hits: 0 },
        [SPRITE]: sprite,
        [STATS]: { ...emptyStats, ...stats },
        [SWIMMABLE]: { swimming: false },
        [TOOLTIP]: {
          dialogs: [],
          persistent: true,
          nextDialog: -1,
        },
      });
      populateInventory(world, guideEntity, items, equipments);
      npcSequence(world, guideEntity, "guideNpc", {});

      world.setIdentifier(guideEntity, "guide");
    } else if (cell === "mob" || cell === "prism") {
      const { patterns, items, sprite, stats, faction, equipments, spring } =
        generateUnitData(
          cell === "prism" ? "prism" : generateUnitKey(hillsUnitDistribution)
        );

      const mobEntity = entities.createMob(world, {
        [ACTIONABLE]: { triggered: false },
        [AFFECTABLE]: {},
        [ATTACKABLE]: {},
        [BEHAVIOUR]: { patterns },
        [BELONGABLE]: { faction },
        [DROPPABLE]: { decayed: false },
        [EQUIPPABLE]: {},
        [FOG]: { visibility, type: "unit" },
        [INVENTORY]: { items: [], size: 20 },
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
        [RENDERABLE]: { generation: 0 },
        [SEQUENCABLE]: { states: {} },
        [SHOOTABLE]: { hits: 0 },
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

      if (cell === "prism") world.setIdentifier(mobEntity, "prism");
    } else if (
      ["house_left", "house_right", "basement_left", "basement_right"].includes(
        cell
      )
    ) {
      entities.createWall(world, {
        [COLLIDABLE]: {},
        [ENTERABLE]: {
          inside: false,
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
        [ENTERABLE]: { inside: false, sprite: wallInside, orientation: "down" },
        [FOG]: { visibility, type: "terrain" },
        [LIGHT]: { brightness: 0, darkness: 1, visibility: 0 },
        [POSITION]: { x, y },
        [SPRITE]: house,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "wall_window") {
      entities.createWall(world, {
        [COLLIDABLE]: {},
        [ENTERABLE]: {
          inside: false,
          sprite: windowInside,
          orientation: "down",
        },
        [FOG]: { visibility, type: "terrain" },
        [LIGHT]: { brightness: 0, darkness: 1, visibility: 0 },
        [POSITION]: { x, y },
        [SPRITE]: window,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "house") {
      entities.createFloat(world, {
        [ENTERABLE]: { inside: false, sprite: none },
        [FOG]: { visibility, type: "float" },
        [POSITION]: { x, y },
        [SPRITE]: house,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "roof") {
      entities.createFloat(world, {
        [ENTERABLE]: { inside: false, sprite: none },
        [FOG]: { visibility, type: "float" },
        [POSITION]: { x, y },
        [SPRITE]: roof,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "roof_left") {
      entities.createWall(world, {
        [COLLIDABLE]: {},
        [ENTERABLE]: { inside: false, sprite: houseRight },
        [FOG]: { visibility, type: "terrain" },
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
        [ENTERABLE]: { inside: false, sprite: houseLeft },
        [FOG]: { visibility, type: "terrain" },
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
        [ENTERABLE]: { inside: false, sprite: roofLeftUpInside },
        [FOG]: { visibility, type: "float" },
        [LIGHT]: { brightness: 0, darkness: 0, visibility: 0 },
        [POSITION]: { x, y },
        [SPRITE]: roofLeftUp,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "roof_up") {
      entities.createWall(world, {
        [COLLIDABLE]: {},
        [ENTERABLE]: { inside: false, sprite: roofUpInside },
        [FOG]: { visibility, type: "float" },
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
        [ENTERABLE]: { inside: false, sprite: roofUpRightInside },
        [LIGHT]: { brightness: 0, darkness: 0, visibility: 0 },
        [FOG]: { visibility, type: "float" },
        [POSITION]: { x, y },
        [SPRITE]: roofUpRight,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "roof_down_left") {
      entities.createWall(world, {
        [COLLIDABLE]: {},
        [ENTERABLE]: { inside: false, sprite: houseRight },
        [FOG]: { visibility, type: "terrain" },
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
        [ENTERABLE]: { inside: false, sprite: none },
        [FOG]: { visibility, type: "float" },
        [POSITION]: { x, y },
        [SPRITE]: roofDown,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "roof_right_down") {
      entities.createWall(world, {
        [COLLIDABLE]: {},
        [ENTERABLE]: { inside: false, sprite: houseLeft },
        [FOG]: { visibility, type: "terrain" },
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
        [ENTERABLE]: { inside: false, sprite: none },
        [FOG]: { visibility, type: "float" },
        [POSITION]: { x, y },
        [SPRITE]: window,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "house_aid") {
      entities.createWall(world, {
        [COLLIDABLE]: {},
        [ENTERABLE]: { inside: false, sprite: wallInside },
        [FOG]: { visibility, type: "terrain" },
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
        [ENTERABLE]: { inside: false, sprite: wallInside },
        [FOG]: { visibility, type: "terrain" },
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
        [ENTERABLE]: { inside: false, sprite: wallInside },
        [FOG]: { visibility, type: "terrain" },
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
    }
  });

  // postprocess spawn
  const guideDoor = world.assertIdentifierAndComponents("guide_door", [
    POSITION,
  ]);
  const guideHouse = { position: add(guideDoor[POSITION], { x: 1, y: -1 }) };
  const spawnKeyEntity = createItemAsDrop(
    world,
    add(guideDoor[POSITION], { x: 2, y: -1 }),
    entities.createItem,
    {
      [ITEM]: {
        amount: 1,
        consume: "key",
        material: "gold",
        bound: false,
      },
      [SPRITE]: goldKey,
    }
  );
  world.setIdentifier(spawnKeyEntity, "key");

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
    [POSITION]: copy(
      world.getIdentifier("compass_chest")?.[POSITION] || { x: 0, y: 0 }
    ),
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
  world.setIdentifier(highlighEntity, "focus");

  // create viewpoint for menu area
  const viewpointEntity = entities.createViewpoint(world, {
    [POSITION]: { x: 0, y: 0 },
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: none,
    [VIEWABLE]: { active: true, fraction: { x: 0, y: -0.5 } },
  });
  npcSequence(world, viewpointEntity, "worldNpc", {
    townPosition: { x: townX, y: townY },
    townWidth,
    townHeight,
  });
  world.setIdentifier(viewpointEntity, "viewpoint");

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
    world.setIdentifier(mountainEntity, `mountain-${offset}`);
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
  world.setIdentifier(signEntity, "sign");
  world.offerQuest(signEntity, "waypointQuest", {
    identifier: "welcome",
    distance: 1.3,
  });

  // postprocess nomad
  const nomadHouse = { position: { x: nomadX - 1, y: nomadY - 1 } };
  const nomadUnit = generateUnitData("nomad");
  const nomadEntity = entities.createVillager(world, {
    [ACTIONABLE]: { triggered: false },
    [AFFECTABLE]: {},
    [ATTACKABLE]: {},
    [BEHAVIOUR]: { patterns: nomadUnit.patterns },
    [BELONGABLE]: { faction: nomadUnit.faction },
    [COLLECTABLE]: {},
    [DROPPABLE]: { decayed: false },
    [EQUIPPABLE]: {},
    [FOG]: { visibility: "hidden", type: "unit" },
    [INVENTORY]: { items: [], size: 5 },
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
    [POSITION]: copy(nomadHouse.position),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SHOOTABLE]: { hits: 0 },
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
  world.setIdentifier(nomadEntity, "nomad");
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
  sellItem(
    world,
    world.getEntityId(ironKeyEntity),
    add(nomadHouse.position, { x: 2, y: 0 }),
    getItemPrice(ironKeyEntity[ITEM])
  );
  const nomadChestData = generateUnitData("uncommonChest");
  const nomadChest = entities.createChest(world, {
    [ATTACKABLE]: {},
    [BELONGABLE]: { faction: nomadChestData.faction },
    [COLLIDABLE]: {},
    [DROPPABLE]: { decayed: false },
    [INVENTORY]: { items: [], size: 20 },
    [FOG]: { visibility: "hidden", type: "terrain" },
    [POSITION]: add(nomadHouse.position, { x: -1, y: 1 }),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: nomadChestData.sprite,
    [STATS]: { ...emptyStats, ...nomadChestData.stats },
    [TOOLTIP]: { dialogs: [], persistent: false, nextDialog: -1 },
  });
  populateInventory(
    world,
    nomadChest,
    nomadChestData.items,
    nomadChestData.equipments
  );

  // postprocess town

  // 1. chief's house in center
  const chiefUnit = generateUnitData("chief");
  const chiefEntity = entities.createVillager(world, {
    [ACTIONABLE]: { triggered: false },
    [AFFECTABLE]: {},
    [ATTACKABLE]: {},
    [BEHAVIOUR]: { patterns: chiefUnit.patterns },
    [BELONGABLE]: { faction: chiefUnit.faction },
    [COLLECTABLE]: {},
    [DROPPABLE]: { decayed: false },
    [EQUIPPABLE]: {},
    [FOG]: { visibility: "hidden", type: "unit" },
    [INVENTORY]: { items: [], size: 5 },
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
    [SHOOTABLE]: { hits: 0 },
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
  world.setIdentifier(chiefEntity, "chief");
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
  sellItem(
    world,
    world.getEntityId(maxHpEntity),
    add(chiefHouse.position, { x: -2, y: 0 }),
    getItemPrice(maxHpEntity[ITEM]),
    Infinity
  );
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
  sellItem(
    world,
    world.getEntityId(maxMpEntity),
    add(chiefHouse.position, { x: 2, y: 0 }),
    getItemPrice(maxMpEntity[ITEM]),
    Infinity
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
  world.setIdentifier(welcomeEntity, "welcome");

  // 2. elder's house
  const elderUnit = generateUnitData("elder");
  const elderEntity = entities.createVillager(world, {
    [ACTIONABLE]: { triggered: false },
    [AFFECTABLE]: {},
    [ATTACKABLE]: {},
    [BEHAVIOUR]: { patterns: elderUnit.patterns },
    [BELONGABLE]: { faction: elderUnit.faction },
    [COLLECTABLE]: {},
    [DROPPABLE]: { decayed: false },
    [EQUIPPABLE]: {},
    [FOG]: { visibility: "hidden", type: "unit" },
    [INVENTORY]: { items: [], size: 5 },
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
    [SHOOTABLE]: { hits: 0 },
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
  world.setIdentifier(elderEntity, "elder");
  const hpEntity = entities.createItem(world, {
    [ITEM]: {
      carrier: -1,
      consume: "potion1",
      material: "fire",
      amount: 10,
      bound: false,
    },
    [SPRITE]: hpFlask1,
    [RENDERABLE]: { generation: 0 },
  });
  sellItem(
    world,
    world.getEntityId(hpEntity),
    add(elderHouse.position, { x: -2, y: 0 }),
    getItemPrice(hpEntity[ITEM]),
    Infinity
  );
  const mpEntity = entities.createItem(world, {
    [ITEM]: {
      carrier: -1,
      consume: "potion1",
      material: "water",
      amount: 10,
      bound: false,
    },
    [SPRITE]: mpFlask1,
    [RENDERABLE]: { generation: 0 },
  });
  sellItem(
    world,
    world.getEntityId(mpEntity),
    add(elderHouse.position, { x: 2, y: 0 }),
    getItemPrice(mpEntity[ITEM]),
    Infinity
  );

  // 3. scout's house
  const scoutUnit = generateUnitData("scout");
  const scoutEntity = entities.createVillager(world, {
    [ACTIONABLE]: { triggered: false },
    [AFFECTABLE]: {},
    [ATTACKABLE]: {},
    [BEHAVIOUR]: { patterns: scoutUnit.patterns },
    [BELONGABLE]: { faction: scoutUnit.faction },
    [COLLECTABLE]: {},
    [DROPPABLE]: { decayed: false },
    [EQUIPPABLE]: {},
    [FOG]: { visibility: "hidden", type: "unit" },
    [INVENTORY]: { items: [], size: 5 },
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
    [SHOOTABLE]: { hits: 0 },
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
  world.setIdentifier(scoutEntity, "scout");
  const hasteEntity = entities.createItem(world, {
    [ITEM]: {
      carrier: -1,
      stat: "haste",
      amount: 1,
      bound: false,
    },
    [SPRITE]: haste,
    [RENDERABLE]: { generation: 0 },
  });
  sellItem(
    world,
    world.getEntityId(hasteEntity),
    add(scoutHouse.position, { x: -2, y: 0 }),
    getItemPrice(hasteEntity[ITEM])
  );
  const torchEntity = entities.createItem(world, {
    [ITEM]: {
      carrier: -1,
      equipment: "torch",
      amount: 1,
      bound: false,
    },
    [SPRITE]: torch,
    [RENDERABLE]: { generation: 0 },
  });
  sellItem(
    world,
    world.getEntityId(torchEntity),
    add(scoutHouse.position, { x: 2, y: 0 }),
    getItemPrice(torchEntity[ITEM])
  );

  // 4. smith's house
  const smithUnit = generateUnitData("smith");
  const smithEntity = entities.createVillager(world, {
    [ACTIONABLE]: { triggered: false },
    [AFFECTABLE]: {},
    [ATTACKABLE]: {},
    [BEHAVIOUR]: { patterns: smithUnit.patterns },
    [BELONGABLE]: { faction: smithUnit.faction },
    [COLLECTABLE]: {},
    [DROPPABLE]: { decayed: false },
    [EQUIPPABLE]: {},
    [FOG]: { visibility: "hidden", type: "unit" },
    [INVENTORY]: { items: [], size: 5 },
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
    [SHOOTABLE]: { hits: 0 },
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
  world.setIdentifier(smithEntity, "smith");
  const shieldEntity = entities.createItem(world, {
    [ITEM]: {
      carrier: -1,
      equipment: "shield",
      material: "wood",
      amount: getGearStat("shield", "wood"),
      bound: false,
    },
    [SPRITE]: woodShield,
    [RENDERABLE]: { generation: 0 },
  });
  sellItem(
    world,
    world.getEntityId(shieldEntity),
    add(smithHouse.position, { x: -2, y: 0 }),
    getItemPrice(shieldEntity[ITEM])
  );
  const swordEntity = entities.createSword(world, {
    [ITEM]: {
      carrier: -1,
      equipment: "sword",
      material: "iron",
      amount: getGearStat("sword", "iron"),
      bound: false,
    },
    [ORIENTABLE]: {},
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: ironSword,
    [RENDERABLE]: { generation: 0 },
  });
  sellItem(
    world,
    world.getEntityId(swordEntity),
    add(smithHouse.position, { x: 2, y: 0 }),
    getItemPrice(swordEntity[ITEM])
  );

  // 5. trader's house
  const traderUnit = generateUnitData("trader");
  const traderEntity = entities.createVillager(world, {
    [ACTIONABLE]: { triggered: false },
    [AFFECTABLE]: {},
    [ATTACKABLE]: {},
    [BEHAVIOUR]: { patterns: traderUnit.patterns },
    [BELONGABLE]: { faction: traderUnit.faction },
    [COLLECTABLE]: {},
    [DROPPABLE]: { decayed: false },
    [EQUIPPABLE]: {},
    [FOG]: { visibility: "hidden", type: "unit" },
    [INVENTORY]: { items: [], size: 5 },
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
    [SHOOTABLE]: { hits: 0 },
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
  world.setIdentifier(traderEntity, "trader");
  const woodEntity = entities.createItem(world, {
    [ITEM]: {
      carrier: -1,
      stackable: "resource",
      material: "wood",
      amount: 1,
      bound: false,
    },
    [SPRITE]: wood,
    [RENDERABLE]: { generation: 0 },
  });
  sellItem(
    world,
    world.getEntityId(woodEntity),
    add(traderHouse.position, { x: -2, y: 0 }),
    getItemPrice(woodEntity[ITEM]),
    Infinity
  );
  const ironEntity = entities.createItem(world, {
    [ITEM]: {
      carrier: -1,
      stackable: "resource",
      material: "iron",
      amount: 1,
      bound: false,
    },
    [SPRITE]: iron,
    [RENDERABLE]: { generation: 0 },
  });
  sellItem(
    world,
    world.getEntityId(ironEntity),
    add(traderHouse.position, { x: 2, y: 0 }),
    getItemPrice(ironEntity[ITEM]),
    Infinity
  );

  // 6. druid's house
  const druidUnit = generateUnitData("druid");
  const druidEntity = entities.createVillager(world, {
    [ACTIONABLE]: { triggered: false },
    [AFFECTABLE]: {},
    [ATTACKABLE]: {},
    [BEHAVIOUR]: { patterns: druidUnit.patterns },
    [BELONGABLE]: { faction: druidUnit.faction },
    [COLLECTABLE]: {},
    [DROPPABLE]: { decayed: false },
    [EQUIPPABLE]: {},
    [FOG]: { visibility: "hidden", type: "unit" },
    [INVENTORY]: { items: [], size: 5 },
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
    [SHOOTABLE]: { hits: 0 },
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
  world.setIdentifier(druidEntity, "druid");
  const berryEntity = entities.createItem(world, {
    [ITEM]: {
      carrier: -1,
      stackable: "berry",
      amount: 1,
      bound: false,
    },
    [SPRITE]: berryStack,
    [RENDERABLE]: { generation: 0 },
  });
  sellItem(
    world,
    world.getEntityId(berryEntity),
    add(druidHouse.position, { x: -2, y: 0 }),
    getItemPrice(berryEntity[ITEM]),
    Infinity
  );
  const flowerEntity = entities.createItem(world, {
    [ITEM]: {
      carrier: -1,
      stackable: "flower",
      amount: 1,
      bound: false,
    },
    [SPRITE]: flowerStack,
    [RENDERABLE]: { generation: 0 },
  });
  sellItem(
    world,
    world.getEntityId(flowerEntity),
    add(druidHouse.position, { x: 2, y: 0 }),
    getItemPrice(flowerEntity[ITEM]),
    Infinity
  );

  // 7. mage's house
  const mageUnit = generateUnitData("mage");
  const mageEntity = entities.createVillager(world, {
    [ACTIONABLE]: { triggered: false },
    [AFFECTABLE]: {},
    [ATTACKABLE]: {},
    [BEHAVIOUR]: { patterns: mageUnit.patterns },
    [BELONGABLE]: { faction: mageUnit.faction },
    [COLLECTABLE]: {},
    [DROPPABLE]: { decayed: false },
    [EQUIPPABLE]: {},
    [FOG]: { visibility: "hidden", type: "unit" },
    [INVENTORY]: { items: [], size: 5 },
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
    [SHOOTABLE]: { hits: 0 },
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
  world.setIdentifier(mageEntity, "mage");
  const waveEntity = entities.createItem(world, {
    [ITEM]: {
      carrier: -1,
      amount: 2,
      equipment: "active",
      active: "wave1",
      bound: false,
    },
    [SPRITE]: waveSpell,
    [RENDERABLE]: { generation: 0 },
  });
  sellItem(
    world,
    world.getEntityId(waveEntity),
    add(mageHouse.position, { x: -2, y: 0 }),
    getItemPrice(waveEntity[ITEM])
  );
  const beamEntity = entities.createItem(world, {
    [ITEM]: {
      carrier: -1,
      amount: 5,
      equipment: "active",
      active: "beam1",
      bound: false,
    },
    [SPRITE]: beamSpell,
    [RENDERABLE]: { generation: 0 },
  });
  sellItem(
    world,
    world.getEntityId(beamEntity),
    add(mageHouse.position, { x: 2, y: 0 }),
    getItemPrice(beamEntity[ITEM])
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
      [ATTACKABLE]: {},
      [BELONGABLE]: { faction: chestData.faction },
      [COLLIDABLE]: {},
      [DROPPABLE]: { decayed: false },
      [INVENTORY]: { items: [], size: 20 },
      [FOG]: { visibility: "hidden", type: "terrain" },
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
  world.addSystem(systems.setupAi);
  world.addSystem(systems.setupTrigger);
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
  world.addSystem(systems.setupImmersion);
  world.addSystem(systems.setupVisibility);
  world.addSystem(systems.setupRenderer);

  // queue all added entities to added listener
  world.cleanup();
};
