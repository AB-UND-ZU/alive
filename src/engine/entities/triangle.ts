import * as components from "../components";
import { Collidable, COLLIDABLE } from "../components/collidable";
import { Movable, MOVABLE } from "../components/movable";
import { POSITION, Position } from "../components/position";
import { Renderable, RENDERABLE } from "../components/renderable";
import { SPRITE, Sprite } from "../components/sprite";
import type { World } from "../ecs";

export default function createTriangle(
  world: World,
  entity: {
    [COLLIDABLE]: Collidable;
    [POSITION]: Position;
    [SPRITE]: Sprite;
    [RENDERABLE]: Renderable;
    [MOVABLE]: Movable;
  }
) {
  const triangleEntity = world.createEntity();

  components.addCollidable(world, triangleEntity, entity[COLLIDABLE]);
  components.addMovable(world, triangleEntity, entity[MOVABLE]);
  components.addPosition(world, triangleEntity, entity[POSITION]);
  components.addSprite(world, triangleEntity, entity[SPRITE]);
  components.addRenderable(world, triangleEntity, entity[RENDERABLE]);

  return triangleEntity;
}
