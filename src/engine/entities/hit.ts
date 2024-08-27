import * as components from "../components";
import { Particle, PARTICLE } from "../components/particle";
import { RENDERABLE, Renderable } from "../components/renderable";
import { Sprite, SPRITE } from "../components/sprite";
import type { World } from "../ecs";

export default function createHit(
  world: World,
  entity: {
    [PARTICLE]: Particle;
    [RENDERABLE]: Renderable;
    [SPRITE]: Sprite;
  }
) {
  const hitEntity = world.createEntity();

  components.addParticle(world, hitEntity, entity[PARTICLE]);
  components.addRenderable(world, hitEntity, entity[RENDERABLE]);
  components.addSprite(world, hitEntity, entity[SPRITE]);

  return hitEntity;
}
