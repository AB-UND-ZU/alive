import * as components from "../components";
import { Fog, FOG } from "../components/fog";
import { Position, POSITION } from "../components/position";
import { RENDERABLE, Renderable } from "../components/renderable";
import { Sprite, SPRITE } from "../components/sprite";
import type { World } from "../ecs";

export default function createFloat(
  world: World,
  entity: {
    [FOG]: Fog;
    [POSITION]: Position;
    [RENDERABLE]: Renderable;
    [SPRITE]: Sprite;
  }
) {
  const floatEntity = world.createEntity();

  components.addFog(world, floatEntity, entity[FOG]);
  components.addPosition(world, floatEntity, entity[POSITION]);
  components.addRenderable(world, floatEntity, entity[RENDERABLE]);
  components.addSprite(world, floatEntity, entity[SPRITE]);

  return floatEntity;
}
