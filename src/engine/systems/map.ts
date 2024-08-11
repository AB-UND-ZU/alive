import { Entity } from "ecs";
import { World } from "../ecs";
import { POSITION } from "../components/position";
import { LEVEL } from "../components/level";
import { RENDERABLE } from "../components/renderable";
import { normalize } from "../../game/math/std";

export const registerEntity = (world: World, entity: Entity) => {
  const position = entity[POSITION];

  if (!position) {
    throw new Error(`Unable to register position for entity ${entity}!`);
  }

  const level = world.metadata.gameEntity[LEVEL];

  const normalizedX = normalize(position.x, level.size);
  const normalizedY = normalize(position.y, level.size);

  const column = (level.map[normalizedX] = level.map[normalizedX] || {});
  const cell = (column[normalizedY] = column[normalizedY] || {});

  cell[world.getEntityId(entity)] = entity;
};

export const unregisterEntity = (world: World, entity: Entity) => {
  const position = entity[POSITION];

  if (!position) {
    throw new Error(`Unable to unregister position for entity ${entity}!`);
  }

  const level = world.metadata.gameEntity[LEVEL];

  const normalizedX = normalize(position.x, level.size);
  const normalizedY = normalize(position.y, level.size);

  delete level.map[normalizedX]?.[normalizedY]?.[world.getEntityId(entity)];
};

export default function setupMap(world: World) {
  const addedEntities = { count: 0, entries: [] };
  const removedEntities = { count: 0, entries: [] };

  const onUpdate = (delta: number) => {
    // ensure components added to ECS are reflected in collision map
    world.getEntities([POSITION], "added", addedEntities);
    world.getEntities([POSITION], "removed", removedEntities);

    for (let i = 0; i < removedEntities.count; i++) {
      unregisterEntity(world, removedEntities.entries[i]);
    }

    for (let i = 0; i < addedEntities.count; i++) {
      registerEntity(world, addedEntities.entries[i]);
    }

    if (addedEntities.count > 0 || removedEntities.count > 0) {
      world.metadata.gameEntity[RENDERABLE].generation += 1;
    }
  };

  return { onUpdate };
}
