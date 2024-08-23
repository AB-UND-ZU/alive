import * as components from "../components";
import { Particle, PARTICLE } from "../components/particle";
import { POSITION, Position } from "../components/position";
import { Renderable, RENDERABLE } from "../components/renderable";
import { SPRITE, Sprite } from "../components/sprite";
import type { World } from "../ecs";

export default function createHit(
  world: World,
  entity: {
    [PARTICLE]: Particle;
    [POSITION]: Position;
    [RENDERABLE]: Renderable;
    [SPRITE]: Sprite;
  }
) {
  const hitEntity = world.createEntity();

  components.addParticle(world, hitEntity, entity[PARTICLE]);
  components.addPosition(world, hitEntity, entity[POSITION]);
  components.addRenderable(world, hitEntity, entity[RENDERABLE]);
  components.addSprite(world, hitEntity, entity[SPRITE]);

  return hitEntity;
}
