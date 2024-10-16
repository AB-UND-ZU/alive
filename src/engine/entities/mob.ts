import * as components from "../components";
import { Animatable, ANIMATABLE } from "../components/animatable";
import { Attackable, ATTACKABLE } from "../components/attackable";
import { Behaviour, BEHAVIOUR } from "../components/behaviour";
import { Countable, COUNTABLE } from "../components/countable";
import { Droppable, DROPPABLE } from "../components/droppable";
import { Equippable, EQUIPPABLE } from "../components/equippable";
import { FOG, Fog } from "../components/fog";
import { Inventory, INVENTORY } from "../components/inventory";
import { Melee, MELEE } from "../components/melee";
import { Movable, MOVABLE } from "../components/movable";
import { Npc, NPC } from "../components/npc";
import { Orientable, ORIENTABLE } from "../components/orientable";
import { POSITION, Position } from "../components/position";
import { Renderable, RENDERABLE } from "../components/renderable";
import { SPRITE, Sprite } from "../components/sprite";
import { SWIMMABLE, Swimmable } from "../components/swimmable";
import { Tooltip, TOOLTIP } from "../components/tooltip";
import type { World } from "../ecs";

export default function createMob(
  world: World,
  entity: {
    [ANIMATABLE]: Animatable;
    [ATTACKABLE]: Attackable;
    [BEHAVIOUR]: Behaviour;
    [COUNTABLE]: Countable;
    [DROPPABLE]: Droppable;
    [EQUIPPABLE]: Equippable;
    [FOG]: Fog;
    [INVENTORY]: Inventory;
    [MELEE]: Melee;
    [MOVABLE]: Movable;
    [NPC]: Npc;
    [ORIENTABLE]: Orientable;
    [POSITION]: Position;
    [RENDERABLE]: Renderable;
    [SPRITE]: Sprite;
    [SWIMMABLE]: Swimmable;
    [TOOLTIP]: Tooltip;
  }
) {
  const mobEntity = world.createEntity();

  components.addAnimatable(world, mobEntity, entity[ANIMATABLE]);
  components.addAttackable(world, mobEntity, entity[ATTACKABLE]);
  components.addBehaviour(world, mobEntity, entity[BEHAVIOUR]);
  components.addCountable(world, mobEntity, entity[COUNTABLE]);
  components.addDroppable(world, mobEntity, entity[DROPPABLE]);
  components.addEquippable(world, mobEntity, entity[EQUIPPABLE]);
  components.addFog(world, mobEntity, entity[FOG]);
  components.addInventory(world, mobEntity, entity[INVENTORY]);
  components.addMelee(world, mobEntity, entity[MELEE]);
  components.addMovable(world, mobEntity, entity[MOVABLE]);
  components.addNpc(world, mobEntity, entity[NPC]);
  components.addOrientable(world, mobEntity, entity[ORIENTABLE]);
  components.addPosition(world, mobEntity, entity[POSITION]);
  components.addRenderable(world, mobEntity, entity[RENDERABLE]);
  components.addSprite(world, mobEntity, entity[SPRITE]);
  components.addSwimmable(world, mobEntity, entity[SWIMMABLE]);
  components.addTooltip(world, mobEntity, entity[TOOLTIP]);

  return mobEntity;
}
