import * as components from "../components";
import { Animatable, ANIMATABLE } from "../components/animatable";
import { Item, ITEM } from "../components/item";
import { Renderable, RENDERABLE } from "../components/renderable";
import { Sprite, SPRITE } from "../components/sprite";
import type { World } from "../ecs";

export default function createKey(
  world: World,
  entity: {
    [ANIMATABLE]: Animatable;
    [ITEM]: Item;
    [RENDERABLE]: Renderable;
    [SPRITE]: Sprite;
  }
) {
  const keyEntity = world.createEntity();

  components.addAnimatable(world, keyEntity, entity[ANIMATABLE]);
  components.addItem(world, keyEntity, entity[ITEM]);
  components.addRenderable(world, keyEntity, entity[RENDERABLE]);
  components.addSprite(world, keyEntity, entity[SPRITE]);

  return keyEntity;
}
