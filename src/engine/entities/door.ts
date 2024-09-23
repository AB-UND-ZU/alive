import * as components from "../components";
import { Animatable, ANIMATABLE } from "../components/animatable";
import { FOG, Fog } from "../components/fog";
import { Light, LIGHT } from "../components/light";
import { Lockable, LOCKABLE } from "../components/lockable";
import { Npc, NPC } from "../components/npc";
import { Orientable, ORIENTABLE } from "../components/orientable";
import { POSITION, Position } from "../components/position";
import { Renderable, RENDERABLE } from "../components/renderable";
import { SPRITE, Sprite } from "../components/sprite";
import { Tooltip, TOOLTIP } from "../components/tooltip";
import type { World } from "../ecs";

export default function createDoor(
  world: World,
  entity: {
    [ANIMATABLE]: Animatable;
    [FOG]: Fog;
    [LIGHT]: Light;
    [LOCKABLE]: Lockable;
    [NPC]: Npc;
    [ORIENTABLE]: Orientable;
    [POSITION]: Position;
    [RENDERABLE]: Renderable;
    [SPRITE]: Sprite;
    [TOOLTIP]: Tooltip;
  }
) {
  const doorEntity = world.createEntity();

  components.addAnimatable(world, doorEntity, entity[ANIMATABLE]);
  components.addFog(world, doorEntity, entity[FOG]);
  components.addLight(world, doorEntity, entity[LIGHT]);
  components.addLockable(world, doorEntity, entity[LOCKABLE]);
  components.addNpc(world, doorEntity, entity[NPC]);
  components.addOrientable(world, doorEntity, entity[ORIENTABLE]);
  components.addPosition(world, doorEntity, entity[POSITION]);
  components.addRenderable(world, doorEntity, entity[RENDERABLE]);
  components.addSprite(world, doorEntity, entity[SPRITE]);
  components.addTooltip(world, doorEntity, entity[TOOLTIP]);

  return doorEntity;
}
