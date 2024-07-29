import { Entity } from "ecs";
import { entities, World } from "../engine";
import { Position, POSITION } from "../engine/components/position";
import { SPRITE } from "../engine/components/sprite";
import { LIGHT } from "../engine/components/light";
import { PLAYER } from "../engine/components/player";

const mapString = `\
   █ ████  █
   █  █ █   ██
  █           █
 █       P   █
  █         █
   █████████\
`;

export const generate = (world: World) => {
  const cellEntities: Record<
    string,
    (entity: { [POSITION]: Position }) => Entity
  > = {
    "█": (entity) => entities.createTerrain(world, { ...entity, [SPRITE]: { layers: ['█']}, [LIGHT]: { brightness: 0, darkness: 1 }}),
    P: (entity) =>
      entities.createHero(world, {
        ...entity,
        [SPRITE]: { layers: ["\u010b"] },
        [LIGHT]: { brightness: 11, darkness: 0 },
        [PLAYER]: {}
      }),
  };

  mapString.split("\n").forEach((row, rowIndex) => {
    row.split("").forEach((cell, columnIndex) => {
      const createEntity = cellEntities[cell];
      if (!createEntity) return;

      createEntity({ [POSITION]: { x: columnIndex, y: rowIndex } });
    });
  });
};
