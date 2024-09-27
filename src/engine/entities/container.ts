import * as components from "../components";
import { Animatable, ANIMATABLE } from "../components/animatable";
import { FOG, Fog } from "../components/fog";
import { Inventory, INVENTORY } from "../components/inventory";
import { Lootable, LOOTABLE } from "../components/lootable";
import { POSITION, Position } from "../components/position";
import { Renderable, RENDERABLE } from "../components/renderable";
import { SPRITE, Sprite } from "../components/sprite";
import { Swimmable, SWIMMABLE } from "../components/swimmable";
import { Tooltip, TOOLTIP } from "../components/tooltip";
import type { World } from "../ecs";

export default function createContainer(
  world: World,
  entity: {
    [ANIMATABLE]: Animatable;
    [FOG]: Fog;
    [INVENTORY]: Inventory;
    [LOOTABLE]: Lootable;
    [POSITION]: Position;
    [RENDERABLE]: Renderable;
    [SPRITE]: Sprite;
    [SWIMMABLE]: Swimmable;
    [TOOLTIP]: Tooltip;
  }
) {
  const containerEntity = world.createEntity();

  components.addAnimatable(world, containerEntity, entity[ANIMATABLE]);
  components.addFog(world, containerEntity, entity[FOG]);
  components.addInventory(world, containerEntity, entity[INVENTORY]);
  components.addLootable(world, containerEntity, entity[LOOTABLE]);
  components.addPosition(world, containerEntity, entity[POSITION]);
  components.addRenderable(world, containerEntity, entity[RENDERABLE]);
  components.addSprite(world, containerEntity, entity[SPRITE]);
  components.addSwimmable(world, containerEntity, entity[SWIMMABLE]);
  components.addTooltip(world, containerEntity, entity[TOOLTIP]);

  return containerEntity;
}
