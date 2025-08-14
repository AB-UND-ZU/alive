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
  selectionHeight,
  tooltipHeight,
} from "../../components/Entity/utils";
import { entities } from "../../engine";
import { DROPPABLE } from "../../engine/components/droppable";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { Focusable, FOCUSABLE } from "../../engine/components/focusable";
import { Inventory, INVENTORY } from "../../engine/components/inventory";
import { ITEM } from "../../engine/components/item";
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
  addToInventory,
  collectItem,
  isEmpty,
} from "../../engine/systems/collect";
import { isDead } from "../../engine/systems/damage";
import {
  disposeEntity,
  moveEntity,
  registerEntity,
} from "../../engine/systems/map";
import { rerenderEntity } from "../../engine/systems/renderer";
import { openDoor } from "../../engine/systems/trigger";
import * as colors from "./colors";
import {
  add,
  choice,
  copy,
  distribution,
  getDistance,
  id,
  lerp,
  normalize,
  random,
  repeat,
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
  levelProgress,
  addBackground,
  popupBackground,
  fireEdge,
  waterEdge,
  earthEdge,
  fireBeam,
  waterBeam,
  earthBeam,
  fireWave,
  waterWave,
  earthWave,
  fireWaveCorner,
  waterWaveCorner,
  earthWaveCorner,
  freeze,
  defaultWaveCorner,
  defaultWave,
  defaultEdge,
  defaultBeam,
  buySelection,
  sellSelection,
  craft,
  shop,
  woodSlashSide,
  woodSlashCorner,
  ironSlashSide,
  ironSlashCorner,
  strikethrough,
  mergeSprites,
  hostileBar,
  xpDot,
  rain,
  info,
  createCountable,
  underline,
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
  FreezeSequence,
  InfoSequence,
  MarkerSequence,
  MeleeSequence,
  Message,
  MessageSequence,
  PerishSequence,
  PointerSequence,
  PopupSequence,
  ProgressSequence,
  RainSequence,
  ReviveSequence,
  SEQUENCABLE,
  Sequence,
  SlashSequence,
  SmokeSequence,
  SpellSequence,
  UnlockSequence,
  VisionSequence,
  XpSequence,
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
import { STATS } from "../../engine/components/stats";
import { invertOrientation, relativeOrientations } from "../math/path";
import { dropEntity, MAX_DROP_RADIUS } from "../../engine/systems/drop";
import { EXERTABLE } from "../../engine/components/exertable";
import {
  consumptionConfigs,
  stackableConsumptions,
} from "../../engine/systems/consume";
import {
  contentDelay,
  decayTime,
  displayPopup,
  frameHeight,
  frameWidth,
  getLootDelay,
  popupTime,
  scrolledVerticalIndex,
} from "./utils";
import { isImmersible } from "../../engine/systems/immersion";
import { PLAYER } from "../../engine/components/player";
import { BELONGABLE } from "../../engine/components/belongable";
import { CASTABLE } from "../../engine/components/castable";
import { BURNABLE } from "../../engine/components/burnable";
import { AFFECTABLE } from "../../engine/components/affectable";
import { getExertables, getParticleAmount } from "../../engine/systems/magic";
import { FRAGMENT } from "../../engine/components/fragment";
import { Popup, POPUP } from "../../engine/components/popup";
import { getActivationRow } from "../../components/Controls";
import {
  canRedeem,
  canShop,
  hasDefeated,
  isInPopup,
  popupIdles,
} from "../../engine/systems/popup";
import { getIdentifierAndComponents } from "../../engine/utils";
import { generateUnitData } from "../balancing/units";
import { play } from "../sound";

export * from "./npcs";
export * from "./quests";

export const swordAttack: Sequence<MeleeSequence> = (world, entity, state) => {
  // align sword with facing direction
  const finished =
    state.elapsed > state.args.tick / (state.args.rotate ? 0.5 : 2);
  const swordEntity = world.getEntityByIdAndComponents(
    entity[EQUIPPABLE].sword,
    [ORIENTABLE]
  );

  // abort if wood sword is converted to stick on entity death during animation
  if (!swordEntity) {
    return { updated: false, finished: true };
  }

  // rotate sword if needed
  const facing =
    state.args.rotate && state.elapsed < state.args.tick
      ? orientations[
          (orientations.indexOf(state.args.facing) -
            Math.floor((2 * state.elapsed) / state.args.tick) +
            4) %
            4
        ]
      : state.args.facing;
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

const slashTicks = 8;

const slashSideSprites = {
  wood: woodSlashSide,
  iron: ironSlashSide,
};
const slashCornerSprites = {
  wood: woodSlashCorner,
  iron: ironSlashCorner,
};

export const chargeSlash: Sequence<SlashSequence> = (world, entity, state) => {
  // TODO: resolve circular dependencies and move outside of handler
  const reversedIterations = [...iterations].reverse();
  const slashIterations = [
    ...reversedIterations.slice(2),
    ...reversedIterations.slice(0, 2),
  ];
  const castableEntity = world.assertByIdAndComponents(state.args.castable, [
    POSITION,
  ]);
  const particleCount = Object.keys(state.particles).length;
  const targetProgress = Math.min(
    Math.ceil((state.elapsed * slashTicks) / state.args.tick),
    slashTicks
  );
  const cleanupProgress = Math.min(
    Math.max(
      Math.ceil((state.elapsed * slashTicks) / state.args.tick) - slashTicks,
      0
    ),
    slashTicks
  );
  const currentProgress = cleanupProgress === 0 ? particleCount : slashTicks;
  const recentParticle = slashTicks - particleCount;

  let finished = state.elapsed > state.args.tick * 2;
  let updated = false;

  // create spell AoE
  if (state.args.exertables.length === 0 && !finished) {
    // create ring around castable
    for (const iteration of iterations) {
      const sidePosition = add(castableEntity[POSITION], iteration.direction);
      const sideExertable = entities.createAoe(world, {
        [EXERTABLE]: { castable: state.args.castable },
        [POSITION]: sidePosition,
      });
      const cornerExertable = entities.createAoe(world, {
        [EXERTABLE]: { castable: state.args.castable },
        [POSITION]: add(sidePosition, iteration.normal),
      });
      state.args.exertables.push(
        world.getEntityId(sideExertable),
        world.getEntityId(cornerExertable)
      );
    }

    updated = true;
  }

  if (targetProgress > currentProgress && !finished) {
    const slashSide = slashSideSprites[state.args.material];
    const slashCorner = slashCornerSprites[state.args.material];

    for (
      let particleIndex = currentProgress;
      particleIndex < targetProgress;
      particleIndex += 1
    ) {
      const iterationIndex = Math.floor(particleIndex / 2);
      const isCorner = particleIndex % 2 === 1;

      const slashIteration = slashIterations[iterationIndex];

      const delta = isCorner
        ? add(slashIteration.direction, {
            x: -slashIteration.normal.x,
            y: -slashIteration.normal.y,
          })
        : slashIteration.direction;
      const slashParticle = entities.createFibre(world, {
        [ORIENTABLE]: { facing: slashIteration.orientation },
        [PARTICLE]: {
          offsetX: delta.x,
          offsetY: delta.y,
          offsetZ: effectHeight,
          duration: state.args.tick / slashTicks,
          animatedOrigin:
            particleIndex === 0
              ? { x: 0, y: 0 }
              : isCorner
              ? slashIteration.direction
              : add(slashIteration.direction, slashIteration.normal),
        },
        [RENDERABLE]: { generation: 1 },
        [SPRITE]: isCorner ? slashCorner : slashSide,
      });
      state.particles[`slash-${particleIndex}`] =
        world.getEntityId(slashParticle);
    }

    updated = true;
  }

  // fade out circle once done
  if (cleanupProgress > recentParticle) {
    for (
      let particleIndex = recentParticle;
      particleIndex < cleanupProgress;
      particleIndex += 1
    ) {
      const particleName = `slash-${particleIndex}`;
      const particleEntity = world.getEntityByIdAndComponents(
        state.particles[particleName],
        [PARTICLE]
      );

      if (!particleEntity) continue;

      disposeEntity(world, particleEntity);
      delete state.particles[particleName];
    }
    updated = true;
  }

  // delete castable and AoE
  if (finished && state.args.exertables.length > 0) {
    for (const exertableId of state.args.exertables) {
      disposeEntity(world, world.assertById(exertableId));
    }
    state.args.exertables = [];
  }

  return { finished, updated };
};

const beamSpeed = 100;
const edgeSprites = {
  wild: edge,
  default: defaultEdge,
  fire: fireEdge,
  water: waterEdge,
  earth: earthEdge,
};
const beamSprites = {
  wild: beam,
  default: defaultBeam,
  fire: fireBeam,
  water: waterBeam,
  earth: earthBeam,
};

export const castBeam1: Sequence<SpellSequence> = (world, entity, state) => {
  const entityId = world.getEntityId(entity);
  const progress = Math.ceil(state.elapsed / beamSpeed);
  const delta = orientationPoints[entity[ORIENTABLE].facing as Orientation];
  const spellAmount = entity[CASTABLE]?.damage || entity[CASTABLE].heal;
  const particleAmount = getParticleAmount(world, spellAmount);
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
        amount: particleAmount,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: edgeSprites[state.args.element],
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
        amount: particleAmount,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: edgeSprites[state.args.element],
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
    (progress - 1) % Math.min(particleAmount, 3) === 0
  ) {
    const beamParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: delta.x,
        offsetY: delta.y,
        offsetZ: particleHeight,
        duration: beamSpeed,
        amount: particleAmount,
        animatedOrigin: copy(delta),
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: beamSprites[state.args.element],
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
  const particleAmount = getParticleAmount(world, Math.abs(state.args.amount));

  if (!state.particles.marker) {
    const markerParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: 0,
        offsetY: 0,
        offsetZ: particleHeight,
        amount: particleAmount,
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
  const finished = state.args.messages.length === 0;
  let updated = false;

  const remainingMessages: Message[] = [];
  state.args.messages.forEach((message) => {
    const isStarted = state.elapsed > message.delay;
    const messageTime = message.fast
      ? messageDuration
      : healMultiplier * messageDuration;
    const isExpired = state.elapsed >= message.delay + messageTime;

    if (isStarted && !isExpired && !("stack" in message)) {
      // mark message as executing
      message.stack = state.args.index;
      state.args.index += 1;

      message.line.forEach((char, index) => {
        const charParticle = entities.createParticle(world, {
          [PARTICLE]: {
            offsetX: index - Math.floor(message.line.length / 2),
            offsetY: message.orientation === "down" ? 3 : -3,
            offsetZ: tooltipHeight,
            animatedOrigin: {
              x: index - Math.floor(message.line.length / 2),
              y: message.orientation === "down" ? 1 : -1,
            },
            duration: messageTime,
          },
          [RENDERABLE]: { generation: 1 },
          [SPRITE]: char,
        });
        state.particles[`char-${message.stack}-${index}`] =
          world.getEntityId(charParticle);
      });
      updated = true;
    } else if (isExpired && "stack" in message) {
      // dispose message
      for (const particleName in state.particles) {
        if (!particleName.startsWith(`char-${message.stack}`)) continue;

        const particleEntity = world.assertByIdAndComponents(
          state.particles[particleName],
          [PARTICLE]
        );

        disposeEntity(world, particleEntity);
        delete state.particles[particleName];
      }
      updated = true;
      return;
    }
    remainingMessages.push(message);
  });

  state.args.messages = remainingMessages;

  // wipe all particles
  if (finished && Object.keys(state.particles).length > 0) {
    for (const particleName in state.particles) {
      const particleEntity = world.assertByIdAndComponents(
        state.particles[particleName],
        [PARTICLE]
      );

      disposeEntity(world, particleEntity);
      delete state.particles[particleName];
    }
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
  const decayDelay = state.args.fast ? 0 : haltTime;
  const finished = state.elapsed > decayDelay + decayTime;

  // create death particle
  if (!state.particles.decay && state.elapsed > decayDelay && !finished) {
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

    if (entity[DROPPABLE]) entity[DROPPABLE].decayed = true;
    if (entity[BURNABLE]) entity[BURNABLE].decayed = true;
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

  if (targetWidth > 3 || (state.args.type === "rain" && targetWidth > 2)) {
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

const rainSpeed = 75;

export const rainDrop: Sequence<RainSequence> = (world, entity, state) => {
  let updated = false;
  let finished = state.elapsed > state.args.height * rainSpeed;

  // create rain particle
  if (!state.particles.drop) {
    const dropParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: 0,
        offsetY: 0,
        offsetZ: effectHeight,
        amount: 0,
        animatedOrigin: { x: 0, y: -state.args.height },
        duration: state.args.height * rainSpeed,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: rain,
    });
    state.particles.drop = world.getEntityId(dropParticle);
    updated = true;
  }

  return { finished, updated };
};

const progressParts = 11;
const progressTime = 75;

export const levelUp: Sequence<ProgressSequence> = (world, entity, state) => {
  let updated = false;
  let finished = state.elapsed > progressParts * progressTime * 3;

  // create progress particles
  if (Object.keys(state.particles).length === 0) {
    // orthogonal lines
    for (let i = 0; i < progressParts; i += 1) {
      for (const orientation of orientations) {
        const delta = orientationPoints[orientation];
        const progressParticle = entities.createFibre(world, {
          [ORIENTABLE]: { facing: orientation },
          [PARTICLE]: {
            offsetX: delta.x * i,
            offsetY: delta.y * i,
            offsetZ: effectHeight,
            duration: i * progressTime,
            animatedOrigin: { x: 0, y: 0 },
          },
          [RENDERABLE]: { generation: 1 },
          [SPRITE]: levelProgress,
        });
        state.particles[`progress-${i}-${orientation}`] =
          world.getEntityId(progressParticle);
        const inverseParticle = entities.createFibre(world, {
          [ORIENTABLE]: { facing: orientation },
          [PARTICLE]: {
            offsetX: delta.x * -i,
            offsetY: delta.y * -i,
            offsetZ: effectHeight,
            duration: i * progressTime,
            animatedOrigin: { x: 0, y: 0 },
          },
          [RENDERABLE]: { generation: 1 },
          [SPRITE]: levelProgress,
        });
        state.particles[`progress-${i}-${orientation}-inverse`] =
          world.getEntityId(inverseParticle);
      }
    }

    updated = true;
  }

  if (!state.args.dropped && state.elapsed > progressParts * progressTime) {
    // move lines out of screen
    for (let i = 0; i < progressParts; i += 1) {
      for (const orientation of orientations) {
        const delta =
          orientationPoints[
            orientations[(orientations.indexOf(orientation) + 1) % 4]
          ];
        const progressParticle = world.assertByIdAndComponents(
          state.particles[`progress-${i}-${orientation}`],
          [PARTICLE]
        );
        const inverseParticle = world.assertByIdAndComponents(
          state.particles[`progress-${i}-${orientation}-inverse`],
          [PARTICLE]
        );

        if (delta.x === 0) {
          progressParticle[PARTICLE].offsetY = delta.y * progressParts;
          inverseParticle[PARTICLE].offsetY = delta.y * progressParts;
        } else {
          progressParticle[PARTICLE].offsetX = delta.x * progressParts;
          inverseParticle[PARTICLE].offsetX = delta.x * progressParts;
        }
        progressParticle[PARTICLE].duration = progressTime * progressParts * 2;
        inverseParticle[PARTICLE].duration = progressTime * progressParts * 2;
      }
    }

    // drop item stats
    const stats = [
      ...repeat("maxHp" as const, state.args.maxHp),
      ...repeat("maxMp" as const, state.args.maxMp),
    ];
    dropEntity(
      world,
      {
        [INVENTORY]: {
          items: stats.map((stat) =>
            world.getEntityId(
              entities.createItem(world, {
                [ITEM]: {
                  amount: 1,
                  stat,
                  carrier: -1,
                  bound: false,
                },
                [RENDERABLE]: { generation: 0 },
                [SPRITE]: getStatSprite(stat, "drop"),
              })
            )
          ),
        },
      },
      entity[POSITION],
      false,
      MAX_DROP_RADIUS,
      undefined,
      progressTime * 2
    );

    state.args.dropped = true;
    updated = true;
  }

  return { finished, updated };
};

const xpTime = 200;

export const acquireXp: Sequence<XpSequence> = (world, entity, state) => {
  const size = world.metadata.gameEntity[LEVEL].size;
  const heroEntity = getIdentifierAndComponents(world, "hero", [
    PLAYER,
    POSITION,
    STATS,
  ]);
  const generation = Math.floor(state.elapsed / xpTime);
  const particleLength = Object.keys(state.particles).length;

  let updated = false;
  let finished =
    !heroEntity || (state.args.generation > 0 && particleLength === 0);

  // create XP particles
  if (generation === 0 && particleLength === 0) {
    for (const orientation of orientations) {
      const delta = orientationPoints[orientation];
      const xpParticle = entities.createFibre(world, {
        [ORIENTABLE]: { facing: orientation },
        [PARTICLE]: {
          offsetX: delta.x * 2,
          offsetY: delta.y * 2,
          offsetZ: effectHeight,
          duration: xpTime * 2,
          animatedOrigin: { x: 0, y: 0 },
        },
        [RENDERABLE]: { generation: 1 },
        [SPRITE]: xpDot,
      });
      state.particles[`xp-${orientation}`] = world.getEntityId(xpParticle);
    }

    updated = true;
  }

  if (generation > 1 && generation > state.args.generation && heroEntity) {
    for (const particleName in state.particles) {
      const xpParticle = world.assertByIdAndComponents(
        state.particles[particleName],
        [PARTICLE]
      );
      const particlePosition = add(entity[POSITION], {
        x: xpParticle[PARTICLE].offsetX,
        y: xpParticle[PARTICLE].offsetY,
      });

      if (getDistance(heroEntity[POSITION], particlePosition, size) === 0) {
        // handle adding of XP
        heroEntity[STATS].xp += 1 / 4;
        rerenderEntity(world, heroEntity);

        // play sound
        play("xp", { delay: random(0, (heroEntity[STATS].xp % 1) * 75 + 75) });

        disposeEntity(world, xpParticle);
        delete state.particles[particleName];
      } else {
        // handle movement of particles
        const orientation = choice(
          ...relativeOrientations(world, particlePosition, heroEntity[POSITION])
        );
        const delta = orientationPoints[orientation];

        xpParticle[PARTICLE].duration = xpTime;
        xpParticle[PARTICLE].offsetX += delta.x;
        xpParticle[PARTICLE].offsetY += delta.y;
      }
    }

    state.args.generation = generation;
    updated = true;
  }

  if (finished && heroEntity) {
    heroEntity[PLAYER].xpReceived += 1;
  }

  return { finished, updated };
};

export const displayShop: Sequence<PopupSequence> = (world, entity, state) => {
  let updated = false;

  const heroEntity = getIdentifierAndComponents(world, "hero", [POSITION]);
  const icon = state.args.transaction === "craft" ? craft : shop;
  const content: Sprite[][] = [
    ...(entity[POPUP] as Popup).deals.map((deal) => {
      // swap direction when selling items
      const leftItem =
        state.args.transaction === "sell" ? deal.price[0] : deal.item;
      const rightItems =
        state.args.transaction === "sell" ? [deal.item] : deal.price;

      const itemSprite = getItemSprite(leftItem, "display");
      const itemText =
        heroEntity && canShop(world, heroEntity, deal)
          ? underline(createText(itemSprite.name))
          : createText(itemSprite.name, colors.grey);
      const prices = rightItems.map((price) => getActivationRow(price)).flat();
      const line = addBackground(
        [
          itemSprite,
          ...itemText,
          ...repeat(none, frameWidth - 4 - itemText.length - prices.length),
          ...prices,
        ],
        colors.black
      );

      // strike through if sold out
      const displayedLine = deal.stock > 0 ? line : strikethrough(line);

      // add placeholder on left for buy and right for sell
      if (state.args.transaction === "sell") {
        displayedLine.push(popupBackground);
      } else {
        displayedLine.unshift(popupBackground);
      }

      return displayedLine;
    }),
  ];

  const popupCenter = { x: 0, y: (frameHeight + 1) / -2 };
  const verticalIndex = entity[POPUP].verticalIndex;
  const selectionX =
    popupCenter.x +
    ((frameWidth - 3) / 2) * (state.args.transaction === "sell" ? 1 : -1);
  const selectionY = popupCenter.y - (frameHeight - 3) / 2;

  if (
    !state.particles.selection &&
    state.elapsed > popupTime + verticalIndex * (frameWidth - 2) * contentDelay
  ) {
    // add selection arrow
    const selectionParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: selectionX,
        offsetY: selectionY + verticalIndex,
        offsetZ: selectionHeight,
        animatedOrigin: { x: selectionX, y: -2 },
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]:
        state.args.transaction === "sell" ? sellSelection : buySelection,
    });
    state.particles.selection = world.getEntityId(selectionParticle);
  }

  if (verticalIndex !== state.args.verticalIndex && state.particles.selection) {
    const selectionParticle = world.assertByIdAndComponents(
      state.particles.selection,
      [PARTICLE]
    );
    selectionParticle[PARTICLE].offsetY = selectionY + verticalIndex;
    state.args.verticalIndex = verticalIndex;
    updated = true;
  }

  const popupResult = displayPopup(world, entity, state, icon, content);
  return {
    updated: popupResult.updated || updated,
    finished: popupResult.finished,
  };
};

export const displayInspect: Sequence<PopupSequence> = (
  world,
  entity,
  state
) => {
  let updated = false;
  const hasItems = entity[INVENTORY].items.length > 0;

  const content: Sprite[][] = hasItems
    ? [
        ...(entity[INVENTORY] as Inventory).items.map((item) => {
          const itemEntity = world.assertByIdAndComponents(item, [ITEM]);
          const itemSprite = getItemSprite(itemEntity[ITEM], "display");
          const consumption =
            itemEntity[ITEM].stackable &&
            stackableConsumptions[itemEntity[ITEM].stackable];
          const amountText = itemEntity[ITEM].equipment
            ? createText("(worn)")
            : createText(`${itemEntity[ITEM].amount}x`, colors.silver);
          const useText = consumption
            ? [
                ...createText(" ("),
                ...createCountable(
                  { [consumption.countable]: consumption.amount },
                  consumption.countable
                ),
                ...createText(")"),
              ]
            : [];
          const itemText = consumption
            ? underline(createText(itemSprite.name))
            : createText(itemSprite.name, colors.grey);
          return addBackground(
            [
              none,
              itemSprite,
              ...itemText,
              ...useText,
              ...repeat(
                none,
                frameWidth -
                  4 -
                  amountText.length -
                  itemText.length -
                  useText.length
              ),
              ...amountText,
            ],
            colors.black
          );
        }),
      ]
    : [createText("No items yet", colors.grey, colors.black)];

  const popupCenter = { x: 0, y: (frameHeight + 1) / -2 };
  const verticalIndex = Math.min(
    entity[POPUP].verticalIndex,
    entity[INVENTORY].items.length - 1
  );
  const selectionX =
    popupCenter.x +
    ((frameWidth - 3) / 2) * (state.args.transaction === "sell" ? 1 : -1);
  const selectionY = popupCenter.y - (frameHeight - 3) / 2;
  const scrollIndex = scrolledVerticalIndex(world, entity, state, content);

  if (
    !state.particles.selection &&
    state.elapsed > popupTime + scrollIndex * (frameWidth - 2) * contentDelay &&
    hasItems
  ) {
    // add selection arrow
    const selectionParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: selectionX,
        offsetY: selectionY + scrollIndex,
        offsetZ: selectionHeight,
        animatedOrigin: { x: selectionX, y: -2 },
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: buySelection,
    });
    state.particles.selection = world.getEntityId(selectionParticle);
  }

  // move selection
  if (
    verticalIndex !== state.args.verticalIndex &&
    state.particles.selection &&
    hasItems
  ) {
    const selectionParticle = world.assertByIdAndComponents(
      state.particles.selection,
      [PARTICLE]
    );
    selectionParticle[PARTICLE].offsetY = selectionY + scrollIndex;
    state.args.verticalIndex = verticalIndex;
    entity[POPUP].verticalIndex = verticalIndex;
    updated = true;
  }

  // delete selection
  if (state.particles.selection && !hasItems) {
    const selectionParticle = world.assertByIdAndComponents(
      state.particles.selection,
      [PARTICLE]
    );
    disposeEntity(world, selectionParticle);
    delete state.particles.selection;
    updated = true;
  }

  const popupResult = displayPopup(world, entity, state, info, content);
  return {
    updated: popupResult.updated || updated,
    finished: popupResult.finished,
  };
};

