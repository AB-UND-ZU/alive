import * as components from "../components";
import { LIGHT, Light } from "../components/light";
import { POSITION, Position } from "../components/position";
import { Renderable, RENDERABLE } from "../components/renderable";
import { SPRITE, Sprite } from "../components/sprite";
import { World } from "../ecs";

export default function createTerrain(
  world: World,
  entity: {
    [POSITION]: Position;
    [SPRITE]: Sprite;
    [LIGHT]: Light;
    [RENDERABLE]: Renderable;
  }
) {
  const terrainEntity = world.createEntity();

  components.addPosition(world, terrainEntity, entity[POSITION]);
  components.addSprite(world, terrainEntity, entity[SPRITE]);
  components.addRenderable(world, terrainEntity, entity[RENDERABLE]);
  components.addLight(world, terrainEntity, entity[LIGHT]);

  return terrainEntity;
}
