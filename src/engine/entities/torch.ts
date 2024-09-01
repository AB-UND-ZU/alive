import * as components from "../components";
import { Light, LIGHT } from "../components/light";
import { Position, POSITION } from "../components/position";
import { RENDERABLE, Renderable } from "../components/renderable";
import { Sprite, SPRITE } from "../components/sprite";
import type { World } from "../ecs";

export default function createTorch(
  world: World,
  entity: {
    [LIGHT]: Light;
    [POSITION]: Position;
    [RENDERABLE]: Renderable;
    [SPRITE]: Sprite;
  }
) {
  const blockEntity = world.createEntity();

  components.addLight(world, blockEntity, entity[LIGHT]);
  components.addPosition(world, blockEntity, entity[POSITION]);
  components.addRenderable(world, blockEntity, entity[RENDERABLE]);
  components.addSprite(world, blockEntity, entity[SPRITE]);

  return blockEntity;
}
