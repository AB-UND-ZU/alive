import {
  decayHeight,
  dialogHeight,
  effectHeight,
  focusHeight,
  getItemSprite,
  idleHeight,
  lootHeight,
  particleHeight,
  tooltipHeight,
} from "../../components/Entity/utils";
import { entities } from "../../engine";
import { DROPPABLE } from "../../engine/components/droppable";
import { EQUIPPABLE, gears } from "../../engine/components/equippable";
import { FOCUSABLE } from "../../engine/components/focusable";
import { INVENTORY } from "../../engine/components/inventory";
import { ITEM, STACK_SIZE } from "../../engine/components/item";
import { LEVEL } from "../../engine/components/level";
import { LIGHT } from "../../engine/components/light";
import { LOOTABLE } from "../../engine/components/lootable";
import { MELEE } from "../../engine/components/melee";
import {
  ORIENTABLE,
  Orientation,
  orientationPoints,
  orientations,
} from "../../engine/components/orientable";
import { PARTICLE } from "../../engine/components/particle";
import { POSITION } from "../../engine/components/position";
import { RENDERABLE } from "../../engine/components/renderable";
import { REVIVABLE } from "../../engine/components/revivable";
import { SPRITE } from "../../engine/components/sprite";
import { TOOLTIP } from "../../engine/components/tooltip";
import { TRACKABLE } from "../../engine/components/trackable";
import { isUnlocked } from "../../engine/systems/action";
import {
  collectItem,
  getStackable,
  isEmpty,
} from "../../engine/systems/collect";
import { isDead, isFriendlyFire } from "../../engine/systems/damage";
import {
  disposeEntity,
  moveEntity,
  registerEntity,
} from "../../engine/systems/map";
import {
  getEntityGeneration,
  rerenderEntity,
} from "../../engine/systems/renderer";
import { openDoor, removeFromInventory } from "../../engine/systems/trigger";
import * as colors from "./colors";
import {
  add,
  copy,
  distribution,
  getDistance,
  lerp,
  normalize,
  signedDistance,
} from "../math/std";
import { iterations } from "../math/tracing";
import {
  bubble,
  createDialog,
  createText,
  decay,
  doorClosedWood,
  fire,
  ghost,
  hit,
  none,
  pointer,
  waveCorner,
  wave,
  woodStick,
  edge,
  beam,
  getMaxCounter,
  flask2,
  flask1,
  getStatSprite,
} from "./sprites";
import {
  ArrowSequence,
  BubbleSequence,
  BurnSequence,
  CollectSequence,
  ConsumeSequence,
  DecaySequence,
  DialogSequence,
  DisposeSequence,
  FocusSequence,
  HitSequence,
  MeleeSequence,
  PerishSequence,
  PointerSequence,
  ReviveSequence,
  SEQUENCABLE,
  Sequence,
  SpellSequence,
  UnlockSequence,
  VisionSequence,
  WaveSequence,
} from "../../engine/components/sequencable";
import { SOUL } from "../../engine/components/soul";
import { VIEWABLE } from "../../engine/components/viewable";
import { MOVABLE } from "../../engine/components/movable";
import { REFERENCE } from "../../engine/components/reference";
import {
  getProjectiles,
  getShootable,
  getStackableArrow,
  isBouncable,
} from "../../engine/systems/ballistics";
import { PROJECTILE } from "../../engine/components/projectile";
import { getGearStat } from "../balancing/equipment";
import { STATS } from "../../engine/components/stats";
import { PLAYER } from "../../engine/components/player";
import { isImmersible } from "../../engine/systems/immersion";
import { invertOrientation } from "../math/path";
import { dropEntity } from "../../engine/systems/drop";
import { EXERTABLE } from "../../engine/components/exertable";
import { consumptionConfigs } from "../../engine/systems/consume";

export * from "./npcs";
export * from "./quests";

export const swordAttack: Sequence<MeleeSequence> = (world, entity, state) => {
  // align sword with facing direction
  const finished = state.elapsed > 150;
  const swordEntity = world.assertByIdAndComponents(entity[EQUIPPABLE].sword, [
    ORIENTABLE,
  ]);
  const currentFacing = swordEntity[ORIENTABLE].facing;
  const facing = finished ? undefined : state.args.facing;
  const updated = currentFacing !== facing;

  if (!state.particles.hit) {
    const delta = orientationPoints[state.args.facing];
    const hitParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: delta.x,
        offsetY: delta.y,
        offsetZ: particleHeight,
        amount: state.args.damage,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: hit,
    });
    state.particles.hit = world.getEntityId(hitParticle);
  }

  if (updated) {
    swordEntity[ORIENTABLE].facing = facing;
  }

  if (finished && state.particles.hit) {
    disposeEntity(world, world.assertById(state.particles.hit));
    delete state.particles.hit;
  }

  return { finished, updated };
};

export const arrowShot: Sequence<ArrowSequence> = (world, entity, state) => {
  const tick = world.assertByIdAndComponents(entity[MOVABLE].reference, [
    REFERENCE,
  ])[REFERENCE].tick;
  const delta = orientationPoints[entity[ORIENTABLE].facing as Orientation];
  const targetDistance = Math.floor(state.elapsed / tick);
  let currentDistance = getDistance(
    state.args.origin,
    entity[POSITION],
    world.metadata.gameEntity[LEVEL].size,
    1
  );

  let finished = targetDistance > state.args.range;
  let updated = false;

  // move arrow forward
  while (!finished && targetDistance >= currentDistance) {
    const shootable = getShootable(world, entity[POSITION]);
    const projectiles = getProjectiles(world, entity[POSITION]);
    if (
      isBouncable(world, entity[POSITION]) ||
      getStackableArrow(world, entity[POSITION]) ||
      (shootable && !isFriendlyFire(world, entity, shootable)) ||
      projectiles.length > 1
    ) {
      finished = true;
      break;
    }

    if (targetDistance === currentDistance) break;

    const targetPosition = add(entity[POSITION], delta);
    moveEntity(world, entity, targetPosition);
    entity[PROJECTILE].moved = true;
    currentDistance += 1;
    updated = true;
  }

  return { finished, updated };
};

