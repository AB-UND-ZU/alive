import { RENDERABLE } from "../components/renderable";
import { World } from "../ecs";
import { REFERENCE } from "../components/reference";
import { unregisterEntity } from "./map";
import { Entity } from "ecs";
import { ATTACKABLE } from "../components/attackable";

export const isDead = (world: World, entity: Entity) =>
  entity[ATTACKABLE].hp <= 0;

export default function setupLoot(world: World) {
  let referencesGeneration = -1;

  const onUpdate = (delta: number) => {
    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);

    if (referencesGeneration === generation) return;

    referencesGeneration = generation;

    for (const entity of world.getEntities([ATTACKABLE, RENDERABLE])) {
      // remove entity on death
      if (isDead(world, entity)) {
        unregisterEntity(world, entity);
        world.removeEntity(entity);
      }
    }
  };

  return { onUpdate };
}
