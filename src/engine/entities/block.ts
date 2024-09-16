import * as components from "../components";
import { Collidable, COLLIDABLE } from "../components/collidable";
import { Fog, FOG } from "../components/fog";
import { Position, POSITION } from "../components/position";
import { RENDERABLE, Renderable } from "../components/renderable";
import { Sprite, SPRITE } from "../components/sprite";
import type { World } from "../ecs";

export default function createBlock(
  world: World,
  entity: {
    [COLLIDABLE]: Collidable;
    [FOG]: Fog;
    [POSITION]: Position;
    [RENDERABLE]: Renderable;
    [SPRITE]: Sprite;
  }
) {
  const blockEntity = world.createEntity();

  components.addCollidable(world, blockEntity, entity[COLLIDABLE]);
  components.addFog(world, blockEntity, entity[FOG]);
  components.addPosition(world, blockEntity, entity[POSITION]);
  components.addRenderable(world, blockEntity, entity[RENDERABLE]);
  components.addSprite(world, blockEntity, entity[SPRITE]);

  return blockEntity;
}
