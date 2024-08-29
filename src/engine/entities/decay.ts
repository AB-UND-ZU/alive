import * as components from "../components";
import { Particle, PARTICLE } from "../components/particle";
import { RENDERABLE, Renderable } from "../components/renderable";
import { Sprite, SPRITE } from "../components/sprite";
import type { World } from "../ecs";

export default function createDecay(
  world: World,
  entity: {
    [PARTICLE]: Particle;
    [RENDERABLE]: Renderable;
    [SPRITE]: Sprite;
  }
) {
  const decayEntity = world.createEntity();

  components.addParticle(world, decayEntity, entity[PARTICLE]);
  components.addRenderable(world, decayEntity, entity[RENDERABLE]);
  components.addSprite(world, decayEntity, entity[SPRITE]);

  return decayEntity;
}
