import ECS, { System, World as ECSWorld, Entity, ListenerType } from "ecs";
import { entities } from ".";
import { RENDERABLE } from "./components/renderable";
import { REFERENCE } from "./components/reference";
import { LEVEL } from "./components/level";
import { IDENTIFIABLE } from "./components/identifiable";
import { Quest, QUEST } from "./components/quest";
import { TRACKABLE } from "./components/trackable";
import { FOCUSABLE } from "./components/focusable";
import { TOOLTIP } from "./components/tooltip";
import { quest, quest as questSprite } from "../game/assets/sprites";
import { rerenderEntity } from "./systems/renderer";
import { Animatable, ANIMATABLE } from "./components/animatable";

export type World = ReturnType<typeof createWorld>;
export type PatchedWorld = ECSWorld & { ecs: World };

export default function createWorld(size: number) {
  const world = ECS.createWorld() as PatchedWorld;

  const createEntity = ECS.createEntity.bind(ECS, world);
  const removeEntity = ECS.removeEntity.bind(ECS, world);
  const getEntity = ECS.getEntity.bind(ECS, world);
  const getEntityById = ECS.getEntityById.bind(ECS, world);
  const getEntityId = ECS.getEntityId.bind(ECS, world);

  const getEntities = ECS.getEntities.bind(ECS, world) as (
    componentNames: string[],
    listenerType?: ListenerType,
    listenerEntities?: { count: number; entries: Record<number, Entity> }
  ) => Entity[];

  const addComponentToEntity = ECS.addComponentToEntity.bind(ECS, world);
  const removeComponentFromEntity = ECS.removeComponentFromEntity.bind(
    ECS,
    world
  );

  // pass patched world to systems
  const addSystem: (system: (world: World) => System) => void = (system) =>
    ECS.addSystem(world, () => system(ecs));

  const update = ECS.update.bind(ECS, world);
  const cleanup = ECS.cleanup.bind(ECS, world);

  // util methods to avoid calling ECS directly
  const addQuest = (entity: Entity, quest: Quest) => {
    addComponentToEntity(entity, QUEST, quest);
    entity[TOOLTIP].idle = questSprite;
  };

  const acceptQuest = (entity: Entity) => {
    entity[QUEST].available = false;
    entity[TOOLTIP].idle = undefined;
  };

  const abortQuest = (entity: Entity) => {
    const activeQuest = (entity[ANIMATABLE] as Animatable)?.states.quest;

    if (!activeQuest) return;

    const giverEntity = ecs.getEntityById(activeQuest.args.giver);

    if (!giverEntity || giverEntity[QUEST].name !== activeQuest.name) return;

    giverEntity[QUEST].available = true;
    giverEntity[TOOLTIP].idle = quest;
  };

  const setIdentifier = (entity: Entity, identifier: string) => {
    addComponentToEntity(entity, IDENTIFIABLE, { name: identifier });
  };

  const getIdentifier = (identifier: string) =>
    getEntities([IDENTIFIABLE]).find(
      (entity) => entity[IDENTIFIABLE].name === identifier
    );

  const setFocus = (entity?: Entity) => {
    const entityId = entity && getEntityId(entity);
    const focusEntity = getIdentifier("focus");
    const compassEntity = getIdentifier("compass");

    if (!focusEntity || !compassEntity) return;

    compassEntity[TRACKABLE].target = entityId;
    rerenderEntity(ecs, compassEntity);

    focusEntity[FOCUSABLE].pendingTarget = entityId;
    rerenderEntity(ecs, focusEntity);
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

    addQuest,
    acceptQuest,
    abortQuest,
    setFocus,

    getIdentifier,
    setIdentifier,

    metadata: {
      gameEntity: {} as Entity,
      listeners: {} as Record<number, () => void>,
      animationEntity: {} as Entity,
    },
  };

  // create global render counter and reference frame
  ecs.metadata.gameEntity = entities.createGame(ecs, {
    [LEVEL]: { map: [], size, walkable: [] },
    [RENDERABLE]: { generation: -1 },
    [REFERENCE]: {
      tick: 350,
      delta: 0,
      suspended: false,
      suspensionCounter: -1,
    },
  });

  // to keep track of last generations of removed reference frame
  ecs.metadata.animationEntity = entities.createFrame(ecs, {
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
