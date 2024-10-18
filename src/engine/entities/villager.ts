import * as components from "../components";
import { Actionable, ACTIONABLE } from "../components/actionable";
import { Animatable, ANIMATABLE } from "../components/animatable";
import { Attackable, ATTACKABLE } from "../components/attackable";
import { Behaviour, BEHAVIOUR } from "../components/behaviour";
import { Collectable, COLLECTABLE } from "../components/collectable";
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

export default function createVillager(
  world: World,
  entity: {
    [ACTIONABLE]: Actionable;
    [ANIMATABLE]: Animatable;
    [ATTACKABLE]: Attackable;
    [BEHAVIOUR]: Behaviour;
    [COLLECTABLE]: Collectable;
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
  const villagerEntity = world.createEntity();

  components.addActionable(world, villagerEntity, entity[ACTIONABLE]);
  components.addAnimatable(world, villagerEntity, entity[ANIMATABLE]);
  components.addAttackable(world, villagerEntity, entity[ATTACKABLE]);
  components.addBehaviour(world, villagerEntity, entity[BEHAVIOUR]);
  components.addCollectable(world, villagerEntity, entity[COLLECTABLE]);
  components.addCountable(world, villagerEntity, entity[COUNTABLE]);
  components.addDroppable(world, villagerEntity, entity[DROPPABLE]);
  components.addEquippable(world, villagerEntity, entity[EQUIPPABLE]);
  components.addFog(world, villagerEntity, entity[FOG]);
  components.addInventory(world, villagerEntity, entity[INVENTORY]);
  components.addMelee(world, villagerEntity, entity[MELEE]);
  components.addMovable(world, villagerEntity, entity[MOVABLE]);
  components.addNpc(world, villagerEntity, entity[NPC]);
  components.addOrientable(world, villagerEntity, entity[ORIENTABLE]);
  components.addPosition(world, villagerEntity, entity[POSITION]);
  components.addRenderable(world, villagerEntity, entity[RENDERABLE]);
  components.addSprite(world, villagerEntity, entity[SPRITE]);
  components.addSwimmable(world, villagerEntity, entity[SWIMMABLE]);
  components.addTooltip(world, villagerEntity, entity[TOOLTIP]);

  return villagerEntity;
}