export const displayInfo: Sequence<InfoSequence> = (world, entity, state) => {
  let updated = false;

  const content: Sprite[][] = [
    ...(entity[POPUP] as Popup).lines.map((line) =>
      addBackground(
        [...line, ...repeat(none, frameWidth - 4 - line.length)],
        colors.black
      )
    ),
  ];

  const popupResult = displayPopup(
    world,
    entity,
    state,
    popupIdles[(entity[POPUP] as Popup).transaction],
    content
  );
  return {
    updated: popupResult.updated || updated,
    finished: popupResult.finished,
  };
};

export const displayQuest: Sequence<InfoSequence> = (world, entity, state) => {
  let updated = false;
  const popup = entity[POPUP] as Popup;
  const heroEntity = getIdentifierAndComponents(world, "hero", [POSITION]);

  const targets = popup.targets.map((target, index) => {
    const defeated = heroEntity && hasDefeated(world, heroEntity, target);
    const sprite = generateUnitData(target.unit).sprite;
    return [
      ...(index === 0 ? createText("DEFEAT:", colors.red) : repeat(none, 7)),
      ...(defeated ? strikethrough : id)([
        ...createText(target.amount.toString().padStart(2, " "), colors.silver),
        mergeSprites(sprite, hostileBar),
        ...createText(sprite.name, defeated ? colors.grey : colors.white),
        ...repeat(none, frameWidth - 2 - 7 - 3 - sprite.name.length),
      ]),
    ];
  });
  const gathers = popup.deals
    .map((deal) => {
      const gathered = heroEntity && canRedeem(world, heroEntity, deal);

      return deal.price.map((price, index) => {
        const name = getItemSprite(price).name;
        return addBackground(
          [
            ...(index === 0
              ? createText("GATHER:", colors.grey)
              : repeat(none, 7)),
            ...(gathered ? strikethrough : id)([
              ...getActivationRow(price),
              ...createText(name, gathered ? colors.grey : colors.white),
              ...repeat(none, frameWidth - 2 - 7 - 3 - name.length),
            ]),
          ],
          colors.black
        );
      });
    })
    .flat();
  const rewards = popup.deals.map((deal, index) => {
    const received = deal.stock === 0;
    return addBackground(
      [
        ...(index === 0 ? createText("REWARD:", colors.lime) : repeat(none, 7)),
        ...(received ? strikethrough : id)([
          ...getActivationRow(deal.item),
          ...createText(
            getItemSprite(deal.item).name,
            received ? colors.grey : colors.white
          ),
        ]),
      ],
      colors.black
    );
  });

  const content: Sprite[][] = [
    ...(entity[POPUP] as Popup).lines.map((line) =>
      addBackground(
        [...line, ...repeat(none, frameWidth - 4 - line.length)],
        colors.black
      )
    ),
    ...repeat(
      [],
      frameHeight -
        2 -
        entity[POPUP].lines.length -
        targets.length -
        gathers.length -
        rewards.length
    ),
    ...targets,
    ...gathers,
    ...rewards,
  ];

  const popupResult = displayPopup(
    world,
    entity,
    state,
    popupIdles[(entity[POPUP] as Popup).transaction],
    content
  );
  return {
    updated: popupResult.updated || updated,
    finished: popupResult.finished,
  };
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
const waveSprites = {
  wild: wave,
  default: defaultWave,
  fire: fireWave,
  water: waterWave,
  earth: earthWave,
};
const waveCornerSprites = {
  wild: waveCorner,
  default: defaultWaveCorner,
  fire: fireWaveCorner,
  water: waterWaveCorner,
  earth: earthWaveCorner,
};

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
          amount: 1,
          duration: waveSpeed,
          animatedOrigin: { x: 0, y: 0 },
        },
        [RENDERABLE]: { generation: 1 },
        [SPRITE]: waveSprites[state.args.element],
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
            amount: 1,
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
            amount: 1,
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
            amount: 1,
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
            amount: 1,
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

      if (waveParticle[SPRITE] === waveCornerSprites[state.args.element])
        continue;

      waveParticle[SPRITE] = waveCornerSprites[state.args.element];
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

