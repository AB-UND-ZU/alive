import * as components from "../components";
import { Collidable, COLLIDABLE } from "../components/collidable";
import { LIGHT, Light } from "../components/light";
import { Movable, MOVABLE } from "../components/movable";
import { Player, PLAYER } from "../components/player";
import { POSITION, Position } from "../components/position";
import { Reference, REFERENCE } from "../components/reference";
import { Renderable, RENDERABLE } from "../components/renderable";
import { SPRITE, Sprite } from "../components/sprite";
import { SWIMMABLE, Swimmable } from "../components/swimmable";
import type { World } from "../ecs";

export default function createHero(
  world: World,
  entity: {
    [COLLIDABLE]: Collidable;
    [POSITION]: Position;
    [SPRITE]: Sprite;
    [LIGHT]: Light;
    [MOVABLE]: Movable;
    [PLAYER]: Player;
    [REFERENCE]: Reference;
    [RENDERABLE]: Renderable;
    [SWIMMABLE]: Swimmable;
  }
) {
  const heroEntity = world.createEntity();

  components.addCollidable(world, heroEntity, entity[COLLIDABLE]);
  components.addLight(world, heroEntity, entity[LIGHT]);
  components.addMovable(world, heroEntity, entity[MOVABLE]);
  components.addPlayer(world, heroEntity, entity[PLAYER]);
  components.addPosition(world, heroEntity, entity[POSITION]);
  components.addReference(world, heroEntity, entity[REFERENCE]);
  components.addRenderable(world, heroEntity, entity[RENDERABLE]);
  components.addSprite(world, heroEntity, entity[SPRITE]);
  components.addSwimmable(world, heroEntity, entity[SWIMMABLE]);

  return heroEntity;
}
