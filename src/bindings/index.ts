import { entities, World, systems } from "../engine";
import * as components from "../engine/components";
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
  chest,
  coin,
  compass,
  createText,
  door,
  flower,
  fog,
  gold,
  herb,
  iron,
  key,
  none,
  player,
  sand,
  seed,
  sword,
  tree1,
  tree2,
  triangle,
  wall,
  water,
  wood,
} from "../game/assets/sprites";
import { simplexNoiseMatrix, valueNoiseMatrix } from "../game/math/noise";
import * as colors from "../game/assets/colors";
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
import { menuArea } from "../game/assets/areas";
import { distribution, normalize, random } from "../game/math/std";
import { LOOTABLE } from "../engine/components/lootable";
import { EQUIPPABLE } from "../engine/components/equippable";
import { INVENTORY } from "../engine/components/inventory";
import { COUNTABLE } from "../engine/components/countable";
import { LOCKABLE } from "../engine/components/lockable";
import { TRACKABLE } from "../engine/components/trackable";
import { FOCUSABLE } from "../engine/components/focusable";
import { VIEWABLE } from "../engine/components/viewable";

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
    const spawn = spawnMatrix[x][y] * (menuDip ** 0.25);

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
      if (cell === "#") entity = "rock";
      else if (cell === "█") entity = "block";
      else if (cell === "▄") entity = "block_down";
      else if (cell === "▀") entity = "block_up";
      else if (cell === "◙") entity = "door";
      else if (cell === "╒") entity = "key";
      else if (cell === "/") entity = "sword";
      else if (cell === "¢") entity = "compass";
      else {
        entities.createBlock(world, {
          [COLLIDABLE]: {},
          [FOG]: { visibility: "visible", type: "terrain" },
          [POSITION]: { x, y },
          [SPRITE]: createText(cell, colors.grey)[0],
          [RENDERABLE]: { generation: 0 },
        });
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

  const heroId = world.getEntityId(
    entities.createHero(world, {
      [ANIMATABLE]: { states: {} },
      [ATTACKABLE]: { max: 10, enemy: false },
      [COLLIDABLE]: {},
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
      [INVENTORY]: { items: [] },
      [LIGHT]: { brightness: 0, visibility: 13, darkness: 0 },
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
      [POSITION]: { x: 0, y: 0 },
      [RENDERABLE]: { generation: 0 },
      [SPRITE]: player,
      [SWIMMABLE]: { swimming: false },
      [VIEWABLE]: { active: false },
    })
  );

  iterateMatrix(worldMatrix, (x, y, cell) => {
    const deltaX = size / 2 - Math.abs(x - size / 2);
    const deltaY = size / 2 - Math.abs(y - size / 2);
    const visibility =
      deltaX < menuRows[0].length / 2 &&
      deltaY < menuRows.length / 2 &&
      (y < menuRows.length / 2 - 2 || y > menuRows.length)
        ? "visible"
        : "hidden";

    entities.createTerrain(world, {
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
    } else if (cell === "gold") {
      const ironEntity = entities.createItem(world, {
        [ANIMATABLE]: { states: {} },
        [ITEM]: { amount: 1, counter: "gold" },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: gold,
      });
      const oreEntity = entities.createOre(world, {
        [INVENTORY]: { items: [world.getEntityId(ironEntity)] },
        [LOOTABLE]: { accessible: true, disposable: false },
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: wall,
        [LIGHT]: { brightness: 0, darkness: 1, visibility: 0 },
        [COLLIDABLE]: {},
      });
      ironEntity[ITEM].carrier = world.getEntityId(oreEntity);
    } else if (cell === "iron") {
      const ironEntity = entities.createItem(world, {
        [ANIMATABLE]: { states: {} },
        [ITEM]: { amount: distribution(80, 15, 5) + 1, counter: "iron" },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: iron,
      });
      const oreEntity = entities.createOre(world, {
        [INVENTORY]: { items: [world.getEntityId(ironEntity)] },
        [LOOTABLE]: { accessible: true, disposable: false },
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: wall,
        [LIGHT]: { brightness: 0, darkness: 1, visibility: 0 },
        [COLLIDABLE]: {},
      });
      ironEntity[ITEM].carrier = world.getEntityId(oreEntity);
    } else if (cell === "block") {
      entities.createBlock(world, {
        [FOG]: { visibility: "visible", type: "terrain" },
        [POSITION]: { x, y },
        [SPRITE]: block,
        [RENDERABLE]: { generation: 0 },
        [COLLIDABLE]: {},
      });
    } else if (cell === "block_down") {
      entities.createBlock(world, {
        [FOG]: { visibility: "visible", type: "terrain" },
        [POSITION]: { x, y },
        [SPRITE]: block_down,
        [RENDERABLE]: { generation: 0 },
        [COLLIDABLE]: {},
      });
    } else if (cell === "block_up") {
      entities.createBlock(world, {
        [FOG]: { visibility: "visible", type: "terrain" },
        [POSITION]: { x, y },
        [SPRITE]: block_up,
        [RENDERABLE]: { generation: 0 },
        [COLLIDABLE]: {},
      });
    } else if (cell === "sand") {
      entities.createTerrain(world, {
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
    } else if (cell === "wood") {
      const woodEntity = entities.createItem(world, {
        [ANIMATABLE]: { states: {} },
        [ITEM]: { amount: distribution(80, 15, 5) + 1, counter: "wood" },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: wood,
      });
      const containerEntity = entities.createContainer(world, {
        [INVENTORY]: { items: [world.getEntityId(woodEntity)] },
        [LOOTABLE]: { accessible: true, disposable: true },
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: none,
      });
      woodEntity[ITEM].carrier = world.getEntityId(containerEntity);
    } else if (cell === "fruit") {
      const [apple, tree] = [
        [apple1, tree1],
        [apple2, tree2],
      ][random(0, 1)];
      const appleEntity = entities.createItem(world, {
        [ANIMATABLE]: { states: {} },
        [ITEM]: { amount: 1, counter: "hp" },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: apple,
      });
      const fruitEntity = entities.createFruit(world, {
        [COLLIDABLE]: {},
        [FOG]: { visibility, type: "terrain" },
        [INVENTORY]: { items: [world.getEntityId(appleEntity)] },
        [LOOTABLE]: { accessible: true, disposable: false },
        [POSITION]: { x, y },
        [SPRITE]: tree,
        [RENDERABLE]: { generation: 0 },
      });
      appleEntity[ITEM].carrier = world.getEntityId(fruitEntity);
    } else if (cell === "tree") {
      entities.createBlock(world, {
        [FOG]: { visibility, type: "terrain" },
        [COLLIDABLE]: {},
        [POSITION]: { x, y },
        [SPRITE]: [tree1, tree2][random(0, 1)],
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "seed") {
      const seedEntity = entities.createItem(world, {
        [ANIMATABLE]: { states: {} },
        [ITEM]: { amount: distribution(80, 15, 5) + 1, counter: "seed" },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: seed,
      });
      const containerEntity = entities.createContainer(world, {
        [FOG]: { visibility, type: "terrain" },
        [INVENTORY]: { items: [world.getEntityId(seedEntity)] },
        [LOOTABLE]: { accessible: true, disposable: false },
        [POSITION]: { x, y },
        [SPRITE]: bush,
        [RENDERABLE]: { generation: 0 },
      });
      seedEntity[ITEM].carrier = world.getEntityId(containerEntity);
    } else if (cell === "bush") {
      entities.createTerrain(world, {
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [SPRITE]: bush,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "herb") {
      const herbEntity = entities.createItem(world, {
        [ANIMATABLE]: { states: {} },
        [ITEM]: { amount: distribution(80, 15, 5) + 1, counter: "herb" },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: herb,
      });
      const containerEntity = entities.createContainer(world, {
        [FOG]: { visibility, type: "terrain" },
        [INVENTORY]: { items: [world.getEntityId(herbEntity)] },
        [LOOTABLE]: { accessible: true, disposable: false },
        [POSITION]: { x, y },
        [SPRITE]: flower,
        [RENDERABLE]: { generation: 0 },
      });
      herbEntity[ITEM].carrier = world.getEntityId(containerEntity);
    } else if (cell === "grass") {
      entities.createTerrain(world, {
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [SPRITE]: flower,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "cactus") {
      entities.createBlock(world, {
        [FOG]: { visibility, type: "terrain" },
        [COLLIDABLE]: {},
        [POSITION]: { x, y },
        [SPRITE]: [cactus1, cactus2][random(0, 1)],
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "door") {
      const doorEntity = entities.createDoor(world, {
        [ANIMATABLE]: { states: {} },
        [FOG]: { visibility, type: "terrain" },
        [LIGHT]: { brightness: 0, darkness: 1, visibility: 0 },
        [LOCKABLE]: { locked: true },
        [NPC]: {},
        [ORIENTABLE]: {},
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: door,
      });
      components.addIdentifiable(world, doorEntity, { name: "door" });
    } else if (cell === "key") {
      const keyEntity = entities.createItem(world, {
        [ANIMATABLE]: { states: {} },
        [ITEM]: { amount: 1, slot: "key" },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: key,
      });
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
        [INVENTORY]: { items: [world.getEntityId(keyEntity)] },
        [LOOTABLE]: { accessible: false, disposable: true },
        [FOG]: { visibility, type: "terrain" },
        [NPC]: {},
        [ORIENTABLE]: { facing: "up" },
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: chest,
      });
      keyEntity[ITEM].carrier = world.getEntityId(chestEntity);
      components.addIdentifiable(world, chestEntity, { name: "key" });
    } else if (cell === "sword") {
      const swordEntity = entities.createSword(world, {
        [ANIMATABLE]: { states: {} },
        [ITEM]: { amount: 1, slot: "melee" },
        [ORIENTABLE]: {},
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: sword,
      });
      const containerEntity = entities.createContainer(world, {
        [INVENTORY]: { items: [world.getEntityId(swordEntity)] },
        [LOOTABLE]: { accessible: true, disposable: true },
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: chest,
      });
      swordEntity[ITEM].carrier = world.getEntityId(containerEntity);
      components.addIdentifiable(world, containerEntity, { name: "sword" });
    } else if (cell === "compass") {
      const compassEntity = entities.createCompass(world, {
        [ANIMATABLE]: { states: {} },
        [ITEM]: { amount: 1, slot: "compass" },
        [ORIENTABLE]: {},
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: compass,
        [TRACKABLE]: { target: heroId },
      });
      const containerEntity = entities.createContainer(world, {
        [INVENTORY]: { items: [world.getEntityId(compassEntity)] },
        [LOOTABLE]: { accessible: true, disposable: true },
        [FOG]: { visibility, type: "terrain" },
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: none,
      });
      compassEntity[ITEM].carrier = world.getEntityId(containerEntity);
      components.addIdentifiable(world, containerEntity, { name: "compass" });
    } else if (cell === "triangle") {
      const clawsEntity = entities.createSword(world, {
        [ANIMATABLE]: { states: {} },
        [ITEM]: { amount: 3, slot: "melee" },
        [ORIENTABLE]: {},
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: none,
      });
      const goldEntity = entities.createItem(world, {
        [ANIMATABLE]: { states: {} },
        [ITEM]: { amount: 1, counter: "gold" },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: coin,
      });
      const triangleEntity = entities.createTriangle(world, {
        [ANIMATABLE]: { states: {} },
        [ATTACKABLE]: { max: 3, enemy: true },
        [BEHAVIOUR]: { patterns: ["triangle"] },
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
        [EQUIPPABLE]: { melee: world.getEntityId(clawsEntity) },
        [FOG]: { visibility, type: "unit" },
        [INVENTORY]: {
          items: [world.getEntityId(goldEntity)],
        },
        [LOOTABLE]: { accessible: false, disposable: true },
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
      });
      clawsEntity[ITEM].carrier = world.getEntityId(triangleEntity);
      goldEntity[ITEM].carrier = world.getEntityId(triangleEntity);
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

  entities.createHighlight(world, {
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
    [FOCUSABLE]: { pendingTarget: heroId },
    [MOVABLE]: {
      orientations: [],
      reference: world.getEntityId(animationEntity),
      spring: {
        duration: 200,
      },
      lastInteraction: 0,
    },
    [POSITION]: { x: 0, y: 0 },
    [RENDERABLE]: { generation: 0 },
    [SPRITE]: none,
  });

  // create main quest entity with itself as reference frame
  const questEntity = entities.createQuest(world, {
    [ANIMATABLE]: {
      states: {
        quest: {
          name: "mainQuest",
          reference: world.getEntityId(world.metadata.gameEntity),
          elapsed: 0,
          args: { step: "move" },
          particles: {},
        },
      },
    },
    [POSITION]: { x: 0, y: 0 },
    [REFERENCE]: {
      tick: -1,
      delta: 0,
      suspended: false,
      suspensionCounter: -1,
    },
    [RENDERABLE]: { generation: 1 },
    [SPRITE]: none,
    [VIEWABLE]: { active: true },
  });
  questEntity[ANIMATABLE].states.quest.reference =
    world.getEntityId(questEntity);

  // create torch for menu area
  entities.createTorch(world, {
    [LIGHT]: { brightness: 13, darkness: 0, visibility: 0 },
    [POSITION]: { x: 0, y: 0 },
    [RENDERABLE]: { generation: 0 },
    [SPRITE]: none,
  });

  world.addSystem(systems.setupMap);
  world.addSystem(systems.setupTick);
  world.addSystem(systems.setupAi);
  world.addSystem(systems.setupCollect);
  world.addSystem(systems.setupDamage);
  world.addSystem(systems.setupUnlock);
  world.addSystem(systems.setupMovement);
  world.addSystem(systems.setupAnimate);
  world.addSystem(systems.setupNeedle);
  world.addSystem(systems.setupFocus);
  world.addSystem(systems.setupDrop);
  world.addSystem(systems.setupImmersion);
  world.addSystem(systems.setupVisibility);
  world.addSystem(systems.setupRenderer);
};
