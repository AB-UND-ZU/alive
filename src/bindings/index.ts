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
  bush,
  cactus1,
  cactus2,
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

export const generateWorld = async (world: World) => {
  const size = world.metadata.gameEntity[LEVEL].size;

  const elevationMatrix = simplexNoiseMatrix(size, size, 0, -50, 100, 1);
  const terrainMatrix = simplexNoiseMatrix(size, size, 0, -40, 100, 1 / 2);
  const temperatureMatrix = simplexNoiseMatrix(size, size, 0, -80, 100, 4);
  const greenMatrix = valueNoiseMatrix(size, size, 1, -80, 100);
  const spawnMatrix = valueNoiseMatrix(size, size, 0, -100, 100);

  const worldMatrix = matrixFactory(size, size, (x, y) => {
    const elevation = elevationMatrix[x][y];
    const terrain = terrainMatrix[x][y];
    const temperature = temperatureMatrix[x][y];
    const green = greenMatrix[x][y];
    const spawn = spawnMatrix[x][y];

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
      return temperature < 0 && terrain < 75 ? "tree" : "rock";

    // desert, oasis and cactus
    if (temperature > 65 && terrain > 70) return "water";
    if (temperature > 65) return 20 < green && green < 25 ? "cactus" : "sand";

    // greens
    if (green > 30) return "tree";
    if (green > 20) return "bush";
    if (green > 10) return "flower";

    // npcs
    if (spawn < -96) return "triangle";
  });

  iterateMatrix(worldMatrix, (x, y, cell) => {
    entities.createAir(world, {
      [FOG]: { visibility: "hidden" },
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [SPRITE]: fog,
    });

    if (cell === "rock") {
      entities.createWall(world, {
        [FOG]: { visibility: "hidden" },
        [POSITION]: { x, y },
        [SPRITE]: wall,
        [LIGHT]: { brightness: 0, darkness: 1 },
        [RENDERABLE]: { generation: 0 },
        [COLLIDABLE]: {},
      });
    } else if (cell === "sand") {
      entities.createSand(world, {
        [FOG]: { visibility: "hidden" },
        [POSITION]: { x, y },
        [SPRITE]: sand,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "water") {
      entities.createWater(world, {
        [FOG]: { visibility: "hidden" },
        [IMMERSIBLE]: {},
        [POSITION]: { x, y },
        [SPRITE]: water,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "tree") {
      entities.createTree(world, {
        [FOG]: { visibility: "hidden" },
        [POSITION]: { x, y },
        [SPRITE]: Math.random() < 0.5 ? tree1 : tree2,
        [RENDERABLE]: { generation: 0 },
        [COLLIDABLE]: {},
      });
    } else if (cell === "bush") {
      entities.createBush(world, {
        [FOG]: { visibility: "hidden" },
        [POSITION]: { x, y },
        [SPRITE]: bush,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "flower") {
      entities.createFlower(world, {
        [FOG]: { visibility: "hidden" },
        [POSITION]: { x, y },
        [SPRITE]: flower,
        [RENDERABLE]: { generation: 0 },
      });
    } else if (cell === "cactus") {
      entities.createCactus(world, {
        [FOG]: { visibility: "hidden" },
        [POSITION]: { x, y },
        [SPRITE]: Math.random() < 0.5 ? cactus1 : cactus2,
        [RENDERABLE]: { generation: 0 },
        [COLLIDABLE]: {},
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
        [FOG]: { visibility: "hidden" },
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
