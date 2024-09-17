import * as components from "../components";
import { Orientable, ORIENTABLE } from "../components/orientable";
import { Particle, PARTICLE } from "../components/particle";
import { RENDERABLE, Renderable } from "../components/renderable";
import { Sprite, SPRITE } from "../components/sprite";
import type { World } from "../ecs";

export default function createCollecting(
  world: World,
  entity: {
    [ORIENTABLE]: Orientable;
    [PARTICLE]: Particle;
    [RENDERABLE]: Renderable;
    [SPRITE]: Sprite;
  }
) {
  const collectingEntity = world.createEntity();

  components.addOrientable(world, collectingEntity, entity[ORIENTABLE]);
  components.addParticle(world, collectingEntity, entity[PARTICLE]);
  components.addRenderable(world, collectingEntity, entity[RENDERABLE]);
  components.addSprite(world, collectingEntity, entity[SPRITE]);

  return collectingEntity;
}
