import {
  decayHeight,
  dialogHeight,
  effectHeight,
  focusHeight,
  fogHeight,
  getItemSprite,
  idleHeight,
  lootHeight,
  particleHeight,
  tooltipHeight,
} from "../../components/Entity/utils";
import { entities } from "../../engine";
import { DROPPABLE } from "../../engine/components/droppable";
import { EQUIPPABLE, Gear, gears } from "../../engine/components/equippable";
import { Focusable, FOCUSABLE } from "../../engine/components/focusable";
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
import { Sprite, SPRITE } from "../../engine/components/sprite";
import { TOOLTIP } from "../../engine/components/tooltip";
import { TRACKABLE } from "../../engine/components/trackable";
import { isUnlocked } from "../../engine/systems/action";
import {
  collectItem,
  getStackable,
  isEmpty,
} from "../../engine/systems/collect";
import { isDead } from "../../engine/systems/damage";
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
  random,
  shuffle,
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
  waveCorner,
  wave,
  woodStick,
  edge,
  beam,
  getMaxCounter,
  flask2,
  flask1,
  getStatSprite,
  questPointer,
  enemyPointer,
  tombstonePointer,
  bubbleUp,
  bubbleRight,
  bubbleDown,
  bubbleLeft,
  shoutUp,
  shoutRight,
  shoutDown,
  shoutLeft,
  shadow,
  heal,
  smokeLight,
  smokeThick,
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
  MarkerSequence,
  MeleeSequence,
  MessageSequence,
  PerishSequence,
  PointerSequence,
  ReviveSequence,
  SEQUENCABLE,
  Sequence,
  SmokeSequence,
  SpellSequence,
  UnlockSequence,
  VisionSequence,
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
import { invertOrientation, relativeOrientations } from "../math/path";
import { dropEntity } from "../../engine/systems/drop";
import { EXERTABLE } from "../../engine/components/exertable";
import { consumptionConfigs } from "../../engine/systems/consume";
import { decayTime, lootSpeed } from "./utils";
import { isImmersible } from "../../engine/systems/immersion";
import { PLAYER } from "../../engine/components/player";
import { BELONGABLE } from "../../engine/components/belongable";
import { CASTABLE } from "../../engine/components/castable";
import { BURNABLE } from "../../engine/components/burnable";

export * from "./npcs";
export * from "./quests";

export const swordAttack: Sequence<MeleeSequence> = (world, entity, state) => {
  // align sword with facing direction
  const finished = state.elapsed > state.args.tick / 2;
  const swordEntity = world.getEntityByIdAndComponents(
    entity[EQUIPPABLE].sword,
    [ORIENTABLE]
  );

  // abort if wood sword is converted to stick on entity death during animation
  if (!swordEntity) {
    return { updated: false, finished: true };
  }

  const facing = state.args.facing;
  const currentFacing = swordEntity[ORIENTABLE].facing;
  const updated = currentFacing !== facing;

  if (updated) {
    swordEntity[ORIENTABLE].facing = facing;
    rerenderEntity(world, swordEntity);
  }

  if (finished) {
    entity[MELEE].facing = undefined;
    swordEntity[ORIENTABLE].facing = undefined;
    rerenderEntity(world, entity);
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
      (shootable && state.args.caster !== world.getEntityId(shootable)) ||
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
    aoeProgress < progress && aoeProgress < state.args.range;
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
    let clearProgress =
      state.args.progress - state.args.duration + state.args.range;
    clearProgress > 0 &&
    clearProgress < progress - state.args.duration + state.args.range;
    clearProgress += 1
  ) {
    const aoeId = state.args.areas.shift();

    if (!aoeId) break;

    const aoeEntity = world.assertById(aoeId);
    disposeEntity(world, aoeEntity);
    updated = true;
  }

  // create beams
  if (
    state.args.progress !== progress &&
    progress > 2 &&
    progress <= state.args.duration - state.args.range &&
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
  const limit = {
    x: delta.x * state.args.range,
    y: delta.y * state.args.range,
  };
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
          (progress > state.args.duration - state.args.range || progress === 1))
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

const markerDuration = 150;
const healMultiplier = 2;

export const amountMarker: Sequence<MarkerSequence> = (
  world,
  entity,
  state
) => {
  const markerTime =
    state.args.amount > 0 ? healMultiplier * markerDuration : markerDuration;
  const finished = state.elapsed > markerTime;
  let updated = false;

  if (!state.particles.marker) {
    const markerParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: 0,
        offsetY: 0,
        offsetZ: particleHeight,
        amount: Math.abs(state.args.amount),
        duration: markerTime,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: state.args.amount > 0 ? heal : hit,
    });
    state.particles.marker = world.getEntityId(markerParticle);
  }

  if (state.elapsed > markerTime && state.particles.marker) {
    disposeEntity(world, world.assertById(state.particles.marker));
    delete state.particles.marker;
  }

  return { finished, updated };
};

