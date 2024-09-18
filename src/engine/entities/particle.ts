import * as components from "../components";
import { Particle, PARTICLE } from "../components/particle";
import { RENDERABLE, Renderable } from "../components/renderable";
import { Sprite, SPRITE } from "../components/sprite";
import type { World } from "../ecs";

export default function createParticle(
  world: World,
  entity: {
    [PARTICLE]: Particle;
    [RENDERABLE]: Renderable;
    [SPRITE]: Sprite;
  }
) {
  const particleEntity = world.createEntity();

  components.addParticle(world, particleEntity, entity[PARTICLE]);
  components.addRenderable(world, particleEntity, entity[RENDERABLE]);
  components.addSprite(world, particleEntity, entity[SPRITE]);

  return particleEntity;
}
