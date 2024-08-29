import { entities } from "../../engine";
import { Animation } from "../../engine/components/animatable";
import { INVENTORY } from "../../engine/components/inventory";
import { LOOTABLE } from "../../engine/components/lootable";
import {
  ORIENTABLE,
  orientationPoints,
} from "../../engine/components/orientable";
import { PARTICLE } from "../../engine/components/particle";
import { POSITION } from "../../engine/components/position";
import { RENDERABLE } from "../../engine/components/renderable";
import { SPRITE } from "../../engine/components/sprite";
import { registerEntity, unregisterEntity } from "../../engine/systems/map";
import { createCounter, decay, hit } from "./sprites";

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
  const finished = state.elapsed > 200;
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

const decayTime = 600;

export const creatureDecay: Animation<"decay"> = (world, entity, state) => {
  const finished =
    !!state.args.timestamp &&
    state.elapsed > state.args.timestamp &&
    entity[LOOTABLE].target;
  const dropId = entity[INVENTORY].items[0];
  const drop = world.getEntityById(dropId);
  let updated = false;

  if (
    !state.particles.decay &&
    state.elapsed > decayTime / 2 &&
    state.elapsed < decayTime
  ) {
    const deathParticle = entities.createDecay(world, {
      [PARTICLE]: { offsetX: 0, offsetY: 0 },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: decay,
    });
    state.particles.decay = world.getEntityId(deathParticle);
    updated = true;
  }

  if (!entity[LOOTABLE].accessible && state.elapsed > decayTime) {
    entity[SPRITE] = drop[SPRITE];
    entity[LOOTABLE].accessible = true;
    updated = true;
  }

  if (entity[LOOTABLE].target && !state.args.timestamp) {
    unregisterEntity(world, entity);
    const targetPosition = world.getEntityById(entity[LOOTABLE].target)[
      POSITION
    ];
    entity[POSITION].x = targetPosition.x;
    entity[POSITION].y = targetPosition.y;
    registerEntity(world, entity);
    state.args.timestamp = state.elapsed + 200;
    updated = true;
  }

  if (state.elapsed > decayTime && state.particles.decay) {
    world.removeEntity(world.getEntityById(state.particles.decay));
    delete state.particles.decay;
    updated = true;
  }

  return { finished, updated };
};
