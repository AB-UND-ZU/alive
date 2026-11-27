import createWorld, { World } from "./ecs";
import type { Entity } from "./entities";

/**
 * Plain copy of all entities of a world. Shared objects stay shared within a
 * snapshot, so it must be stored with structured cloning (e.g. IndexedDB) to
 * keep that sharing and values like Infinity intact.
 */
export type WorldSnapshot = {
  nextId: number;
  playtime: number;
  game: number;
  sequence: number;
  render: number;
  entities: [number, Record<string, unknown>][];
};

type EntityToken = { $entity: number };

// also accept objects of other realms, e.g. as returned by structured cloning
const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return true;

  const prototype = Object.getPrototypeOf(value);
  return !prototype || !Object.getPrototypeOf(prototype);
};

const copyValue = (
  value: unknown,
  replace: (value: object) => unknown,
  copies: Map<unknown, unknown>
): unknown => {
  if (!isPlainObject(value)) return value;

  const replaced = replace(value);
  if (replaced !== undefined) return replaced;

  const existing = copies.get(value);
  if (existing) return existing;

  const copy = (Array.isArray(value) ? [] : {}) as Record<string, unknown>;
  copies.set(value, copy);

  for (const key in value) {
    copy[key] = copyValue(value[key], replace, copies);
  }

  return copy;
};

export const createSnapshot = (world: World): WorldSnapshot => {
  const ecs = world.metadata.ecs;
  const copies = new Map<unknown, unknown>();
  const replace = (value: object) => {
    const entityId = ecs.entityIds.get(value);
    if (entityId) return { $entity: entityId } as EntityToken;
  };

  const entities: WorldSnapshot["entities"] = [];
  for (const entity of ecs.entities) {
    if (ecs.deferredRemovals.entities.has(entity)) continue;

    const components: Record<string, unknown> = {};
    for (const componentName in entity) {
      components[componentName] = copyValue(
        entity[componentName as keyof Entity],
        replace,
        copies
      );
    }
    entities.push([world.getEntityId(entity), components]);
  }

  return {
    nextId: ecs.nextId,
    playtime: world.metadata.playtime,
    game: world.getEntityId(world.metadata.gameEntity),
    sequence: world.getEntityId(world.metadata.sequenceEntity),
    render: world.getEntityId(world.metadata.renderEntity),
    entities,
  };
};

/** Create a world with identical entities and IDs, but without systems. */
export const restoreSnapshot = (
  snapshot: WorldSnapshot,
  readValue?: (value: object) => unknown
) => {
  const world = createWorld();
  const copies = new Map<unknown, unknown>();
  const restored = snapshot.entities.map(([entityId]) =>
    world.restoreEntity(entityId)
  );
  const replace = (value: object) => {
    if ("$entity" in value) {
      // keep detached entities as placeholders, same as removed entities
      return world.getEntityById((value as EntityToken).$entity) || {};
    }
    return readValue?.(value);
  };

  snapshot.entities.forEach(([, components], index) => {
    for (const componentName in components) {
      world.addComponentToEntity(
        restored[index],
        componentName as keyof typeof components as never,
        copyValue(components[componentName], replace, copies) as never
      );
    }
  });

  world.metadata.ecs.nextId = snapshot.nextId;
  world.metadata.playtime = snapshot.playtime;
  world.metadata.gameEntity = world.assertById(
    snapshot.game
  ) as World["metadata"]["gameEntity"];
  world.metadata.sequenceEntity = world.assertById(
    snapshot.sequence
  ) as World["metadata"]["sequenceEntity"];
  world.metadata.renderEntity = world.assertById(
    snapshot.render
  ) as World["metadata"]["renderEntity"];

  return world;
};
