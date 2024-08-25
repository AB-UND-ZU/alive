import * as components from "../components";
import { REFERENCE, Reference } from "../components/reference";
import { RENDERABLE, Renderable } from "../components/renderable";
import type { World } from "../ecs";

export default function createAnimation(
  world: World,
  entity: {
    [REFERENCE]: Reference;
    [RENDERABLE]: Renderable;
  }
) {
  const animationEntity = world.createEntity();

  components.addReference(world, animationEntity, entity[REFERENCE]);
  components.addRenderable(world, animationEntity, entity[RENDERABLE]);

  return animationEntity;
}
