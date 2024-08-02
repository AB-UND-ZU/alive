import * as components from "../components";
import { LIGHT, Light } from "../components/light";
import { Player, PLAYER } from "../components/player";
import { POSITION, Position } from "../components/position";
import { Renderable, RENDERABLE } from "../components/renderable";
import { SPRITE, Sprite } from "../components/sprite";
import { World } from "../ecs";

export default function createHero(
  world: World,
  entity: {
    [POSITION]: Position;
    [SPRITE]: Sprite;
    [LIGHT]: Light;
    [PLAYER]: Player;
    [RENDERABLE]: Renderable;
  }
) {
  const heroEntity = world.createEntity();

  components.addLight(world, heroEntity, entity[LIGHT]);
  components.addPlayer(world, heroEntity, entity[PLAYER]);
  components.addPosition(world, heroEntity, entity[POSITION]);
  components.addRenderable(world, heroEntity, entity[RENDERABLE]);
  components.addSprite(world, heroEntity, entity[SPRITE]);

  return heroEntity;
}
