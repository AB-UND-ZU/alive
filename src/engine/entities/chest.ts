import * as components from "../components";
import { Animatable, ANIMATABLE } from "../components/animatable";
import { Attackable, ATTACKABLE } from "../components/attackable";
import { Collidable, COLLIDABLE } from "../components/collidable";
import { Countable, COUNTABLE } from "../components/countable";
import { FOG, Fog } from "../components/fog";
import { Inventory, INVENTORY } from "../components/inventory";
import { Lootable, LOOTABLE } from "../components/lootable";
import { Movable, MOVABLE } from "../components/movable";
import { Npc, NPC } from "../components/npc";
import { Orientable, ORIENTABLE } from "../components/orientable";
import { POSITION, Position } from "../components/position";
import { Renderable, RENDERABLE } from "../components/renderable";
import { SPRITE, Sprite } from "../components/sprite";
import type { World } from "../ecs";

export default function createChest(
  world: World,
  entity: {
    [ANIMATABLE]: Animatable;
    [ATTACKABLE]: Attackable;
    [COLLIDABLE]: Collidable;
    [COUNTABLE]: Countable;
    [FOG]: Fog;
    [INVENTORY]: Inventory;
    [LOOTABLE]: Lootable;
    [MOVABLE]: Movable;
    [NPC]: Npc;
    [ORIENTABLE]: Orientable;
    [POSITION]: Position;
    [SPRITE]: Sprite;
    [RENDERABLE]: Renderable;
  }
) {
  const chestEntity = world.createEntity();

  components.addAnimatable(world, chestEntity, entity[ANIMATABLE]);
  components.addAttackable(world, chestEntity, entity[ATTACKABLE]);
  components.addCollidable(world, chestEntity, entity[COLLIDABLE]);
  components.addCountable(world, chestEntity, entity[COUNTABLE]);
  components.addFog(world, chestEntity, entity[FOG]);
  components.addInventory(world, chestEntity, entity[INVENTORY]);
  components.addLootable(world, chestEntity, entity[LOOTABLE]);
  components.addMovable(world, chestEntity, entity[MOVABLE]);
  components.addNpc(world, chestEntity, entity[NPC]);
  components.addOrientable(world, chestEntity, entity[ORIENTABLE]);
  components.addPosition(world, chestEntity, entity[POSITION]);
  components.addSprite(world, chestEntity, entity[SPRITE]);
  components.addRenderable(world, chestEntity, entity[RENDERABLE]);

  return chestEntity;
}
