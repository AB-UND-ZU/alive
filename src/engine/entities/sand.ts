import * as components from "../components";
import { FOG, Fog } from "../components/fog";
import { POSITION, Position } from "../components/position";
import { Renderable, RENDERABLE } from "../components/renderable";
import { SPRITE, Sprite } from "../components/sprite";
import type { World } from "../ecs";

export default function createSand(
  world: World,
  entity: {
    [FOG]: Fog;
    [POSITION]: Position;
    [SPRITE]: Sprite;
    [RENDERABLE]: Renderable;
  }
) {
  const sandEntity = world.createEntity();

  components.addFog(world, sandEntity , entity[FOG]);
  components.addPosition(world, sandEntity, entity[POSITION]);
  components.addSprite(world, sandEntity, entity[SPRITE]);
  components.addRenderable(world, sandEntity, entity[RENDERABLE]);

  return sandEntity;
}
