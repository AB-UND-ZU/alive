import { entities, World, systems } from "../engine";
import { POSITION } from "../engine/components/position";
import { SPRITE } from "../engine/components/sprite";
import { LIGHT } from "../engine/components/light";
import { PLAYER } from "../engine/components/player";
import { RENDERABLE } from "../engine/components/renderable";
import { MOVABLE } from "../engine/components/movable";
import { COLLIDABLE } from "../engine/components/collidable";
import {
  addBackground,
  arrow,
  berry,
  berryStack,
  block,
  blockDown,
  blockUp,
  bowActive,
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
  hpFlask1,
  iron,
  ironKey,
  ironMine,
  ironSword,
  leaves,
  mpFlask1,
  none,
  palm1,
  palm2,
  path,
  sand,
  stem,
  stick,
  torch,
  tree1,
  tree2,
  wall,
  water,
  wood,
  woodShield,
} from "../game/assets/sprites";
import { simplexNoiseMatrix, valueNoiseMatrix } from "../game/math/noise";
import { LEVEL } from "../engine/components/level";
import { iterateMatrix, matrixFactory } from "../game/math/matrix";
import { FOG } from "../engine/components/fog";
import { NPC } from "../engine/components/npc";
import { IMMERSIBLE } from "../engine/components/immersible";
import { SWIMMABLE } from "../engine/components/swimmable";
import { BEHAVIOUR } from "../engine/components/behaviour";
import { ATTACKABLE } from "../engine/components/attackable";
import { MELEE } from "../engine/components/melee";
import { ITEM } from "../engine/components/item";
import { ORIENTABLE } from "../engine/components/orientable";
import { aspectRatio } from "../components/Dimensions/sizing";
import { initialPosition, menuArea } from "../game/levels/areas";
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
  fence,
  house,
  houseLeft,
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
import * as colors from "../game/assets/colors";
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
import { populateInventory } from "./creation";
import { getItemPrice } from "../game/balancing/trading";
import { getGearStat } from "../game/balancing/equipment";

