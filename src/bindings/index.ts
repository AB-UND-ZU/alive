import { Entity } from "ecs";
import { entities, World, systems } from "../engine";
import { Position, POSITION } from "../engine/components/position";
import { SPRITE } from "../engine/components/sprite";
import { LIGHT } from "../engine/components/light";
import { PLAYER } from "../engine/components/player";
import { RENDERABLE } from "../engine/components/renderable";
import { MOVABLE } from "../engine/components/movable";

const mapString = `\
   █ ████  █
   █  █ █   ██
  █           █
 █       P   █
  █         █
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
        [SPRITE]: { layers: ["█"] },
        [LIGHT]: { brightness: 0, darkness: 1 },
        [RENDERABLE]: { generation: 0 },
      }),
    P: (entity) =>
      entities.createHero(world, {
        ...entity,
        [SPRITE]: { layers: ["\u010b"] },
        [LIGHT]: { brightness: 11, darkness: 0 },
        [PLAYER]: {},
        [RENDERABLE]: { generation: 0 },
        [MOVABLE]: { orientations: [] },
      }),
  };

  mapString.split("\n").forEach((row, rowIndex) => {
    row.split("").forEach((cell, columnIndex) => {
      const createEntity = cellEntities[cell];
      if (!createEntity) return;

      createEntity({ [POSITION]: { x: columnIndex, y: rowIndex } });
    });
  });

  world.addSystem(systems.setupMovement);
  world.addSystem(systems.setupRenderer);
};