const beamSpeed = 100;
const beam1Range = 12;

export const castBeam1: Sequence<SpellSequence> = (world, entity, state) => {
  const entityId = world.getEntityId(entity);
  const progress = Math.ceil(state.elapsed / beamSpeed);
  const delta = orientationPoints[entity[ORIENTABLE].facing as Orientation];
  let finished = progress > state.args.duration;
  let updated = false;

  // create wall particles
  if (!state.particles.start) {
    const startParticle = entities.createFibre(world, {
      [ORIENTABLE]: { facing: entity[ORIENTABLE].facing },
      [PARTICLE]: {
        offsetX: 0,
        offsetY: 0,
        offsetZ: particleHeight,
        duration: beamSpeed,
        animatedOrigin: { x: 0, y: 0 },
        amount: state.args.amount,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: edge,
    });
    state.particles.start = world.getEntityId(startParticle);

    const endParticle = entities.createFibre(world, {
      [ORIENTABLE]: { facing: invertOrientation(entity[ORIENTABLE].facing) },
      [PARTICLE]: {
        offsetX: 0,
        offsetY: 0,
        offsetZ: particleHeight,
        duration: beamSpeed,
        animatedOrigin: { x: 0, y: 0 },
        amount: state.args.amount,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: edge,
    });
    state.particles.end = world.getEntityId(endParticle);
  }

  // create effect areas
  for (
    let aoeProgress = state.args.progress;
    aoeProgress < progress && aoeProgress < beam1Range;
    aoeProgress += 1
  ) {
    const offset = {
      x: delta.x * (aoeProgress + 1),
      y: delta.y * (aoeProgress + 1),
    };
    const aoeEntity = entities.createAoe(world, {
      [EXERTABLE]: { castable: entityId },
      [POSITION]: add(entity[POSITION], offset),
    });
    registerEntity(world, aoeEntity);
    state.args.areas.push(world.getEntityId(aoeEntity));
    updated = true;
  }

  // remove effect areas
  for (
    let clearProgress = state.args.progress - state.args.duration + beam1Range;
    clearProgress > 0 &&
    clearProgress < progress - state.args.duration + beam1Range;
    clearProgress += 1
  ) {
    const aoeId = state.args.areas.shift();
    const aoeEntity = world.assertById(aoeId!);
    disposeEntity(world, aoeEntity);
    updated = true;
  }

  // create beams
  if (
    state.args.progress !== progress &&
    progress > 2 &&
    progress <= state.args.duration - beam1Range &&
    (progress - 1) % Math.min(state.args.amount, 3) === 0
  ) {
    const beamParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: delta.x,
        offsetY: delta.y,
        offsetZ: particleHeight,
        duration: beamSpeed,
        amount: state.args.amount,
        animatedOrigin: copy(delta),
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: beam,
    });

    state.particles[`beam-${progress}`] = world.getEntityId(beamParticle);

    updated = true;
  }

  // move particles
  const limit = { x: delta.x * beam1Range, y: delta.y * beam1Range };
  if (state.args.progress !== progress) {
    for (const particleName in state.particles) {
      const particleEntity = world.assertByIdAndComponents(
        state.particles[particleName],
        [PARTICLE]
      );

      // delete particle if reaching range limit
      if (
        particleEntity[PARTICLE].offsetX === limit.x &&
        particleEntity[PARTICLE].offsetY === limit.y
      ) {
        if (particleName.startsWith("beam")) {
          disposeEntity(world, particleEntity);
          delete state.particles[particleName];
        }
        continue;
      }

      // move edges separately
      if (
        !particleName.startsWith("end") ||
        (particleName === "end" &&
          (progress > state.args.duration - beam1Range || progress === 1))
      ) {
        particleEntity[PARTICLE].offsetX += delta.x;
        particleEntity[PARTICLE].offsetY += delta.y;
      }
    }

    updated = true;
    state.args.progress = progress;
  }

  // dispose particles and areas
  if (finished) {
    for (const particleName in state.particles) {
      const particleEntity = world.assertById(state.particles[particleName]);
      disposeEntity(world, particleEntity);
      delete state.particles[particleName];
    }

    for (const aoeId of state.args.areas) {
      const aoeEntity = world.assertById(aoeId);
      disposeEntity(world, aoeEntity);
    }

    updated = true;
  }

  return { finished, updated };
};

export const damageHit: Sequence<HitSequence> = (world, entity, state) => {
  const finished = state.elapsed > 150;
  const updated = false;

  if (!state.particles.hit) {
    const hitParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: 0,
        offsetY: 0,
        offsetZ: particleHeight,
        amount: state.args.damage,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: hit,
    });
    state.particles.hit = world.getEntityId(hitParticle);
  }

  if (finished && state.particles.hit) {
    disposeEntity(world, world.assertById(state.particles.hit));
    delete state.particles.hit;
  }

  return { finished, updated };
};

const haltTime = 200;
const decayTime = 500;

export const creatureDecay: Sequence<DecaySequence> = (
  world,
  entity,
  state
) => {
  let updated = false;
  const finished = state.elapsed > decayTime;

  // create death particle
  if (!state.particles.decay && state.elapsed > haltTime && !finished) {
    const deathParticle = entities.createParticle(world, {
      [PARTICLE]: { offsetX: 0, offsetY: 0, offsetZ: decayHeight },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: decay,
    });
    state.particles.decay = world.getEntityId(deathParticle);
    updated = true;
  }

  // delete death particle and make entity lootable
  if (finished) {
    if (state.particles.decay) {
      disposeEntity(world, world.assertById(state.particles.decay));
      delete state.particles.decay;
    }

    entity[DROPPABLE].decayed = true;
  }

  return { finished, updated };
};

const bubbleTick = 250;

