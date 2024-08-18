import * as components from "../components";
import { COLLIDABLE, Collidable } from "../components/collidable";
import { FOG, Fog } from "../components/fog";
import { LIGHT, Light } from "../components/light";
import { POSITION, Position } from "../components/position";
import { Renderable, RENDERABLE } from "../components/renderable";
import { SPRITE, Sprite } from "../components/sprite";
import type { World } from "../ecs";

export default function createWall(
  world: World,
  entity: {
    [COLLIDABLE]: Collidable;
    [FOG]: Fog;
    [POSITION]: Position;
    [SPRITE]: Sprite;
    [LIGHT]: Light;
    [RENDERABLE]: Renderable;
  }
) {
  const wallEntity = world.createEntity();

  components.addCollidable(world, wallEntity, entity[COLLIDABLE]);
  components.addFog(world, wallEntity , entity[FOG]);
  components.addPosition(world, wallEntity, entity[POSITION]);
  components.addSprite(world, wallEntity, entity[SPRITE]);
  components.addRenderable(world, wallEntity, entity[RENDERABLE]);
  components.addLight(world, wallEntity, entity[LIGHT]);

  return wallEntity;
}
