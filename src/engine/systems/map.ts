import { Entity } from "ecs";
import { World } from "../ecs";
import { POSITION } from "../components/position";

export const registerEntity = (world: World, entity: Entity) => {
  const position = entity[POSITION];

  if (!position) {
    throw new Error(`Unable to register position for entity ${entity}!`);
  }

  const column = (world.metadata.map[position.x] =
    world.metadata.map[position.x] || {});
  const cell = (column[position.y] = column[position.y] || {});

  cell[world.getEntityId(entity)] = entity;
};

export const unregisterEntity = (world: World, entity: Entity) => {
  const position = entity[POSITION];

  if (!position) {
    throw new Error(`Unable to unregister position for entity ${entity}!`);
  }

  delete world.metadata.map[position.x]?.[position.y]?.[
    world.getEntityId(entity)
  ];
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
  };

  return { onUpdate };
}
