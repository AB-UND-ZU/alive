import { entities } from "../../engine";
import { Animation } from "../../engine/components/animatable";
import { FOCUSABLE } from "../../engine/components/focusable";
import { INVENTORY } from "../../engine/components/inventory";
import { LOOTABLE } from "../../engine/components/lootable";
import {
  ORIENTABLE,
  orientationPoints,
  orientations,
} from "../../engine/components/orientable";
import { PARTICLE } from "../../engine/components/particle";
import { POSITION } from "../../engine/components/position";
import { REFERENCE } from "../../engine/components/reference";
import { RENDERABLE } from "../../engine/components/renderable";
import { SPRITE } from "../../engine/components/sprite";
import { registerEntity, unregisterEntity } from "../../engine/systems/map";
import * as colors from "../assets/colors";
import { iterations } from "../math/tracing";
import { createCounter, createText, decay, hit, none } from "./sprites";

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

const decayTime = 500;

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
    state.elapsed > 200 &&
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
    const targetEntity = world.getEntityById(entity[LOOTABLE].target);
    entity[POSITION].x = targetEntity[POSITION].x;
    entity[POSITION].y = targetEntity[POSITION].y;

    if (entity[ORIENTABLE]) {
      const orientation = targetEntity[ORIENTABLE].facing;
      entity[ORIENTABLE].facing =
        orientations[
          (orientations.indexOf(orientation) + 2) % orientations.length
        ];
    }

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

const lineSprites = createText("─┐│┘─└│┌", colors.olive);

export const focusCircle: Animation<"focus"> = (world, entity, state) => {
  const finished = false;
  let updated = false;

  // create all 8 surrounding particles
  if (Object.keys(state.particles).length !== 8) {
    for (let i = 0; i < 4; i += 1) {
      const iteration = iterations[i];
      const sideParticle = entities.createCounter(world, {
        [PARTICLE]: {
          offsetX: iteration.direction.x,
          offsetY: iteration.direction.y,
        },
        [RENDERABLE]: { generation: 1 },
        [SPRITE]: none,
      });
      const cornerParticle = entities.createCounter(world, {
        [PARTICLE]: {
          offsetX: iteration.direction.x + iteration.normal.x,
          offsetY: iteration.direction.y + iteration.normal.y,
        },
        [RENDERABLE]: { generation: 1 },
        [SPRITE]: none,
      });
      state.particles[`line-${i * 2}`] = world.getEntityId(sideParticle);
      state.particles[`line-${i * 2 + 1}`] = world.getEntityId(cornerParticle);
    }
    updated = true;
  }

  const currentIndex = parseInt(
    Object.keys(Array.from({ length: 8 })).find(
      (lineIndex) =>
        world.getEntityById(state.particles[`line-${lineIndex}`])[SPRITE].layers
          .length > 0
    ) || "-1"
  );
  const focusIndex =
    Math.floor(
      (state.elapsed - state.args.offset) /
        world.metadata.gameEntity[REFERENCE].tick
    ) % 4;
  const currentActive = currentIndex !== -1;
  const isActive = entity[FOCUSABLE].active

  // disable all on inactive
  if (currentActive && !isActive) {
    for (let i = 0; i < 8; i += 1) {
      const particle = world.getEntityById(state.particles[`line-${i}`]);
      particle[SPRITE] = none;
    }

    updated = true;
  } else if (isActive && currentIndex !== focusIndex) {
    // rotate focus by toggling visibility of 8 individual particles
    for (let i = 0; i < 8; i += 1) {
      const particle = world.getEntityById(state.particles[`line-${i}`]);
      const particleIndex = i % 4;
      particle[SPRITE] = particleIndex === focusIndex ? lineSprites[i] : none;
    }

    updated = true;
  }

  return { finished, updated };
};
