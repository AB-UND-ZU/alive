import * as components from "../components";
import { Collidable, COLLIDABLE } from "../components/collidable";
import { FOG, Fog } from "../components/fog";
import { POSITION, Position } from "../components/position";
import { RENDERABLE, Renderable } from "../components/renderable";
import { SPRITE, Sprite } from "../components/sprite";
import type { World } from "../ecs";

export default function createTerrain(
  world: World,
  entity: {
    [COLLIDABLE]: Collidable;
    [FOG]: Fog;
    [POSITION]: Position;
    [RENDERABLE]: Renderable;
    [SPRITE]: Sprite;
  }
) {
  const terrainEntity = world.createEntity();

  components.addCollidable(world, terrainEntity , entity[COLLIDABLE]);
  components.addFog(world, terrainEntity , entity[FOG]);
  components.addPosition(world, terrainEntity, entity[POSITION]);
  components.addRenderable(world, terrainEntity, entity[RENDERABLE]);
  components.addSprite(world, terrainEntity, entity[SPRITE]);

  return terrainEntity;
}
