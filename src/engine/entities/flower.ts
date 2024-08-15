import * as components from "../components";
import { FOG, Fog } from "../components/fog";
import { POSITION, Position } from "../components/position";
import { RENDERABLE, Renderable } from "../components/renderable";
import { SPRITE, Sprite } from "../components/sprite";
import type { World } from "../ecs";

export default function createFlower(
  world: World,
  entity: {
    [FOG]: Fog;
    [POSITION]: Position;
    [SPRITE]: Sprite;
    [RENDERABLE]: Renderable;
  }
) {
  const flowerEntity = world.createEntity();

  components.addFog(world, flowerEntity , entity[FOG]);
  components.addPosition(world, flowerEntity, entity[POSITION]);
  components.addSprite(world, flowerEntity, entity[SPRITE]);
  components.addRenderable(world, flowerEntity, entity[RENDERABLE]);

  return flowerEntity;
}
