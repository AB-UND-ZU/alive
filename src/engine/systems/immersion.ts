import { Entity } from "ecs";
import { IMMERSIBLE } from "../components/immersible";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { SWIMMABLE } from "../components/swimmable";
import { World } from "../ecs";
import { getCell } from "./map";
import { rerenderEntity } from "./renderer";

export const isImmersible = (world: World, position: Position) => {
  const cell = getCell(world, position);
  return Object.values(cell).some((entity) => IMMERSIBLE in (entity as Entity));
};

export const isWalkable = (world: World, position: Position) =>
  [-1, 0, 1]
    .map((xOffset) =>
      [-1, 0, 1].map((yOffset) =>
        !isImmersible(world, {
          x: position.x + xOffset,
          y: position.y + yOffset,
        })
      )
    )
    .flat()
    .some(Boolean);

export default function setupImmersion(world: World) {
  const gameId = world.getEntityId(world.metadata.gameEntity);
  const entityGenerations = { [gameId]: -1 };

  const onUpdate = (delta: number) => {
    const generation = world.metadata.gameEntity[RENDERABLE].generation;

    if (entityGenerations[gameId] === generation) return;

    entityGenerations[gameId] = generation;

    for (const entity of world.getEntities([POSITION, SWIMMABLE])) {
      const entityId = world.getEntityId(entity);
      const entityGeneration = entity[RENDERABLE].generation;

      if (entityGenerations[entityId] === entityGeneration) continue;

      entityGenerations[entityId] = entityGeneration;

      const isSwimming = entity[SWIMMABLE].swimming;
      const shouldSwim = isImmersible(world, entity[POSITION]);

      if (isSwimming !== shouldSwim) {
        entity[SWIMMABLE].swimming = shouldSwim;
        rerenderEntity(world, entity);
      }
    }
  };

  return { onUpdate };
}
