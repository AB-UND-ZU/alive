import * as components from "../components";
import { Animatable, ANIMATABLE } from "../components/animatable";
import { Collidable, COLLIDABLE } from "../components/collidable";
import { FOG, Fog } from "../components/fog";
import { Inventory, INVENTORY } from "../components/inventory";
import { Lootable, LOOTABLE } from "../components/lootable";
import { POSITION, Position } from "../components/position";
import { Renderable, RENDERABLE } from "../components/renderable";
import { SPRITE, Sprite } from "../components/sprite";
import { Tooltip, TOOLTIP } from "../components/tooltip";
import { Tradable, TRADABLE } from "../components/tradable";
import type { World } from "../ecs";

export default function createShop(
  world: World,
  entity: {
    [ANIMATABLE]: Animatable;
    [COLLIDABLE]: Collidable;
    [FOG]: Fog;
    [INVENTORY]: Inventory;
    [LOOTABLE]: Lootable;
    [POSITION]: Position;
    [RENDERABLE]: Renderable;
    [SPRITE]: Sprite;
    [TOOLTIP]: Tooltip;
    [TRADABLE]: Tradable;
  }
) {
  const shopEntity = world.createEntity();

  components.addAnimatable(world, shopEntity, entity[ANIMATABLE]);
  components.addCollidable(world, shopEntity, entity[COLLIDABLE]);
  components.addFog(world, shopEntity, entity[FOG]);
  components.addInventory(world, shopEntity, entity[INVENTORY]);
  components.addLootable(world, shopEntity, entity[LOOTABLE]);
  components.addPosition(world, shopEntity, entity[POSITION]);
  components.addRenderable(world, shopEntity, entity[RENDERABLE]);
  components.addSprite(world, shopEntity, entity[SPRITE]);
  components.addTooltip(world, shopEntity, entity[TOOLTIP]);
  components.addTradable(world, shopEntity, entity[TRADABLE]);

  return shopEntity;
}
