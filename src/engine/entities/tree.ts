import * as components from "../components";
import { Collidable, COLLIDABLE } from "../components/collidable";
import { POSITION, Position } from "../components/position";
import { Renderable, RENDERABLE } from "../components/renderable";
import { SPRITE, Sprite } from "../components/sprite";
import type { World } from "../ecs";

export default function createTree(
  world: World,
  entity: {
    [COLLIDABLE]: Collidable;
    [POSITION]: Position;
    [SPRITE]: Sprite;
    [RENDERABLE]: Renderable;
  }
) {
  const treeEntity = world.createEntity();

  components.addCollidable(world, treeEntity, entity[COLLIDABLE]);
  components.addPosition(world, treeEntity, entity[POSITION]);
  components.addSprite(world, treeEntity, entity[SPRITE]);
  components.addRenderable(world, treeEntity, entity[RENDERABLE]);

  return treeEntity;
}
