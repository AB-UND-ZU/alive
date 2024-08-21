import { Entity } from "ecs";
import { RENDERABLE } from "../components/renderable";
import { World } from "../ecs";
import { REFERENCE } from "../components/reference";
import { MOVABLE } from "../components/movable";

export const rerenderEntity = (world: World, entity: Entity) => {
  entity[RENDERABLE].generation += 1;
};

export const getEntityGeneration = (world: World, entity: Entity) => {
  const generation = entity[RENDERABLE].generation;
  const movable = entity[MOVABLE];

  if (!movable) return generation;

  return (
    generation +
    world.getEntityById(entity[MOVABLE].reference)[RENDERABLE].generation
  );
};

export default function setupRenderer(world: World) {
  let referencesGeneration = -1;

  const onUpdate = (delta: number) => {
    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);

    if (referencesGeneration === generation) return;

    referencesGeneration = generation;

    for (const listener of Object.values(world.metadata.listeners)) {
      listener();
    }
  };

  return { onUpdate };
}
