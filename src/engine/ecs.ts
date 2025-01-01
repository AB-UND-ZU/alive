import ECS, {
  System,
  World as ECSWorld,
  Entity as ECSEntity,
  ListenerType,
} from "ecs";
import { entities } from ".";
import { RENDERABLE } from "./components/renderable";
import { REFERENCE } from "./components/reference";
import { LEVEL } from "./components/level";
import { IDENTIFIABLE } from "./components/identifiable";
import { Quest, QUEST } from "./components/quest";
import { TRACKABLE } from "./components/trackable";
import { Focusable, FOCUSABLE } from "./components/focusable";
import { TOOLTIP } from "./components/tooltip";
import { pending, quest as questSprite } from "../game/assets/sprites";
import { rerenderEntity } from "./systems/renderer";
import { getSequence } from "./systems/sequence";
import { Entity, TypedEntity } from "./entities";
import { getHasteInterval } from "./systems/movement";
import { PLAYER } from "./components/player";

export type World = ReturnType<typeof createWorld>;
export type PatchedWorld = ECSWorld & { ecs: World };

const ECS_DEBUG = false;

export default function createWorld(size: number) {
  const world = ECS.createWorld() as PatchedWorld;

  const createEntity = ECS.createEntity.bind(ECS, world);
  const removeEntity = ECS.removeEntity.bind(ECS, world);
  const getEntity = <C extends keyof Entity>(componentNames: C[]) =>
    ECS.getEntity(world, componentNames) as TypedEntity<C> | undefined;
  const getEntityById = (entityId?: number) => {
    if (!entityId) return;

    const entity = ECS.getEntityById(world, entityId) as
      | TypedEntity
      | undefined;

    if (!entity) {
      if (ECS_DEBUG) {
        const message = `${JSON.stringify(entityId)}: Could not find entity!`;
        console.trace(Date.now(), message, entity);
      }
      return;
    }

    return entity;
  };
  const getEntityId = (entity: ECSEntity) =>
    ECS.getEntityId(world, entity) as number;
  const getEntities = <C extends keyof Entity>(
    componentNames: C[],
    listenerType?: ListenerType,
    listenerEntities?: { count: number; entries: Record<number, ECSEntity> }
  ) =>
    ECS.getEntities(
      world,
      componentNames,
      listenerType,
      listenerEntities as unknown as []
    ) as TypedEntity<C>[];

  const getEntityComponents = <C extends keyof Entity>(
    entity: TypedEntity,
    componentNames: C[]
  ) => {
    for (const componentName of componentNames) {
      if (!entity[componentName]) {
        if (ECS_DEBUG) {
          const message = `${getEntityId(
            entity
          )}: Missing component "${componentName}"!`;
          console.trace(Date.now(), message, entity);
        }
        return;
      }
    }

    return entity as TypedEntity<C>;
  };

  const getEntityByIdAndComponents = <C extends keyof Entity>(
    entityId: number | undefined = undefined,
    componentNames: C[]
  ) => {
    if (!entityId) return;

    const entity = getEntityById(entityId);

    if (!entity) return;

    return getEntityComponents(entity, componentNames);
  };

  const assertComponents = <C extends keyof Entity>(
    entity: TypedEntity,
    componentNames: C[]
  ) => {
    for (const componentName of componentNames) {
      if (!entity[componentName]) {
        const message = `${getEntityId(
          entity
        )}: Missing component "${componentName}"!`;
        if (ECS_DEBUG) console.info(Date.now(), "ASSERT", message, entity);
        throw new Error(`Assertion failed for entity with ID ${message}`);
      }
    }

    return entity as TypedEntity<C>;
  };

  const assertById = (entityId: number) => {
    const entity = getEntityById(entityId);

    if (!entity) {
      const message = `${JSON.stringify(entityId)}: Could not find entity!`;
      if (ECS_DEBUG) console.info(Date.now(), "ASSERT", message, entity);
      throw new Error(`Assertion failed for entity with ID ${message}`);
    }

    return entity;
  };

  const assertByIdAndComponents = <C extends keyof Entity>(
    entityId: number | undefined = undefined,
    componentNames: C[]
  ) => {
    const entity = getEntityById(entityId);

    if (!entity) {
      const message = `${JSON.stringify(entityId)}: Could not find entity!`;
      if (ECS_DEBUG) console.info(Date.now(), "ASSERT", message, entity);
      throw new Error(`Assertion failed for entity with ID ${message}`);
    }

    return assertComponents(entity, componentNames);
  };

  const addComponentToEntity = <C extends keyof Entity>(
    entity: ECSEntity,
    componentName: C,
    componentData: Entity[C]
  ) => ECS.addComponentToEntity(world, entity, componentName, componentData);
  const removeComponentFromEntity = <C extends keyof Entity>(
    entity: TypedEntity<C>,
    componentName: C
  ) => ECS.removeComponentFromEntity(world, entity, componentName);

  // pass patched world to systems
  const addSystem: (system: (world: World) => System) => void = (system) =>
    ECS.addSystem(world, () => system(ecs));

  const update = ECS.update.bind(ECS, world);
  const cleanup = ECS.cleanup.bind(ECS, world);

  // util methods to avoid calling ECS directly
  const offerQuest = (
    entity: ECSEntity,
    name: Quest["name"],
    memory: any,
    retry: boolean = true
  ) => {
    if (entity[QUEST]) {
      entity[QUEST].name = name;
      entity[QUEST].available = true;
    } else {
      addComponentToEntity(entity, QUEST, {
        name,
        available: true,
        retry,
        memory,
      });
    }
    entity[TOOLTIP].idle = questSprite;
  };

  const acceptQuest = (entity: ECSEntity) => {
    entity[QUEST].available = false;
    entity[TOOLTIP].idle = pending;
    entity[TOOLTIP].changed = true;
  };

  const abortQuest = (entity: TypedEntity) => {
    const activeQuest = getSequence(ecs, entity, "quest");

    if (!activeQuest) return;

    const giverEntity = getEntityById(activeQuest.args.giver);

    if (
      !giverEntity?.[QUEST]?.retry ||
      giverEntity[QUEST].name !== activeQuest.name
    )
      return;

    offerQuest(
      giverEntity,
      activeQuest.name as Quest["name"],
      giverEntity[QUEST].memory
    );
  };

  const setIdentifier = (entity: TypedEntity, identifier: string) => {
    addComponentToEntity(entity, IDENTIFIABLE, { name: identifier });
  };

  const assertIdentifier = (identifier: string) => {
    const entity = getIdentifier(identifier);

    if (!entity) {
      const message = `${JSON.stringify(identifier)}: Could not find entity!`;
      if (ECS_DEBUG) console.info(Date.now(), "ASSERT", message, entity);
      throw new Error(`Assertion failed for entity with identifier ${message}`);
    }

    return entity;
  };

  const assertIdentifierAndComponents = <C extends keyof Entity>(
    identifier: string,
    componentNames: C[]
  ) => {
    const entity = assertIdentifier(identifier);
    return assertComponents(entity, componentNames);
  };

  const getIdentifier = (identifier: string) =>
    getEntities([IDENTIFIABLE]).find(
      (entity) => entity[IDENTIFIABLE].name === identifier
    );

  const getIdentifierAndComponents = <C extends keyof Entity>(
    identifier: string,
    componentNames: C[]
  ) => {
    const entity = getIdentifier(identifier);
    if (!entity) return;
    return getEntityComponents(entity, componentNames);
  };

  const setHighlight = (
    highlight?: Focusable["highlight"],
    entity?: TypedEntity
  ) => {
    const entityId = highlight && entity && getEntityId(entity);
    const focusEntity = getIdentifierAndComponents("focus", [
      FOCUSABLE,
      TRACKABLE,
    ]);
    const heroEntity = getIdentifierAndComponents("hero", [PLAYER]);

    if (!focusEntity) return;

    focusEntity[FOCUSABLE].pendingTarget = entityId;
    focusEntity[FOCUSABLE].highlight = highlight;
    focusEntity[TRACKABLE].target = heroEntity && getEntityId(heroEntity);
    rerenderEntity(ecs, focusEntity);
  };

  const setNeedle = (entity?: TypedEntity) => {
    const entityId = entity && getEntityId(entity);
    const compassEntity = getIdentifierAndComponents("compass", [TRACKABLE]);

    if (!compassEntity) return;

    compassEntity[TRACKABLE].target = entityId;
    rerenderEntity(ecs, compassEntity);
  };

  const ecs = {
    createEntity,
    removeEntity,
    getEntity,
    getEntityById,
    getEntityId,
    getEntities,
    addComponentToEntity,
    removeComponentFromEntity,
    addSystem,
    update,
    cleanup,

    getEntityByIdAndComponents,
    assertById,
    assertComponents,
    assertByIdAndComponents,

    offerQuest,
    acceptQuest,
    abortQuest,
    setHighlight,
    setNeedle,

    getIdentifier,
    assertIdentifier,
    assertIdentifierAndComponents,
    getIdentifierAndComponents,
    setIdentifier,

    metadata: {
      gameEntity: {} as TypedEntity<"LEVEL" | "RENDERABLE" | "REFERENCE">,
      listeners: {} as Record<number, () => void>,
      sequenceEntity: {} as TypedEntity<"RENDERABLE" | "REFERENCE">,
    },
  };

  // create global render counter and reference frame
  ecs.metadata.gameEntity = entities.createGame(ecs, {
    [LEVEL]: { map: {}, size, walkable: [], initialized: false },
    [RENDERABLE]: { generation: -1 },
    [REFERENCE]: {
      tick: getHasteInterval(ecs, -1),
      delta: 0,
      suspended: false,
      suspensionCounter: -1,
    },
  });

  // to keep track of last generations of removed reference frame
  ecs.metadata.sequenceEntity = entities.createFrame(ecs, {
    [RENDERABLE]: { generation: 0 },
    [REFERENCE]: {
      tick: -1,
      delta: 0,
      suspended: false,
      suspensionCounter: -1,
    },
  });

  world.ecs = ecs;

  return ecs;
}
