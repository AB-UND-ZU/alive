import { RENDERABLE } from "../components/renderable";
import { World } from "../ecs";
import {
  Animatable,
  ANIMATABLE,
  AnimationArgument,
} from "../components/animatable";
import { REFERENCE } from "../components/reference";
import * as animations from "../../game/assets/animations";
import { rerenderEntity } from "./renderer";
import { Entity } from "ecs";

export const getAnimations = (world: World, entity: Entity) =>
  Object.values(entity[ANIMATABLE]?.states || {});

export default function setupAnimate(world: World) {
  const onUpdate = (delta: number) => {
    // to keep track of expired animations
    const animationFrames = world
      .getEntities([REFERENCE, RENDERABLE])
      .reduce((frames, entity) => {
        frames[world.getEntityId(entity)] = {};
        return frames;
      }, {} as Record<number, { [animatableId: number]: boolean }>);

    for (const entity of world.getEntities([ANIMATABLE, RENDERABLE])) {
      const animatable = entity[ANIMATABLE] as Animatable;

      for (const animationName in animatable.states) {
        const animationType = animationName as keyof AnimationArgument;
        const animationState = animatable.states[animationType]!;
        const animationEntity = world.getEntityById(animationState.reference);
        animationState.elapsed += delta;
        const animation = animations[animationState.name];
        const result = animation(world, entity, animationState as any); // trust me TypeScript i'm an engineer

        animationFrames[animationState.reference][world.getEntityId(entity)] =
          result.finished;

        if (result.updated || result.finished) {
          rerenderEntity(world, animationEntity);
        }

        if (result.finished) {
          // TODO: handle cleaning up of particles
          delete animatable.states[animationType];
          entity[RENDERABLE].generation +=
            animationEntity[RENDERABLE].generation;
        }
      }
    }

    // delete finished animation frames
    for (const animationId in animationFrames) {
      const frame = world.getEntityById(parseInt(animationId));
      const entityAnimations = Object.entries(animationFrames[animationId]);

      if (
        entityAnimations.length > 0 &&
        entityAnimations.every(([_, finished]) => finished)
      ) {
        // persist last generation in frame and entities to allow safely removing frame and ensuring proper rendering
        const lastGeneration = frame[RENDERABLE].generation;
        world.metadata.animationEntity[RENDERABLE].generation += lastGeneration;
        world.removeEntity(frame, false);
      }
    }
  };

  return { onUpdate };
}