const messageDuration = 400;

export const transientMessage: Sequence<MessageSequence> = (
  world,
  entity,
  state
) => {
  // currently only supports one character
  const messageTime = state.args.fast
    ? messageDuration
    : healMultiplier * messageDuration;
  const finished = state.elapsed > messageTime;
  let updated = false;

  if (!state.particles.counter) {
    const counterParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: 0,
        offsetY: state.args.orientation === "down" ? 3 : -3,
        offsetZ: tooltipHeight,
        animatedOrigin: { x: 0, y: state.args.orientation === "down" ? 1 : -1 },
        duration: messageTime,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: state.args.message[0],
    });
    state.particles.counter = world.getEntityId(counterParticle);
  }

  if (state.elapsed > messageTime && state.particles.counter) {
    disposeEntity(world, world.assertById(state.particles.counter));
    delete state.particles.counter;
    updated = true;
  }

  return { finished, updated };
};

const haltTime = 200;

export const creatureDecay: Sequence<DecaySequence> = (
  world,
  entity,
  state
) => {
  let updated = false;
  const finished = state.elapsed > haltTime + decayTime;

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

const waveSpeed = 350;
const waveDissolve = 1;

export const castWave1: Sequence<SpellSequence> = (world, entity, state) => {
  const entityId = world.getEntityId(entity);
  let updated = false;
  let finished = false;

  const outerRadius = Math.ceil(state.elapsed / waveSpeed);
  const innerRadius = Math.round(state.elapsed / waveSpeed);

  // create wave sides, initial corners and AoE
  if (state.args.progress === 0) {
    for (const orientation of orientations) {
      const waveParticle = entities.createFibre(world, {
        [ORIENTABLE]: { facing: orientation },
        [PARTICLE]: {
          offsetX: 0,
          offsetY: 0,
          offsetZ: particleHeight,
          amount: 0,
          duration: waveSpeed,
          animatedOrigin: { x: 0, y: 0 },
        },
        [RENDERABLE]: { generation: 1 },
        [SPRITE]: wave,
      });
      state.particles[`side-${orientation}`] = world.getEntityId(waveParticle);
    }

    const aoeEntity = entities.createAoe(world, {
      [EXERTABLE]: { castable: entityId },
      [POSITION]: copy(entity[POSITION]),
    });
    registerEntity(world, aoeEntity);
    state.args.areas.push(world.getEntityId(aoeEntity));

    updated = true;
  }

  if (outerRadius !== state.args.progress && outerRadius < state.args.range) {
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
        const leftParticle = entities.createFibre(world, {
          [ORIENTABLE]: { facing: rotatedOrientation },
          [PARTICLE]: {
            offsetX: leftDelta.x,
            offsetY: leftDelta.y,
            offsetZ: particleHeight,
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
        state.particles[`inner-${innerRadius}-left-${iteration.orientation}`] =
          world.getEntityId(leftParticle);

        const rightDelta = {
          x:
            iteration.direction.x * cornerDistance +
            iteration.normal.x * cornerDistance,
          y:
            iteration.direction.y * cornerDistance +
            iteration.normal.y * cornerDistance,
        };
        const rightParticle = entities.createFibre(world, {
          [ORIENTABLE]: { facing: invertOrientation(iteration.orientation) },
          [PARTICLE]: {
            offsetX: rightDelta.x,
            offsetY: rightDelta.y,
            offsetZ: particleHeight,
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
        state.particles[`inner-${innerRadius}-right-${iteration.orientation}`] =
          world.getEntityId(rightParticle);
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
        const leftParticle = entities.createFibre(world, {
          [ORIENTABLE]: { facing: rotatedOrientation },
          [PARTICLE]: {
            offsetX: leftDelta.x,
            offsetY: leftDelta.y,
            offsetZ: particleHeight,
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
        state.particles[`outer-${outerRadius}-left-${iteration.orientation}`] =
          world.getEntityId(leftParticle);

        const rightDelta = {
          x:
            iteration.direction.x * cornerDistance +
            iteration.normal.x * cornerDistance,
          y:
            iteration.direction.y * cornerDistance +
            iteration.normal.y * cornerDistance,
        };
        const rightParticle = entities.createFibre(world, {
          [ORIENTABLE]: { facing: iteration.orientation },
          [PARTICLE]: {
            offsetX: rightDelta.x,
            offsetY: rightDelta.y,
            offsetZ: particleHeight,
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
        state.particles[`outer-${outerRadius}-right-${iteration.orientation}`] =
          world.getEntityId(rightParticle);
      }
    }

    state.args.progress = outerRadius;
    updated = true;
  }

  if (innerRadius !== state.args.memory.innerRadius) {
    // make inner corners visible after passing half block width
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

    // create AoE
    for (const iteration of iterations) {
      const aoeSide = entities.createAoe(world, {
        [EXERTABLE]: { castable: entityId },
        [POSITION]: add(entity[POSITION], {
          x: innerRadius * iteration.direction.x,
          y: innerRadius * iteration.direction.y,
        }),
      });
      const aoeCorner = entities.createAoe(world, {
        [EXERTABLE]: { castable: entityId },
        [POSITION]: add(entity[POSITION], {
          x: innerRadius * iteration.direction.x + iteration.normal.x,
          y: innerRadius * iteration.direction.y + iteration.normal.y,
        }),
      });
      registerEntity(world, aoeSide);
      registerEntity(world, aoeCorner);
      state.args.areas.push(
        world.getEntityId(aoeSide),
        world.getEntityId(aoeCorner)
      );

      for (let normal = 1; normal < innerRadius; normal += 1) {
        const aoeDiagonal = entities.createAoe(world, {
          [EXERTABLE]: { castable: entityId },
          [POSITION]: add(entity[POSITION], {
            x:
              (innerRadius - normal) * iteration.direction.x +
              iteration.normal.x * (normal + 1),
            y:
              (innerRadius - normal) * iteration.direction.y +
              iteration.normal.y * (normal + 1),
          }),
        });
        registerEntity(world, aoeDiagonal);
        state.args.areas.push(world.getEntityId(aoeDiagonal));
      }
    }

    state.args.memory.innerRadius = innerRadius;
    updated = true;
  }

  if (
    outerRadius + waveDissolve >= state.args.range &&
    outerRadius < state.args.duration
  ) {
    // slowly dissolve wave after hitting range
    const particles = Object.keys(state.particles);
    const dissolvePercentage =
      (state.elapsed / waveSpeed + 1 + waveDissolve - state.args.range) /
      (state.args.duration - state.args.range + waveDissolve);
    const totalParticles = (state.args.range * 2 - 1) * 4;
    const dissolvingCount =
      particles.length - totalParticles * (1 - dissolvePercentage);

    if (dissolvingCount > 0) {
      shuffle(particles)
        .slice(0, dissolvingCount)
        .forEach((particleName) => {
          const particleEntity = world.assertByIdAndComponents(
            state.particles[particleName],
            [PARTICLE]
          );

          disposeEntity(world, particleEntity);
          delete state.particles[particleName];
        });
      updated = true;
    }
  } else if (outerRadius >= state.args.duration) {
    // clear wave on end
    for (const particleName in state.particles) {
      const particleEntity = world.assertByIdAndComponents(
        state.particles[particleName],
        [PARTICLE]
      );

      disposeEntity(world, particleEntity);
      delete state.particles[particleName];
    }

    // clear AoE
    for (const aoeId of state.args.areas) {
      const aoeEntity = world.assertById(aoeId);
      disposeEntity(world, aoeEntity);
    }
    state.args.areas = [];

    finished = true;
    return { finished, updated };
  }

  return { finished, updated };
};

export const fireBurn: Sequence<BurnSequence> = (world, entity, state) => {
  let updated = false;
  let finished = false;
  const isBurning = entity[BURNABLE].burning;
  const isEternalFire = entity[BURNABLE].eternal;

  if (isBurning && !state.particles.fire) {
    // create fire particle
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
  } else if (!isBurning && state.particles.fire) {
    // extinguish fire if not burning anymore
    disposeEntity(world, world.assertById(state.particles.fire));
    delete state.particles.fire;
    updated = true;
  }

  // create castable and AoE for eternal fire
  if (
    isEternalFire &&
    isBurning &&
    !state.args.castable &&
    !state.args.exertable
  ) {
    const spellEntity = entities.createSpell(world, {
      [BELONGABLE]: { faction: "nature" },
      [CASTABLE]: {
        affected: {},
        damage: 1,
        burn: 3,
        freeze: 0,
        caster: world.getEntityId(entity),
      },
      [ORIENTABLE]: {},
      [POSITION]: copy(entity[POSITION]),
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
      [SPRITE]: none,
    });
    state.args.castable = world.getEntityId(spellEntity);

    const exertableEntity = entities.createAoe(world, {
      [EXERTABLE]: { castable: state.args.castable },
      [POSITION]: copy(entity[POSITION]),
    });
    state.args.exertable = world.getEntityId(exertableEntity);

    updated = true;
  } else if (
    isEternalFire &&
    !isBurning &&
    state.args.castable &&
    state.args.exertable
  ) {
    // deactivate eternal fire AoE
    disposeEntity(world, world.assertById(state.args.castable));
    delete state.args.castable;
    disposeEntity(world, world.assertById(state.args.exertable));
    delete state.args.exertable;

    updated = true;
  }

  const generation = world.metadata.gameEntity[RENDERABLE].generation;

  if (isBurning && generation !== state.args.generation) {
    state.args.generation = generation;
    const fireParticle = world.assertByIdAndComponents(state.particles.fire, [
      PARTICLE,
    ]);
    const amount = fireParticle[PARTICLE].amount;
    fireParticle[PARTICLE].amount =
      amount === 2 ? [1, 3][distribution(40, 60)] : 2;
    updated = true;
  }

  return { finished, updated };
};

export const smokeWind: Sequence<SmokeSequence> = (world, entity, state) => {
  let updated = false;
  let finished = false;

  const isBurning = entity[BURNABLE].burning;
  const generation = world.metadata.gameEntity[RENDERABLE].generation;

  if (generation !== state.args.generation) {
    state.args.generation = generation;

    // add smoke
    if (isBurning && random(0, Object.keys(state.particles).length) <= 1) {
      const step = 2 - ((generation + 2) % 2);
      const smokeParticle = entities.createParticle(world, {
        [PARTICLE]: {
          offsetX: 0,
          offsetY: 0,
          offsetZ: fogHeight,
          animatedOrigin: { x: 0, y: 0 },
          amount: random(0, 1) + step,
          duration: step * 350,
        },
        [RENDERABLE]: { generation: (generation % 2) + 2 },
        [SPRITE]: [smokeThick, smokeLight][step - 1],
      });
      state.particles[`smoke-${generation}`] = world.getEntityId(smokeParticle);
      updated = true;
    }

    // move or fade smoke
    const wind = random(0, 2) === 0 ? random(0, 2) - 1 : 0;
    for (const particleName in state.particles) {
      const smokeParticle = world.assertByIdAndComponents(
        state.particles[particleName],
        [PARTICLE, RENDERABLE]
      );

      const step = (smokeParticle[PARTICLE].duration || 350) / 350;
      if ((generation + smokeParticle[RENDERABLE].generation) % step === 0) {
        smokeParticle[PARTICLE].offsetY -= 1;
        smokeParticle[PARTICLE].offsetX += wind;

        const distance = smokeParticle[PARTICLE].offsetY * -1;
        const amount = smokeParticle[PARTICLE].amount || 1;
        if (random(0, 2) < distance - amount) {
          smokeParticle[PARTICLE].amount = Math.max(
            0,
            amount === 2 ? 0 : amount - random(1, 2)
          );
          updated = true;
        }

        // remove depleted smoke
        if (smokeParticle[PARTICLE].amount === 0) {
          disposeEntity(world, smokeParticle);
          delete state.particles[particleName];
          updated = true;
        }
      }
    }
  }

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

// how unfortunate
export const tragicDeath: Sequence<PerishSequence> = (world, entity, state) => {
  let updated = false;
  const circleTime = state.args.fast ? visionTime / 2 : visionTime;
  const ripTime = circleTime + 500;
  const spawnTime = ripTime + 500;
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
  const itemEntity = world.getEntityByIdAndComponents(itemId, [
    RENDERABLE,
    ITEM,
    SPRITE,
  ]);

  // abort if item has been disposed improperly
  if (!itemEntity) {
    if (lootId) {
      const lootParticle = world.assertById(lootId);
      disposeEntity(world, lootParticle);
      delete state.particles.loot;
    }
    return { updated, finished: true };
  }

  const distance = getDistance(entity[POSITION], state.args.origin, size);
  const delay = state.args.delay || 0;
  const lootDelay =
    MOVABLE in entity
      ? Math.min(
          200,
          world.assertByIdAndComponents(entity[MOVABLE].reference, [REFERENCE])[
            REFERENCE
          ].tick - 50
        )
      : lootSpeed * distance;

  // add item to player's inventory
  if (state.elapsed >= lootDelay + delay) {
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

      // set background
      if (!isImmersible(world, entity[POSITION])) {
        entity[SPRITE] = shadow;
      }
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

          if (!gears.includes(targetEquipment as Gear)) {
            removeFromInventory(world, entity, existingItem);
          }
          dropEntity(
            world,
            { [INVENTORY]: { items: [existingId] } },
            entity[POSITION]
          );
        }

        entity[EQUIPPABLE][targetEquipment] = targetId;

        if (!gears.includes(targetEquipment as Gear)) {
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
        const maxStat = getMaxCounter(targetStat);
        const maximum = maxStat !== targetStat ? entity[STATS][maxStat] : 99;
        entity[STATS][targetStat] = Math.min(
          entity[STATS][targetStat] + state.args.amount,
          maximum
        );

        if (entity[PLAYER] && targetStat === "hp") {
          entity[PLAYER].healingReceived += state.args.amount;
        }
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
  if (!lootId && state.elapsed >= delay && state.elapsed < lootDelay + delay) {
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

const consumeSpeed = 500;

export const flaskConsume: Sequence<ConsumeSequence> = (
  world,
  entity,
  state
) => {
  let updated = false;
  const finished = state.elapsed >= consumeSpeed * 2;
  const consumableId = state.particles.consumable;
  const countableId = state.particles.countable;
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

  // process item consumption and show amount marker
  if (countableId && state.elapsed >= consumeSpeed * 2) {
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

    // queue healing effect
    if (entity[PLAYER] && consumptionConfig.countable === "hp") {
      entity[PLAYER].healingReceived += consumptionConfig.amount;
    }

    updated = true;
  }

  // create consumable particle
  if (!consumableId) {
    const consumableParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: 0,
        offsetY: -2,
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

  // create countable particle, empty flask and add decay
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
        animatedOrigin: { x: 0, y: -2 },
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: getStatSprite(consumptionConfig.countable),
    });
    state.particles.countable = world.getEntityId(countableParticle);

    const decayParticle = entities.createParticle(world, {
      [PARTICLE]: { offsetX: 0, offsetY: -2, offsetZ: lootHeight },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: decay,
    });
    state.particles.decay = world.getEntityId(decayParticle);

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
  if (state.elapsed > collectTime && !entity[MOVABLE].flying) {
    entity[MOVABLE].flying = true;
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

const lineSprites: Record<NonNullable<Focusable["highlight"]>, Sprite[]> = {
  quest: createText("─┐│┘─└│┌", colors.lime),
  enemy: createText("─┐│┘─└│┌", colors.red),
  tombstone: createText("─┐│┘─└│┌", colors.silver),
};

const focusSpeed = 250;

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
  const focusIndex = Math.floor(state.elapsed / focusSpeed) % 4;
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
      particle[SPRITE] =
        particleIndex === focusIndex
          ? lineSprites[
              (entity[FOCUSABLE].highlight as Focusable["highlight"])!
            ][i]
          : none;
    }

    updated = true;
  }

  return { finished, updated };
};

const charDelay = 33;
const tooltipDelay = 500;
const bubbleSprites = {
  up: bubbleUp,
  right: bubbleRight,
  down: bubbleDown,
  left: bubbleLeft,
};
const shoutSprites = {
  up: shoutUp,
  right: shoutRight,
  down: shoutDown,
  left: shoutLeft,
};

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
    state.elapsed / charDelay > totalLength * 1.5 + 30;
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
  const heroOrientation =
    heroEntity &&
    relativeOrientations(world, heroEntity[POSITION], entity[POSITION])[0];
  const bubbleOrientation =
    heroOrientation === orientation
      ? heroOrientation
      : heroOrientation ===
        orientations[(orientations.indexOf(orientation) + 3) % 4]
      ? orientation
      : orientations[(orientations.indexOf(orientation) + 1) % 4];

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

    // create bubble
    const bubbleParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: 0,
        offsetY: 0,
        offsetZ: state.args.isDialog
          ? dialogHeight
          : state.args.isIdle
          ? idleHeight
          : tooltipHeight,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: none,
    });
    state.particles.bubble = world.getEntityId(bubbleParticle);
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

  // reorient bubble
  const bubbleParticle = world.getEntityByIdAndComponents(
    state.particles.bubble,
    [PARTICLE, SPRITE]
  );
  const bubbleSprite =
    bubbleOrientation &&
    currentLength >
      Math.floor((totalLength - 1) / 2) +
        (orientation === bubbleOrientation ? -1 : 1) *
          (orientation === "up" ? 1 : -1)
      ? (state.args.isEnemy ? shoutSprites : bubbleSprites)[bubbleOrientation]
      : none;
  if (
    state.args.isDialog &&
    bubbleSprite &&
    bubbleParticle &&
    bubbleSprite !== bubbleParticle[SPRITE]
  ) {
    bubbleParticle[SPRITE] = bubbleSprite;
    const bubbleOffset =
      orientationPoints[
        orientations[
          (orientations.indexOf(orientation) +
            (orientation === bubbleOrientation ? 3 : 1)) %
            4
        ]
      ];
    bubbleParticle[PARTICLE].offsetX = bubbleOffset.x;
    bubbleParticle[PARTICLE].offsetY = bubbleOffset.y;
    updated = true;
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

    if (bubbleParticle) {
      disposeEntity(world, bubbleParticle);
      delete state.particles.bubble;
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

const pointers: Record<NonNullable<Focusable["highlight"]>, Sprite> = {
  quest: questPointer,
  enemy: enemyPointer,
  tombstone: tombstonePointer,
};

export const pointerArrow: Sequence<PointerSequence> = (
  world,
  entity,
  state
) => {
  let updated = false;
  let finished = false;

  const highlighEntity = world.getEntities([
    FOCUSABLE,
    TRACKABLE,
    ORIENTABLE,
  ])[0];
  const targetId = highlighEntity?.[FOCUSABLE].target;
  const targetEntity = world.getEntityByIdAndComponents(targetId, [POSITION]);

  if (!state.args.lastOrientation && (!highlighEntity || !targetEntity)) {
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
      [SPRITE]: pointers[highlighEntity[FOCUSABLE].highlight!],
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
    (!highlighEntity || !targetEntity || targetChanged || shouldDisplay)
  ) {
    pointerParticle[ORIENTABLE].facing = undefined;
    if (targetChanged) {
      disposeEntity(world, pointerParticle);
      delete state.particles.pointer;
      state.args.target = undefined;
    }
    state.args.lastOrientation = undefined;
    updated = true;
  } else if (highlighEntity && targetEntity && !shouldDisplay) {
    // invert orientation as needle from highlight is pointing to hero
    const orientation = highlighEntity[ORIENTABLE].facing;
    const invertedOrientation = orientation && invertOrientation(orientation);
    if (
      invertedOrientation &&
      state.args.lastOrientation !== invertedOrientation
    ) {
      const delta = orientationPoints[invertedOrientation];
      if (
        state.args.lastOrientation &&
        pointerParticle[PARTICLE].animatedOrigin
      ) {
        pointerParticle[PARTICLE].animatedOrigin = undefined;
      }
      pointerParticle[PARTICLE].offsetX = delta.x * 8;
      pointerParticle[PARTICLE].offsetY = delta.y * 5;
      pointerParticle[ORIENTABLE].facing = invertedOrientation;
      state.args.lastOrientation = invertedOrientation;
      state.args.target = targetId;
      updated = true;
    }
  }

  return { finished, updated };
};
