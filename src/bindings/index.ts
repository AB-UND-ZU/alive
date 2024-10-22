import { entities, World, systems } from "../engine";
import { POSITION } from "../engine/components/position";
import { SPRITE } from "../engine/components/sprite";
import { LIGHT } from "../engine/components/light";
import { PLAYER } from "../engine/components/player";
import { RENDERABLE } from "../engine/components/renderable";
import { MOVABLE } from "../engine/components/movable";
import { COLLIDABLE } from "../engine/components/collidable";
import {
  apple1,
  apple2,
  block,
  blockDown,
  blockUp,
  bush,
  cactus1,
  cactus2,
  campfire,
  chest,
  coin,
  compass,
  createDialog,
  doorClosedGold,
  doorClosedWood,
  flower,
  fog,
  getCountableSprite,
  ghost,
  goldKey,
  goldMine,
  herb,
  iron,
  ironSword,
  none,
  pot,
  sand,
  seed,
  tree1,
  tree2,
  villager,
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
  copy,
  distribution,
  normalize,
  random,
  signedDistance,
} from "../game/math/std";
import { LOOTABLE } from "../engine/components/lootable";
import { EQUIPPABLE } from "../engine/components/equippable";
import { INVENTORY } from "../engine/components/inventory";
import { COUNTABLE, emptyCountable } from "../engine/components/countable";
import { LOCKABLE } from "../engine/components/lockable";
import { TRACKABLE } from "../engine/components/trackable";
import { FOCUSABLE } from "../engine/components/focusable";
import { VIEWABLE } from "../engine/components/viewable";
import { TOOLTIP } from "../engine/components/tooltip";
import { DROPPABLE } from "../engine/components/droppable";
import { ACTIONABLE } from "../engine/components/actionable";
import {
  house,
  houseLeft,
  houseRight,
  roofDown,
  roofDownLeft,
  roofLeftUp,
  roofRightDown,
  roofUp,
  roofUpRight,
  sign,
  window,
} from "../game/assets/sprites/structures";
import { BURNABLE } from "../engine/components/burnable";
import {
  createItemAsDrop,
  createItemInInventory,
} from "../engine/systems/drop";
import { COLLECTABLE } from "../engine/components/collectable";
import { SOUL } from "../engine/components/soul";
import { FocusSequence, SEQUENCABLE } from "../engine/components/sequencable";
import { createSequence } from "../engine/systems/sequence";
import { npcSequence } from "../game/assets/utils";
import { SPAWNABLE } from "../engine/components/spawnable";
import { REFERENCE } from "../engine/components/reference";
import { generateMobKey, generateMobStat } from "../game/balancing/mobs";
import { greenMobDistribution } from "../game/levels/green";

