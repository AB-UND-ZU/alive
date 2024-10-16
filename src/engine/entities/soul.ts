import * as components from "../components";
import { Animatable, ANIMATABLE } from "../components/animatable";
import { Equippable, EQUIPPABLE } from "../components/equippable";
import { Inventory, INVENTORY } from "../components/inventory";
import { Light, LIGHT } from "../components/light";
import { Movable, MOVABLE } from "../components/movable";
import { Position, POSITION } from "../components/position";
import { RENDERABLE, Renderable } from "../components/renderable";
import { Sprite, SPRITE } from "../components/sprite";
import { Viewable, VIEWABLE } from "../components/viewable";
import type { World } from "../ecs";

export default function createSoul(
  world: World,
  entity: {
    [ANIMATABLE]: Animatable;
    [EQUIPPABLE]: Equippable;
    [INVENTORY]: Inventory;
    [LIGHT]: Light;
    [MOVABLE]: Movable;
    [POSITION]: Position;
    [RENDERABLE]: Renderable;
    [SPRITE]: Sprite;
    [VIEWABLE]: Viewable;
  }
) {
  const soulEntity = world.createEntity();

  components.addAnimatable(world, soulEntity, entity[ANIMATABLE]);
  components.addEquippable(world, soulEntity, entity[EQUIPPABLE]);
  components.addInventory(world, soulEntity, entity[INVENTORY]);
  components.addLight(world, soulEntity, entity[LIGHT]);
  components.addMovable(world, soulEntity, entity[MOVABLE]);
  components.addPosition(world, soulEntity, entity[POSITION]);
  components.addRenderable(world, soulEntity, entity[RENDERABLE]);
  components.addSprite(world, soulEntity, entity[SPRITE]);
  components.addViewable(world, soulEntity, entity[VIEWABLE]);

  return soulEntity;
}
