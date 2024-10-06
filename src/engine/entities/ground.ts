import * as components from "../components";
import { FOG, Fog } from "../components/fog";
import { POSITION, Position } from "../components/position";
import { RENDERABLE, Renderable } from "../components/renderable";
import { SPRITE, Sprite } from "../components/sprite";
import type { World } from "../ecs";

export default function createGround(
  world: World,
  entity: {
    [FOG]: Fog;
    [POSITION]: Position;
    [RENDERABLE]: Renderable;
    [SPRITE]: Sprite;
  }
) {
  const groundEntity = world.createEntity();

  components.addFog(world, groundEntity, entity[FOG]);
  components.addPosition(world, groundEntity, entity[POSITION]);
  components.addRenderable(world, groundEntity, entity[RENDERABLE]);
  components.addSprite(world, groundEntity, entity[SPRITE]);

  return groundEntity;
}