export const bubbleSplash: Sequence<BubbleSequence> = (
  world,
  entity,
  state
) => {
  let updated = false;
  let finished = false;

  // create bubble particle
  if (!state.particles.bubble) {
    const bubbleParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: 0,
        offsetY: 0,
        offsetZ: effectHeight,
        amount: 0,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: bubble,
    });
    state.particles.bubble = world.getEntityId(bubbleParticle);
    updated = true;
  }

  const targetWidth = Math.floor(state.elapsed / bubbleTick);

  if (targetWidth > 3) {
    finished = true;
  } else if (targetWidth !== state.args.width) {
    state.args.width = targetWidth;
    const bubbleParticle = world.assertByIdAndComponents(
      state.particles.bubble,
      [PARTICLE]
    );
    bubbleParticle[PARTICLE].amount = targetWidth;
    updated = true;
  }

  return { finished, updated };
};

/*           ┌─┐
      ┌─┐   ╔┘ └╗
╔─╗  ┌╝ ╚┐ ┌┘   └┐
│1│  │ 2 │ │  3  │
╚─╝  └╗ ╔┘ └┐   ┌┘
      └─┘   ╚┐ ┌╝
             └─┘    */

const waveSpeed = 250;

export const waterWave: Sequence<WaveSequence> = (world, entity, state) => {
  let updated = false;
  let finished = false;

  const outerRadius = Math.ceil(state.elapsed / waveSpeed);
  const innerRadius = Math.round(state.elapsed / waveSpeed);

  // create wave sides and initial corners
  if (state.args.outerRadius === 0) {
    for (const orientation of orientations) {
      const waveParticle = entities.createFibre(world, {
        [ORIENTABLE]: { facing: orientation },
        [PARTICLE]: {
          offsetX: 0,
          offsetY: 0,
          offsetZ: effectHeight,
          amount: 0,
          duration: waveSpeed,
          animatedOrigin: { x: 0, y: 0 },
        },
        [RENDERABLE]: { generation: 1 },
        [SPRITE]: wave,
      });
      state.particles[`side-${orientation}`] = world.getEntityId(waveParticle);
    }
    updated = true;
  }

  // break sides and outer waves on shores after passing half of block width
  if (innerRadius !== state.args.innerRadius && outerRadius === innerRadius) {
    for (const particleName in state.particles) {
      const waveParticle = world.assertByIdAndComponents(
        state.particles[particleName],
        [PARTICLE]
      );
      if (
        !particleName.startsWith("inner") &&
        !isImmersible(
          world,
          add(entity[POSITION], {
            x: waveParticle[PARTICLE].offsetX,
            y: waveParticle[PARTICLE].offsetY,
          })
        )
      ) {
        disposeEntity(world, waveParticle);
        delete state.particles[particleName];
        updated = true;
      }
    }
  }

  if (Object.keys(state.particles).length === 0) {
    finished = true;
    return { finished, updated };
  }

  if (outerRadius !== state.args.outerRadius) {
    // move all existing particles in their respective orientation
    for (const particleName in state.particles) {
      const waveParticle = world.assertByIdAndComponents(
        state.particles[particleName],
        [PARTICLE, ORIENTABLE]
      );
      const orientation = particleName.split("-").slice(-1)[0] as Orientation;
      const delta = orientationPoints[orientation];
      waveParticle[PARTICLE].offsetX += delta.x;
      waveParticle[PARTICLE].offsetY += delta.y;

      // break inner waves immediately
      if (
        particleName.startsWith("inner") &&
        !isImmersible(
          world,
          add(entity[POSITION], {
            x: waveParticle[PARTICLE].offsetX,
            y: waveParticle[PARTICLE].offsetY,
          })
        )
      ) {
        disposeEntity(world, waveParticle);
        delete state.particles[particleName];
        updated = true;
      }
    }

    // create new set of hidden inner corner pairs
    if (outerRadius > 0 && outerRadius % 2 === 0) {
      const cornerDistance = outerRadius / 2;
      for (const iteration of iterations) {
        const rotatedOrientation =
          orientations[(orientations.indexOf(iteration.orientation) + 1) % 4];
        const leftDelta = {
          x:
            iteration.direction.x * cornerDistance -
            iteration.normal.x * cornerDistance,
          y:
            iteration.direction.y * cornerDistance -
            iteration.normal.y * cornerDistance,
        };
        if (isImmersible(world, add(entity[POSITION], leftDelta))) {
          const leftParticle = entities.createFibre(world, {
            [ORIENTABLE]: { facing: rotatedOrientation },
            [PARTICLE]: {
              offsetX: leftDelta.x,
              offsetY: leftDelta.y,
              offsetZ: effectHeight,
              amount: 0,
              duration: waveSpeed,
              animatedOrigin: {
                x:
                  iteration.direction.x * cornerDistance -
                  iteration.normal.x * cornerDistance,
                y:
                  iteration.direction.y * cornerDistance -
                  iteration.normal.y * cornerDistance,
              },
            },
            [RENDERABLE]: { generation: 1 },
            [SPRITE]: none,
          });
          state.particles[
            `inner-${innerRadius}-left-${iteration.orientation}`
          ] = world.getEntityId(leftParticle);
        }

        const rightDelta = {
          x:
            iteration.direction.x * cornerDistance +
            iteration.normal.x * cornerDistance,
          y:
            iteration.direction.y * cornerDistance +
            iteration.normal.y * cornerDistance,
        };
        if (isImmersible(world, add(entity[POSITION], rightDelta))) {
          const rightParticle = entities.createFibre(world, {
            [ORIENTABLE]: { facing: invertOrientation(iteration.orientation) },
            [PARTICLE]: {
              offsetX: rightDelta.x,
              offsetY: rightDelta.y,
              offsetZ: effectHeight,
              amount: 0,
              duration: waveSpeed,
              animatedOrigin: {
                x:
                  iteration.direction.x * cornerDistance +
                  iteration.normal.x * cornerDistance,
                y:
                  iteration.direction.y * cornerDistance +
                  iteration.normal.y * cornerDistance,
              },
            },
            [RENDERABLE]: { generation: 1 },
            [SPRITE]: none,
          });
          state.particles[
            `inner-${innerRadius}-right-${iteration.orientation}`
          ] = world.getEntityId(rightParticle);
        }
      }
    }

    // create new set of hidden outer corner pairs
    if (outerRadius % 2 === 1) {
      const cornerDistance = Math.ceil(outerRadius / 2);
      for (const iteration of iterations) {
        const rotatedOrientation =
          orientations[(orientations.indexOf(iteration.orientation) + 3) % 4];
        const leftDelta = {
          x:
            iteration.direction.x * cornerDistance -
            iteration.normal.x * cornerDistance,
          y:
            iteration.direction.y * cornerDistance -
            iteration.normal.y * cornerDistance,
        };
        if (isImmersible(world, add(entity[POSITION], leftDelta))) {
          const leftParticle = entities.createFibre(world, {
            [ORIENTABLE]: { facing: rotatedOrientation },
            [PARTICLE]: {
              offsetX: leftDelta.x,
              offsetY: leftDelta.y,
              offsetZ: effectHeight,
              amount: 0,
              duration: waveSpeed,
              animatedOrigin: {
                x:
                  iteration.direction.x * (cornerDistance - 1) -
                  iteration.normal.x * (cornerDistance - 1),
                y:
                  iteration.direction.y * (cornerDistance - 1) -
                  iteration.normal.y * (cornerDistance - 1),
              },
            },
            [RENDERABLE]: { generation: 1 },
            [SPRITE]: none,
          });
          state.particles[
            `outer-${outerRadius}-left-${iteration.orientation}`
          ] = world.getEntityId(leftParticle);
        }

        const rightDelta = {
          x:
            iteration.direction.x * cornerDistance +
            iteration.normal.x * cornerDistance,
          y:
            iteration.direction.y * cornerDistance +
            iteration.normal.y * cornerDistance,
        };
        if (isImmersible(world, add(entity[POSITION], rightDelta))) {
          const rightParticle = entities.createFibre(world, {
            [ORIENTABLE]: { facing: iteration.orientation },
            [PARTICLE]: {
              offsetX: rightDelta.x,
              offsetY: rightDelta.y,
              offsetZ: effectHeight,
              amount: 0,
              duration: waveSpeed,
              animatedOrigin: {
                x:
                  iteration.direction.x * (cornerDistance - 1) +
                  iteration.normal.x * (cornerDistance - 1),
                y:
                  iteration.direction.y * (cornerDistance - 1) +
                  iteration.normal.y * (cornerDistance - 1),
              },
            },
            [RENDERABLE]: { generation: 1 },
            [SPRITE]: none,
          });
          state.particles[
            `outer-${outerRadius}-right-${iteration.orientation}`
          ] = world.getEntityId(rightParticle);
        }
      }
    }

    state.args.outerRadius = outerRadius;
    updated = true;
  }

  if (innerRadius !== state.args.innerRadius) {
    // move all existing particles in their respective orientation
    for (const particleName in state.particles) {
      if (particleName.startsWith("side")) continue;

      const waveParticle = world.assertByIdAndComponents(
        state.particles[particleName],
        [SPRITE]
      );

      if (waveParticle[SPRITE] === waveCorner) continue;

      waveParticle[SPRITE] = waveCorner;
      rerenderEntity(world, waveParticle);
    }
    state.args.innerRadius = innerRadius;
    updated = true;
  }

  return { finished, updated };
};

