import * as components from "../components";
import { Level, LEVEL } from "../components/level";
import { Reference, REFERENCE } from "../components/reference";
import { Renderable, RENDERABLE } from "../components/renderable";
import type { World } from "../ecs";

export default function createGame(
  world: World,
  entity: {
    [LEVEL]: Level,
    [RENDERABLE]: Renderable;
    [REFERENCE]: Reference;
  }
) {
  const gameEntity = world.createEntity();

  components.addLevel(world, gameEntity, entity[LEVEL]);
  components.addReference(world, gameEntity, entity[REFERENCE]);
  components.addRenderable(world, gameEntity, entity[RENDERABLE]);

  return gameEntity;
}
