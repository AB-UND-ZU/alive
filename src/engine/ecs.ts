import {
  initializeParticleMotion,
  releaseMotion,
  updateParticleMotions,
  updateCameraMotion,
} from "./motion";
import { PARTICLE } from "./components/particle";
import type ECSLibrary from "ecs";
import {
  System,
  World as ECSWorld,
  Entity as ECSEntity,
  ListenerType,
} from "ecs";
import FastECS from "./vendor/ecs";
import { entities, systems } from ".";
import { RENDERABLE } from "./components/renderable";
import { REFERENCE } from "./components/reference";
import { Entity, TypedEntity } from "./entities";
import { LEVEL, LevelName } from "./components/level";
import { resumeLiquidEffects } from "./systems/water";
import { getHasteInterval } from "./systems/movement";
import { initialDimensions } from "../renderers/interface/dimensions";
import { ECS_DEBUG, setIdentifier } from "./utils";

// performance fork with the same API as the "ecs" package, see vendor/ecs.js
const ECS = FastECS as unknown as typeof ECSLibrary;

export type World = ReturnType<typeof createWorld>;
export type PatchedWorld = ECSWorld & { ecs: World };

export default function createWorld() {
  const world = ECS.createWorld() as PatchedWorld;

  const createEntity = ECS.createEntity.bind(ECS, world);
  // recreate an entity with its previous ID, e.g. when loading a saved game
  const restoreEntity = (entityId: number) => {
    const ids = world as unknown as { nextId: number };
    const nextId = ids.nextId;
    ids.nextId = entityId;
    const entity = createEntity() as TypedEntity;
    ids.nextId = Math.max(nextId, entityId + 1);
    return entity;
  };
  const removeEntity = (entity: ECSEntity, deferredRemoval?: boolean) => {
    releaseMotion(ecs, entity);
    ECS.removeEntity(world, entity, deferredRemoval);
  };
  const getEntity = <C extends keyof Entity>(componentNames: C[]) =>
    ECS.getEntity(world, [
      ...componentNames,
      world.ecs.metadata.gameEntity[LEVEL].name,
    ]) as TypedEntity<C> | undefined;
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
      [...componentNames, world.ecs.metadata.gameEntity[LEVEL].name],
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
  ) => {
    ECS.addComponentToEntity(world, entity, componentName, componentData);
    if (componentName === PARTICLE) initializeParticleMotion(ecs, entity);
  };
  const removeComponentFromEntity = <C extends keyof Entity>(
    entity: TypedEntity<C>,
    componentName: C,
    deferredRemoval?: boolean
  ) =>
    ECS.removeComponentFromEntity(
      world,
      entity,
      componentName,
      deferredRemoval
    );

  // pass patched world to systems
  const addSystem: (system: (world: World) => System) => void = (system) =>
    ECS.addSystem(world, () => system(ecs));

  const update = (delta: number) => {
    world.ecs.metadata.elapsed += delta;
    world.ecs.metadata.renderTime = world.ecs.metadata.elapsed;
    if (world.ecs.metadata.gameEntity[LEVEL]?.name !== "LEVEL_MENU") {
      world.ecs.metadata.playtime += delta;
    }
    ECS.update(world, delta);
    updateParticleMotions(ecs);
    updateCameraMotion(ecs);
  };
  const cleanup = ECS.cleanup.bind(ECS, world);

  const ecs = {
    createEntity,
    restoreEntity,
    removeEntity,
    getEntity,
    getEntityById,
    getEntityId,
    getEntityComponents,
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

    metadata: {
      gameEntity: {} as TypedEntity<"LEVEL" | "RENDERABLE" | "REFERENCE">,
      listeners: {} as Record<number, (reset?: boolean) => void>,
      sequenceEntity: {} as TypedEntity<"RENDERABLE" | "REFERENCE">,
      renderEntity: {} as TypedEntity<"RENDERABLE">,
      initial: true,
      // milliseconds spent in levels other than the menu
      playtime: 0,
      elapsed: 0,
      renderTime: 0,
      occlusionGeneration: 0,
      // stored game this world was loaded from or saved to
      saveId: undefined as string | undefined,
      loadGame: (saveId: string) => {},
      eraseGame: (saveId: string) => {},
      suspend: () => {},
      resume: () => {},
      setFlipped: (flipped: boolean) => {},
      ecs: world,
      dimensions: initialDimensions,
      interact: {
        position: { x: 0, y: 0 },
        size: { x: 0, y: 0 },
        active: undefined as undefined | number,
        last: undefined as undefined | number,
        origin: { x: 0, y: 0 },
      },
    },
  };

  world.ecs = ecs;

  return ecs;
}