export const fireBurn: Sequence<BurnSequence> = (world, entity, state) => {
  let updated = false;
  let finished = false;

  // create fire particle
  if (!state.particles.fire) {
    const fireParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: 0,
        offsetY: 0,
        offsetZ: particleHeight,
        amount: 1,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: fire,
    });
    state.particles.fire = world.getEntityId(fireParticle);
    updated = true;
  }

  const generation = world.metadata.gameEntity[RENDERABLE].generation;

  if (generation !== state.args.generation) {
    state.args.generation = generation;
    const fireParticle = world.assertByIdAndComponents(state.particles.fire, [
      PARTICLE,
    ]);
    const amount = fireParticle[PARTICLE].amount;
    fireParticle[PARTICLE].amount =
      amount === 2 ? [1, 3][distribution(40, 60)] : 2;
    updated = true;
  }

  // TODO: decay of fire

  return { finished, updated };
};

// keep door locked until animation is finished
const keyTime = 200;
const unlockTime = 500;

export const doorUnlock: Sequence<UnlockSequence> = (world, entity, state) => {
  let updated = false;
  const finished = state.elapsed > unlockTime;
  const keyEntity = world.assertByIdAndComponents(state.args.itemId, [SPRITE]);

  // create key particle
  if (!state.particles.key && !finished) {
    const size = world.metadata.gameEntity[LEVEL].size;
    const delta = {
      x: signedDistance(entity[POSITION].x, state.args.origin.x, size),
      y: signedDistance(entity[POSITION].y, state.args.origin.y, size),
    };

    const keyParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: 0,
        offsetY: 0,
        offsetZ: tooltipHeight,
        animatedOrigin: delta,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: keyEntity[SPRITE],
    });
    state.particles.key = world.getEntityId(keyParticle);
    updated = true;
  }

  if (state.particles.key && (finished || state.elapsed > keyTime)) {
    disposeEntity(world, world.assertById(state.particles.key));
    delete state.particles.key;

    // disarm door
    entity[SPRITE] = doorClosedWood;
  }

  if (finished) {
    // discard key
    disposeEntity(world, keyEntity);
    openDoor(world, entity);
  }

  return { finished, updated };
};

// floor at non-zero value to render full shadow
const MIN_LIGHT_RADIUS = 0.02;
const visionTime = 2000;

