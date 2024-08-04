import ECS, { System, World as ECSWorld, Entity } from "ecs";
import { entities } from ".";
import { RENDERABLE } from "./components/renderable";
import { REFERENCE } from "./components/reference";

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
      gameEntity: {} as Entity,
      listeners: {} as Record<number, () => void>,
    },
  };

  // create global render counter and reference frame
  ecs.metadata.gameEntity = entities.createGame(ecs, {
    [RENDERABLE]: { generation: 0 },
    [REFERENCE]: { tick: 350, delta: 0, suspended: false },
  });

  world.ecs = ecs;

  return ecs;
}
