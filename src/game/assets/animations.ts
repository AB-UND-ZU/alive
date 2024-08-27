import { entities } from "../../engine";
import { Animation } from "../../engine/components/animatable";
import {
  ORIENTABLE,
  orientationPoints,
} from "../../engine/components/orientable";
import { PARTICLE } from "../../engine/components/particle";
import { RENDERABLE } from "../../engine/components/renderable";
import { SPRITE } from "../../engine/components/sprite";
import { createCounter, hit } from "./sprites";

export const swordAttack: Animation<"melee"> = (world, entity, state) => {
  // align sword with facing direction
  const finished = state.elapsed > 150;
  const currentFacing = entity[ORIENTABLE].facing;
  const facing = finished ? undefined : state.args.facing;
  const updated = currentFacing !== facing;

  if (!state.particles.hit) {
    const delta = orientationPoints[state.args.facing];
    const hitParticle = entities.createHit(world, {
      [PARTICLE]: { offsetX: delta.x, offsetY: delta.y },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: hit,
    });
    state.particles.hit = world.getEntityId(hitParticle);
  }

  if (updated) {
    entity[ORIENTABLE].facing = facing;
  }

  if (finished && state.particles.hit) {
    world.removeEntity(world.getEntityById(state.particles.hit));
    delete state.particles.hit;
  }

  return { finished, updated };
};

export const damageCounter: Animation<"counter"> = (world, entity, state) => {
  const finished = state.elapsed > 1000;
  let updated = false;

  if (!state.particles.counter) {
    const delta = orientationPoints[state.args.facing];
    const counterParticle = entities.createCounter(world, {
      [PARTICLE]: { offsetX: delta.x, offsetY: delta.y },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: createCounter(state.args.amount),
    });
    state.particles.counter = world.getEntityId(counterParticle);
    updated = true;
  }

  const counterParticle = world.getEntityById(state.particles.counter);
  const char = state.args.amount > 9 ? "#" : state.args.amount.toString();
  if (counterParticle[SPRITE].layers[0].char !== char) {
    counterParticle[SPRITE].layers[0].char = char;
    updated = true;
  }

  return { finished, updated };
};
