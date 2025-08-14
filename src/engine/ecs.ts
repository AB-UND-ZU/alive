import ECS, {
  System,
  World as ECSWorld,
  Entity as ECSEntity,
  ListenerType,
} from "ecs";
import { entities } from ".";
import { RENDERABLE } from "./components/renderable";
import { REFERENCE } from "./components/reference";
import { Entity, TypedEntity } from "./entities";
import { LEVEL, LevelName } from "./components/level";
import { getHasteInterval } from "./systems/movement";

export type World = ReturnType<typeof createWorld>;
export type PatchedWorld = ECSWorld & { ecs: World };

export const ECS_DEBUG = false;

export default function createWorld(name: LevelName, size: number) {
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

  const ecs = {
    createEntity,
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
      listeners: {} as Record<number, () => void>,
      sequenceEntity: {} as TypedEntity<"RENDERABLE" | "REFERENCE">,
    },
  };

  // create global render counter and reference frame
  ecs.metadata.gameEntity = entities.createGame(ecs, {
    [LEVEL]: {
      name,
      map: {},
      size,
      walkable: [],
      cells: {},
      initialized: false,
    },
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
