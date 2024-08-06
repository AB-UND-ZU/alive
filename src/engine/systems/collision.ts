import { Entity } from "ecs";
import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { COLLIDABLE } from "../components/collidable";

export const registerEntityCollision = (world: World, entity: Entity) => {
  const position = entity[POSITION];

  if (!position || !entity[COLLIDABLE]) {
    throw new Error(`Unable to register collision for entity ${entity}!`);
  }

  const column = (world.metadata.collisionMap[position.x] =
    world.metadata.collisionMap[position.x] || {});
  const cell = (column[position.y] = column[position.y] || {});

  cell[world.getEntityId(entity)] = entity;
};

export const unregisterEntityCollision = (world: World, entity: Entity) => {
  const position = entity[POSITION];

  if (!position || !entity[COLLIDABLE]) {
    throw new Error(`Unable to unregister collision for entity ${entity}!`);
  }

  delete world.metadata.collisionMap[position.x]?.[position.y]?.[
    world.getEntityId(entity)
  ];
};

export const isCollision = (world: World, position: Position) =>
  Object.keys(world.metadata.collisionMap[position.x]?.[position.y] || {}).length > 0;

export default function setupCollision(world: World) {
  const addedEntities = { count: 0, entries: [] };
  const removedEntities = { count: 0, entries: [] };

  const onUpdate = (delta: number) => {
    // ensure components added to ECS are reflected in collision map
    world.getEntities([COLLIDABLE, POSITION], "added", addedEntities);
    world.getEntities([COLLIDABLE, POSITION], "removed", removedEntities);

    for (let i = 0; i < removedEntities.count; i++) {
      unregisterEntityCollision(world, removedEntities.entries[i]);
    }

    for (let i = 0; i < addedEntities.count; i++) {
      registerEntityCollision(world, addedEntities.entries[i]);
    }
  };

  return { onUpdate };
}
