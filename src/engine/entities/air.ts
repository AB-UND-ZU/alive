import * as components from "../components";
import { FOG, Fog } from "../components/fog";
import { POSITION, Position } from "../components/position";
import { RENDERABLE, Renderable } from "../components/renderable";
import { SPRITE, Sprite } from "../components/sprite";
import type { World } from "../ecs";

export default function createAir(
  world: World,
  entity: {
    [FOG]: Fog;
    [POSITION]: Position;
    [RENDERABLE]: Renderable;
    [SPRITE]: Sprite;
  }
) {
  const airEntity = world.createEntity();

  components.addFog(world, airEntity , entity[FOG]);
  components.addPosition(world, airEntity, entity[POSITION]);
  components.addRenderable(world, airEntity, entity[RENDERABLE]);
  components.addSprite(world, airEntity, entity[SPRITE]);

  return airEntity;
}
