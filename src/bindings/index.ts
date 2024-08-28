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
  block,
  block_down,
  block_up,
  bush,
  cactus1,
  cactus2,
  createText,
  door,
  flower,
  fog,
  none,
  player,
  sand,
  sword,
  tree1,
  tree2,
  triangle,
  wall,
  water,
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
import { INVENTORY } from "../engine/components/inventory";
import { ITEM } from "../engine/components/item";
import { ORIENTABLE } from "../engine/components/orientable";
import { ANIMATABLE } from "../engine/components/animatable";
import { aspectRatio } from "../components/Dimensions/sizing";
import { menuArea } from "../game/assets/areas";
import { normalize } from "../game/math/std";

export const generateWorld = async (world: World) => {
  const size = world.metadata.gameEntity[LEVEL].size;

  const elevationMatrix = simplexNoiseMatrix(size, size, 0, -50, 100, 1);
  const terrainMatrix = simplexNoiseMatrix(size, size, 0, -40, 100, 1 / 2);
  const temperatureMatrix = simplexNoiseMatrix(size, size, 0, -80, 100, 4);
  const greenMatrix = valueNoiseMatrix(size, size, 1, -80, 100);
  const spawnMatrix = valueNoiseMatrix(size, size, 0, -100, 100);

  const worldMatrix = matrixFactory<string>(size, size, (x, y) => {
    // distance from zero
    const deltaX = size / 2 - Math.abs(x - size / 2);
    const deltaY = size / 2 - Math.abs(y - size / 2);

    // clear square menu area
    if (deltaX <= 9 && deltaY <= 6) return "";

    // clear triangular exit
    if (y > 6 && y < 12 && y > 5 + deltaX) return "";

    const distance = Math.sqrt((deltaX * aspectRatio) ** 2 + deltaY ** 2);

    // create clean elevation around menu
    const menu = 100000 / distance ** 4;
    const menuElevation = Math.min(35, menu * 2);
    const menuDip = 1 / (1 + menu / 2);

    const elevation = elevationMatrix[x][y] * menuDip + menuElevation;
    const terrain = terrainMatrix[x][y] * menuDip + menuElevation;
    const temperature = temperatureMatrix[x][y] * menuDip;
    const green = greenMatrix[x][y] * menuDip;
    const spawn = spawnMatrix[x][y] * menuDip;

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
      return temperature < 0 && terrain < 75 && menu < 5 ? "tree" : "rock";

    // desert, oasis and cactus
    if (temperature > 65 && terrain > 70) return "water";
    if (temperature > 65) return 20 < green && green < 25 ? "cactus" : "sand";

    // greens
    if (green > 30) return "tree";
    if (green > 20) return "bush";
    if (green > 10) return "grass";

    // npcs
    if (spawn < -96) return "triangle";

    return "";
  });

  // insert menu
  const rows = menuArea.split("\n");
  rows.forEach((row, rowIndex) => {
    row.split("").forEach((cell, columnIndex) => {
      if (cell === " ") return;

      const x = normalize(columnIndex - (row.length - 1) / 2, size);
      const y = normalize(rowIndex - (rows.length - 1) / 2, size);
      let entity = "";
      if (cell === "#") entity = "rock";
      else if (cell === "█") entity = "block";
      else if (cell === "▄") entity = "block_down";
      else if (cell === "▀") entity = "block_up";
      else if (cell === "◙") entity = "door";
      else {
        entities.createText(world, {
          [COLLIDABLE]: {},
          [POSITION]: { x, y },
          [SPRITE]: createText(cell),
          [RENDERABLE]: { generation: 0 },
        });
      }

      worldMatrix[x][y] = entity;
    });
  });

  iterateMatrix(worldMatrix, (x, y, cell) => {
    const deltaX = size / 2 - Math.abs(x - size / 2);
    const deltaY = size / 2 - Math.abs(y - size / 2);
    const visibility = deltaX <= 10 && deltaY <= 6 ? "visible" : "hidden";

    entities.createAir(world, {
      [FOG]: { visibility },
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [SPRITE]: fog,
    });

    if (cell === "rock") {
      entities.createWall(world, {
        [FOG]: { visibility },
        [POSITION]: { x, y },
        [SPRITE]: wall,
        [LIGHT]: { brightness: 0, darkness: 1 },
        [RENDERABLE]: { generation: 0 },
        [COLLIDABLE]: {},
      });
    } else if (cell === "block") {
      entities.createWall(world, {
        [FOG]: { visibility },
        [POSITION]: { x, y },
        [SPRITE]: block,
        [LIGHT]: { brightness: 0, darkness: 1 },
        [RENDERABLE]: { generation: 0 },
        [COLLIDABLE]: {},
      });
    } else if (cell === "block_down") {
      entities.createWall(world, {
        [FOG]: { visibility },
        [POSITION]: { x, y },
        [SPRITE]: block_down,
        [LIGHT]: { brightness: 0, darkness: 1 },
        [RENDERABLE]: { generation: 0 },
        [COLLIDABLE]: {},
      });
    } else if (cell === "block_up") {
      entities.createWall(world, {
        [FOG]: { visibility },
        [POSITION]: { x, y },
        [SPRITE]: block_up,
        [LIGHT]: { brightness: 0, darkness: 1 },
        [RENDERABLE]: { generation: 0 },
        [COLLIDABLE]: {},
      });
    } else if (cell === "sand") {
      entities.createSand(world, {
        [FOG]: { visibility },
        [POSITION]: { x, y },
        [SPRITE]: sand,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "water") {
      entities.createWater(world, {
        [FOG]: { visibility },
        [IMMERSIBLE]: {},
        [POSITION]: { x, y },
        [SPRITE]: water,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "tree") {
      entities.createTree(world, {
        [FOG]: { visibility },
        [POSITION]: { x, y },
        [SPRITE]: Math.random() < 0.5 ? tree1 : tree2,
        [RENDERABLE]: { generation: 0 },
        [COLLIDABLE]: {},
      });
    } else if (cell === "bush") {
      entities.createBush(world, {
        [FOG]: { visibility },
        [POSITION]: { x, y },
        [SPRITE]: bush,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "grass") {
      entities.createFlower(world, {
        [FOG]: { visibility },
        [POSITION]: { x, y },
        [SPRITE]: flower,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "cactus") {
      entities.createCactus(world, {
        [FOG]: { visibility },
        [POSITION]: { x, y },
        [SPRITE]: Math.random() < 0.5 ? cactus1 : cactus2,
        [RENDERABLE]: { generation: 0 },
        [COLLIDABLE]: {},
      });
    } else if (cell === "door") {
      entities.createDoor(world, {
        [ANIMATABLE]: { states: {} },
        [ATTACKABLE]: { max: 10, hp: 10, enemy: true },
        [COLLIDABLE]: {},
        [FOG]: { visibility },
        [LIGHT]: { brightness: 0, darkness: 1 },
        [NPC]: {},
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: door,
      });
    } else if (cell === "triangle") {
      const clawsId = world.getEntityId(
        entities.createSword(world, {
          [ANIMATABLE]: { states: {} },
          [ITEM]: { dmg: 3 },
          [ORIENTABLE]: {},
          [RENDERABLE]: { generation: 0 },
          [SPRITE]: none,
        })
      );
      entities.createTriangle(world, {
        [ANIMATABLE]: { states: {} },
        [ATTACKABLE]: { max: 3, hp: 3, enemy: true },
        [BEHAVIOUR]: { patterns: ["triangle"] },
        [COLLIDABLE]: {},
        [FOG]: { visibility },
        [MELEE]: { item: clawsId },
        [MOVABLE]: {
          orientations: [],
          reference: world.getEntityId(world.metadata.gameEntity),
          spring: {
            duration: 200,
          },
        },
        [NPC]: {},
        [ORIENTABLE]: {},
        [POSITION]: { x, y },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: triangle,
        [SWIMMABLE]: { swimming: false },
      });
    }
  });

  const swordId = world.getEntityId(
    entities.createSword(world, {
      [ANIMATABLE]: { states: {} },
      [ITEM]: { dmg: 1 },
      [ORIENTABLE]: {},
      [RENDERABLE]: { generation: 0 },
      [SPRITE]: sword,
    })
  );

  const frameId = world.getEntityId(
    entities.createFrame(world, {
      [REFERENCE]: {
        tick: 250,
        delta: 0,
        suspended: true,
        pendingSuspended: false,
      },
      [RENDERABLE]: { generation: 0 },
    })
  );

  entities.createHero(world, {
    [ANIMATABLE]: { states: {} },
    [ATTACKABLE]: { max: 10, hp: 10, enemy: false },
    [COLLIDABLE]: {},
    [INVENTORY]: { items: [swordId] },
    [LIGHT]: { brightness: 5.55, darkness: 0 },
    [MELEE]: { item: swordId },
    [MOVABLE]: {
      orientations: [],
      reference: frameId,
      spring: {
        mass: 0.1,
        friction: 50,
        tension: 1000,
      },
    },
    [ORIENTABLE]: {},
    [PLAYER]: {},
    [POSITION]: { x: 0, y: 0 },
    [RENDERABLE]: { generation: 0 },
    [SPRITE]: player,
    [SWIMMABLE]: { swimming: false },
  });

  world.addSystem(systems.setupMap);
  world.addSystem(systems.setupTick);
  world.addSystem(systems.setupAi);
  world.addSystem(systems.setupDamage);
  world.addSystem(systems.setupMovement);
  world.addSystem(systems.setupImmersion);
  world.addSystem(systems.setupLoot);
  world.addSystem(systems.setupAnimate);
  world.addSystem(systems.setupVisibility);
  world.addSystem(systems.setupRenderer);
};
