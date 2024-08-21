import * as components from "../components";
import { FOG, Fog } from "../components/fog";
import { Immersible, IMMERSIBLE } from "../components/immersible";
import { POSITION, Position } from "../components/position";
import { Renderable, RENDERABLE } from "../components/renderable";
import { SPRITE, Sprite } from "../components/sprite";
import type { World } from "../ecs";

export default function createWater(
  world: World,
  entity: {
    [FOG]: Fog;
    [IMMERSIBLE]: Immersible;
    [POSITION]: Position;
    [SPRITE]: Sprite;
    [RENDERABLE]: Renderable;
  }
) {
  const waterEntity = world.createEntity();

  components.addFog(world, waterEntity , entity[FOG]);
  components.addImmersible(world, waterEntity , entity[IMMERSIBLE]);
  components.addPosition(world, waterEntity, entity[POSITION]);
  components.addSprite(world, waterEntity, entity[SPRITE]);
  components.addRenderable(world, waterEntity, entity[RENDERABLE]);

  return waterEntity;
}
