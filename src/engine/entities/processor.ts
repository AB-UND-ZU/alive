import * as components from "../components";
import { Animatable, ANIMATABLE } from "../components/animatable";
import { Reference, REFERENCE } from "../components/reference";
import { RENDERABLE, Renderable } from "../components/renderable";
import type { World } from "../ecs";

export default function createProcessor(
  world: World,
  entity: {
    [ANIMATABLE]: Animatable;
    [REFERENCE]: Reference;
    [RENDERABLE]: Renderable;
  }
) {
  const processorEntity = world.createEntity();

  components.addAnimatable(world, processorEntity, entity[ANIMATABLE]);
  components.addReference(world, processorEntity, entity[REFERENCE]);
  components.addRenderable(world, processorEntity, entity[RENDERABLE]);

  return processorEntity;
}
