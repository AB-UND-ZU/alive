import * as components from "../components";
import { Animatable, ANIMATABLE } from "../components/animatable";
import { Item, ITEM } from "../components/item";
import { Orientable, ORIENTABLE } from "../components/orientable";
import { Renderable, RENDERABLE } from "../components/renderable";
import { Sprite, SPRITE } from "../components/sprite";
import type { World } from "../ecs";

export default function createSword(
  world: World,
  entity: {
    [ANIMATABLE]: Animatable;
    [ITEM]: Item;
    [ORIENTABLE]: Orientable;
    [RENDERABLE]: Renderable;
    [SPRITE]: Sprite;
  }
) {
  const swordEntity = world.createEntity();

  components.addAnimatable(world, swordEntity, entity[ANIMATABLE]);
  components.addItem(world, swordEntity, entity[ITEM]);
  components.addOrientable(world, swordEntity, entity[ORIENTABLE]);
  components.addRenderable(world, swordEntity, entity[RENDERABLE]);
  components.addSprite(world, swordEntity, entity[SPRITE]);

  return swordEntity;
}