export const changeRadius: Sequence<VisionSequence> = (
  world,
  entity,
  state
) => {
  const updated = true;
  const circleTime = state.args.fast ? visionTime / 2 : visionTime;
  const finished = state.elapsed > circleTime;

  if (!state.args.previousLight) {
    state.args.previousLight = { ...entity[LIGHT] };
  }

  const ratio = Math.min(state.elapsed / circleTime, 1);
  const targetBrightness = state.args.light?.brightness || MIN_LIGHT_RADIUS;
  const targetVisibility = state.args.light?.visibility || MIN_LIGHT_RADIUS;

  if (
    entity[LIGHT].brightness === targetBrightness &&
    entity[LIGHT].visibility === targetVisibility
  ) {
    return { updated: false, finished: true };
  }

  // reduce circular light radius
  entity[LIGHT].brightness = lerp(
    state.args.previousLight?.brightness || MIN_LIGHT_RADIUS,
    targetBrightness,
    ratio
  );
  entity[LIGHT].visibility = lerp(
    state.args.previousLight?.visibility || MIN_LIGHT_RADIUS,
    targetVisibility,
    ratio
  );

  if (finished) {
    entity[LIGHT].brightness = targetBrightness;
    entity[LIGHT].visibility = targetVisibility;
  }

  return { finished, updated };
};

const ripTime = visionTime + 500;
const spawnTime = ripTime + 500;

// how unfortunate
export const tragicDeath: Sequence<PerishSequence> = (world, entity, state) => {
  let updated = false;
  const finished = state.elapsed > spawnTime;

  if (state.elapsed > ripTime && !entity[TOOLTIP].dialogs.length) {
    entity[TOOLTIP].dialogs = [createDialog("RIP")];
    entity[TOOLTIP].changed = true;
    entity[TOOLTIP].override = "visible";
    updated = true;
  }

  if (finished) {
    entity[REVIVABLE].available = true;
  }

  return { finished, updated };
};

// keep entities around to keep swimmable animation for collecting particles
const disposeTime = 200;

export const entityDispose: Sequence<DisposeSequence> = (
  world,
  entity,
  state
) => {
  const updated = false;
  const finished = state.elapsed > disposeTime;

  if (finished) {
    disposeEntity(world, entity, false);
  }

  return { finished, updated };
};

const lootSpeed = 200;

export const itemCollect: Sequence<CollectSequence> = (
  world,
  entity,
  state
) => {
  let updated = false;
  let finished = false;
  const entityId = world.getEntityId(entity);
  const lootId = state.particles.loot;
  const itemId = state.args.itemId;
  const size = world.metadata.gameEntity[LEVEL].size;
  const itemEntity = world.assertByIdAndComponents(itemId, [
    RENDERABLE,
    ITEM,
    SPRITE,
  ]);
  const distance = getDistance(entity[POSITION], state.args.origin, size);
  const lootDelay =
    MOVABLE in entity
      ? world.assertByIdAndComponents(entity[MOVABLE].reference, [REFERENCE])[
          REFERENCE
        ].tick - 50
      : lootSpeed * distance;

  // add item to player's inventory
  if (state.elapsed >= lootDelay) {
    if (lootId) {
      const lootParticle = world.assertById(lootId);
      disposeEntity(world, lootParticle);
      delete state.particles.loot;
    }

    // set disposable if it is a dropped loot
    if (state.args.drop) {
      entity[LOOTABLE].disposable = true;
      itemEntity[ITEM].carrier = entityId;
      entity[INVENTORY].items.push(itemId);
    } else {
      let targetEquipment = itemEntity[ITEM].equipment;
      let targetStat = itemEntity[ITEM].stat;
      let targetConsume = itemEntity[ITEM].consume;
      let targetStackable = itemEntity[ITEM].stackable;
      let targetItem = itemEntity;

      // if no sword is equipped, use wood as stick
      if (
        entity[MELEE] &&
        !entity[EQUIPPABLE].sword &&
        targetStat === "stick"
      ) {
        targetEquipment = "sword";
        targetStat = undefined;
        targetItem = entities.createSword(world, {
          [ITEM]: {
            amount: getGearStat("sword", "wood"),
            equipment: "sword",
            material: "wood",
            carrier: entityId,
            bound: false,
          },
          [ORIENTABLE]: {},
          [RENDERABLE]: { generation: 0 },
          [SEQUENCABLE]: { states: {} },
          [SPRITE]: woodStick,
        });
      }

      const targetId = world.getEntityId(targetItem);

      if (targetEquipment) {
        const existingId = entity[EQUIPPABLE][targetEquipment];

        // add existing render count if item is replaced
        if (existingId) {
          const existingItem = world.assertById(existingId);
          targetItem[RENDERABLE].generation += getEntityGeneration(
            world,
            existingItem
          );

          if (!gears.includes(targetEquipment)) {
            removeFromInventory(world, entity, existingItem);
          }
          dropEntity(
            world,
            { [INVENTORY]: { items: [existingId] } },
            entity[POSITION]
          );
        }

        entity[EQUIPPABLE][targetEquipment] = targetId;

        if (!gears.includes(targetEquipment)) {
          entity[INVENTORY].items.push(targetId);
        }
      } else if (
        targetConsume ||
        (targetStackable &&
          state.args.fullStack &&
          itemEntity[ITEM].amount === STACK_SIZE)
      ) {
        entity[INVENTORY].items.push(targetId);
      } else if (targetStat) {
        entity[STATS][targetStat] += state.args.amount;
      } else if (targetStackable) {
        // add to existing stack if available
        const existingStack = getStackable(world, entity, itemEntity[ITEM]);

        if (existingStack) {
          existingStack[ITEM].amount += 1;
        } else {
          // create new stack
          const stackEntity = entities.createItem(world, {
            [ITEM]: { ...itemEntity[ITEM], carrier: entityId },
            [SPRITE]: getItemSprite(itemEntity[ITEM]),
            [RENDERABLE]: { generation: 0 },
          });
          const stackId = world.getEntityId(stackEntity);
          stackEntity[ITEM].amount = 1;
          entity[INVENTORY].items.push(stackId);
        }

        // delete old stack
        if (itemEntity[ITEM].amount === 0) {
          disposeEntity(world, itemEntity);
        }
      }
    }

    finished = true;
  }

  // create loot particle
  if (!lootId && state.elapsed < lootDelay) {
    const delta = {
      x: signedDistance(entity[POSITION].x, state.args.origin.x, size),
      y: signedDistance(entity[POSITION].y, state.args.origin.y, size),
    };
    const lootParticle = entities.createFibre(world, {
      [ORIENTABLE]: { facing: itemEntity[ORIENTABLE]?.facing },
      [PARTICLE]: {
        offsetX: 0,
        offsetY: 0,
        offsetZ: tooltipHeight,
        duration: lootDelay,
        animatedOrigin: delta,
        amount: state.args.amount,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: itemEntity[ITEM].stat
        ? getStatSprite(itemEntity[ITEM].stat, "drop")
        : getItemSprite(itemEntity[ITEM]),
    });
    state.particles.loot = world.getEntityId(lootParticle);
    updated = true;
  }

  return { finished, updated };
};

const consumeSpeed = 350;

export const flaskConsume: Sequence<ConsumeSequence> = (
  world,
  entity,
  state
) => {
  let updated = false;
  const finished = state.elapsed >= consumeSpeed * 3;
  const consumableId = state.particles.consumable;
  const countableId = state.particles.countable;
  const decayId = state.particles.decay;
  const itemId = state.args.itemId;
  const itemEntity = world.getEntityByIdAndComponents(itemId, [
    RENDERABLE,
    ITEM,
    SPRITE,
  ]);

  const consumptionConfig =
    itemEntity &&
    consumptionConfigs[itemEntity[ITEM].consume!]?.[itemEntity[ITEM].material!];

  if (!consumptionConfig) {
    return { finished: true, updated: false };
  }

  // process item consumption and decay flask
  if (!decayId && state.elapsed >= consumeSpeed * 2) {
    const maxCountable = getMaxCounter(consumptionConfig.countable);
    entity[STATS][consumptionConfig.countable] = Math.min(
      entity[STATS][maxCountable],
      entity[STATS][consumptionConfig.countable] + consumptionConfig.amount
    );

    if (itemEntity[ITEM].amount === 0) {
      disposeEntity(world, itemEntity);
    }

    if (countableId) {
      const countableParticle = world.assertById(countableId);
      disposeEntity(world, countableParticle);
      delete state.particles.countable;
    }

    const decayParticle = entities.createParticle(world, {
      [PARTICLE]: { offsetX: 0, offsetY: -1, offsetZ: lootHeight },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: decay,
    });
    state.particles.decay = world.getEntityId(decayParticle);
    updated = true;
  }

  // create consumable particle
  if (!consumableId) {
    const consumableParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: 0,
        offsetY: -1,
        offsetZ: effectHeight,
        duration: consumeSpeed,
        animatedOrigin: { x: 0, y: 0 },
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: itemEntity[SPRITE],
    });
    state.particles.consumable = world.getEntityId(consumableParticle);
    updated = true;
  }

  // create countable particle and empty flask
  if (
    !countableId &&
    state.elapsed >= consumeSpeed &&
    state.elapsed < consumeSpeed * 2
  ) {
    const consumableParticle = world.getEntityByIdAndComponents(
      state.particles.consumable,
      [SPRITE]
    );

    if (consumableParticle) {
      consumableParticle[SPRITE] =
        itemEntity[ITEM].consume === "potion2" ? flask2 : flask1;
      rerenderEntity(world, consumableParticle);
    }

    const countableParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: 0,
        offsetY: 0,
        offsetZ: lootHeight,
        duration: consumeSpeed,
        animatedOrigin: { x: 0, y: -1 },
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: getStatSprite(consumptionConfig.countable),
    });
    state.particles.countable = world.getEntityId(countableParticle);
    updated = true;
  }

  if (finished) {
    if (state.particles.consumable) {
      const consumableParticle = world.assertById(state.particles.consumable);
      disposeEntity(world, consumableParticle);
      delete state.particles.consumable;
    }

    if (state.particles.decay) {
      const decayParticle = world.assertById(state.particles.decay);
      disposeEntity(world, decayParticle);
      delete state.particles.decay;
    }
  }

  return { finished, updated };
};

