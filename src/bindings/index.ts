import { Entity } from "ecs";
import { entities, World, systems } from "../engine";
import { Position, POSITION } from "../engine/components/position";
import { SPRITE } from "../engine/components/sprite";
import { LIGHT } from "../engine/components/light";
import { PLAYER } from "../engine/components/player";
import { RENDERABLE } from "../engine/components/renderable";
import { MOVABLE } from "../engine/components/movable";
import { REFERENCE } from "../engine/components/reference";
import { COLLIDABLE } from "../engine/components/collidable";
import { player, tree, triangle, wall } from "../game/assets/sprites";
import {
  iterateMatrix,
  matrixFactory,
  valueNoiseMatrix,
} from "../game/math/noise";

/*
const mapString = `\
  # █ ████  █
## █  █ █   ██
  █>          █
 █  #    P   █
  █ ##      █
   ████ ████
     ██████
       ███
        █
`;
  const cellEntities: Record<
    string,
    (entity: { [POSITION]: Position }) => Entity
  > = {
    "█": (entity) =>
      entities.createTerrain(world, {
        ...entity,
        [SPRITE]: wall,
        [LIGHT]: { brightness: 0, darkness: 1 },
        [RENDERABLE]: { generation: 0 },
        [COLLIDABLE]: {},
      }),
    "#": (entity) =>
    ">": (entity) =>
      entities.createTriangle(world, {
        ...entity,
        [SPRITE]: triangle,
        [RENDERABLE]: { generation: 0 },
        [COLLIDABLE]: {},
        [MOVABLE]: {
          orientations: ['right', 'left'],
          reference: world.getEntityId(world.metadata.gameEntity),
          spring: {
            duration: 200
          }
        },
      }),
    P: (entity) => {
    },
  };

  mapString.split("\n").forEach((row, rowIndex) => {
    row.split("").forEach((cell, columnIndex) => {
      const createEntity = cellEntities[cell];
      if (!createEntity) return;

      createEntity({ [POSITION]: { x: columnIndex, y: rowIndex } });
    });
  });
  */

export const generateWorld = async (world: World, size: number) => {
  const terrainMatrix = valueNoiseMatrix(size, size, 10, -100, 100);
  const greenMatrix = valueNoiseMatrix(size, size, 1, 0, 100);

  const worldMatrix = matrixFactory(size, size, (x, y) => {
    if (terrainMatrix[x][y] > 5) return "terrain";
    if (greenMatrix[x][y] > 60) return "green";
  });

  iterateMatrix(worldMatrix, (x, y, cell) => {
    if (cell === "terrain") {
      entities.createTerrain(world, {
        [POSITION]: { x, y },
        [SPRITE]: wall,
        [LIGHT]: { brightness: 0, darkness: 1 },
        [RENDERABLE]: { generation: 0 },
        [COLLIDABLE]: {},
      });
    } else if (cell === "green") {
      entities.createTree(world, {
        [POSITION]: { x, y },
        [SPRITE]: tree,
        [RENDERABLE]: { generation: 0 },
        [COLLIDABLE]: {},
      });
    }
  });

  const hero = entities.createHero(world, {
    [POSITION]: { x: 0, y: 0 },
    [COLLIDABLE]: {},
    [SPRITE]: player,
    [LIGHT]: { brightness: 11, darkness: 0 },
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
};
