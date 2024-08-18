import * as components from "../components";
import { FOG, Fog } from "../components/fog";
import { POSITION, Position } from "../components/position";
import { Renderable, RENDERABLE } from "../components/renderable";
import { SPRITE, Sprite } from "../components/sprite";
import type { World } from "../ecs";

export default function createIce(
  world: World,
  entity: {
    [FOG]: Fog;
    [POSITION]: Position;
    [SPRITE]: Sprite;
    [RENDERABLE]: Renderable;
  }
) {
  const iceEntity = world.createEntity();

  components.addFog(world, iceEntity , entity[FOG]);
  components.addPosition(world, iceEntity, entity[POSITION]);
  components.addSprite(world, iceEntity, entity[SPRITE]);
  components.addRenderable(world, iceEntity, entity[RENDERABLE]);

  return iceEntity;
}
