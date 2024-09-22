import * as components from "../components";
import { Light, LIGHT } from "../components/light";
import { Position, POSITION } from "../components/position";
import { RENDERABLE, Renderable } from "../components/renderable";
import { Sprite, SPRITE } from "../components/sprite";
import { Viewable, VIEWABLE } from "../components/viewable";
import type { World } from "../ecs";

export default function createTorch(
  world: World,
  entity: {
    [LIGHT]: Light;
    [POSITION]: Position;
    [RENDERABLE]: Renderable;
    [SPRITE]: Sprite;
    [VIEWABLE]: Viewable;
  }
) {
  const blockEntity = world.createEntity();

  components.addLight(world, blockEntity, entity[LIGHT]);
  components.addPosition(world, blockEntity, entity[POSITION]);
  components.addRenderable(world, blockEntity, entity[RENDERABLE]);
  components.addSprite(world, blockEntity, entity[SPRITE]);
  components.addViewable(world, blockEntity, entity[VIEWABLE]);

  return blockEntity;
}
