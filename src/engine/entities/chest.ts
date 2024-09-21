import * as components from "../components";
import { Animatable, ANIMATABLE } from "../components/animatable";
import { Attackable, ATTACKABLE } from "../components/attackable";
import { Collidable, COLLIDABLE } from "../components/collidable";
import { Countable, COUNTABLE } from "../components/countable";
import { Droppable, DROPPABLE } from "../components/droppable";
import { FOG, Fog } from "../components/fog";
import { Inventory, INVENTORY } from "../components/inventory";
import { Npc, NPC } from "../components/npc";
import { Orientable, ORIENTABLE } from "../components/orientable";
import { POSITION, Position } from "../components/position";
import { Renderable, RENDERABLE } from "../components/renderable";
import { SPRITE, Sprite } from "../components/sprite";
import { Tooltip, TOOLTIP } from "../components/tooltip";
import type { World } from "../ecs";

export default function createChest(
  world: World,
  entity: {
    [ANIMATABLE]: Animatable;
    [ATTACKABLE]: Attackable;
    [COLLIDABLE]: Collidable;
    [COUNTABLE]: Countable;
    [DROPPABLE]: Droppable;
    [FOG]: Fog;
    [INVENTORY]: Inventory;
    [NPC]: Npc;
    [ORIENTABLE]: Orientable;
    [POSITION]: Position;
    [RENDERABLE]: Renderable;
    [SPRITE]: Sprite;
    [TOOLTIP]: Tooltip;
  }
) {
  const chestEntity = world.createEntity();

  components.addAnimatable(world, chestEntity, entity[ANIMATABLE]);
  components.addAttackable(world, chestEntity, entity[ATTACKABLE]);
  components.addCollidable(world, chestEntity, entity[COLLIDABLE]);
  components.addCountable(world, chestEntity, entity[COUNTABLE]);
  components.addDroppable(world, chestEntity, entity[DROPPABLE]);
  components.addFog(world, chestEntity, entity[FOG]);
  components.addInventory(world, chestEntity, entity[INVENTORY]);
  components.addNpc(world, chestEntity, entity[NPC]);
  components.addOrientable(world, chestEntity, entity[ORIENTABLE]);
  components.addPosition(world, chestEntity, entity[POSITION]);
  components.addRenderable(world, chestEntity, entity[RENDERABLE]);
  components.addSprite(world, chestEntity, entity[SPRITE]);
  components.addTooltip(world, chestEntity, entity[TOOLTIP]);

  return chestEntity;
}
