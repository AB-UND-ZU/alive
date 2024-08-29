import { RENDERABLE } from "../components/renderable";
import { World } from "../ecs";
import { REFERENCE } from "../components/reference";
import { unregisterEntity } from "./map";
import { ATTACKABLE } from "../components/attackable";
import { isEmpty } from "./collect";
import { LOOTABLE } from "../components/lootable";
import { isDead } from "./damage";
import { PLAYER } from "../components/player";
import { Animatable, ANIMATABLE } from "../components/animatable";
import { getAnimations } from "./animate";
import { entities } from "..";

export default function setupDrop(world: World) {
  let referencesGeneration = -1;

  const onUpdate = (delta: number) => {
    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);

    if (referencesGeneration === generation) return;

    referencesGeneration = generation;

    for (const entity of world.getEntities([ATTACKABLE, RENDERABLE])) {
      // remove entity on death
      if (
        isDead(world, entity) &&
        isEmpty(world, entity) &&
        !(PLAYER in entity) &&
        getAnimations(world, entity).length === 0
      ) {
        unregisterEntity(world, entity);
        world.removeEntity(entity);
      } else if (
        isDead(world, entity) &&
        LOOTABLE in entity &&
        !entity[LOOTABLE].target &&
        getAnimations(world, entity).length === 0
      ) {
        const animationEntity = entities.createAnimation(world, {
          [REFERENCE]: {
            tick: -1,
            delta: 0,
            suspended: false,
            pendingSuspended: false,
          },
          [RENDERABLE]: { generation: 1 },
        });
        (entity[ANIMATABLE] as Animatable).states.decay = {
          name: "creatureDecay",
          reference: world.getEntityId(animationEntity),
          elapsed: 0,
          args: {},
          particles: {},
        };
      }
    }
  };

  return { onUpdate };
}
