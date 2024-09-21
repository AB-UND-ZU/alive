import * as components from "../components";
import { Item, ITEM } from "../components/item";
import { Renderable, RENDERABLE } from "../components/renderable";
import { Sprite, SPRITE } from "../components/sprite";
import type { World } from "../ecs";

export default function createItem(
  world: World,
  entity: {
    [ITEM]: Item;
    [RENDERABLE]: Renderable;
    [SPRITE]: Sprite;
  }
) {
  const itemEntity = world.createEntity();

  components.addItem(world, itemEntity, entity[ITEM]);
  components.addRenderable(world, itemEntity, entity[RENDERABLE]);
  components.addSprite(world, itemEntity, entity[SPRITE]);

  return itemEntity;
}