export const createLevel = (world: World, name: LevelName, size: number) => {
  // create global render counter and reference frame
  world.metadata.gameEntity = entities.createGame(world, {
    [LEVEL]: {
      name,
      map: {},
      size,
      walkable: [],
      biomes: [],
      cells: [],
      objects: [],
      cellPositions: {},
      initialized: [],
    },
    [RENDERABLE]: { generation: -1 },
    [REFERENCE]: {
      tick: getHasteInterval(world, -1),
      delta: 0,
      suspended: false,
      suspensionCounter: -1,
    },
  });

  // tag to itself
  world.addComponentToEntity(world.metadata.gameEntity, name, {});

  // to keep track of last generations of removed reference frame
  world.metadata.sequenceEntity = entities.createFrame(world, {
    [RENDERABLE]: { generation: 0 },
    [REFERENCE]: {
      tick: -1,
      delta: 0,
      suspended: false,
      suspensionCounter: -1,
    },
  });

  // keep track of changed terrain to rerender world but not retrigger systems
  world.metadata.renderEntity = entities.createCounter(world, {
    [RENDERABLE]: { generation: 0 },
  });
  setIdentifier(world, world.metadata.renderEntity, "renderer");

  return world.metadata.gameEntity;
};

export const createSystems = (world: World) => {
  resumeLiquidEffects(world);
  // start ordered systems
  world.addSystem(systems.setupInitialize);
  world.addSystem(systems.setupTick);
  world.addSystem(systems.setupFreeze);
  world.addSystem(systems.setupAi);
  world.addSystem(systems.setupTrigger);
  world.addSystem(systems.setupPopup);
  world.addSystem(systems.setupFishing);
  world.addSystem(systems.setupVessel);
  world.addSystem(systems.setupBuild);
  world.addSystem(systems.setupHarvest);
  world.addSystem(systems.setupClick);
  world.addSystem(systems.setupCollect);
  world.addSystem(systems.setupConsume);
  world.addSystem(systems.setupPush);
  world.addSystem(systems.setupSpike);
  world.addSystem(systems.setupDamage);
  world.addSystem(systems.setupBallistics);
  world.addSystem(systems.setupHoming);
  world.addSystem(systems.setupMovement);
  world.addSystem(systems.setupEnter);
  world.addSystem(systems.setupBurn);
  world.addSystem(systems.setupAction);
  world.addSystem(systems.setupInteract);
  world.addSystem(systems.setupText);
  world.addSystem(systems.setupMagic);
  world.addSystem(systems.setupSequence);
  world.addSystem(systems.setupFocus);
  world.addSystem(systems.setupNeedle);
  world.addSystem(systems.setupFate);
  world.addSystem(systems.setupDrop);
  world.addSystem(systems.setupLeveling);
  world.addSystem(systems.setupImmersion);
  world.addSystem(systems.setupVisibility);
  world.addSystem(systems.setupRenderer);
  world.addSystem(systems.setupMap);
};

export const preloadLevel = (world: World) => {
  // ensure all entities are registered by running map system once
  const mapSystem = systems.setupMap(world);
  mapSystem.onUpdate(0);

  // run one full game tick
  world.metadata.ecs.ecs.update(0);
};
