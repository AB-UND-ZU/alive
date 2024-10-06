import { entities, World, systems } from "../engine";
import { POSITION } from "../engine/components/position";
import { SPRITE } from "../engine/components/sprite";
import { LIGHT } from "../engine/components/light";
import { PLAYER } from "../engine/components/player";
import { RENDERABLE } from "../engine/components/renderable";
import { MOVABLE } from "../engine/components/movable";
import { REFERENCE } from "../engine/components/reference";
import { COLLIDABLE } from "../engine/components/collidable";
import {
  apple1,
  apple2,
  block,
  block_down,
  block_up,
  bush,
  cactus1,
  cactus2,
  campfire,
  chest,
  coin,
  compass,
  createDialog,
  fireSword,
  flower,
  fog,
  gold,
  goldKey,
  herb,
  iron,
  ironKey,
  ironShield,
  lockedGold,
  lockedIron,
  none,
  player,
  pot,
  sand,
  seed,
  tree1,
  tree2,
  triangle,
  villager,
  wall,
  water,
  wood,
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
import { ANIMATABLE } from "../engine/components/animatable";
import { aspectRatio } from "../components/Dimensions/sizing";
import { initialPosition, menuArea } from "../game/assets/areas";
import { distribution, normalize, random } from "../game/math/std";
import { LOOTABLE } from "../engine/components/lootable";
import { EQUIPPABLE } from "../engine/components/equippable";
import { INVENTORY } from "../engine/components/inventory";
import { COUNTABLE } from "../engine/components/countable";
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
  window,
} from "../game/assets/sprites/structures";
import { BURNABLE } from "../engine/components/burnable";

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
    const deltaX = size / 2 - Math.abs(x - size / 2);
    const deltaY = size / 2 - Math.abs(y - size / 2);

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
    if (spawn < -96) return "triangle";

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
      else if (cell === "◙") entity = "door";
      else if (cell === "◘") entity = "gold_one";
      else if (cell === "÷") entity = "iron_one";
      else if (cell === "o") entity = "pot";
      else if (cell === "¢") entity = "compass";
      else if (cell === "#") entity = "tree";
      else if (cell === "=") entity = "wood_two";
      else if (cell === ".") entity = "fruit";
      else if (cell === "τ") entity = "bush";
      else if (cell === "°") entity = "seed_one";
      else if (cell === ",") entity = "grass";
      else if (cell === "•") entity = "herb_one";
      else if (cell === "♀") entity = "guide";
      else if (cell === "►") entity = "triangle_spawn";
      else if (cell === "*") entity = "campfire";
      else if (cell === "↔") entity = "key";
      else if (cell === "├") entity = "house_left";
      else if (cell === "┤") entity = "house_right";
      else if (cell === "┼") entity = "house";
      else if (cell === "┴") entity = "house_window";
      else if (cell === "Φ") entity = "house_door";
      else if (cell === "╕") entity = "roof_left_up";
      else if (cell === "═") entity = "roof_up";
      else if (cell === "╒") entity = "roof_up_right";
      else if (cell === "╡") entity = "roof_down_left";
      else if (cell === "─") entity = "roof_down";
      else if (cell === "╞") entity = "roof_right_down";
      else {
        console.error(`Unrecognized cell: ${cell}!`);
      }

      worldMatrix[x][y] = entity;
    });
  });

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

  const heroEntity = entities.createHero(world, {
    [ACTIONABLE]: { triggered: false },
    [ANIMATABLE]: { states: {} },
    [ATTACKABLE]: { max: 10, enemy: false },
    [COUNTABLE]: {
      hp: 10,
      mp: 0,
      xp: 10,
      gold: 0,
      wood: 0,
      iron: 0,
      herb: 0,
      seed: 0,
    },
    [EQUIPPABLE]: {},
    [FOG]: { visibility: "visible", type: "unit" },
    [INVENTORY]: { items: [], size: 20 },
    [LIGHT]: { brightness: 13, visibility: 13, darkness: 0 },
    [MELEE]: {},
    [MOVABLE]: {
      orientations: [],
      reference: frameId,
      spring: {
        mass: 0.1,
        friction: 50,
        tension: 1000,
      },
      lastInteraction: 0,
    },
    [ORIENTABLE]: {},
    [PLAYER]: {},
    [POSITION]: { ...initialPosition },
    [RENDERABLE]: { generation: 0 },
    [SPRITE]: player,
    [SWIMMABLE]: { swimming: false },
    [VIEWABLE]: { active: false },
  });
  const heroId = world.getEntityId(heroEntity);
  world.setIdentifier(heroEntity, "hero");

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

    if (cell === "rock") {
      entities.createWall(world, {
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [SPRITE]: wall,
        [LIGHT]: { brightness: 0, darkness: 1, visibility: 0 },
        [RENDERABLE]: { generation: 0 },
        [COLLIDABLE]: {},
      });
    } else if (cell === "gold" || cell === "gold_one") {
      const ironEntity = entities.createItem(world, {
        [ITEM]: { amount: 1, counter: "gold" },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: gold,
      });
      const oreEntity = entities.createOre(world, {
        [INVENTORY]: { items: [world.getEntityId(ironEntity)], size: 1 },
        [LOOTABLE]: { disposable: false },
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: wall,
        [LIGHT]: { brightness: 0, darkness: 1, visibility: 0 },
        [COLLIDABLE]: {},
      });
      ironEntity[ITEM].carrier = world.getEntityId(oreEntity);

      if (cell === "gold_one") world.setIdentifier(oreEntity, "gold");
    } else if (cell === "iron" || cell === "iron_one") {
      const ironEntity = entities.createItem(world, {
        [ITEM]: {
          amount: cell === "iron" ? distribution(80, 15, 5) + 1 : 1,
          counter: "iron",
        },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: iron,
      });
      const oreEntity = entities.createOre(world, {
        [INVENTORY]: { items: [world.getEntityId(ironEntity)], size: 1 },
        [LOOTABLE]: { disposable: false },
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: wall,
        [LIGHT]: { brightness: 0, darkness: 1, visibility: 0 },
        [COLLIDABLE]: {},
      });
      ironEntity[ITEM].carrier = world.getEntityId(oreEntity);
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
        [SPRITE]: block_down,
        [RENDERABLE]: { generation: 0 },
        [COLLIDABLE]: {},
      });
    } else if (cell === "block_up") {
      entities.createTerrain(world, {
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [SPRITE]: block_up,
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
      const woodEntity = entities.createItem(world, {
        [ITEM]: {
          amount: cell === "wood" ? distribution(80, 15, 5) + 1 : 2,
          counter: "wood",
        },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: wood,
      });
      const containerEntity = entities.createContainer(world, {
        [ANIMATABLE]: { states: {} },
        [INVENTORY]: { items: [world.getEntityId(woodEntity)], size: 1 },
        [LOOTABLE]: { disposable: true },
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: none,
        [SWIMMABLE]: { swimming: false },
        [TOOLTIP]: { dialogs: [], persistent: false, nextDialog: -1 },
      });
      woodEntity[ITEM].carrier = world.getEntityId(containerEntity);
      if (cell === "wood_two") world.setIdentifier(containerEntity, "wood_two");
    } else if (cell === "fruit") {
      const [apple, tree] = [
        [apple1, tree1],
        [apple2, tree2],
      ][random(0, 1)];
      const appleEntity = entities.createItem(world, {
        [ITEM]: { amount: 1, counter: "hp" },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: apple,
      });
      const fruitEntity = entities.createFruit(world, {
        [COLLIDABLE]: {},
        [FOG]: { visibility, type: "terrain" },
        [INVENTORY]: { items: [world.getEntityId(appleEntity)], size: 1 },
        [LOOTABLE]: { disposable: false },
        [POSITION]: { x, y },
        [SPRITE]: tree,
        [RENDERABLE]: { generation: 0 },
      });
      appleEntity[ITEM].carrier = world.getEntityId(fruitEntity);
    } else if (cell === "tree") {
      entities.createTerrain(world, {
        [FOG]: { visibility, type: "terrain" },
        [COLLIDABLE]: {},
        [POSITION]: { x, y },
        [SPRITE]: [tree1, tree2][random(0, 1)],
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "seed" || cell === "seed_one") {
      const seedEntity = entities.createItem(world, {
        [ITEM]: {
          amount: cell === "seed" ? distribution(80, 15, 5) + 1 : 1,
          counter: "seed",
        },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: seed,
      });
      const containerEntity = entities.createContainer(world, {
        [ANIMATABLE]: { states: {} },
        [FOG]: { visibility, type: "terrain" },
        [INVENTORY]: { items: [world.getEntityId(seedEntity)], size: 1 },
        [LOOTABLE]: { disposable: false },
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: bush,
        [SWIMMABLE]: { swimming: false },
        [TOOLTIP]: { dialogs: [], persistent: false, nextDialog: -1 },
      });
      seedEntity[ITEM].carrier = world.getEntityId(containerEntity);
    } else if (cell === "bush") {
      entities.createGround(world, {
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [SPRITE]: bush,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "herb" || cell === "herb_one") {
      const herbEntity = entities.createItem(world, {
        [ITEM]: {
          amount: cell === "herb" ? distribution(80, 15, 5) + 1 : 1,
          counter: "herb",
        },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: herb,
      });
      const containerEntity = entities.createContainer(world, {
        [ANIMATABLE]: { states: {} },
        [FOG]: { visibility, type: "terrain" },
        [INVENTORY]: { items: [world.getEntityId(herbEntity)], size: 1 },
        [LOOTABLE]: { disposable: false },
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: flower,
        [SWIMMABLE]: { swimming: false },
        [TOOLTIP]: { dialogs: [], persistent: false, nextDialog: -1 },
      });
      herbEntity[ITEM].carrier = world.getEntityId(containerEntity);
    } else if (cell === "grass") {
      entities.createGround(world, {
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [SPRITE]: flower,
        [RENDERABLE]: { generation: 0 },
      });
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
        [ANIMATABLE]: { states: {} },
        [FOG]: { visibility, type: "float" },
        [LIGHT]: { brightness: 0, darkness: 1, visibility: 0 },
        [LOCKABLE]: {
          locked: true,
          material: cell === "door" ? "gold" : "iron",
        },
        [NPC]: {},
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: cell === "door" ? lockedGold : lockedIron,
        [TOOLTIP]: {
          dialogs: [createDialog("Locked")],
          persistent: false,
          nextDialog: 0,
        },
      });
      if (cell === "house_door") world.setIdentifier(doorEntity, "door");
    } else if (cell === "campfire") {
      entities.createFire(world, {
        [ANIMATABLE]: { states: {} },
        [BURNABLE]: { burning: true, eternal: true },
        [COLLIDABLE]: {},
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: campfire,
        [TOOLTIP]: { dialogs: [], persistent: false, nextDialog: -1 },
      });
    } else if (cell === "pot") {
      const coinEntity = entities.createItem(world, {
        [ITEM]: { amount: 3, counter: "gold" },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: coin,
      });
      const chestEntity = entities.createChest(world, {
        [ANIMATABLE]: { states: {} },
        [ATTACKABLE]: { max: 3, enemy: true },
        [COLLIDABLE]: {},
        [COUNTABLE]: {
          hp: 3,
          mp: 0,
          xp: 0,
          gold: 0,
          wood: 0,
          iron: 0,
          herb: 0,
          seed: 0,
        },
        [DROPPABLE]: { decayed: false },
        [FOG]: { visibility, type: "terrain" },
        [INVENTORY]: { items: [world.getEntityId(coinEntity)], size: 1 },
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: pot,
        [TOOLTIP]: { dialogs: [], persistent: false, nextDialog: -1 },
      });
      coinEntity[ITEM].carrier = world.getEntityId(chestEntity);
      world.setIdentifier(chestEntity, "pot");
    } else if (cell === "compass") {
      const compassEntity = entities.createCompass(world, {
        [ANIMATABLE]: { states: {} },
        [ITEM]: { amount: 1, slot: "compass" },
        [ORIENTABLE]: {},
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: compass,
        [TRACKABLE]: { target: heroId },
      });
      world.setIdentifier(compassEntity, "compass");
      const chestEntity = entities.createChest(world, {
        [ANIMATABLE]: { states: {} },
        [ATTACKABLE]: { max: 10, enemy: true },
        [COLLIDABLE]: {},
        [COUNTABLE]: {
          hp: 10,
          mp: 0,
          xp: 0,
          gold: 0,
          wood: 0,
          iron: 0,
          herb: 0,
          seed: 0,
        },
        [DROPPABLE]: { decayed: false },
        [INVENTORY]: { items: [world.getEntityId(compassEntity)], size: 1 },
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: chest,
        [TOOLTIP]: { dialogs: [], persistent: false, nextDialog: -1 },
      });
      compassEntity[ITEM].carrier = world.getEntityId(chestEntity);
      world.setIdentifier(chestEntity, "compass_chest");
    } else if (cell === "guide") {
      // create reference frame for spawn quest
      const animationEntity = entities.createFrame(world, {
        [REFERENCE]: {
          tick: -1,
          delta: 0,
          suspended: false,
          suspensionCounter: -1,
        },
        [RENDERABLE]: { generation: 1 },
      });
      const swordEntity = entities.createSword(world, {
        [ANIMATABLE]: { states: {} },
        [ITEM]: { amount: 3, slot: "melee", material: "fire" },
        [ORIENTABLE]: {},
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: fireSword,
      });
      const keyEntity = entities.createItem(world, {
        [ITEM]: { amount: 1, consume: "key", material: "iron" },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: ironKey,
      });
      const shieldEntity = entities.createItem(world, {
        [ITEM]: { amount: 2, slot: "armor", material: "iron" },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: ironShield,
      });

      const guideEntity = entities.createNpc(world, {
        [ACTIONABLE]: { triggered: false },
        [ANIMATABLE]: {
          states: {
            quest: {
              name: "spawnQuest",
              reference: world.getEntityId(animationEntity),
              elapsed: 0,
              args: { step: "initial" },
              particles: {},
            },
          },
        },
        [ATTACKABLE]: { max: 50, enemy: false },
        [BEHAVIOUR]: { patterns: [] },
        [COUNTABLE]: {
          hp: 50,
          mp: 0,
          xp: 50,
          gold: 0,
          wood: 0,
          iron: 0,
          herb: 0,
          seed: 0,
        },
        [DROPPABLE]: { decayed: false },
        [EQUIPPABLE]: {
          melee: world.getEntityId(swordEntity),
          armor: world.getEntityId(shieldEntity),
        },
        [FOG]: { visibility, type: "unit" },
        [INVENTORY]: { items: [world.getEntityId(keyEntity)], size: 5 },
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
        [SPRITE]: villager,
        [SWIMMABLE]: { swimming: false },
        [TOOLTIP]: {
          dialogs: [],
          persistent: false,
          nextDialog: -1,
        },
      });
      const guideId = world.getEntityId(guideEntity);
      swordEntity[ITEM].carrier = guideId;
      shieldEntity[ITEM].carrier = guideId;
      world.setIdentifier(guideEntity, "guide");
    } else if (cell === "triangle" || cell === "triangle_spawn") {
      const clawsEntity = entities.createSword(world, {
        [ANIMATABLE]: { states: {} },
        [ITEM]: { amount: 1, slot: "melee" },
        [ORIENTABLE]: {},
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: none,
      });
      const goldEntity = entities.createItem(world, {
        [ITEM]: { amount: 1, counter: "gold" },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: coin,
      });
      const triangleEntity = entities.createNpc(world, {
        [ACTIONABLE]: { triggered: false },
        [ANIMATABLE]: { states: {} },
        [ATTACKABLE]: { max: 2, enemy: true },
        [BEHAVIOUR]: { patterns: [{ name: "triangle", memory: {} }] },
        [COUNTABLE]: {
          hp: 2,
          mp: 0,
          xp: 0,
          gold: 0,
          wood: 0,
          iron: 0,
          herb: 0,
          seed: 0,
        },
        [DROPPABLE]: { decayed: false },
        [EQUIPPABLE]: { melee: world.getEntityId(clawsEntity) },
        [FOG]: { visibility, type: "unit" },
        [INVENTORY]: { items: [world.getEntityId(goldEntity)], size: 1 },
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
        [SPRITE]: triangle,
        [SWIMMABLE]: { swimming: false },
        [TOOLTIP]: { dialogs: [], persistent: true, nextDialog: -1 },
      });
      clawsEntity[ITEM].carrier = world.getEntityId(triangleEntity);
      goldEntity[ITEM].carrier = world.getEntityId(triangleEntity);

      if (cell === "triangle_spawn")
        world.setIdentifier(triangleEntity, "triangle");
    } else if (cell === "key") {
      const keyEntity = entities.createItem(world, {
        [ITEM]: {
          amount: 1,
          consume: "key",
          material: "gold",
        },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: goldKey,
      });
      const containerEntity = entities.createContainer(world, {
        [ANIMATABLE]: { states: {} },
        [FOG]: { visibility, type: "terrain" },
        [INVENTORY]: { items: [world.getEntityId(keyEntity)], size: 1 },
        [LOOTABLE]: { disposable: true },
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: none,
        [SWIMMABLE]: { swimming: false },
        [TOOLTIP]: { dialogs: [], persistent: false, nextDialog: -1 },
      });
      keyEntity[ITEM].carrier = world.getEntityId(containerEntity);
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
      entities.createTerrain(world, {
        [COLLIDABLE]: {},
        [FOG]: { visibility: "visible", type: "float" },
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
  const animationEntity = entities.createFrame(world, {
    [REFERENCE]: {
      tick: -1,
      delta: 0,
      suspended: false,
      suspensionCounter: -1,
    },
    [RENDERABLE]: { generation: 1 },
  });

  const highlighEntity = entities.createHighlight(world, {
    [ANIMATABLE]: {
      states: {
        focus: {
          name: "focusCircle",
          reference: world.getEntityId(animationEntity),
          elapsed: 0,
          args: { offset: 0 },
          particles: {},
        },
      },
    },
    [FOCUSABLE]: {},
    [MOVABLE]: {
      orientations: [],
      reference: world.getEntityId(animationEntity),
      spring: {
        duration: 200,
      },
      lastInteraction: 0,
    },
    [POSITION]: { ...initialPosition },
    [RENDERABLE]: { generation: 0 },
    [SPRITE]: none,
  });
  world.setIdentifier(highlighEntity, "focus");

  // create viewpoimt for menu area
  const viewpointEntity = entities.createViewpoint(world, {
    [POSITION]: { x: 0, y: 0 },
    [RENDERABLE]: { generation: 0 },
    [SPRITE]: none,
    [VIEWABLE]: { active: true },
  });
  world.setIdentifier(viewpointEntity, "viewpoint");

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
  world.addSystem(systems.setupAnimate);
  world.addSystem(systems.setupNeedle);
  world.addSystem(systems.setupFocus);
  world.addSystem(systems.setupDrop);
  world.addSystem(systems.setupImmersion);
  world.addSystem(systems.setupVisibility);
  world.addSystem(systems.setupRenderer);
};