// animate light on tombstone before respawning hero
const soulTime = visionTime / 2;
const arriveTime = 2500;
const soulSpeed = 1 / 70;

export const soulRespawn: Sequence<ReviveSequence> = (world, entity, state) => {
  let updated = false;
  const size = world.metadata.gameEntity[LEVEL].size;
  const entityId = world.getEntityId(entity);
  const origin =
    state.args.origin ||
    world.assertByIdAndComponents(state.args.tombstoneId, [POSITION])[POSITION];
  const compassEntity = world.getIdentifierAndComponents("compass", [ITEM]);

  if (!state.args.origin) state.args.origin = origin;

  const delta = {
    x: signedDistance(origin.x, state.args.target.x, size),
    y: signedDistance(origin.y, state.args.target.y, size),
  };

  const lootDelay =
    world.assertByIdAndComponents(entity[MOVABLE].reference, [REFERENCE])[
      REFERENCE
    ].tick - 50;
  const spawnDistance = Math.sqrt(delta.x ** 2 + delta.y ** 2);
  const soulDuration = spawnDistance / soulSpeed;
  const collectTime = state.args.compassId ? soulTime + lootDelay : soulTime;
  const moveTime = collectTime + soulDuration;
  const finished = state.elapsed > moveTime + arriveTime;

  // create soul particle
  if (
    state.elapsed > soulTime &&
    state.elapsed < moveTime &&
    !state.particles.soul
  ) {
    const soulParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: 0,
        offsetY: 0,
        offsetZ: particleHeight,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: ghost,
    });
    state.particles.soul = world.getEntityId(soulParticle);
    updated = true;
  }

  // collect compass
  if (
    state.elapsed > soulTime &&
    state.elapsed < moveTime &&
    state.args.compassId &&
    compassEntity &&
    compassEntity[ITEM].carrier !== entityId
  ) {
    collectItem(world, entity, world.assertById(compassEntity[ITEM].carrier));
    updated = true;
  }

  // exit any buildings by marking as flying
  if (state.elapsed > collectTime && !entity[PLAYER].flying) {
    entity[PLAYER].flying = true;
    updated = true;
  }

  // update viewpoint if moved
  const ratio = Math.max(
    0,
    Math.min(1, (state.elapsed - collectTime) / soulDuration)
  );
  const flightLocation = origin && {
    x: normalize(origin.x + delta.x * ratio, size),
    y: normalize(origin.y + delta.y * ratio, size),
  };
  const roundedLocation = origin && {
    x: normalize(Math.round(flightLocation.x), size),
    y: normalize(Math.round(flightLocation.y), size),
  };

  if (
    state.elapsed > collectTime &&
    state.elapsed < moveTime &&
    (roundedLocation.x !== entity[POSITION].x ||
      roundedLocation.y !== entity[POSITION].y)
  ) {
    moveEntity(world, entity, roundedLocation);
    entity[VIEWABLE].fraction = {
      x: signedDistance(roundedLocation.x, flightLocation.x, size),
      y: signedDistance(roundedLocation.y, flightLocation.y, size),
    };
    rerenderEntity(world, entity);
    updated = true;
  }

  if ((state.elapsed > moveTime && entity[VIEWABLE].fraction) || finished) {
    moveEntity(world, entity, state.args.target);
    entity[VIEWABLE].fraction = undefined;
  }

  // mark soul as ready to be spawned
  if (finished) {
    entity[SOUL].ready = true;
  }

  return { finished, updated };
};

