import * as components from "../components";
import { Animatable, ANIMATABLE } from "../components/animatable";
import { Collidable, COLLIDABLE } from "../components/collidable";
import { FOG, Fog } from "../components/fog";
import { Light, LIGHT } from "../components/light";
import { Npc, NPC } from "../components/npc";
import { POSITION, Position } from "../components/position";
import { Renderable, RENDERABLE } from "../components/renderable";
import { SPRITE, Sprite } from "../components/sprite";
import type { World } from "../ecs";

export default function createDoor(
  world: World,
  entity: {
    [ANIMATABLE]: Animatable;
    [COLLIDABLE]: Collidable;
    [FOG]: Fog;
    [LIGHT]: Light;
    [NPC]: Npc;
    [POSITION]: Position;
    [SPRITE]: Sprite;
    [RENDERABLE]: Renderable;
  }
) {
  const doorEntity = world.createEntity();

  components.addAnimatable(world, doorEntity, entity[ANIMATABLE]);
  components.addCollidable(world, doorEntity, entity[COLLIDABLE]);
  components.addFog(world, doorEntity , entity[FOG]);
  components.addLight(world, doorEntity, entity[LIGHT]);
  components.addNpc(world, doorEntity , entity[NPC]);
  components.addPosition(world, doorEntity, entity[POSITION]);
  components.addSprite(world, doorEntity, entity[SPRITE]);
  components.addRenderable(world, doorEntity, entity[RENDERABLE]);

  return doorEntity;
}
