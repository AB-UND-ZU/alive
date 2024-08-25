import { Entity } from "ecs";
import { RENDERABLE } from "../components/renderable";
import { World } from "../ecs";
import { REFERENCE } from "../components/reference";
import { MOVABLE } from "../components/movable";
import { Animatable, ANIMATABLE } from "../components/animatable";
import { MELEE } from "../components/melee";

export const rerenderEntity = (world: World, entity: Entity) => {
  entity[RENDERABLE].generation += 1;
};

const getAnimatableGeneration = (world: World, entity?: Entity) => {
  const animatable = entity?.[ANIMATABLE] as Animatable;
  if (!entity || !animatable) return 0;

  return Object.values(animatable.states).reduce(
    (total, state) =>
      total + world.getEntityById(state.reference)[RENDERABLE].generation,
    animatable.generationOffset
  );
};

export const getEntityGeneration = (world: World, entity: Entity) => {
  const generation = entity[RENDERABLE].generation;
  const movable = entity[MOVABLE];

  return (
    generation +
    (movable
      ? world.getEntityById(movable.reference)[RENDERABLE].generation
      : 0) +
    getAnimatableGeneration(world, entity) +
    getAnimatableGeneration(world, world.getEntityById(entity[MELEE]?.item))
  );
};

export default function setupRenderer(world: World) {
  let referencesGeneration = -1;

  const onUpdate = (delta: number) => {
    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce(
        (total, entity) => entity[RENDERABLE].generation + total,
        world.metadata.generationOffset
      );

    if (referencesGeneration === generation) return;

    referencesGeneration = generation;

    for (const listener of Object.values(world.metadata.listeners)) {
      listener();
    }
  };

  return { onUpdate };
}
