import * as components from "../components";
import { Actionable, ACTIONABLE } from "../components/actionable";
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

export default function createNpc(
  world: World,
  entity: {
    [ACTIONABLE]: Actionable;
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
  const npcEntity = world.createEntity();

  components.addActionable(world, npcEntity, entity[ACTIONABLE]);
  components.addAnimatable(world, npcEntity, entity[ANIMATABLE]);
  components.addAttackable(world, npcEntity, entity[ATTACKABLE]);
  components.addBehaviour(world, npcEntity, entity[BEHAVIOUR]);
  components.addCountable(world, npcEntity, entity[COUNTABLE]);
  components.addDroppable(world, npcEntity, entity[DROPPABLE]);
  components.addEquippable(world, npcEntity, entity[EQUIPPABLE]);
  components.addFog(world, npcEntity, entity[FOG]);
  components.addInventory(world, npcEntity, entity[INVENTORY]);
  components.addMelee(world, npcEntity, entity[MELEE]);
  components.addMovable(world, npcEntity, entity[MOVABLE]);
  components.addNpc(world, npcEntity, entity[NPC]);
  components.addOrientable(world, npcEntity, entity[ORIENTABLE]);
  components.addPosition(world, npcEntity, entity[POSITION]);
  components.addRenderable(world, npcEntity, entity[RENDERABLE]);
  components.addSprite(world, npcEntity, entity[SPRITE]);
  components.addSwimmable(world, npcEntity, entity[SWIMMABLE]);
  components.addTooltip(world, npcEntity, entity[TOOLTIP]);

  return npcEntity;
}
