import { RENDERABLE } from "../components/renderable";
import { World } from "../ecs";
import { REFERENCE } from "../components/reference";
import { ATTACKABLE } from "../components/attackable";
import { isEmpty } from "./collect";
import { LOOTABLE } from "../components/lootable";
import { isDead } from "./damage";
import { PLAYER } from "../components/player";
import { Animatable, ANIMATABLE } from "../components/animatable";
import { entities } from "..";
import { disposeEntity } from "./map";

export default function setupDrop(world: World) {
  let referencesGeneration = -1;

  const onUpdate = (delta: number) => {
    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);

    if (referencesGeneration === generation) return;

    referencesGeneration = generation;

    for (const entity of world.getEntities([ATTACKABLE, RENDERABLE])) {
      if (
        isDead(world, entity) &&
        isEmpty(world, entity) &&
        !(PLAYER in entity)
      ) {
        // remove entity on death and fully looted
        disposeEntity(world, entity);
      } else if (
        isDead(world, entity) &&
        LOOTABLE in entity &&
        !entity[LOOTABLE].accessible &&
        ANIMATABLE in entity &&
        !(entity[ANIMATABLE] as Animatable).states.decay
      ) {
        // start decaying animation
        const animationEntity = entities.createAnimation(world, {
          [REFERENCE]: {
            tick: -1,
            delta: 0,
            suspended: false,
            suspensionCounter: -1,
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
