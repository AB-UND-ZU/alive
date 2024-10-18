import * as components from "../components";
import { Actionable, ACTIONABLE } from "../components/actionable";
import { Animatable, ANIMATABLE } from "../components/animatable";
import { Attackable, ATTACKABLE } from "../components/attackable";
import { Collectable, COLLECTABLE } from "../components/collectable";
import { Countable, COUNTABLE } from "../components/countable";
import { Droppable, DROPPABLE } from "../components/droppable";
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
import { Spawnable, SPAWNABLE } from "../components/spawnable";
import { SPRITE, Sprite } from "../components/sprite";
import { SWIMMABLE, Swimmable } from "../components/swimmable";
import { Viewable, VIEWABLE } from "../components/viewable";
import type { World } from "../ecs";

export default function createHero(
  world: World,
  entity: {
    [ACTIONABLE]: Actionable;
    [ANIMATABLE]: Animatable;
    [ATTACKABLE]: Attackable;
    [COLLECTABLE]: Collectable;
    [COUNTABLE]: Countable;
    [DROPPABLE]: Droppable;
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
    [SPAWNABLE]: Spawnable;
    [SPRITE]: Sprite;
    [SWIMMABLE]: Swimmable;
    [VIEWABLE]: Viewable;
  }
) {
  const heroEntity = world.createEntity();

  components.addActionable(world, heroEntity, entity[ACTIONABLE]);
  components.addAnimatable(world, heroEntity, entity[ANIMATABLE]);
  components.addAttackable(world, heroEntity, entity[ATTACKABLE]);
  components.addCollectable(world, heroEntity, entity[COLLECTABLE]);
  components.addCountable(world, heroEntity, entity[COUNTABLE]);
  components.addDroppable(world, heroEntity, entity[DROPPABLE]);
  components.addEquippable(world, heroEntity, entity[EQUIPPABLE]);
  components.addFog(world, heroEntity, entity[FOG]);
  components.addInventory(world, heroEntity, entity[INVENTORY]);
  components.addLight(world, heroEntity, entity[LIGHT]);
  components.addMelee(world, heroEntity, entity[MELEE]);
  components.addMovable(world, heroEntity, entity[MOVABLE]);
  components.addOrientable(world, heroEntity, entity[ORIENTABLE]);
  components.addPlayer(world, heroEntity, entity[PLAYER]);
  components.addPosition(world, heroEntity, entity[POSITION]);
  components.addRenderable(world, heroEntity, entity[RENDERABLE]);
  components.addSpawnable(world, heroEntity, entity[SPAWNABLE]);
  components.addSprite(world, heroEntity, entity[SPRITE]);
  components.addSwimmable(world, heroEntity, entity[SWIMMABLE]);
  components.addViewable(world, heroEntity, entity[VIEWABLE]);

  return heroEntity;
}
