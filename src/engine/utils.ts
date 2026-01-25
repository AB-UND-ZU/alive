import { World } from ".";
import { IDENTIFIABLE } from "./components/identifiable";
import { TRACKABLE } from "./components/trackable";
import { Focusable, FOCUSABLE } from "./components/focusable";
import { rerenderEntity } from "./systems/renderer";
import { Entity, TypedEntity } from "./entities";
import { PLAYER } from "./components/player";

export const TEST_MODE = window.location.search.substring(1) === "test";

export const ECS_DEBUG = false;

export const setIdentifier = (
  world: World,
  entity: TypedEntity,
  identifier: string
) => {
  world.addComponentToEntity(entity, IDENTIFIABLE, { name: identifier });
};

export const assertIdentifier = (world: World, identifier: string) => {
  const entity = getIdentifier(world, identifier);

  if (!entity) {
    const message = `${JSON.stringify(identifier)}: Could not find entity!`;
    if (ECS_DEBUG) console.info(Date.now(), "ASSERT", message, entity);
    throw new Error(`Assertion failed for entity with identifier ${message}`);
  }

  return entity;
};

export const assertIdentifierAndComponents = <C extends keyof Entity>(
  world: World,
  identifier: string,
  componentNames: C[]
) => {
  const entity = assertIdentifier(world, identifier);
  return world.assertComponents(entity, componentNames);
};

export const getIdentifier = (world: World, identifier?: string) =>
  identifier
    ? world
        .getEntities([IDENTIFIABLE])
        .find((entity) => entity[IDENTIFIABLE].name === identifier)
    : undefined;

export const getIdentifiers = (world: World, identifier?: string) =>
  identifier
    ? world
        .getEntities([IDENTIFIABLE])
        .filter((entity) => entity[IDENTIFIABLE].name === identifier)
    : [];

export const getIdentifierAndComponents = <C extends keyof Entity>(
  world: World,
  identifier: string,
  componentNames: C[]
) => {
  const entity = getIdentifier(world, identifier);
  if (!entity) return;
  return world.getEntityComponents(entity, componentNames);
};

export const getIdentifiersAndComponents = <C extends keyof Entity>(
  world: World,
  identifier: string,
  componentNames: C[]
) => {
  const entities = getIdentifiers(world, identifier);
  return entities
    .map((entity) => world.getEntityComponents(entity, componentNames))
    .filter(Boolean) as TypedEntity<C>[];
};

export const setHighlight = (
  world: World,
  highlight?: Focusable["highlight"],
  entity?: TypedEntity
) => {
  const entityId = highlight && entity && world.getEntityId(entity);
  const focusEntity = getIdentifierAndComponents(world, "focus", [
    FOCUSABLE,
    TRACKABLE,
  ]);
  const heroEntity = getIdentifierAndComponents(world, "hero", [PLAYER]);

  if (!focusEntity) return;

  focusEntity[FOCUSABLE].pendingTarget = entityId;
  focusEntity[FOCUSABLE].highlight = highlight;
  focusEntity[TRACKABLE].target = heroEntity && world.getEntityId(heroEntity);
  rerenderEntity(world, focusEntity);
};

export const setNeedle = (world: World, entity?: TypedEntity) => {
  const entityId = entity && world.getEntityId(entity);
  const compassEntity = getIdentifierAndComponents(world, "compass", [
    TRACKABLE,
  ]);

  if (!compassEntity) return;

  compassEntity[TRACKABLE].target = entityId;
  rerenderEntity(world, compassEntity);
};
