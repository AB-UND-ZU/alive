import ECS from "ecs";

export default function createWorld() {
  const world = ECS.createWorld();

  const createEntity = ECS.createEntity.bind(ECS, world);
  const getEntity = ECS.getEntity.bind(ECS, world);
  const getEntityId = ECS.getEntityId.bind(ECS, world);
  const getEntities = ECS.getEntities.bind(ECS, world);

  const addComponentToEntity = ECS.addComponentToEntity.bind(ECS, world);

  const addSystem = ECS.addSystem.bind(ECS, world);

  return {
    world,
    createEntity,
    getEntity,
    getEntityId,
    getEntities,
    addComponentToEntity,
    addSystem,
  };
}

export type World = ReturnType<typeof createWorld>;