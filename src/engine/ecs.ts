import ECS, { System, World as ECSWorld } from "ecs";

export type World = ReturnType<typeof createWorld>;
export type PatchedWorld = ECSWorld & { ecs: World };

export default function createWorld() {
  const world = ECS.createWorld() as PatchedWorld;

  const createEntity = ECS.createEntity.bind(ECS, world);
  const getEntity = ECS.getEntity.bind(ECS, world);
  const getEntityId = ECS.getEntityId.bind(ECS, world);
  const getEntities = ECS.getEntities.bind(ECS, world);

  const addComponentToEntity = ECS.addComponentToEntity.bind(ECS, world);

  // pass patched world to systems
  const addSystem: (system: (world: World) => System) => void = (system) =>
    ECS.addSystem(world, () => system(ecs));

  const update = ECS.update.bind(ECS, world);
  const cleanup = ECS.cleanup.bind(ECS, world);

  const ecs = {
    createEntity,
    getEntity,
    getEntityId,
    getEntities,
    addComponentToEntity,
    addSystem,
    update,
    cleanup,

    metadata: {
      generation: 0,
      listeners: {} as Record<number, () => void>,
    },
  };

  world.ecs = ecs;

  return ecs;
}
