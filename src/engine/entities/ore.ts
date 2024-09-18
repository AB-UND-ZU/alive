import * as components from "../components";
import { COLLIDABLE, Collidable } from "../components/collidable";
import { FOG, Fog } from "../components/fog";
import { Inventory, INVENTORY } from "../components/inventory";
import { Lootable, LOOTABLE } from "../components/lootable";
import { LIGHT, Light } from "../components/light";
import { POSITION, Position } from "../components/position";
import { Renderable, RENDERABLE } from "../components/renderable";
import { SPRITE, Sprite } from "../components/sprite";
import type { World } from "../ecs";

export default function createOre(
  world: World,
  entity: {
    [COLLIDABLE]: Collidable;
    [FOG]: Fog;
    [INVENTORY]: Inventory;
    [LIGHT]: Light;
    [LOOTABLE]: Lootable;
    [POSITION]: Position;
    [SPRITE]: Sprite;
    [RENDERABLE]: Renderable;
  }
) {
  const oreEntity = world.createEntity();

  components.addCollidable(world, oreEntity, entity[COLLIDABLE]);
  components.addFog(world, oreEntity, entity[FOG]);
  components.addInventory(world, oreEntity, entity[INVENTORY]);
  components.addLight(world, oreEntity, entity[LIGHT]);
  components.addLootable(world, oreEntity, entity[LOOTABLE]);
  components.addPosition(world, oreEntity, entity[POSITION]);
  components.addSprite(world, oreEntity, entity[SPRITE]);
  components.addRenderable(world, oreEntity, entity[RENDERABLE]);

  return oreEntity;
}
