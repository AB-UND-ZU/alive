import type {
  DiscoverySequence,
  InteractSequence,
} from "./components/sequencable";
import { isPresentationSequence } from "./presentation";
import { SEQUENCABLE } from "./components/sequencable";
import { LIQUID } from "./components/liquid";
import { RENDERABLE } from "./components/renderable";
import { REFERENCE } from "./components/reference";
import createWorld, { World } from "./ecs";
import * as sprites from "../game/assets/sprites";
import { Sprite } from "./components/sprite";
import { INVENTORY } from "./components/inventory";
import { LEVEL } from "./components/level";
import { ITEM } from "./components/item";
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

export const createSnapshot = (
  world: World,
  network = false,
  selected?: Set<number>
): WorldSnapshot => {
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

  const omitted = new Set<number>();
  const cosmeticFrames = new Set<number>();
  const authoritativeFrames = new Set<number>();
  if (network)
    for (const entity of ecs.entities)
      for (const state of Object.values(
        (
          entity[SEQUENCABLE] as
            | import("./components/sequencable").Sequencable
            | undefined
        )?.states || {}
      )) {
        if (isPresentationSequence(entity as TypedEntity, state!)) {
          for (const id of Object.values(state!.particles)) omitted.add(id);
          cosmeticFrames.add(state!.reference);
        } else authoritativeFrames.add(state!.reference);
      }
  const entities: WorldSnapshot["entities"] = [];
  for (const entity of ecs.entities) {
    if (
      (selected && !selected.has(world.getEntityId(entity as TypedEntity))) ||
      ecs.deferredRemovals.entities.has(entity) ||
      omitted.has(world.getEntityId(entity as TypedEntity))
    )
      continue;

    const components: Record<string, unknown> = {};
    for (const componentName in entity) {
      let value = entity[componentName];
      if (network) {
        if (componentName === LEVEL)
          value = {
            ...(value as object),
            map: {},
            walkable: [],
            initialized: [],
            ...(selected
              ? { cells: [], objects: [], biomes: [], cellPositions: {} }
              : {}),
          };
        if (componentName === SEQUENCABLE) {
          const states = (
            value as import("./components/sequencable").Sequencable
          ).states;
          value = {
            states: Object.fromEntries(
              Object.entries(states).map(([key, state]) => [
                key,
                isPresentationSequence(entity as TypedEntity, state!)
                  ? {
                      ...state,
                      started: state!.started,
                      elapsed: 0,
                      args: {
                        ...state!.initialArgs!,
                        ...(state!.name === "discoveryIdle"
                          ? { force: (state!.args as DiscoverySequence).force }
                          : {}),
                        ...(state!.name === "popupInteract"
                          ? { active: (state!.args as InteractSequence).active }
                          : {}),
                      },
                      particles: {},
                    }
                  : state,
              ])
            ),
          };
        }
        if (
          componentName === LIQUID &&
          (
            entity[SEQUENCABLE] as
              | import("./components/sequencable").Sequencable
              | undefined
          )?.states.splash?.name === "bubbleSplash"
        )
          value = { ...(value as object), amount: 0 };
        const id = world.getEntityId(entity as TypedEntity);
        if (cosmeticFrames.has(id) && !authoritativeFrames.has(id)) {
          if (componentName === RENDERABLE) value = { generation: 0 };
          if (componentName === REFERENCE)
            value = { ...(value as object), delta: 0 };
        }
      }
      components[componentName] = copyValue(value, replace, copies);
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
export const restoreSnapshot = (
  snapshot: WorldSnapshot,
  world = createWorld(),
  removed?: number[],
  removedComponents: [number, string[]][] = []
) => {
  const records = new Map(snapshot.entities);
  const current = (world.metadata.ecs as unknown as { entities: TypedEntity[] })
    .entities;
  for (const id of removed || []) {
    const entity = world.getEntityById(id);
    if (entity) world.removeEntity(entity, false);
  }
  for (const entity of removed
    ? snapshot.entities.flatMap(([id]) => {
        const entity = world.getEntityById(id);
        return entity ? [entity] : [];
      })
    : [...current]) {
    const components = records.get(world.getEntityId(entity));
    if (!components) {
      if (world.getEntityId(entity) < 0) continue;
      world.removeEntity(entity, false);
      continue;
    }
    for (const name in entity) {
      if (removed === undefined && !(name in components))
        world.removeComponentFromEntity(entity, name as never, false);
    }
  }
  for (const [id, names] of removedComponents) {
    const entity = world.getEntityById(id);
    if (entity)
      for (const name of names)
        world.removeComponentFromEntity(entity, name as never, false);
  }
  const copies = new Map<unknown, unknown>();
  const restored = snapshot.entities.map(
    ([entityId]) =>
      world.getEntityById(entityId) || world.restoreEntity(entityId)
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
      const entity = restored[index];
      const data = copyValue(components[componentName], replace, copies);
      if (removed !== undefined && componentName === LEVEL && entity[LEVEL])
        Object.assign(entity[LEVEL], data);
      else if (componentName in entity)
        Object.assign(entity, { [componentName]: data });
      else
        world.addComponentToEntity(
          entity,
          componentName as never,
          data as never
        );
    }
  });

  // Older arena cleanup could remove loot items while their containers survived.
  for (const entity of restored) {
    const inventory = entity[INVENTORY];
    if (!inventory) continue;
    const items = inventory.items.filter((id) =>
      world.getEntityByIdAndComponents(id, [ITEM])
    );
    if (items.length !== inventory.items.length) inventory.items = items;
  }

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
