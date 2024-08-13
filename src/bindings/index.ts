import { entities, World, systems } from "../engine";
import { POSITION } from "../engine/components/position";
import { SPRITE } from "../engine/components/sprite";
import { LIGHT } from "../engine/components/light";
import { PLAYER } from "../engine/components/player";
import { RENDERABLE } from "../engine/components/renderable";
import { MOVABLE } from "../engine/components/movable";
import { REFERENCE } from "../engine/components/reference";
import { COLLIDABLE } from "../engine/components/collidable";
import { fog, player, tree, triangle, wall } from "../game/assets/sprites";
import { valueNoiseMatrix } from "../game/math/noise";
import { LEVEL } from "../engine/components/level";
import { iterateMatrix, matrixFactory } from "../game/math/matrix";
import { FOG } from "../engine/components/fog";

export const generateWorld = async (world: World) => {
  const size = world.metadata.gameEntity[LEVEL].size;

  const terrainMatrix = valueNoiseMatrix(size, size, 6, -100, 100);
  const greenMatrix = valueNoiseMatrix(size, size, 1, 0, 100);
  // const spawnMatrix = valueNoiseMatrix(size, size, 0, -100, 100);

  const worldMatrix = matrixFactory(size, size, (x, y) => {
    if (terrainMatrix[x][y] > 5) return "terrain";
    if (greenMatrix[x][y] > 60) return "green";
    // if (spawnMatrix[x][y] < -99) return "triangle";
  });

  iterateMatrix(worldMatrix, (x, y, cell) => {
    entities.createAir(world, {
      [FOG]: { visibility: "hidden" },
      [POSITION]: { x, y },
      [RENDERABLE]: { generation: 0 },
      [SPRITE]: fog,
    });

    if (cell === "terrain") {
      entities.createTerrain(world, {
        [FOG]: { visibility: "hidden" },
        [POSITION]: { x, y },
        [SPRITE]: wall,
        [LIGHT]: { brightness: 0, darkness: 1 },
        [RENDERABLE]: { generation: 0 },
        [COLLIDABLE]: {},
      });
    } else if (cell === "green") {
      entities.createTree(world, {
        [FOG]: { visibility: "hidden" },
        [POSITION]: { x, y },
        [SPRITE]: tree,
        [RENDERABLE]: { generation: 0 },
        [COLLIDABLE]: {},
      });
    } else if (cell === "triangle") {
      entities.createTriangle(world, {
        [POSITION]: { x, y },
        [SPRITE]: triangle,
        [RENDERABLE]: { generation: 0 },
        [COLLIDABLE]: {},
        [MOVABLE]: {
          orientations: ['right', 'left'],
          reference: world.getEntityId(world.metadata.gameEntity),
          spring: {
            duration: 200
          }
        }
      });
    }
  });

  const hero = entities.createHero(world, {
    [POSITION]: { x: 0, y: 0 },
    [COLLIDABLE]: {},
    [SPRITE]: player,
    [LIGHT]: { brightness: 6, darkness: 0 },
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
