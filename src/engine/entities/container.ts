import * as components from "../components";
import { FOG, Fog } from "../components/fog";
import { Inventory, INVENTORY } from "../components/inventory";
import { Lootable, LOOTABLE } from "../components/lootable";
import { POSITION, Position } from "../components/position";
import { Renderable, RENDERABLE } from "../components/renderable";
import { SPRITE, Sprite } from "../components/sprite";
import type { World } from "../ecs";

export default function createContainer(
  world: World,
  entity: {
    [FOG]: Fog;
    [INVENTORY]: Inventory;
    [LOOTABLE]: Lootable;
    [POSITION]: Position;
    [SPRITE]: Sprite;
    [RENDERABLE]: Renderable;
  }
) {
  const containerEntity = world.createEntity();

  components.addFog(world, containerEntity, entity[FOG]);
  components.addInventory(world, containerEntity, entity[INVENTORY]);
  components.addLootable(world, containerEntity, entity[LOOTABLE]);
  components.addPosition(world, containerEntity, entity[POSITION]);
  components.addSprite(world, containerEntity, entity[SPRITE]);
  components.addRenderable(world, containerEntity, entity[RENDERABLE]);

  return containerEntity;
}
