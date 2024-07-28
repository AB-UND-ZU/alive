import * as components from "../components";
import { LIGHT, Light } from "../components/light";
import { POSITION, Position } from "../components/position";
import { SPRITE, Sprite } from "../components/sprite";
import { World } from "../ecs";

export default function createPlayer(
  world: World,
  entity: {
    [POSITION]: Position;
    [SPRITE]: Sprite;
    [LIGHT]: Light;
  }
) {
  const playerEntity = world.createEntity();

  components.addPosition(world, playerEntity, entity[POSITION]);
  components.addSprite(world, playerEntity, entity[SPRITE]);
  components.addLight(world, playerEntity, entity[LIGHT]);

  return playerEntity;
}
