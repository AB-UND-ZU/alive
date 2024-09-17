import * as components from "../components";
import { Animatable, ANIMATABLE } from "../components/animatable";
import { Item, ITEM } from "../components/item";
import { Renderable, RENDERABLE } from "../components/renderable";
import { Sprite, SPRITE } from "../components/sprite";
import type { World } from "../ecs";

export default function createApple(
  world: World,
  entity: {
    [ANIMATABLE]: Animatable;
    [ITEM]: Item;
    [RENDERABLE]: Renderable;
    [SPRITE]: Sprite;
  }
) {
  const appleEntity = world.createEntity();

  components.addAnimatable(world, appleEntity, entity[ANIMATABLE]);
  components.addItem(world, appleEntity, entity[ITEM]);
  components.addRenderable(world, appleEntity, entity[RENDERABLE]);
  components.addSprite(world, appleEntity, entity[SPRITE]);

  return appleEntity;
}
