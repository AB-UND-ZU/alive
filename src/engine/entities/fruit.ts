import * as components from "../components";
import { COLLIDABLE, Collidable } from "../components/collidable";
import { FOG, Fog } from "../components/fog";
import { Inventory, INVENTORY } from "../components/inventory";
import { Lootable, LOOTABLE } from "../components/lootable";
import { POSITION, Position } from "../components/position";
import { RENDERABLE, Renderable } from "../components/renderable";
import { SPRITE, Sprite } from "../components/sprite";
import type { World } from "../ecs";

export default function createFruit(
  world: World,
  entity: {
    [COLLIDABLE]: Collidable;
    [FOG]: Fog;
    [INVENTORY]: Inventory;
    [LOOTABLE]: Lootable;
    [POSITION]: Position;
    [SPRITE]: Sprite;
    [RENDERABLE]: Renderable;
  }
) {
  const fruitEntity = world.createEntity();

  components.addCollidable(world, fruitEntity, entity[COLLIDABLE]);
  components.addFog(world, fruitEntity, entity[FOG]);
  components.addInventory(world, fruitEntity, entity[INVENTORY]);
  components.addLootable(world, fruitEntity, entity[LOOTABLE]);
  components.addPosition(world, fruitEntity, entity[POSITION]);
  components.addSprite(world, fruitEntity, entity[SPRITE]);
  components.addRenderable(world, fruitEntity, entity[RENDERABLE]);

  return fruitEntity;
}
