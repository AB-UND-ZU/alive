import * as components from "../components";
import { Animatable, ANIMATABLE } from "../components/animatable";
import { Attackable, ATTACKABLE } from "../components/attackable";
import { Countable, COUNTABLE } from "../components/countable";
import { Equippable, EQUIPPABLE } from "../components/equippable";
import { Fog, FOG } from "../components/fog";
import { Inventory, INVENTORY } from "../components/inventory";
import { LIGHT, Light } from "../components/light";
import { Melee, MELEE } from "../components/melee";
import { Movable, MOVABLE } from "../components/movable";
import { Orientable, ORIENTABLE } from "../components/orientable";
import { Player, PLAYER } from "../components/player";
import { POSITION, Position } from "../components/position";
import { Renderable, RENDERABLE } from "../components/renderable";
import { SPRITE, Sprite } from "../components/sprite";
import { SWIMMABLE, Swimmable } from "../components/swimmable";
import { Viewable, VIEWABLE } from "../components/viewable";
import type { World } from "../ecs";

export default function createHero(
  world: World,
  entity: {
    [ANIMATABLE]: Animatable;
    [ATTACKABLE]: Attackable;
    [COUNTABLE]: Countable;
    [EQUIPPABLE]: Equippable;
    [FOG]: Fog;
    [INVENTORY]: Inventory;
    [LIGHT]: Light;
    [MELEE]: Melee;
    [MOVABLE]: Movable;
    [ORIENTABLE]: Orientable;
    [PLAYER]: Player;
    [POSITION]: Position;
    [RENDERABLE]: Renderable;
    [SPRITE]: Sprite;
    [SWIMMABLE]: Swimmable;
    [VIEWABLE]: Viewable;
  }
) {
  const heroEntity = world.createEntity();

  components.addAnimatable(world, heroEntity, entity[ANIMATABLE]);
  components.addAttackable(world, heroEntity, entity[ATTACKABLE]);
  components.addEquippable(world, heroEntity, entity[EQUIPPABLE]);
  components.addInventory(world, heroEntity, entity[INVENTORY]);
  components.addCountable(world, heroEntity, entity[COUNTABLE]);
  components.addFog(world, heroEntity, entity[FOG]);
  components.addLight(world, heroEntity, entity[LIGHT]);
  components.addMelee(world, heroEntity, entity[MELEE]);
  components.addMovable(world, heroEntity, entity[MOVABLE]);
  components.addOrientable(world, heroEntity, entity[ORIENTABLE]);
  components.addPlayer(world, heroEntity, entity[PLAYER]);
  components.addPosition(world, heroEntity, entity[POSITION]);
  components.addRenderable(world, heroEntity, entity[RENDERABLE]);
  components.addSprite(world, heroEntity, entity[SPRITE]);
  components.addSwimmable(world, heroEntity, entity[SWIMMABLE]);
  components.addViewable(world, heroEntity, entity[VIEWABLE]);

  return heroEntity;
}
