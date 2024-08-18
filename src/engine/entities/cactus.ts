import * as components from "../components";
import { COLLIDABLE, Collidable } from "../components/collidable";
import { FOG, Fog } from "../components/fog";
import { POSITION, Position } from "../components/position";
import { RENDERABLE, Renderable } from "../components/renderable";
import { SPRITE, Sprite } from "../components/sprite";
import type { World } from "../ecs";

export default function createCactus(
  world: World,
  entity: {
    [COLLIDABLE]: Collidable;
    [FOG]: Fog;
    [POSITION]: Position;
    [SPRITE]: Sprite;
    [RENDERABLE]: Renderable;
  }
) {
  const cactusEntity = world.createEntity();

  components.addCollidable(world, cactusEntity, entity[COLLIDABLE]);
  components.addFog(world, cactusEntity , entity[FOG]);
  components.addPosition(world, cactusEntity, entity[POSITION]);
  components.addSprite(world, cactusEntity, entity[SPRITE]);
  components.addRenderable(world, cactusEntity, entity[RENDERABLE]);

  return cactusEntity;
}
