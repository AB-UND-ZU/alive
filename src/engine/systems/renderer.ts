import { Entity } from "ecs";
import { RENDERABLE } from "../components/renderable";
import { World } from "../ecs";
import { REFERENCE } from "../components/reference";
import { MOVABLE } from "../components/movable";
import { Animatable, ANIMATABLE } from "../components/animatable";
import { EQUIPPABLE } from "../components/equippable";

export const rerenderEntity = (world: World, entity: Entity) => {
  entity[RENDERABLE].generation += 1;
};

export const getEntityGeneration = (world: World, entity: Entity) => {
  const renderableGeneration = entity[RENDERABLE].generation;
  const movable = entity[MOVABLE];
  const movableGeneration = movable
    ? world.getEntityById(movable.reference)[RENDERABLE].generation
    : 0;
  const animatable = entity[ANIMATABLE] as Animatable;
  const animatableGeneration = animatable
    ? Object.values(animatable.states).reduce(
        (total, state) =>
          total + world.getEntityById(state.reference)[RENDERABLE].generation,
        0
      )
    : 0;

  const equipmentGenerations: number = entity[EQUIPPABLE]
    ? Object.values<number>(entity[EQUIPPABLE]).filter(Boolean).reduce(
        (total, item) =>
          total + getEntityGeneration(world, world.getEntityById(item)),
        0
      )
    : 0;

  return (
    renderableGeneration +
    movableGeneration +
    animatableGeneration +
    equipmentGenerations
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
