import { ITEM } from "./components/item";
import { World } from ".";
import { IDENTIFIABLE } from "./components/identifiable";
import { TRACKABLE } from "./components/trackable";
import { Focusable, FOCUSABLE } from "./components/focusable";
import { rerenderEntity } from "./systems/renderer";
import { Entity, TypedEntity } from "./entities";
import { PLAYER } from "./components/player";
import { Sprite } from "./components/sprite";
import { POI } from "./components/poi";
import { Position } from "./components/position";

export const TEST_MODE =
  typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).has("test")
    : typeof process !== "undefined" && process.argv.includes("--test");

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

export const getPlayerFocus = (world: World, player?: TypedEntity) => {
  const id = player?.[PLAYER]?.interface?.focus;
  return id === undefined
    ? getIdentifierAndComponents(world, "focus", [FOCUSABLE, TRACKABLE])
    : world.getEntityByIdAndComponents(id, [FOCUSABLE, TRACKABLE]);
};

export const setHighlight = (
  world: World,
  highlight?: Focusable["highlight"],
  entity?: TypedEntity,
  quadrant?: Position,
  player?: TypedEntity
) => {
  const focuses =
    world.metadata.warpPlayer && !player
      ? world
          .getEntities([FOCUSABLE, TRACKABLE])
          .filter((focus) => focus[FOCUSABLE].owner !== undefined)
      : [getPlayerFocus(world, player)].filter(Boolean);
  for (const focus of focuses) {
    if (!focus) continue;
    focus[FOCUSABLE].pendingTarget =
      highlight && entity ? world.getEntityId(entity) : undefined;
    focus[FOCUSABLE].highlight = highlight;
    const hero =
      player ||
      (focus[FOCUSABLE].owner
        ? world.getEntityById(focus[FOCUSABLE].owner)
        : getIdentifierAndComponents(world, "hero", [PLAYER]));
    focus[TRACKABLE].target = hero && world.getEntityId(hero);
    focus[TRACKABLE].quadrant = quadrant;
    rerenderEntity(world, focus);
  }
};

export const setNeedle = (
  world: World,
  entity?: TypedEntity,
  player?: TypedEntity
) => {
  const compasses = world.metadata.warpPlayer
    ? world
        .getEntities([ITEM, TRACKABLE])
        .filter(
          (compass) =>
            compass[ITEM].accessory === "compass" &&
            (!player || compass[ITEM].carrier === world.getEntityId(player))
        )
    : [getIdentifierAndComponents(world, "compass", [TRACKABLE])].filter(
        Boolean
      );
  for (const compass of compasses) {
    if (!compass) continue;
    compass[TRACKABLE].target = entity && world.getEntityId(entity);
    rerenderEntity(world, compass);
  }
};

export const setPoi = (world: World, entity: TypedEntity, sprite: Sprite) => {
  world.addComponentToEntity(entity, POI, { sprite });
};