export const generateWorld = async (world: World) => {
  const size = world.metadata.gameEntity[LEVEL].size;

  const elevationMatrix = simplexNoiseMatrix(size, size, 0, -50, 100, 1);
  const terrainMatrix = simplexNoiseMatrix(size, size, 0, -40, 100, 1 / 2);
  const temperatureMatrix = simplexNoiseMatrix(size, size, 0, -80, 100, 4);
  const greenMatrix = valueNoiseMatrix(size, size, 1, -80, 100);
  const spawnMatrix = valueNoiseMatrix(size, size, 0, -100, 100);

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
  const townX = random(
    Math.floor(size / 4),
    Math.floor((size / 4) * 3) - townWidth
  );
  const townY = random(
    Math.floor(size / 4),
    Math.floor((size / 4) * 3) - townHeight
  );
  const houses = relativeHouses.map((house) => ({
    ...house,
    position: add(house.position, {
      x: townX - townWidth / 2,
      y: townY - townHeight / 2,
    }),
  }));

  const worldMatrix = matrixFactory<string>(size, size, (x, y) => {
    // distance from zero
    const menuDeltaX = Math.abs(signedDistance(menuX, x, size));
    const menuDeltaY = Math.abs(signedDistance(menuY, y, size));
    const townDeltaX = Math.abs(signedDistance(townX, x, size));
    const townDeltaY = Math.abs(signedDistance(townY, y, size));

    // clear square menu and town areas
    if (
      (menuDeltaX < menuWidth / 2 && menuDeltaY < menuHeight / 2) ||
      (townDeltaX < townWidth / 2 && townDeltaY < townHeight / 2)
    )
      return "";

    // clear triangular exit
    if (y > 5 && y < 14 && y > 4 + menuDeltaX) return "";

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
    const dx = townDeltaX - clampedX;
    const dy = townDeltaY - clampedY;
    const townDistance = Math.sqrt((dx * aspectRatio) ** 2 + dy ** 2);
    const townDip = sigmoid(townDistance, 10, 0.5);
    const townElevation = 20 * (1 - townDip);

    // set menu and town areas
    const elevation =
      elevationMatrix[x][y] * menuDip * townDip + menuElevation + townElevation;
    const terrain =
      terrainMatrix[x][y] * menuDip * townDip + menuElevation + townElevation;
    const temperature = temperatureMatrix[x][y] * menuDip * townDip;
    const green = greenMatrix[x][y] * menuDip * townDip;
    const spawn = spawnMatrix[x][y] * menuDip ** 0.25 * townDip ** 0.25;

    // beach palms
    if (temperature < 65 && elevation < 7 && elevation > 3 && spawn > 65)
      return "palm";

    // beach and islands (if not desert)
    if (
      temperature < 65 &&
      elevation < 0 &&
      (elevation > -32 || temperature > 0)
    )
      return "water";

    if (
      temperature < 65 &&
      elevation < 6 &&
      (elevation > -35 || temperature > 0)
    )
      return "sand";

    // island palms
    if (elevation <= -35 && temperature < 0 && green > 30) return "palm";

    // forest
    if (elevation > 25 && terrain > 30)
      return temperature < 0 && terrain < 75 && menu < 5
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
    if (temperature > 65 && terrain > 75) return "water";
    if (temperature > 65 && terrain > 70) return "palm";
    if (
      temperature > 65 &&
      ((-11 < terrain && terrain < -10) ||
        (10 < terrain && terrain < 11) ||
        (20 < terrain && terrain < 21))
    )
      return "rock";
    if (temperature > 65) return 21 < green && green < 25 ? "cactus" : "sand";

    // greens
    if (green > 37 && elevation > 17) return "tree";
    if (green > 30 && elevation > 14)
      return spawn > 93 ? "fruit" : spawn > 80 ? "wood" : "hedge";
    if (green > 20 && elevation > 11) return spawn > 91 ? "berry" : "bush";
    if (green > 10 && elevation > 8) return spawn > 92 ? "flower" : "grass";

    // spawn
    if (spawn < -96) return "mob";

    return "";
  });

  // insert menu
  menuRows.forEach((row, rowIndex) => {
    row.split("").forEach((cell, columnIndex) => {
      if (cell === " ") return;

      const x = normalize(columnIndex - (row.length - 1) / 2, size);
      const y = normalize(rowIndex - (menuRows.length - 1) / 2, size);
      let entity = "";
      if (cell === "█") entity = "mountain";
      else if (cell === "≈") entity = "water";
      else if (cell === "░") entity = "sand";
      else if (cell === "▒") entity = "path";
      else if (cell === "▓") entity = "block";
      else if (cell === "▄") entity = "block_down";
      else if (cell === "▀") entity = "block_up";
      else if (cell === "i") entity = "alive";
      else if (cell === "◙") entity = "gate";
      else if (cell === "◘") entity = "ore_one";
      else if (cell === "∙") entity = "coin_one";
      else if (cell === "o") entity = "intro_pot";
      else if (cell === "■") entity = "box";
      else if (cell === "¢") entity = "compass";
      else if (cell === "#") entity = "tree";
      else if (cell === "=") entity = "wood_two";
      else if (cell === ".") entity = "fruit";
      else if (cell === "τ") entity = "bush";
      else if (cell === "'") entity = "berry_one";
      else if (cell === ",") entity = "grass";
      else if (cell === "·") entity = "flower_one";
      else if (cell === "♀") entity = "guide";
      else if (cell === "►") entity = "prism";
      else if (cell === "*") entity = "campfire";
      else if (cell === "↔") entity = "key";
      else if (cell === "├") entity = "house_left";
      else if (cell === "└") entity = "basement_left";
      else if (cell === "┤") entity = "house_right";
      else if (cell === "┘") entity = "basement_right";
      else if (cell === "┴") entity = "wall";
      else if (cell === "─") entity = "wall_window";
      else if (cell === "Φ") entity = "nomad_door";
      else if (cell === "┼") entity = "house";
      else if (cell === "┬") entity = "house_window";
      else if (cell === "╬") entity = "roof";
      else if (cell === "╠") entity = "roof_left";
      else if (cell === "╣") entity = "roof_right";
      else if (cell === "╔") entity = "roof_left_up";
      else if (cell === "╦") entity = "roof_up";
      else if (cell === "╗") entity = "roof_up_right";
      else if (cell === "╞") entity = "roof_down_left";
      else if (cell === "╪") entity = "roof_down";
      else if (cell === "╡") entity = "roof_right_down";
      else {
        console.error(`Unrecognized cell: ${cell}!`);
      }

      worldMatrix[x][y] = entity;
    });
  });

  // insert town
  iterateMatrix(townMatrix, (offsetX, offsetY, value) => {
    if (!value) return;

    const x = normalize(townX + offsetX - townWidth / 2, size);
    const y = normalize(townY + offsetY - townHeight / 2, size);
    worldMatrix[x][y] = value;
  });

  // set inn door
  worldMatrix[townX][townY] = "iron_door";

  iterateMatrix(worldMatrix, (x, y, cell) => {
    const deltaX = size / 2 - Math.abs(x - size / 2);
    const deltaY = size / 2 - Math.abs(y - size / 2);
    const townDeltaX = Math.abs(signedDistance(townX, x, size));
    const townDeltaY = Math.abs(signedDistance(townY, y, size));
    const visibility =
      (deltaX < menuRows[0].length / 2 &&
        deltaY < menuRows.length / 2 &&
        (y < menuRows.length / 2 - 3 || y > menuRows.length)) ||
      (townDeltaX < townWidth / 2 &&
        townDeltaY < townHeight / 2 &&
        ["house", "door", "wall", "roof", "basement"].some((structure) =>
          cell.includes(structure)
        ))
        ? "visible"
        : "hidden";

    entities.createGround(world, {
      [FOG]: { visibility, type: "air" },
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [SPRITE]: fog,
    });

    if (cell === "alive") {
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
        },
        [POSITION]: copy(initialPosition),
        [PLAYER]: { ghost: true, inside: false, flying: false },
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
    } else if (cell === "rock") {
      const { items, sprite, stats, faction } = generateUnitData(
        (["rock1", "rock2"] as const)[random(0, 1)]
      );
      const rockEntity = entities.createResource(world, {
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
      populateInventory(world, rockEntity, items);
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
    } else if (cell === "sand") {
      entities.createGround(world, {
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [SPRITE]: sand,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "path") {
      entities.createGround(world, {
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [SPRITE]: path,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "water") {
      entities.createWater(world, {
        [FOG]: { visibility, type: "terrain" },
        [IMMERSIBLE]: {},
        [POSITION]: { x, y },
        [SPRITE]: water,
        [RENDERABLE]: { generation: 0 },
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
    } else if (cell === "fruit") {
      const [tree, stack] = (
        [
          [tree1, "plum"],
          [tree2, "apple"],
        ] as const
      )[random(0, 1)];
      const fruitEntity = entities.createFruit(world, {
        [COLLIDABLE]: {},
        [FOG]: { visibility, type: "terrain" },
        [INVENTORY]: { items: [], size: 1 },
        [LOOTABLE]: { disposable: false },
        [POSITION]: { x, y },
        [SEQUENCABLE]: { states: {} },
        [SPRITE]: tree,
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
    } else if (cell === "tree" || cell === "leaves") {
      if (
        cell === "leaves" ||
        (random(0, 29) === 0 &&
          y < size - 1 &&
          worldMatrix[x][y + 1] === "tree")
      ) {
        entities.createTerrain(world, {
          [FOG]: { visibility, type: "terrain" },
          [COLLIDABLE]: {},
          [POSITION]: { x, y },
          [SPRITE]: leaves,
          [RENDERABLE]: { generation: 0 },
        });

        if (cell === "tree") worldMatrix[x][y + 1] = "stem";
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
    } else if (cell === "palm") {
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
    } else if (cell === "bush" || cell === "berry" || cell === "berry_one") {
      entities.createGround(world, {
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [SPRITE]: bush,
        [RENDERABLE]: { generation: 0 },
      });

      if (cell === "berry" || cell === "berry_one") {
        createItemAsDrop(world, { x, y }, entities.createItem, {
          [ITEM]: {
            stat: "berry",
            amount: cell === "berry" ? distribution(80, 15, 5) + 1 : 1,
            bound: false,
          },
          [SPRITE]: berry,
        });
      }
    } else if (cell === "grass" || cell === "flower" || cell === "flower_one") {
      entities.createGround(world, {
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [SPRITE]: grass,
        [RENDERABLE]: { generation: 0 },
      });
      if (cell === "flower" || cell === "flower_one") {
        createItemAsDrop(world, { x, y }, entities.createItem, {
          [ITEM]: {
            stat: "flower",
            amount: cell === "flower" ? distribution(80, 15, 5) + 1 : 1,
            bound: false,
          },
          [SPRITE]: flower,
        });
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
      const cactusEntity = entities.createCactus(world, {
        [ATTACKABLE]: {},
        [BELONGABLE]: { faction },
        [COLLIDABLE]: {},
        [DROPPABLE]: { decayed: false },
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
      if (cell === "nomad_door") world.setIdentifier(doorEntity, "nomad_door");
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
        [COLLIDABLE]: {},
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SEQUENCABLE]: { states: {} },
        [SPRITE]: campfire,
        [TOOLTIP]: { dialogs: [], persistent: false, nextDialog: -1 },
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
        [MELEE]: {},
        [MOVABLE]: {
          orientations: [],
          reference: world.getEntityId(world.metadata.gameEntity),
          spring: {
            duration: 200,
          },
          lastInteraction: 0,
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
      npcSequence(world, guideEntity, "guideNpc");

      world.setIdentifier(guideEntity, "guide");
    } else if (cell === "mob" || cell === "prism") {
      const { patterns, items, sprite, stats, faction, equipments } =
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
        [MELEE]: {},
        [MOVABLE]: {
          orientations: [],
          reference: world.getEntityId(world.metadata.gameEntity),
          spring: {
            duration: 200,
          },
          lastInteraction: 0,
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
    } else if (cell === "key") {
      const keyEntity = createItemAsDrop(world, { x, y }, entities.createItem, {
        [ITEM]: {
          amount: 1,
          consume: "key",
          material: "gold",
          bound: false,
        },
        [SPRITE]: goldKey,
      });

      world.setIdentifier(keyEntity, "key");

      // add roof above key
      entities.createFloat(world, {
        [ENTERABLE]: { inside: false, sprite: none },
        [FOG]: { visibility: "visible", type: "float" },
        [POSITION]: { x, y },
        [SPRITE]: roofDown,
        [RENDERABLE]: { generation: 0 },
      });
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
        [FOG]: { visibility: "visible", type: "terrain" },
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
        [FOG]: { visibility: "visible", type: "terrain" },
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
        [FOG]: { visibility: "visible", type: "terrain" },
        [LIGHT]: { brightness: 0, darkness: 1, visibility: 0 },
        [POSITION]: { x, y },
        [SPRITE]: window,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "house") {
      entities.createFloat(world, {
        [ENTERABLE]: { inside: false, sprite: none },
        [FOG]: { visibility: "visible", type: "float" },
        [POSITION]: { x, y },
        [SPRITE]: house,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "roof") {
      entities.createFloat(world, {
        [ENTERABLE]: { inside: false, sprite: none },
        [FOG]: { visibility: "visible", type: "float" },
        [POSITION]: { x, y },
        [SPRITE]: roof,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "roof_left") {
      entities.createWall(world, {
        [COLLIDABLE]: {},
        [ENTERABLE]: { inside: false, sprite: houseRight },
        [FOG]: { visibility: "visible", type: "terrain" },
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
        [FOG]: { visibility: "visible", type: "terrain" },
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
        [FOG]: { visibility: "visible", type: "float" },
        [LIGHT]: { brightness: 0, darkness: 0, visibility: 0 },
        [POSITION]: { x, y },
        [SPRITE]: roofLeftUp,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "roof_up") {
      entities.createWall(world, {
        [COLLIDABLE]: {},
        [ENTERABLE]: { inside: false, sprite: roofUpInside },
        [FOG]: { visibility: "visible", type: "float" },
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
        [FOG]: { visibility: "visible", type: "float" },
        [POSITION]: { x, y },
        [SPRITE]: roofUpRight,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "roof_down_left") {
      entities.createWall(world, {
        [COLLIDABLE]: {},
        [ENTERABLE]: { inside: false, sprite: houseRight },
        [FOG]: { visibility: "visible", type: "terrain" },
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
        [FOG]: { visibility: "visible", type: "float" },
        [POSITION]: { x, y },
        [SPRITE]: roofDown,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "roof_right_down") {
      entities.createWall(world, {
        [COLLIDABLE]: {},
        [ENTERABLE]: { inside: false, sprite: houseLeft },
        [FOG]: { visibility: "visible", type: "terrain" },
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
        [FOG]: { visibility: "visible", type: "float" },
        [POSITION]: { x, y },
        [SPRITE]: window,
        [RENDERABLE]: { generation: 0 },
      });
    }
  });

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
    },
    [POSITION]: copy(
      world.getIdentifier("compass_chest")?.[POSITION] || { x: 0, y: 0 }
    ),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: none,
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
  npcSequence(world, viewpointEntity, "worldNpc");
  world.setIdentifier(viewpointEntity, "viewpoint");

  // add quest sign after exiting
  const signEntity = entities.createSign(world, {
    [FOG]: { visibility: "hidden", type: "terrain" },
    [COLLIDABLE]: {},
    [POSITION]: { x: 0, y: 11 },
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: sign,
    [TOOLTIP]: {
      dialogs: [],
      persistent: false,
      nextDialog: -1,
    },
  });
  npcSequence(world, signEntity, "signNpc");
  world.setIdentifier(signEntity, "sign");
  world.offerQuest(signEntity, "townQuest");

  // spawn elements in town

  // 1. chief's house in center
  const chiefHouse = houses[0];
  const welcomeEntity = entities.createSign(world, {
    [FOG]: { visibility: "hidden", type: "terrain" },
    [COLLIDABLE]: {},
    [POSITION]: add(chiefHouse.position, { x: 3, y: 3 }),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: sign,
    [TOOLTIP]: {
      dialogs: [
        createDialog("Chief's house"),
        [
          ...createDialog("Find "),
          ...addBackground([ironKey], colors.black),
          ...createDialog(" key"),
        ],
      ],
      persistent: false,
      nextDialog: 0,
    },
  });
  world.setIdentifier(welcomeEntity, "welcome");

  // 2. elder's house
  const elderHouse = houses[1];
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
    [MELEE]: {},
    [MOVABLE]: {
      orientations: [],
      reference: world.getEntityId(world.metadata.gameEntity),
      spring: {
        duration: 200,
      },
      lastInteraction: 0,
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
  const scoutHouse = houses[2];
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
    [MELEE]: {},
    [MOVABLE]: {
      orientations: [],
      reference: world.getEntityId(world.metadata.gameEntity),
      spring: {
        duration: 200,
      },
      lastInteraction: 0,
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
  const smithHouse = houses[4];
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
    [MELEE]: {},
    [MOVABLE]: {
      orientations: [],
      reference: world.getEntityId(world.metadata.gameEntity),
      spring: {
        duration: 200,
      },
      lastInteraction: 0,
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
  const traderHouse = houses[5];
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
    [MELEE]: {},
    [MOVABLE]: {
      orientations: [],
      reference: world.getEntityId(world.metadata.gameEntity),
      spring: {
        duration: 200,
      },
      lastInteraction: 0,
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
  const druidHouse = houses[6];
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
    [MELEE]: {},
    [MOVABLE]: {
      orientations: [],
      reference: world.getEntityId(world.metadata.gameEntity),
      spring: {
        duration: 200,
      },
      lastInteraction: 0,
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

  // 7. hunter's house
  const hunterHouse = houses[7];
  const hunterUnit = generateUnitData("hunter");
  const hunterEntity = entities.createVillager(world, {
    [ACTIONABLE]: { triggered: false },
    [AFFECTABLE]: {},
    [ATTACKABLE]: {},
    [BEHAVIOUR]: { patterns: hunterUnit.patterns },
    [BELONGABLE]: { faction: hunterUnit.faction },
    [COLLECTABLE]: {},
    [DROPPABLE]: { decayed: false },
    [EQUIPPABLE]: {},
    [FOG]: { visibility: "hidden", type: "unit" },
    [INVENTORY]: { items: [], size: 5 },
    [MELEE]: {},
    [MOVABLE]: {
      orientations: [],
      reference: world.getEntityId(world.metadata.gameEntity),
      spring: {
        duration: 200,
      },
      lastInteraction: 0,
    },
    [NPC]: {},
    [ORIENTABLE]: {},
    [POSITION]: copy(hunterHouse.position),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SHOOTABLE]: { hits: 0 },
    [SPRITE]: hunterUnit.sprite,
    [STATS]: { ...emptyStats, ...hunterUnit.stats },
    [SWIMMABLE]: { swimming: false },
    [TOOLTIP]: {
      dialogs: [],
      persistent: false,
      nextDialog: -1,
    },
  });
  populateInventory(
    world,
    hunterEntity,
    hunterUnit.items,
    hunterUnit.equipments
  );
  world.setIdentifier(hunterEntity, "hunter");
  const bowEntity = entities.createItem(world, {
    [ITEM]: {
      carrier: -1,
      equipment: "active",
      active: "bow",
      amount: 1,
      bound: false,
    },
    [SPRITE]: bowActive,
    [RENDERABLE]: { generation: 0 },
  });
  sellItem(
    world,
    world.getEntityId(bowEntity),
    add(hunterHouse.position, { x: -2, y: 0 }),
    getItemPrice(bowEntity[ITEM])
  );
  const arrowEntity = entities.createItem(world, {
    [ITEM]: {
      carrier: -1,
      stackable: "arrow",
      amount: 10,
      bound: false,
    },
    [SPRITE]: arrow,
    [RENDERABLE]: { generation: 0 },
  });
  sellItem(
    world,
    world.getEntityId(arrowEntity),
    add(hunterHouse.position, { x: 2, y: 0 }),
    getItemPrice(arrowEntity[ITEM])
  );

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
  world.addSystem(systems.setupNeedle);
  world.addSystem(systems.setupFocus);
  world.addSystem(systems.setupFate);
  world.addSystem(systems.setupDrop);
  world.addSystem(systems.setupImmersion);
  world.addSystem(systems.setupVisibility);
  world.addSystem(systems.setupRenderer);

  // queue all added entities to added listener
  world.cleanup();
};
