import { entities, World, systems } from "../engine";
import { POSITION } from "../engine/components/position";
import { SPRITE } from "../engine/components/sprite";
import { LIGHT } from "../engine/components/light";
import { PLAYER } from "../engine/components/player";
import { RENDERABLE } from "../engine/components/renderable";
import { MOVABLE } from "../engine/components/movable";
import { REFERENCE } from "../engine/components/reference";
import { COLLIDABLE } from "../engine/components/collidable";
import { bush, cactus1, cactus2, flower, fog, frozen, ice, player, sand, tree1, tree2, triangle, wall, water } from "../game/assets/sprites";
import { simplexNoiseMatrix, valueNoiseMatrix } from "../game/math/noise";
import { LEVEL } from "../engine/components/level";
import { iterateMatrix, matrixFactory } from "../game/math/matrix";
import { FOG } from "../engine/components/fog";
import { NPC } from "../engine/components/npc";

export const generateWorld = async (world: World) => {
  const size = world.metadata.gameEntity[LEVEL].size;

  const elevationMatrix = simplexNoiseMatrix(size, size, 0, -50, 100, 1);
  const terrainMatrix = simplexNoiseMatrix(size, size, 0 ,-40,100,1/2);
  const temperatureMatrix = simplexNoiseMatrix(size, size, 0, -80, 100, 4);
  const greenMatrix = valueNoiseMatrix(size, size, 1, -80, 100);
  const spawnMatrix = valueNoiseMatrix(size, size, 0, -100, 100);
  
  const worldMatrix = matrixFactory(size, size, (x, y) => {
    const elevation = elevationMatrix[x][y];
    const terrain = terrainMatrix[x][y];
    const temperature = temperatureMatrix[x][y];
    const green = greenMatrix[x][y];
    const spawn = spawnMatrix[x][y];

    // ice
    // if (elevation < 0 && temperature < -40) return 20 < green && green < 25 ? "frozen" : "ice";

    // beach and islands (if not desert)
    if (temperature < 65 && elevation < 0 && (elevation > -32 || temperature > 0)) return "water";
    if (temperature < 65 && elevation < 6 && (elevation > -35 || temperature > 0)) return "sand";

    // forest
    if (elevation > 25 && terrain > 30) return temperature < 0 && terrain < 75 ? "tree" : "rock";

    // desert, oasis and cactus
    if (temperature > 65 && terrain > 70) return "water";
    if (temperature > 65) return 20 < green && green < 25 ? "cactus" : "sand";

    // greens
    if (green > 30) return "tree";
    if (green > 20) return "bush";
    if (green > 10) return "flower";
    
    // npcs
    if (spawn < -99) return "triangle";
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
        [POSITION]: { x, y },
        [SPRITE]: water,
        [RENDERABLE]: { generation: 0 },
      });
    // } else if (cell === "ice") {
    //   entities.createIce(world, {
    //     [FOG]: { visibility: "hidden" },
    //     [POSITION]: { x, y },
    //     [SPRITE]: ice,
    //     [RENDERABLE]: { generation: 0 },
    //   });
    // } else if (cell === "frozen") {
    //   entities.createIce(world, {
    //     [FOG]: { visibility: "hidden" },
    //     [POSITION]: { x, y },
    //     [SPRITE]: frozen,
    //     [RENDERABLE]: { generation: 0 },
    //   });
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
      entities.createTriangle(world, {
        [FOG]: { visibility: "hidden" },
        [MOVABLE]: {
          orientations: ["right", "left"],
          reference: world.getEntityId(world.metadata.gameEntity),
          spring: {
            duration: 200,
          },
        },
        [NPC]: {},
        [POSITION]: { x, y },
        [SPRITE]: triangle,
        [RENDERABLE]: { generation: 0 },
        [COLLIDABLE]: {},
      });
    }
  });

  const hero = entities.createHero(world, {
    [POSITION]: { x: 0, y: 0 },
    [COLLIDABLE]: {},
    [SPRITE]: player,
    [LIGHT]: { brightness: 5.55, darkness: 0 },
    [PLAYER]: {},
    [REFERENCE]: {
      tick: 250,
      delta: 0,
      suspended: true,
      pendingSuspended: false,
    },
    [RENDERABLE]: { generation: 0 },
    [MOVABLE]: {
      orientations: [],
      reference: world.getEntityId(world.metadata.gameEntity),
      spring: {
        mass: 0.1,
        friction: 50,
        tension: 1000,
      },
    },
  });

  // set hero as own reference frame
  hero[MOVABLE].reference = world.getEntityId(hero);

  world.addSystem(systems.setupMap);
  world.addSystem(systems.setupMovement);
  world.addSystem(systems.setupRenderer);
  world.addSystem(systems.setupVisibility);
};
