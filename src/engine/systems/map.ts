import { Entity } from "ecs";
import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { Level, LEVEL } from "../components/level";
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

const unregisterEntity = (world: World, entity: Entity) => {
  const position = entity[POSITION];

  if (!position) {
    throw new Error(`Unable to unregister position for entity ${entity}!`);
  }

  const cell = getCell(world, position);

  const entityId = parseInt(
    Object.entries(cell).find(([_, cellEntity]) => cellEntity === entity)![0]
  );
  delete cell[entityId];
};

export const disposeEntity = (
  world: World,
  entity: Entity,
  deferredRemoval?: boolean
) => {
  if (POSITION in entity) {
    unregisterEntity(world, entity);
  }
  world.removeEntity(entity, deferredRemoval);
};

export const moveEntity = (
  world: World,
  entity: Entity,
  position: Position
) => {
  unregisterEntity(world, entity);
  entity[POSITION].x = position.x;
  entity[POSITION].y = position.y;
  registerEntity(world, entity);
};

export const getCell = (world: World, position: Position) => {
  const level = world.metadata.gameEntity[LEVEL] as Level;
  const normalizedX = normalize(position.x, level.size);
  const normalizedY = normalize(position.y, level.size);
  return level.map[normalizedX]?.[normalizedY] || {};
};

type ListenerEntities = { count: number; entries: Entity[] };

export default function setupMap(world: World) {
  const addedEntities: ListenerEntities = { count: 0, entries: [] };
  const removedEntities: ListenerEntities = { count: 0, entries: [] };

  const onUpdate = (delta: number) => {
    // ensure components added to ECS are reflected in map
    world.getEntities([POSITION], "added", addedEntities);
    world.getEntities([POSITION], "removed", removedEntities);

    // automatically register mapped entities but expect removal to happen through disposeEntity()
    for (let i = 0; i < addedEntities.count; i++) {
      registerEntity(world, addedEntities.entries[i]);
    }

    // nonetheless warn if not disposed properly
    for (let i = 0; i < removedEntities.count; i++) {
      const removedEntity = removedEntities.entries[i];
      if (
        Object.values(getCell(world, removedEntity[POSITION])).indexOf(
          removedEntity
        ) !== -1
      ) {
        console.error(
          Date.now(),
          "Entity not disposed properly!",
          removedEntity
        );
      }
    }
  };

  return { onUpdate };
}
