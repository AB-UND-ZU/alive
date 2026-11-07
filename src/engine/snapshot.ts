import createWorld, { World } from "./ecs";
import * as sprites from "../game/assets/sprites";
import { Sprite } from "./components/sprite";
import { TypedEntity } from "./entities";

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

type SpriteToken = { $sprite: string };
type EntityToken = { $entity: number };

// game code compares sprites by identity, so they are stored by export name
const spriteNames = new Map<unknown, string>();
const namedSprites: Record<string, Sprite> = {};
for (const [name, value] of Object.entries(sprites)) {
  if (
    !value ||
    typeof value !== "object" ||
    !Array.isArray((value as Sprite).layers) ||
    spriteNames.has(value)
  )
    continue;

  spriteNames.set(value, name);
  namedSprites[name] = value as Sprite;
}

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
  const ecs = world.metadata.ecs as unknown as {
    nextId: number;
    entities: Record<string, unknown>[];
    deferredRemovals: { entities: Set<unknown> };
  };
  const copies = new Map<unknown, unknown>();
  const replace = (value: object) => {
    const spriteName = spriteNames.get(value);
    if (spriteName) return { $sprite: spriteName } as SpriteToken;

    const entityId = world.getEntityId(value as TypedEntity);
    if (entityId) return { $entity: entityId } as EntityToken;
  };

  const entities: WorldSnapshot["entities"] = [];
  for (const entity of ecs.entities) {
    if (ecs.deferredRemovals.entities.has(entity)) continue;

    const components: Record<string, unknown> = {};
    for (const componentName in entity) {
      components[componentName] = copyValue(
        entity[componentName],
        replace,
        copies
      );
    }
    entities.push([world.getEntityId(entity as TypedEntity), components]);
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
export const restoreSnapshot = (snapshot: WorldSnapshot) => {
  const world = createWorld();
  const copies = new Map<unknown, unknown>();
  const restored = snapshot.entities.map(([entityId]) =>
    world.restoreEntity(entityId)
  );
  const replace = (value: object) => {
    if ("$sprite" in value) {
      const spriteName = (value as SpriteToken).$sprite;
      const sprite = namedSprites[spriteName];
      if (!sprite) throw new Error(`Unknown sprite "${spriteName}"!`);
      return sprite;
    }

    if ("$entity" in value) {
      // keep detached entities as placeholders, same as removed entities
      return world.getEntityById((value as EntityToken).$entity) || {};
    }
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

  (world.metadata.ecs as unknown as { nextId: number }).nextId =
    snapshot.nextId;
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
