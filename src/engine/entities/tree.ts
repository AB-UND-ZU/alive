import * as components from "../components";
import { COLLIDABLE, Collidable } from "../components/collidable";
import { FOG, Fog } from "../components/fog";
import { POSITION, Position } from "../components/position";
import { RENDERABLE, Renderable } from "../components/renderable";
import { SPRITE, Sprite } from "../components/sprite";
import type { World } from "../ecs";

export default function createTree(
  world: World,
  entity: {
    [COLLIDABLE]: Collidable;
    [FOG]: Fog;
    [POSITION]: Position;
    [SPRITE]: Sprite;
    [RENDERABLE]: Renderable;
  }
) {
  const treeEntity = world.createEntity();

  components.addCollidable(world, treeEntity, entity[COLLIDABLE]);
  components.addFog(world, treeEntity , entity[FOG]);
  components.addPosition(world, treeEntity, entity[POSITION]);
  components.addSprite(world, treeEntity, entity[SPRITE]);
  components.addRenderable(world, treeEntity, entity[RENDERABLE]);

  return treeEntity;
}
