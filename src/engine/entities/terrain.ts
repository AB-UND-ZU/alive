import * as components from "../components";
import { FOG, Fog } from "../components/fog";
import { POSITION, Position } from "../components/position";
import { RENDERABLE, Renderable } from "../components/renderable";
import { SPRITE, Sprite } from "../components/sprite";
import type { World } from "../ecs";

export default function createTerrain(
  world: World,
  entity: {
    [FOG]: Fog;
    [POSITION]: Position;
    [RENDERABLE]: Renderable;
    [SPRITE]: Sprite;
  }
) {
  const terrainEntity = world.createEntity();

  components.addFog(world, terrainEntity , entity[FOG]);
  components.addPosition(world, terrainEntity, entity[POSITION]);
  components.addRenderable(world, terrainEntity, entity[RENDERABLE]);
  components.addSprite(world, terrainEntity, entity[SPRITE]);

  return terrainEntity;
}
