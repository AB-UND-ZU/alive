import * as components from "../components";
import { Collidable, COLLIDABLE } from "../components/collidable";
import { Position, POSITION } from "../components/position";
import { RENDERABLE, Renderable } from "../components/renderable";
import { Sprite, SPRITE } from "../components/sprite";
import type { World } from "../ecs";

export default function createText(
  world: World,
  entity: {
    [COLLIDABLE]: Collidable;
    [POSITION]: Position;
    [RENDERABLE]: Renderable;
    [SPRITE]: Sprite;
  }
) {
  const textEntity = world.createEntity();

  components.addCollidable(world, textEntity, entity[COLLIDABLE]);
  components.addPosition(world, textEntity, entity[POSITION]);
  components.addRenderable(world, textEntity, entity[RENDERABLE]);
  components.addSprite(world, textEntity, entity[SPRITE]);

  return textEntity;
}
