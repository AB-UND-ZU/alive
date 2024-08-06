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
import { player, tree, triangle, wall } from "../assets/sprites";

const mapString = `\
  # █ ████  █
## █  █ █   ██
  █>          █
 █  #    P   █
  █ ##      █
   █████████\
`;

export const generateWorld = (world: World) => {
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
      entities.createTree(world, {
        ...entity,
        [SPRITE]: tree,
        [RENDERABLE]: { generation: 0 },
        [COLLIDABLE]: {},
      }),
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
      const hero = entities.createHero(world, {
        ...entity,
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
          }
        },
      });

      // set hero as own reference frame
      hero[MOVABLE].reference = world.getEntityId(hero);

      return hero;
    },
  };

  mapString.split("\n").forEach((row, rowIndex) => {
    row.split("").forEach((cell, columnIndex) => {
      const createEntity = cellEntities[cell];
      if (!createEntity) return;

      createEntity({ [POSITION]: { x: columnIndex, y: rowIndex } });
    });
  });

  world.addSystem(systems.setupCollision);
  world.addSystem(systems.setupMovement);
  world.addSystem(systems.setupRenderer);
};
