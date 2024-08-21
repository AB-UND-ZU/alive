import * as components from "../components";
import { Reference, REFERENCE } from "../components/reference";
import { Renderable, RENDERABLE } from "../components/renderable";
import type { World } from "../ecs";

export default function createFrame(
  world: World,
  entity: {
    [RENDERABLE]: Renderable;
    [REFERENCE]: Reference;
  }
) {
  const frameEntity = world.createEntity();

  components.addReference(world, frameEntity, entity[REFERENCE]);
  components.addRenderable(world, frameEntity, entity[RENDERABLE]);

  return frameEntity;
}
