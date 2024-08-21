import * as components from "../components";
import { Behaviour, BEHAVIOUR } from "../components/behaviour";
import { Collidable, COLLIDABLE } from "../components/collidable";
import { FOG, Fog } from "../components/fog";
import { Movable, MOVABLE } from "../components/movable";
import { Npc, NPC } from "../components/npc";
import { POSITION, Position } from "../components/position";
import { Renderable, RENDERABLE } from "../components/renderable";
import { SPRITE, Sprite } from "../components/sprite";
import { SWIMMABLE, Swimmable } from "../components/swimmable";
import type { World } from "../ecs";

export default function createTriangle(
  world: World,
  entity: {
    [BEHAVIOUR]: Behaviour;
    [COLLIDABLE]: Collidable;
    [FOG]: Fog;
    [MOVABLE]: Movable;
    [NPC]: Npc;
    [POSITION]: Position;
    [SPRITE]: Sprite;
    [RENDERABLE]: Renderable;
    [SWIMMABLE]: Swimmable;
  }
) {
  const triangleEntity = world.createEntity();

  components.addBehaviour(world, triangleEntity, entity[BEHAVIOUR]);
  components.addCollidable(world, triangleEntity, entity[COLLIDABLE]);
  components.addFog(world, triangleEntity , entity[FOG]);
  components.addMovable(world, triangleEntity, entity[MOVABLE]);
  components.addNpc(world, triangleEntity , entity[NPC]);
  components.addPosition(world, triangleEntity, entity[POSITION]);
  components.addSprite(world, triangleEntity, entity[SPRITE]);
  components.addRenderable(world, triangleEntity, entity[RENDERABLE]);
  components.addSwimmable(world, triangleEntity, entity[SWIMMABLE]);

  return triangleEntity;
}
