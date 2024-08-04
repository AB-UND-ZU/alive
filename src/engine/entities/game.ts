import * as components from "../components";
import { Reference, REFERENCE } from "../components/reference";
import { Renderable, RENDERABLE } from "../components/renderable";
import type { World } from "../ecs";

export default function createGame(
  world: World,
  entity: {
    [RENDERABLE]: Renderable;
    [REFERENCE]: Reference;
  }
) {
  const gameEntity = world.createEntity();

  components.addReference(world, gameEntity, entity[REFERENCE]);
  components.addRenderable(world, gameEntity, entity[RENDERABLE]);

  return gameEntity;
}
