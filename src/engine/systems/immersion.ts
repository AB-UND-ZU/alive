import { Entity } from "ecs";
import { IMMERSIBLE } from "../components/immersible";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { SWIMMABLE } from "../components/swimmable";
import { World } from "../ecs";
import { getCell } from "./map";
import { getEntityGeneration, rerenderEntity } from "./renderer";
import { REFERENCE } from "../components/reference";

export const isImmersible = (world: World, position: Position) => {
  const cell = getCell(world, position);
  return Object.values(cell).some((entity) => IMMERSIBLE in (entity as Entity));
};

export const isSubmerged = (world: World, position: Position) =>
  [-1, 0, 1]
    .map((xOffset) =>
      [-1, 0, 1].map((yOffset) =>
        isImmersible(world, {
          x: position.x + xOffset,
          y: position.y + yOffset,
        })
      )
    )
    .flat()
    .every(Boolean);

export default function setupImmersion(world: World) {
  let referencesGeneration = -1;
  const entityGenerations: Record<string, number> = {};

  const onUpdate = (delta: number) => {
    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);

    if (referencesGeneration === generation) return;

    referencesGeneration = generation;

    for (const entity of world.getEntities([POSITION, SWIMMABLE])) {
      const entityId = world.getEntityId(entity);
      const entityGeneration = getEntityGeneration(world, entity);

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
