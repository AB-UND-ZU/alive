import { Entity } from "ecs";
import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { LEVEL } from "../components/level";
import { add, normalize } from "../../game/math/std";
import { isWalkable } from "./movement";
import { getOverlappingCell } from "../../game/math/matrix";
import { INVENTORY } from "../components/inventory";
import { rerenderEntity } from "./renderer";
import { EQUIPPABLE } from "../components/equippable";
import {
  Sequencable,
  SEQUENCABLE,
  SequenceState,
} from "../components/sequencable";
import { RENDERABLE } from "../components/renderable";
import { MOVABLE } from "../components/movable";

export const updateWalkable = (world: World, position: Position) => {
  // update walkable map after initialization
  const level = world.metadata.gameEntity[LEVEL];

  if (level.walkable.length > 0) {
    for (let x = -1; x <= 1; x += 1) {
      for (let y = -1; y <= 1; y += 1) {
        const target = add(position, { x, y });
        const walkable = getOverlappingCell(level.walkable, target.x, target.y);
        const newWalkable = isWalkable(world, target) ? 1 : 0;

        // update duplicated values
        if (walkable !== newWalkable) {
          for (let offsetX = 0; offsetX <= 1; offsetX += 1) {
            for (let offsetY = 0; offsetY <= 1; offsetY += 1) {
              const normalizedX = normalize(
                target.x + offsetX * level.size,
                level.size * 2
              );
              const normalizedY = normalize(
                target.y + offsetY * level.size,
                level.size * 2
              );
              level.walkable[normalizedX][normalizedY] = newWalkable;
            }
          }
        }
      }
    }
  }
};

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

  updateWalkable(world, position);
};

const unregisterEntity = (world: World, entity: Entity) => {
  const position = entity[POSITION];

  if (!position) {
    throw new Error(`Unable to unregister position for entity ${entity}!`);
  }

  const cell = getCell(world, position);

  const entityId = Object.entries(cell).find(
    ([_, cellEntity]) => cellEntity === entity
  )![0];
  delete cell[entityId];

  updateWalkable(world, position);
};

export const disposeParticles = (
  world: World,
  sequenceState: SequenceState<{}>
) => {
  // clean up orphaned particles
  for (const particleName in sequenceState.particles) {
    const particleEntity = world.assertById(
      sequenceState.particles[particleName]
    );
    disposeEntity(world, particleEntity);
    delete sequenceState.particles[particleName];
  }
};

export const disposeFrame = (
  world: World,
  frame: Entity,
  deferredRemoval?: boolean
) => {
  // persist last generation in frame and entities to allow safely removing frame immediately and ensuring proper rendering
  const lastGeneration = frame[RENDERABLE].generation;
  world.metadata.sequenceEntity[RENDERABLE].generation += lastGeneration;
  disposeEntity(world, frame, deferredRemoval);
};

export const disposeSequence = (
  world: World,
  entity: Entity,
  sequenceName: string
) => {
  const sequenceState = entity[SEQUENCABLE].states[sequenceName];
  const frameEntity = world.assertById(sequenceState.reference);
  disposeFrame(world, frameEntity, true);
  disposeParticles(world, sequenceState);
  delete entity[SEQUENCABLE].states[sequenceName];
};

export const disposeEntity = (
  world: World,
  entity: Entity,
  deferredRemoval?: boolean,
  removeItems = true
) => {
  if (POSITION in entity) {
    unregisterEntity(world, entity);
  }

  if (removeItems && INVENTORY in entity) {
    for (const itemId of entity[INVENTORY].items) {
      const itemEntity = world.assertById(itemId);
      world.removeEntity(itemEntity, deferredRemoval);
    }
  }

  if (removeItems && EQUIPPABLE in entity) {
    for (const itemId of Object.values(entity[EQUIPPABLE]) as number[]) {
      const itemEntity = world.getEntityById(itemId);
      if (!itemEntity) continue;
      world.removeEntity(itemEntity, deferredRemoval);
    }
  }

  // clean up any remaining sequences
  Object.keys((entity[SEQUENCABLE] as Sequencable)?.states || {}).forEach(
    (sequenceName) => {
      disposeSequence(world, entity, sequenceName);
    }
  );

  // clean up movable frames
  const movableReference = entity[MOVABLE]?.reference;
  if (
    movableReference &&
    movableReference !== world.getEntityId(world.metadata.gameEntity)
  ) {
    const referenceEntity = world.assertById(movableReference);
    disposeFrame(world, referenceEntity, true);
  }

  world.removeEntity(entity, deferredRemoval);
};

export const moveEntity = (
  world: World,
  entity: Entity,
  position: Position
) => {
  const size = world.metadata.gameEntity[LEVEL].size;

  unregisterEntity(world, entity);
  entity[POSITION].x = normalize(position.x, size);
  entity[POSITION].y = normalize(position.y, size);
  registerEntity(world, entity);
};

export const getCell = (world: World, position: Position) => {
  const level = world.metadata.gameEntity[LEVEL];
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
    world.metadata.ecs.ecs.cleanup();
    world.getEntities([POSITION], "added", addedEntities);
    world.getEntities([POSITION], "removed", removedEntities);

    // automatically register mapped entities but expect removal to happen through disposeEntity()
    for (let i = 0; i < addedEntities.count; i++) {
      const addedEntity = addedEntities.entries[i];

      // prevent registering if entity was removed in same frame
      if (!world.getEntityId(addedEntity)) continue;

      registerEntity(world, addedEntity);
    }

    // force rerender to make new entities appear immediately
    if (addedEntities.count > 0) {
      rerenderEntity(world, world.metadata.sequenceEntity);
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