export const generateWorld = async (world: World) => {
  const size = world.metadata.gameEntity[LEVEL].size;

  const elevationMatrix = simplexNoiseMatrix(size, size, 0, -50, 100, 1);
  const terrainMatrix = simplexNoiseMatrix(size, size, 0, -40, 100, 1 / 2);
  const temperatureMatrix = simplexNoiseMatrix(size, size, 0, -80, 100, 4);
  const greenMatrix = valueNoiseMatrix(size, size, 1, -80, 100);
  const spawnMatrix = valueNoiseMatrix(size, size, 0, -100, 100);

  const menuRows = menuArea.split("\n");

  const worldMatrix = matrixFactory<string>(size, size, (x, y) => {
    // distance from zero
    const deltaX = Math.abs(signedDistance(0, x, size));
    const deltaY = Math.abs(signedDistance(0, y, size));

    // clear square menu area
    if (deltaX < menuRows[0].length / 2 && deltaY < menuRows.length / 2)
      return "";

    // clear triangular exit
    if (y > 6 && y < 14 && y > 5 + deltaX) return "";

    const distance = Math.sqrt((deltaX * aspectRatio) ** 2 + deltaY ** 2);

    // create clean elevation around menu
    const menu = 100000 / distance ** 4;
    const menuElevation = Math.min(35, menu * 3);
    const menuDip = 1 / (1 + menu / 2);

    const elevation = elevationMatrix[x][y] * menuDip + menuElevation;
    const terrain = terrainMatrix[x][y] * menuDip + menuElevation;
    const temperature = temperatureMatrix[x][y] * menuDip;
    const green = greenMatrix[x][y] * menuDip;
    const spawn = spawnMatrix[x][y] * menuDip ** 0.25;

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

    // forest
    if (elevation > 25 && terrain > 30)
      return temperature < 0 && terrain < 75 && menu < 5
        ? spawn > 97
          ? "fruit"
          : spawn > 91
          ? "wood"
          : "tree"
        : spawn > 99
        ? "gold"
        : spawn > 86
        ? "iron"
        : "rock";

    // desert, oasis and cactus
    if (temperature > 65 && terrain > 70) return "water";
    if (temperature > 65) return 20 < green && green < 25 ? "cactus" : "sand";

    // greens
    if (green > 30) return spawn > 97 ? "fruit" : spawn > 91 ? "wood" : "tree";
    if (green > 20) return spawn > 91 ? "seed" : "bush";
    if (green > 10) return spawn > 92 ? "herb" : "grass";

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
      if (cell === "█") entity = "rock";
      else if (cell === "≈") entity = "water";
      else if (cell === "░") entity = "sand";
      else if (cell === "▓") entity = "block";
      else if (cell === "▄") entity = "block_down";
      else if (cell === "▀") entity = "block_up";
      else if (cell === "i") entity = "alive";
      else if (cell === "◙") entity = "door";
      else if (cell === "◘") entity = "iron_one";
      else if (cell === "∙") entity = "coin_one";
      else if (cell === "o") entity = "pot";
      else if (cell === "¢") entity = "compass";
      else if (cell === "#") entity = "tree";
      else if (cell === "=") entity = "wood_two";
      else if (cell === ".") entity = "fruit";
      else if (cell === "τ") entity = "bush";
      else if (cell === "'") entity = "seed_one";
      else if (cell === ",") entity = "grass";
      else if (cell === "·") entity = "herb_one";
      else if (cell === "♀") entity = "guide";
      else if (cell === "►") entity = "triangle";
      else if (cell === "*") entity = "campfire";
      else if (cell === "↔") entity = "key";
      else if (cell === "├") entity = "house_left";
      else if (cell === "┤") entity = "house_right";
      else if (cell === "─") entity = "house";
      else if (cell === "┴") entity = "house_window";
      else if (cell === "Φ") entity = "house_door";
      else if (cell === "╒") entity = "roof_left_up";
      else if (cell === "╤") entity = "roof_up";
      else if (cell === "╕") entity = "roof_up_right";
      else if (cell === "╞") entity = "roof_down_left";
      else if (cell === "╧") entity = "roof_down";
      else if (cell === "╡") entity = "roof_right_down";
      else {
        console.error(`Unrecognized cell: ${cell}!`);
      }

      worldMatrix[x][y] = entity;
    });
  });

  iterateMatrix(worldMatrix, (x, y, cell) => {
    const deltaX = size / 2 - Math.abs(x - size / 2);
    const deltaY = size / 2 - Math.abs(y - size / 2);
    const visibility =
      deltaX < menuRows[0].length / 2 &&
      deltaY < menuRows.length / 2 &&
      (y < menuRows.length / 2 - 2 || y > menuRows.length)
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
            tick: 250,
            delta: 0,
            suspended: true,
            suspensionCounter: -1,
          },
          [RENDERABLE]: { generation: 0 },
        })
      );
      entities.createHalo(world, {
        [ACTIONABLE]: { triggered: false },
        [EQUIPPABLE]: {},
        [INVENTORY]: { items: [], size: 10 },
        [LIGHT]: { brightness: 15, visibility: 15, darkness: 0 },
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
        [PLAYER]: { ghost: true },
        [RENDERABLE]: { generation: 0 },
        [SEQUENCABLE]: { states: {} },
        [SOUL]: { ready: true },
        [SPAWNABLE]: {
          position: copy(initialPosition),
          viewable: { active: false },
          light: { brightness: 15, visibility: 15, darkness: 0 },
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
    } else if (cell === "rock") {
      entities.createWall(world, {
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [SPRITE]: wall,
        [LIGHT]: { brightness: 0, darkness: 1, visibility: 0 },
        [RENDERABLE]: { generation: 0 },
        [COLLIDABLE]: {},
      });
    } else if (cell === "gold") {
      entities.createWall(world, {
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: goldMine,
        [LIGHT]: { brightness: 0, darkness: 1, visibility: 0 },
        [COLLIDABLE]: {},
      });
    } else if (cell === "iron" || cell === "iron_one") {
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
      createItemInInventory(world, oreEntity, entities.createItem, {
        [ITEM]: {
          amount: cell === "iron" ? distribution(80, 15, 5) + 1 : 1,
          counter: "iron",
        },
        [SPRITE]: iron,
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
    } else if (cell === "sand") {
      entities.createGround(world, {
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [SPRITE]: sand,
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
            counter: "wood",
            amount: cell === "wood" ? distribution(80, 15, 5) + 1 : 2,
          },
          [SPRITE]: wood,
        }
      );
      if (cell === "wood_two")
        world.setIdentifier(world.assertById(woodEntity[ITEM].carrier), cell);
    } else if (cell === "fruit") {
      const [apple, tree] = [
        [apple1, tree1],
        [apple2, tree2],
      ][random(0, 1)];
      const fruitEntity = entities.createFruit(world, {
        [COLLIDABLE]: {},
        [FOG]: { visibility, type: "terrain" },
        [INVENTORY]: { items: [], size: 1 },
        [LOOTABLE]: { disposable: false },
        [POSITION]: { x, y },
        [SPRITE]: tree,
        [RENDERABLE]: { generation: 0 },
      });
      createItemInInventory(world, fruitEntity, entities.createItem, {
        [ITEM]: {
          amount: 1,
          counter: "hp",
        },
        [SPRITE]: apple,
      });
    } else if (cell === "tree") {
      entities.createTerrain(world, {
        [FOG]: { visibility, type: "terrain" },
        [COLLIDABLE]: {},
        [POSITION]: { x, y },
        [SPRITE]: [tree1, tree2][random(0, 1)],
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "bush" || cell === "seed" || cell === "seed_one") {
      entities.createGround(world, {
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [SPRITE]: bush,
        [RENDERABLE]: { generation: 0 },
      });

      if (cell === "seed" || cell === "seed_one") {
        createItemAsDrop(world, { x, y }, entities.createItem, {
          [ITEM]: {
            counter: "seed",
            amount: cell === "seed" ? distribution(80, 15, 5) + 1 : 1,
          },
          [SPRITE]: seed,
        });
      }
    } else if (cell === "grass" || cell === "herb" || cell === "herb_one") {
      entities.createGround(world, {
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [SPRITE]: flower,
        [RENDERABLE]: { generation: 0 },
      });
      if (cell === "herb" || cell === "herb_one") {
        createItemAsDrop(world, { x, y }, entities.createItem, {
          [ITEM]: {
            counter: "herb",
            amount: cell === "herb" ? distribution(80, 15, 5) + 1 : 1,
          },
          [SPRITE]: herb,
        });
      }
    } else if (cell === "coin_one") {
      const coinItem = createItemAsDrop(world, { x, y }, entities.createItem, {
        [ITEM]: {
          counter: "gold",
          amount: 1,
        },
        [SPRITE]: coin,
      });
      world.setIdentifier(world.assertById(coinItem[ITEM].carrier), "coin");
    } else if (cell === "cactus") {
      entities.createTerrain(world, {
        [FOG]: { visibility, type: "terrain" },
        [COLLIDABLE]: {},
        [POSITION]: { x, y },
        [SPRITE]: [cactus1, cactus2][random(0, 1)],
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "door" || cell === "house_door") {
      const doorEntity = entities.createDoor(world, {
        [FOG]: { visibility, type: "float" },
        [LIGHT]: { brightness: 0, darkness: 1, visibility: 0 },
        [LOCKABLE]: {
          locked: true,
          material: cell === "door" ? "gold" : undefined,
        },
        [NPC]: {},
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SEQUENCABLE]: { states: {} },
        [SPRITE]: cell === "door" ? doorClosedGold : doorClosedWood,
        [TOOLTIP]: {
          dialogs: [createDialog(cell === "door" ? "Locked" : "Closed")],
          persistent: false,
          nextDialog: 0,
        },
      });
      world.setIdentifier(doorEntity, cell);
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
    } else if (cell === "pot") {
      const potEntity = entities.createChest(world, {
        [ATTACKABLE]: { enemy: true },
        [COLLIDABLE]: {},
        [COUNTABLE]: { ...emptyCountable, hp: 5, maxHp: 5, gold: 3 },
        [DROPPABLE]: { decayed: false },
        [FOG]: { visibility, type: "terrain" },
        [INVENTORY]: { items: [], size: 1 },
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SEQUENCABLE]: { states: {} },
        [SPRITE]: pot,
        [TOOLTIP]: { dialogs: [], persistent: false, nextDialog: -1 },
      });
      world.setIdentifier(potEntity, "pot");
    } else if (cell === "compass") {
      const compassEntity = entities.createCompass(world, {
        [ITEM]: { amount: 1, slot: "compass", carrier: -1 },
        [ORIENTABLE]: {},
        [RENDERABLE]: { generation: 0 },
        [SEQUENCABLE]: { states: {} },
        [SPRITE]: compass,
        [TRACKABLE]: {},
      });
      world.setIdentifier(compassEntity, "compass");
      const chestEntity = entities.createChest(world, {
        [ATTACKABLE]: { enemy: true },
        [COLLIDABLE]: {},
        [COUNTABLE]: { ...emptyCountable, hp: 10, maxHp: 10 },
        [DROPPABLE]: { decayed: false },
        [INVENTORY]: { items: [world.getEntityId(compassEntity)], size: 1 },
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SEQUENCABLE]: { states: {} },
        [SPRITE]: chest,
        [TOOLTIP]: { dialogs: [], persistent: false, nextDialog: -1 },
      });
      compassEntity[ITEM].carrier = world.getEntityId(chestEntity);
      world.setIdentifier(chestEntity, "compass_chest");
    } else if (cell === "guide") {
      const guideEntity = entities.createVillager(world, {
        [ACTIONABLE]: { triggered: false },
        [ATTACKABLE]: { enemy: false },
        [BEHAVIOUR]: { patterns: [] },
        [COLLECTABLE]: {},
        [COUNTABLE]: { ...emptyCountable, hp: 20, maxHp: 20 },
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
        [SPRITE]: villager,
        [SWIMMABLE]: { swimming: false },
        [TOOLTIP]: {
          dialogs: [],
          persistent: true,
          nextDialog: -1,
        },
      });
      createItemInInventory(world, guideEntity, entities.createSword, {
        [ITEM]: { amount: 2, slot: "melee", material: "iron" },
        [ORIENTABLE]: {},
        [SEQUENCABLE]: { states: {} },
        [SPRITE]: ironSword,
      });
      createItemInInventory(world, guideEntity, entities.createItem, {
        [ITEM]: { amount: 1, slot: "armor", material: "wood" },
        [SPRITE]: woodShield,
      });
      npcSequence(world, guideEntity, "guideNpc");

      world.setIdentifier(guideEntity, "guide");
    } else if (cell === "mob" || cell === "triangle") {
      const { damage, pattern, items, sprite, hp } = generateMobStat(
        cell === "triangle"
          ? "spawnTriangle"
          : generateMobKey(greenMobDistribution)
      );

      const mobEntity = entities.createMob(world, {
        [ATTACKABLE]: { enemy: true },
        [BEHAVIOUR]: { patterns: [{ name: pattern, memory: {} }] },
        [COUNTABLE]: {
          ...emptyCountable,
          hp,
          maxHp: hp,
        },
        [DROPPABLE]: { decayed: false },
        [EQUIPPABLE]: {},
        [FOG]: { visibility, type: "unit" },
        [INVENTORY]: { items: [], size: 1 },
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
        [SPRITE]: sprite,
        [SWIMMABLE]: { swimming: false },
        [TOOLTIP]: { dialogs: [], persistent: true, nextDialog: -1 },
      });
      for (const item of items) {
        createItemInInventory(
          world,
          mobEntity,
          entities.createItem,
          {
            [ITEM]: item,
            [SPRITE]: getCountableSprite(item.counter, "drop"),
          },
          "inventoryOnly"
        );
      }

      // add claws for damage
      createItemInInventory(
        world,
        mobEntity,
        entities.createSword,
        {
          [ITEM]: { amount: damage, slot: "melee" },
          [ORIENTABLE]: {},
          [SEQUENCABLE]: { states: {} },
          [SPRITE]: none,
        },
        "equipOnly"
      );

      if (cell === "triangle") world.setIdentifier(mobEntity, "triangle");
    } else if (cell === "key") {
      const keyEntity = createItemAsDrop(world, { x, y }, entities.createItem, {
        [ITEM]: {
          amount: 1,
          consume: "key",
          material: "gold",
        },
        [SPRITE]: goldKey,
      });

      world.setIdentifier(keyEntity, "key");

      // add roof above key
      entities.createFloat(world, {
        [FOG]: { visibility: "visible", type: "float" },
        [POSITION]: { x, y },
        [SPRITE]: roofDown,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "house_left" || cell === "house_right") {
      entities.createWall(world, {
        [COLLIDABLE]: {},
        [FOG]: { visibility: "visible", type: "terrain" },
        [LIGHT]: {
          brightness: 0,
          darkness: 1,
          visibility: 0,
          orientation: cell === "house_left" ? "right" : "left",
        },
        [POSITION]: { x, y },
        [SPRITE]: cell === "house_left" ? houseLeft : houseRight,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "house") {
      entities.createWall(world, {
        [COLLIDABLE]: {},
        [FOG]: { visibility: "visible", type: "terrain" },
        [LIGHT]: { brightness: 0, darkness: 1, visibility: 0 },
        [POSITION]: { x, y },
        [SPRITE]: house,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "roof_left_up") {
      entities.createTerrain(world, {
        [COLLIDABLE]: {},
        [FOG]: { visibility: "visible", type: "float" },
        [POSITION]: { x, y },
        [SPRITE]: roofLeftUp,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "roof_up") {
      entities.createWall(world, {
        [COLLIDABLE]: {},
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
      entities.createTerrain(world, {
        [COLLIDABLE]: {},
        [FOG]: { visibility: "visible", type: "float" },
        [POSITION]: { x, y },
        [SPRITE]: roofUpRight,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "roof_down_left") {
      entities.createWall(world, {
        [COLLIDABLE]: {},
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
        [FOG]: { visibility: "visible", type: "float" },
        [POSITION]: { x, y },
        [SPRITE]: roofDown,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "roof_right_down") {
      entities.createWall(world, {
        [COLLIDABLE]: {},
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
      entities.createWall(world, {
        [COLLIDABLE]: {},
        [FOG]: { visibility: "visible", type: "terrain" },
        [LIGHT]: { brightness: 0, darkness: 1, visibility: 0 },
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
    [VIEWABLE]: { active: true },
  });
  npcSequence(world, viewpointEntity, "worldNpc");
  world.setIdentifier(viewpointEntity, "viewpoint");

  // add quest sign after exiting
  const signEntity = entities.createSign(world, {
    [FOG]: { visibility: "hidden", type: "terrain" },
    [COLLIDABLE]: {},
    [POSITION]: { x: 0, y: 12 },
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

  // start ordered systems
  world.addSystem(systems.setupMap);
  world.addSystem(systems.setupTick);
  world.addSystem(systems.setupAi);
  world.addSystem(systems.setupTrigger);
  world.addSystem(systems.setupCollect);
  world.addSystem(systems.setupDamage);
  world.addSystem(systems.setupMovement);
  world.addSystem(systems.setupBurn);
  world.addSystem(systems.setupAction);
  world.addSystem(systems.setupText);
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
