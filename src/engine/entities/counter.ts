import * as components from "../components";
import { Particle, PARTICLE } from "../components/particle";
import { RENDERABLE, Renderable } from "../components/renderable";
import { Sprite, SPRITE } from "../components/sprite";
import type { World } from "../ecs";

export default function createCounter(
  world: World,
  entity: {
    [PARTICLE]: Particle;
    [RENDERABLE]: Renderable;
    [SPRITE]: Sprite;
  }
) {
  const counterEntity = world.createEntity();

  components.addParticle(world, counterEntity, entity[PARTICLE]);
  components.addRenderable(world, counterEntity, entity[RENDERABLE]);
  components.addSprite(world, counterEntity, entity[SPRITE]);

  return counterEntity;
}
