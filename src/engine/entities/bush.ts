import * as components from "../components";
import { FOG, Fog } from "../components/fog";
import { POSITION, Position } from "../components/position";
import { RENDERABLE, Renderable } from "../components/renderable";
import { SPRITE, Sprite } from "../components/sprite";
import type { World } from "../ecs";

export default function createBush(
  world: World,
  entity: {
    [FOG]: Fog;
    [POSITION]: Position;
    [SPRITE]: Sprite;
    [RENDERABLE]: Renderable;
  }
) {
  const bushEntity = world.createEntity();

  components.addFog(world, bushEntity , entity[FOG]);
  components.addPosition(world, bushEntity, entity[POSITION]);
  components.addSprite(world, bushEntity, entity[SPRITE]);
  components.addRenderable(world, bushEntity, entity[RENDERABLE]);

  return bushEntity;
}
