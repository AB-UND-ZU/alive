import * as components from "../components";
import { Item, ITEM } from "../components/item";
import { Renderable, RENDERABLE } from "../components/renderable";
import { Sprite, SPRITE } from "../components/sprite";
import type { World } from "../ecs";

export default function createSword(
  world: World,
  entity: {
    [ITEM]: Item;
    [RENDERABLE]: Renderable;
    [SPRITE]: Sprite;
  }
) {
  const swordEntity = world.createEntity();

  components.addItem(world, swordEntity, entity[ITEM]);
  components.addRenderable(world, swordEntity, entity[RENDERABLE]);
  components.addSprite(world, swordEntity, entity[SPRITE]);

  return swordEntity;
}