const lineSprites = createText("─┐│┘─└│┌", colors.lime);

export const focusCircle: Sequence<FocusSequence> = (world, entity, state) => {
  const finished = false;
  let updated = false;

  // create all 8 surrounding particles
  if (Object.keys(state.particles).length !== 8) {
    for (let i = 0; i < 4; i += 1) {
      const iteration = iterations[i];
      const sideParticle = entities.createParticle(world, {
        [PARTICLE]: {
          offsetX: iteration.direction.x,
          offsetY: iteration.direction.y,
          offsetZ: focusHeight,
          animatedOrigin: { x: 0, y: 0 },
        },
        [RENDERABLE]: { generation: 1 },
        [SPRITE]: none,
      });
      const cornerParticle = entities.createParticle(world, {
        [PARTICLE]: {
          offsetX: iteration.direction.x + iteration.normal.x,
          offsetY: iteration.direction.y + iteration.normal.y,
          offsetZ: focusHeight,
          animatedOrigin: { x: 0, y: 0 },
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
        world.assertByIdAndComponents(state.particles[`line-${lineIndex}`], [
          SPRITE,
        ])[SPRITE].layers.length > 0
    ) || "-1"
  );
  const focusIndex = world.metadata.gameEntity[RENDERABLE].generation % 4;
  const currentActive = currentIndex !== -1;
  const isActive = !!entity[FOCUSABLE].target;

  // disable all on inactive
  if (currentActive && !isActive) {
    for (let i = 0; i < 8; i += 1) {
      const particle = world.assertByIdAndComponents(
        state.particles[`line-${i}`],
        [SPRITE]
      );
      particle[SPRITE] = none;
    }

    updated = true;
  } else if (isActive && currentIndex !== focusIndex) {
    // rotate focus by toggling visibility of 8 individual particles
    for (let i = 0; i < 8; i += 1) {
      const particle = world.assertByIdAndComponents(
        state.particles[`line-${i}`],
        [SPRITE]
      );
      const particleIndex = i % 4;
      particle[SPRITE] = particleIndex === focusIndex ? lineSprites[i] : none;
    }

    updated = true;
  }

  return { finished, updated };
};

const charDelay = 33;
const tooltipDelay = 500;

export const dialogText: Sequence<DialogSequence> = (world, entity, state) => {
  const heroEntity = world.getIdentifierAndComponents("hero", [POSITION]);

  let updated = false;

  // display if located in any adjacent cell
  const size = world.metadata.gameEntity[LEVEL].size;
  const delta = heroEntity &&
    !isDead(world, heroEntity) && {
      x: signedDistance(heroEntity[POSITION].x, entity[POSITION].x, size),
      y: signedDistance(heroEntity[POSITION].y, entity[POSITION].y, size),
    };
  const isAdjacent =
    !!delta && Math.abs(delta.x) <= 1 && Math.abs(delta.y) <= 1;
  const changed = entity[TOOLTIP].changed;
  const totalLength = state.args.text.length;
  const expired =
    !state.args.overridden &&
    !state.args.isIdle &&
    state.elapsed / charDelay > totalLength * 2 + 40;
  const isCloseBy =
    isAdjacent &&
    !!heroEntity &&
    !isDead(world, heroEntity) &&
    !entity[TOOLTIP].override &&
    !isDead(world, entity) &&
    !isEmpty(world, entity) &&
    !isUnlocked(world, entity);
  const active =
    !expired &&
    !changed &&
    (state.args.overridden || (state.args.isIdle && !isAdjacent) || isCloseBy);

  const orientation =
    (!state.args.isIdle &&
      active &&
      delta &&
      (delta.y > 0 ? "down" : delta.y < 0 && "up")) ||
    state.args.orientation ||
    (state.args.isDialog || state.args.isIdle ? "up" : "down");

  if (state.args.orientation !== orientation) {
    // prevent idle text from reorienting
    updated = !state.args.isIdle;
    state.args.orientation = orientation;
  }

  // create char particles
  const particlesLength = Object.keys(state.particles).length;
  if (particlesLength === 0 && !expired) {
    for (let i = 0; i < totalLength; i += 1) {
      const origin = add(orientationPoints[state.args.orientation], {
        x: -Math.floor((totalLength - 1) / 2),
        y: 0,
      });
      const charPosition = add(origin, { x: i, y: 0 });
      const particleName = `char-${i}`;

      const charParticle = entities.createParticle(world, {
        [PARTICLE]: {
          offsetX: charPosition.x,
          offsetY: charPosition.y,
          offsetZ: state.args.isDialog
            ? dialogHeight
            : state.args.isIdle
            ? idleHeight
            : tooltipHeight,
        },
        [RENDERABLE]: { generation: 1 },
        [SPRITE]: none,
      });
      state.particles[particleName] = world.getEntityId(charParticle);
    }
  }

  const cursorIndex = Array.from({ length: totalLength }).findIndex((_, i) => {
    const particleName = `char-${i}`;
    const particleEntity = world.getEntityByIdAndComponents(
      state.particles[particleName],
      [SPRITE]
    );
    return !particleEntity || particleEntity[SPRITE] === none;
  });
  const currentLength = cursorIndex === -1 ? totalLength : cursorIndex;

  // update timestamp on active change
  if (active !== state.args.active) {
    const isDelayed =
      !active &&
      entity[TOOLTIP].persistent &&
      !isDead(world, entity) &&
      !state.args.isIdle &&
      !state.args.isDialog;
    state.args.timestamp = isDelayed
      ? state.elapsed + tooltipDelay
      : state.elapsed;
    state.args.active = active;
    state.args.lengthOffset = isDelayed ? totalLength : currentLength;
  }

  const charCount = Math.max(
    Math.floor((state.elapsed - state.args.timestamp) / charDelay),
    0
  );
  const targetLength = active
    ? Math.min(state.args.lengthOffset + charCount, totalLength)
    : Math.max(Math.min(totalLength, state.args.lengthOffset) - charCount, 0);

  let finished = false;
  if (currentLength !== targetLength) {
    updated = true;
  }

  if (updated) {
    const origin = add(orientationPoints[state.args.orientation], {
      x: -Math.floor((totalLength - 1) / 2),
      y: 0,
    });

    for (let i = 0; i < totalLength; i += 1) {
      const charSprite = i < targetLength ? state.args.text[i] : none;
      const charPosition = add(origin, { x: i, y: 0 });
      const particleName = `char-${i}`;

      const charParticle = world.assertByIdAndComponents(
        state.particles[particleName],
        [PARTICLE, SPRITE]
      );
      charParticle[PARTICLE].offsetX = charPosition.x;
      charParticle[PARTICLE].offsetY = charPosition.y;
      charParticle[SPRITE] = charSprite;
    }
  }

  // remove particles if player is not in adjacent position anymore and text is fully hidden,
  // or auto advance dialog
  if (
    !active &&
    currentLength === 0 &&
    Object.keys(state.particles).length > 0 &&
    !state.particles.idle
  ) {
    for (let i = 0; i < totalLength; i += 1) {
      const particleName = `char-${i}`;
      disposeEntity(world, world.assertById(state.particles[particleName]));
      delete state.particles[particleName];
    }

    entity[TOOLTIP].changed = undefined;

    const nextDialog = entity[TOOLTIP].nextDialog + 1;
    if (expired && entity[TOOLTIP].dialogs.length > nextDialog) {
      entity[TOOLTIP].nextDialog = nextDialog;
      finished = true;
    } else if (entity[TOOLTIP].idle) {
      // add idle particle
      const idleParticle = entities.createParticle(world, {
        [PARTICLE]: {
          offsetX: 0,
          offsetY: -1,
          offsetZ: idleHeight,
        },
        [RENDERABLE]: { generation: 1 },
        [SPRITE]: entity[TOOLTIP].idle,
      });
      state.particles.idle = world.getEntityId(idleParticle);
      updated = true;
    }
  }

  if (
    currentLength === 0 &&
    ((!expired && !active) ||
      (expired && (!isCloseBy || entity[TOOLTIP].changed)))
  ) {
    if (!isCloseBy) {
      entity[TOOLTIP].nextDialog = 0;
    }

    if (state.particles.idle) {
      disposeEntity(world, world.assertById(state.particles.idle));
      delete state.particles.idle;
    }

    finished = true;
  }

  return { finished, updated };
};

export const pointerArrow: Sequence<PointerSequence> = (
  world,
  entity,
  state
) => {
  let updated = false;
  let finished = false;

  const compassEntity = world.getEntityByIdAndComponents(
    entity[EQUIPPABLE].compass,
    [TRACKABLE, ORIENTABLE]
  );
  const targetId = compassEntity?.[TRACKABLE].target;
  const targetEntity = world.getEntityByIdAndComponents(targetId, [POSITION]);

  if (!state.args.lastOrientation && (!compassEntity || !targetEntity)) {
    return { updated, finished };
  }

  // create pointer particle
  if (!state.particles.pointer) {
    const pointerParticle = entities.createFibre(world, {
      [ORIENTABLE]: {},
      [PARTICLE]: {
        offsetX: 0,
        offsetY: 0,
        offsetZ: tooltipHeight,
        animatedOrigin: { x: 0, y: 0 },
        duration: 400,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: pointer,
    });
    state.particles.pointer = world.getEntityId(pointerParticle);
    updated = true;
  }

  const pointerParticle = world.assertByIdAndComponents(
    state.particles.pointer,
    [ORIENTABLE, PARTICLE]
  );

  const size = world.metadata.gameEntity[LEVEL].size;
  const shouldDisplay =
    !targetEntity ||
    getDistance(entity[POSITION], targetEntity[POSITION], size) <
      entity[LIGHT].visibility;
  const targetChanged = state.args.target !== targetId;
  if (
    state.args.lastOrientation &&
    (!compassEntity || !targetEntity || targetChanged || shouldDisplay)
  ) {
    pointerParticle[ORIENTABLE].facing = undefined;
    if (targetChanged) {
      disposeEntity(world, pointerParticle);
      delete state.particles.pointer;
      state.args.target = undefined;
    }
    state.args.lastOrientation = undefined;
    updated = true;
  } else if (compassEntity && targetEntity && !shouldDisplay) {
    const orientation = compassEntity[ORIENTABLE].facing;
    if (orientation && state.args.lastOrientation !== orientation) {
      const delta = orientationPoints[orientation];
      if (
        state.args.lastOrientation &&
        pointerParticle[PARTICLE].animatedOrigin
      ) {
        pointerParticle[PARTICLE].animatedOrigin = undefined;
      }
      pointerParticle[PARTICLE].offsetX = delta.x * 8;
      pointerParticle[PARTICLE].offsetY = delta.y * 5;
      pointerParticle[ORIENTABLE].facing = orientation;
      state.args.lastOrientation = orientation;
      state.args.target = targetId;
      updated = true;
    }
  }

  return { finished, updated };
};
