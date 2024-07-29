import * as components from "../components";
import { LIGHT, Light } from "../components/light";
import { Player, PLAYER } from "../components/player";
import { POSITION, Position } from "../components/position";
import { SPRITE, Sprite } from "../components/sprite";
import { World } from "../ecs";

export default function createHero(
  world: World,
  entity: {
    [POSITION]: Position;
    [SPRITE]: Sprite;
    [LIGHT]: Light;
    [PLAYER]: Player;
  }
) {
  const heroEntity = world.createEntity();

  components.addLight(world, heroEntity, entity[LIGHT]);
  components.addPlayer(world, heroEntity, entity[PLAYER]);
  components.addPosition(world, heroEntity, entity[POSITION]);
  components.addSprite(world, heroEntity, entity[SPRITE]);

  return heroEntity;
}
