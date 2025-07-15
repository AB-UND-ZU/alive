import { Entity as ECSEntity } from "ecs";
import { World } from ".";
import { IDENTIFIABLE } from "./components/identifiable";
import { Quest, QUEST } from "./components/quest";
import { TRACKABLE } from "./components/trackable";
import { Focusable, FOCUSABLE } from "./components/focusable";
import { TOOLTIP } from "./components/tooltip";
import { quest as questSprite } from "../game/assets/sprites";
import { rerenderEntity } from "./systems/renderer";
import { getSequence } from "./systems/sequence";
import { Entity, TypedEntity } from "./entities";
import { PLAYER } from "./components/player";
import { ECS_DEBUG } from "./ecs";

// util methods
export const offerQuest = (
  world: World,
  entity: ECSEntity,
  name: Quest["name"],
  memory: any
) => {
  if (entity[QUEST]) {
    entity[QUEST].name = name;
    entity[QUEST].available = true;
  } else {
    world.addComponentToEntity(entity, QUEST, {
      name,
      available: true,
      memory,
    });
  }
  entity[TOOLTIP].idle = questSprite;
};

export const acceptQuest = (world: World, entity: ECSEntity) => {
  entity[QUEST].available = false;
  entity[TOOLTIP].idle = undefined;
  entity[TOOLTIP].changed = true;
};

export const abortQuest = (world: World, entity: TypedEntity) => {
  const activeQuest = getSequence(world, entity, "quest");

  if (!activeQuest) return;

  const giverEntity = world.getEntityById(activeQuest.args.giver);

  if (!giverEntity?.[QUEST] || giverEntity[QUEST].name !== activeQuest.name)
    return;

  offerQuest(
    world,
    giverEntity,
    activeQuest.name as Quest["name"],
    giverEntity[QUEST].memory
  );
};

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

export const getIdentifier = (world: World, identifier: string) =>
  world
    .getEntities([IDENTIFIABLE])
    .find((entity) => entity[IDENTIFIABLE].name === identifier);

export const getIdentifierAndComponents = <C extends keyof Entity>(
  world: World,
  identifier: string,
  componentNames: C[]
) => {
  const entity = getIdentifier(world, identifier);
  if (!entity) return;
  return world.getEntityComponents(entity, componentNames);
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