const burnTicks = 4;

export const fireBurn: Sequence<BurnSequence> = (world, entity, state) => {
  const isTerrainBurning = entity[BURNABLE]?.burning;
  const isUnitBurning = entity[AFFECTABLE]?.burn > 0;
  const isBurning = isTerrainBurning || isUnitBurning;
  const isEternalFire = entity[BURNABLE]?.eternal;
  const fireTick = world.metadata.gameEntity[REFERENCE].tick;
  const burnGeneration = Math.ceil(state.elapsed / fireTick);
  const worldGeneration = world.metadata.gameEntity[RENDERABLE].generation;
  const heroEntity = getIdentifierAndComponents(world, "hero", [POSITION]);
  const size = world.metadata.gameEntity[LEVEL].size;

  let updated = false;
  let finished = !isBurning;

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
  const burnFactor =
    entity[FRAGMENT]?.structure && entity[BURNABLE]?.remains
      ? 5
      : entity[FRAGMENT]?.structure || entity[BURNABLE]?.remains
      ? 3
      : 1;
  if (
    isEternalFire &&
    isTerrainBurning &&
    !state.args.castable &&
    !state.args.exertable
  ) {
    const spellEntity = entities.createSpell(world, {
      [BELONGABLE]: { faction: "nature" },
      [CASTABLE]: {
        affected: {},
        damage: 0,
        burn: 2,
        freeze: 0,
        heal: 0,
        caster: world.getEntityId(entity),
        medium: "true",
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
    !isTerrainBurning &&
    state.args.castable &&
    state.args.exertable
  ) {
    finished = true;
  } else if (
    !isEternalFire &&
    isTerrainBurning &&
    burnGeneration > 3 * burnFactor &&
    state.args.generation !== worldGeneration &&
    (random(0, 2 * burnFactor) === 0 || burnGeneration > 6 * burnFactor)
  ) {
    // combust organic material
    entity[BURNABLE].combusted = true;
    entity[BURNABLE].burning = false;
    finished = true;
  }

  if (finished && state.args.castable && state.args.exertable) {
    // deactivate eternal fire AoE
    disposeEntity(world, world.assertById(state.args.castable));
    delete state.args.castable;
    disposeEntity(world, world.assertById(state.args.exertable));
    delete state.args.exertable;
  }

  let generation;

  // synchronize generation tick
  if (isUnitBurning) {
    state.args.lastTick = burnGeneration;
    generation = state.args.lastTick;
  } else if (isTerrainBurning) {
    generation = worldGeneration;
  }

  // animate particle
  if (generation && isBurning && generation !== state.args.generation) {
    state.args.generation = generation;
    const fireParticle = world.assertByIdAndComponents(state.particles.fire, [
      PARTICLE,
    ]);
    const amount = fireParticle[PARTICLE].amount;
    fireParticle[PARTICLE].amount =
      amount === 2 ? [1, 3][distribution(40, 60)] : 2;
    updated = true;

    // handle damage
    if (isUnitBurning) {
      const castableEntity = getExertables(world, entity[POSITION]).map(
        (exertable) =>
          world.getEntityByIdAndComponents(exertable[EXERTABLE].castable, [
            CASTABLE,
          ])
      )[0];
      const fireEntity = world.getEntityByIdAndComponents(
        castableEntity?.[CASTABLE].caster,
        [BURNABLE]
      );
      const isInEternalFire =
        fireEntity?.[BURNABLE].eternal &&
        castableEntity?.[CASTABLE] &&
        castableEntity[CASTABLE].burn > 0;

      // fast tick while standing in fire or every N ticks
      if (
        isInEternalFire ||
        generation - (state.args.lastDot || 0) >= burnTicks
      ) {
        state.args.lastDot = generation;
        entity[AFFECTABLE].dot += 1;

        if (!isInEternalFire) {
          entity[AFFECTABLE].burn -= 1;
        }
      }
    }

    // play sounds
    const distance = heroEntity
      ? getDistance(heroEntity[POSITION], entity[POSITION], size) + 1
      : 3;
    if (distance < 10) {
      const proximity = 1 / distance;

      if (isEternalFire || isUnitBurning || random(0, 3) === 0) {
        play("fire", { proximity, delay: random(0, 175) });
      }

      if (random(0, 2) === 0) {
        play("crackle", {
          proximity,
          delay: random(0, 350),
          intensity: random(1, 10),
        });
      }
    }
  }

  return { finished, updated };
};

export const unitFreeze: Sequence<FreezeSequence> = (world, entity, state) => {
  const freezeTick = world.metadata.gameEntity[REFERENCE].tick;
  const freezeGeneration = Math.floor(state.elapsed / freezeTick);
  const freezeFactor = Math.ceil(
    lerp(state.args.total, 0, freezeGeneration / state.args.total)
  );
  const particleAmount = Math.round(
    lerp(3, 1, freezeGeneration / (state.args.total - 1))
  );

  // reduce freeze counter
  if (entity[AFFECTABLE].freeze > freezeFactor) {
    entity[AFFECTABLE].freeze = freezeFactor;
  }
  const isFrozen = entity[AFFECTABLE].freeze > 0;

  let updated = false;
  let finished = !isFrozen;

  if (isFrozen && !state.particles.freeze) {
    // create freeze particle
    const freezeParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: 0,
        offsetY: 0,
        offsetZ: particleHeight,
        amount: particleAmount,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: freeze,
    });
    state.particles.freeze = world.getEntityId(freezeParticle);

    updated = true;
  } else if (!isFrozen && state.particles.freeze) {
    // remove frozen particle
    disposeEntity(world, world.assertById(state.particles.freeze));
    delete state.particles.freeze;
    updated = true;
  }

  // update particle amount
  if (isFrozen) {
    const freezeParticle = world.assertByIdAndComponents(
      state.particles.freeze,
      [PARTICLE]
    );
    const amount = freezeParticle[PARTICLE].amount;

    if (amount !== particleAmount) {
      freezeParticle[PARTICLE].amount = particleAmount;
      updated = true;
    }
  }

  return { finished, updated };
};

export const smokeWind: Sequence<SmokeSequence> = (world, entity, state) => {
  const isBurning = entity[BURNABLE]?.burning || entity[AFFECTABLE]?.burn > 0;
  const isEternalFire = entity[BURNABLE]?.eternal;
  const isExtinguishing = state.args.extinguish > 0;
  const generation = world.metadata.gameEntity[RENDERABLE].generation;

  let updated = false;
  let finished =
    !isBurning && !isExtinguishing && Object.keys(state.particles).length === 0;

  if (generation !== state.args.generation) {
    state.args.generation = generation;

    // add smoke
    if (
      isExtinguishing ||
      (isBurning &&
        random(
          0,
          Object.keys(state.particles).length + (isEternalFire ? 0 : 4)
        ) <= 1)
    ) {
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
      if (isExtinguishing) state.args.extinguish -= 1;
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
        const { offsetX, offsetY } = smokeParticle[PARTICLE];
        smokeParticle[PARTICLE].animatedOrigin = { x: offsetX, y: offsetY };
        smokeParticle[PARTICLE].offsetY -= 1;
        smokeParticle[PARTICLE].offsetX += wind;

        const distance = smokeParticle[PARTICLE].offsetY * -1;
        const amount = smokeParticle[PARTICLE].amount || 1;
        if (random(0, 2) < distance - amount) {
          smokeParticle[PARTICLE].amount = Math.max(
            0,
            amount === 2 ? 0 : amount - random(1, 2)
          );
        }

        // remove depleted smoke
        if (smokeParticle[PARTICLE].amount === 0) {
          disposeEntity(world, smokeParticle);
          delete state.particles[particleName];
        }

        updated = true;
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
      [SPRITE]: getItemSprite(state.args.item),
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
  const lootDelay = getLootDelay(world, entity, distance);

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
      addToInventory(world, entity, itemEntity, false, state.args.amount);
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
    } else if (entity[PLAYER] && consumptionConfig.countable === "mp") {
      entity[PLAYER].manaReceived += consumptionConfig.amount;
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
  const compassEntity = getIdentifierAndComponents(world, "compass", [ITEM]);

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

const focusSpeed = 200;

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
  const isActive = !!entity[FOCUSABLE].target && !!entity[FOCUSABLE].highlight;

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
  const heroEntity = getIdentifierAndComponents(world, "hero", [POSITION]);

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
    state.elapsed / charDelay > totalLength * 1.5 + 25;
  const isCloseBy =
    isAdjacent &&
    !!heroEntity &&
    !isDead(world, heroEntity) &&
    !isInPopup(world, heroEntity) &&
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
  const highlight = highlighEntity?.[FOCUSABLE].highlight;
  const targetEntity = world.getEntityByIdAndComponents(targetId, [POSITION]);

  if (!state.args.lastOrientation && (!highlighEntity || !targetEntity)) {
    return { updated, finished };
  }

  // create pointer particle
  if (!state.particles.pointer && highlight) {
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
      [SPRITE]: pointers[highlight],
    });
    state.particles.pointer = world.getEntityId(pointerParticle);
    updated = true;
  }

  const pointerParticle = world.assertByIdAndComponents(
    state.particles.pointer,
    [ORIENTABLE, PARTICLE]
  );

  // update pointer highlight
  if (highlight && pointerParticle[SPRITE] !== pointers[highlight]) {
    pointerParticle[SPRITE] = pointers[highlight];
    updated = true;
  }

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
      pointerParticle[PARTICLE].offsetX = delta.x * 7;
      pointerParticle[PARTICLE].offsetY = delta.y * 4;
      pointerParticle[ORIENTABLE].facing = invertedOrientation;
      state.args.lastOrientation = invertedOrientation;
      state.args.target = targetId;
      updated = true;
    }
  }

  return { finished, updated };
};
