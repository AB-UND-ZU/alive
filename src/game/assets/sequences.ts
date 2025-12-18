import {
  decayHeight,
  dialogHeight,
  effectHeight,
  floatHeight,
  focusHeight,
  fogHeight,
  idleHeight,
  immersibleHeight,
  lootHeight,
  particleHeight,
  tooltipHeight,
  transientHeight,
} from "../../components/Entity/utils";
import { entities } from "../../engine";
import { DROPPABLE } from "../../engine/components/droppable";
import { Equipment, EQUIPPABLE } from "../../engine/components/equippable";
import { Focusable, FOCUSABLE } from "../../engine/components/focusable";
import { Inventory, INVENTORY } from "../../engine/components/inventory";
import { ITEM, ItemStats } from "../../engine/components/item";
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
import {
  calculateHealing,
  getEntityStats,
  isDead,
} from "../../engine/systems/damage";
import {
  disposeEntity,
  moveEntity,
  registerEntity,
} from "../../engine/systems/map";
import { rerenderEntity } from "../../engine/systems/renderer";
import { canWarp, openDoor } from "../../engine/systems/trigger";
import { brighten, colors, darken, recolor } from "../../game/assets/colors";
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
  reversed,
  shuffle,
  signedDistance,
} from "../math/std";
import { iterations, reversedIterations } from "../math/tracing";
import {
  bubble,
  createDialog,
  createText,
  decay,
  fire,
  ghost,
  none,
  getMaxCounter,
  potion,
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
  fireBeam,
  waterBeam,
  earthBeam,
  freeze,
  airBeam,
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
  crackle,
  keyHole,
  portalBackdrop,
  portalEntered,
  fountain,
  fountainDrop,
  fountainHeal,
  fountainHealing,
  meleeHit,
  magicHit,
  getStatColor,
  woodEdge,
  ironEdge,
  goldEdge,
  diamondEdge,
  rubyEdge,
  woodBeam,
  ironBeam,
  goldBeam,
  diamondBeam,
  rubyBeam,
  woodWave,
  woodAirWave,
  woodFireWave,
  woodWaterWave,
  woodEarthWave,
  woodWaveCorner,
  woodAirWaveCorner,
  woodFireWaveCorner,
  woodWaterWaveCorner,
  woodEarthWaveCorner,
  missing,
  swordSlot,
  shieldSlot,
  ringSlot,
  amuletSlot,
  compassSlot,
  torchSlot,
  goldSlashSide,
  diamondSlashSide,
  rubySlashSide,
  goldSlashCorner,
  diamondSlashCorner,
  rubySlashCorner,
  primarySlot,
  secondarySlot,
  dotted,
  times,
  shaded,
  delay,
  addForeground,
  popupActive,
  bottle,
  elixir,
  popupBlocked,
  star,
  discovery,
  parseSprite,
  colorToCode,
  blocked,
  chief,
  diamondGem,
  snowflake,
} from "./sprites";
import {
  ArrowSequence,
  BubbleSequence,
  BurnSequence,
  CollectSequence,
  ConsumeSequence,
  DecaySequence,
  DialogSequence,
  DiscoverySequence,
  DisposeSequence,
  FocusSequence,
  FountainSequence,
  FreezeSequence,
  MarkerSequence,
  MeleeSequence,
  Message,
  MessageSequence,
  PerishSequence,
  PointerSequence,
  PopupSequence,
  ProgressSequence,
  DropSequence,
  ReviveSequence,
  SEQUENCABLE,
  Sequence,
  SlashSequence,
  SmokeSequence,
  SpellSequence,
  UnlockSequence,
  VisionSequence,
  VortexSequence,
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
import {
  invertOrientation,
  relativeOrientations,
  rotateOrientation,
} from "../math/path";
import { EXERTABLE } from "../../engine/components/exertable";
import {
  consumptionConfigs,
  getItemConsumption,
} from "../../engine/systems/consume";
import {
  decayTime,
  renderPopup,
  frameHeight,
  frameWidth,
  getItemDescription,
  getItemSprite,
  getLootDelay,
  scrolledVerticalIndex,
  getEntityDescription,
  entitySprites,
} from "./utils";
import { isImmersible } from "../../engine/systems/immersion";
import { PLAYER } from "../../engine/components/player";
import { BELONGABLE } from "../../engine/components/belongable";
import {
  CASTABLE,
  DamageType,
  getEmptyCastable,
} from "../../engine/components/castable";
import { BURNABLE } from "../../engine/components/burnable";
import { AFFECTABLE } from "../../engine/components/affectable";
import {
  getExertables,
  getParticleAmount,
  hasTriggered,
} from "../../engine/systems/magic";
import { FRAGMENT } from "../../engine/components/fragment";
import { Popup, POPUP } from "../../engine/components/popup";
import { getActivationRow } from "../../components/Controls";
import {
  canRedeem,
  canSell,
  canShop,
  gearSlots,
  getTab,
  getTabSelections,
  getVerticalIndex,
  hasDefeated,
  isInPopup,
  matchesItem,
  missingFunds,
  popupIdles,
  visibleStats,
} from "../../engine/systems/popup";
import { getIdentifierAndComponents } from "../../engine/utils";
import { generateUnitData } from "../balancing/units";
import { play } from "../sound";
import { extinguishEntity } from "../../engine/systems/burn";
import {
  alienPixels,
  bodyPixels,
  centerSprites,
  knightPixels,
  magePixels,
  materialElementColors,
  overlay,
  pixelFrame,
  recolorPixels,
  recolorSprite,
  roguePixels,
  shieldElementPixels,
  shieldPixels,
  swordElementPixels,
  swordPixels,
} from "./pixels";
import { getItemSellPrice } from "../balancing/trading";
import { getForgeOptions, getForgeStatus } from "../balancing/forging";
import { getItemDiff } from "../balancing/equipment";
import { getCraftingDeal } from "../balancing/crafting";
import { isInside, onSameLayer } from "../../engine/systems/enter";
import { Spawnable, SPAWNABLE } from "../../engine/components/spawnable";
import { classes, ClassKey } from "../balancing/classes";
import { getSelectedLevel, levelConfig } from "../levels";

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
  gold: goldSlashSide,
  diamond: diamondSlashSide,
  ruby: rubySlashSide,
};
const slashCornerSprites = {
  wood: woodSlashCorner,
  iron: ironSlashCorner,
  gold: goldSlashCorner,
  diamond: diamondSlashCorner,
  ruby: rubySlashCorner,
};
const slashInverse = true;

export const chargeSlash: Sequence<SlashSequence> = (world, entity, state) => {
  // TODO: resolve circular dependencies and move outside of handler
  const slashIterations = slashInverse
    ? [...iterations.slice(1), ...iterations.slice(0, 3)]
    : [...reversedIterations.slice(2), ...reversedIterations.slice(0, 2)];
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
        ? add(
            slashIteration.direction,
            slashInverse
              ? slashIteration.normal
              : {
                  x: -slashIteration.normal.x,
                  y: -slashIteration.normal.y,
                }
          )
        : slashIteration.direction;
      const slashParticle = entities.createFibre(world, {
        [ORIENTABLE]: {
          facing:
            particleIndex === 0 && slashInverse
              ? undefined
              : !slashInverse || !isCorner
              ? slashIteration.orientation
              : rotateOrientation(slashIteration.orientation, 1),
        },
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
              : add(
                  slashIteration.direction,
                  slashInverse
                    ? {
                        x: -slashIteration.normal.x,
                        y: -slashIteration.normal.y,
                      }
                    : slashIteration.normal
                ),
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
const beamTicks = 3;
const edgeSprites = {
  wood: woodEdge,
  iron: ironEdge,
  gold: goldEdge,
  diamond: diamondEdge,
  ruby: rubyEdge,
};
const beamSprites = {
  wood: woodBeam,
  iron: ironBeam,
  gold: goldBeam,
  diamond: diamondBeam,
  ruby: rubyBeam,
  air: airBeam,
  fire: fireBeam,
  water: waterBeam,
  earth: earthBeam,
};

export const castBeam1: Sequence<SpellSequence> = (world, entity, state) => {
  const entityId = world.getEntityId(entity);
  const progress = Math.ceil(state.elapsed / beamSpeed);
  const delta = orientationPoints[entity[ORIENTABLE].facing as Orientation];
  const material = state.args.material;
  const element = state.args.element || material;
  const limit = {
    x: delta.x * state.args.range,
    y: delta.y * state.args.range,
  };

  let finished = progress > state.args.duration;
  let updated = false;

  // create edge particles
  if (!state.particles.start) {
    const startParticle = entities.createFibre(world, {
      [ORIENTABLE]: { facing: entity[ORIENTABLE].facing },
      [PARTICLE]: {
        offsetX: limit.x,
        offsetY: limit.y,
        offsetZ: particleHeight,
        duration: beamSpeed * state.args.range,
        animatedOrigin: { x: 0, y: 0 },
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: edgeSprites[material],
    });
    state.particles.start = world.getEntityId(startParticle);

    const endParticle = entities.createFibre(world, {
      [ORIENTABLE]: { facing: invertOrientation(entity[ORIENTABLE].facing) },
      [PARTICLE]: {
        offsetX: delta.x,
        offsetY: delta.y,
        offsetZ: particleHeight,
        duration: beamSpeed,
        animatedOrigin: { x: 0, y: 0 },
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: edgeSprites[material],
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

  if (state.args.progress !== progress && progress > 2) {
    // create bolts
    if (
      progress <= state.args.duration - state.args.range &&
      (progress - 1) % beamTicks === 0
    ) {
      const beamParticle = entities.createParticle(world, {
        [PARTICLE]: {
          offsetX: limit.x,
          offsetY: limit.y,
          offsetZ: particleHeight,
          duration: beamSpeed * (state.args.range - 1),
          amount: 2,
          animatedOrigin: copy(delta),
        },
        [RENDERABLE]: { generation: 1 },
        [SPRITE]: beamSprites[element],
      });

      state.particles[`bolt-${progress}`] = world.getEntityId(beamParticle);
    }

    updated = true;
  }

  // move particles
  if (state.args.progress !== progress) {
    for (const particleName in state.particles) {
      const particleEntity = world.assertByIdAndComponents(
        state.particles[particleName],
        [PARTICLE]
      );

      // delete particle if reaching range limit
      const particleProgress = particleName.startsWith("bolt")
        ? progress - parseInt(particleName.split("-")[1])
        : 0;
      if (particleProgress >= state.args.range) {
        if (particleName.startsWith("bolt")) {
          disposeEntity(world, particleEntity);
          delete state.particles[particleName];
          updated = true;
        }
        continue;
      }

      // move end separately
      if (
        particleName === "end" &&
        progress > state.args.duration - state.args.range &&
        particleEntity[PARTICLE].duration === beamSpeed
      ) {
        particleEntity[PARTICLE].offsetX = limit.x;
        particleEntity[PARTICLE].offsetY = limit.y;
        particleEntity[PARTICLE].duration = beamSpeed * (state.args.range - 1);
        updated = true;
      }
    }

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
const markerType: Record<DamageType, Sprite> = {
  melee: meleeHit,
  magic: magicHit,
  true: heal,
};

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
      [SPRITE]: markerType[state.args.type],
    });
    state.particles.marker = world.getEntityId(markerParticle);
  }

  if (state.elapsed > markerTime && state.particles.marker) {
    disposeEntity(world, world.assertById(state.particles.marker));
    delete state.particles.marker;
  }

  return { finished, updated };
};

const messageDuration = 600;

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
      const inPopup = isInPopup(world, entity);

      // mark message as executing
      message.stack = state.args.index;
      state.args.index += 1;

      const line = inPopup
        ? addBackground(message.line, colors.black)
        : message.line;

      line.forEach((char, index) => {
        const charParticle = entities.createParticle(world, {
          [PARTICLE]: {
            offsetX: index - Math.floor(message.line.length / 2),
            offsetY: message.orientation === "down" ? 4 : -4,
            offsetZ: transientHeight,
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

const rainSpeed = 50;
// const rainDepth = 15;

export const rainDropPixelated: Sequence<DropSequence> = (
  world,
  entity,
  state
) => {
  // const parallaxFactor = clamp(state.args.parallax, -rainDepth, rainDepth) / rainDepth;
  const perceivedSpeed = rainSpeed; //* (1 - parallaxFactor / 3)

  let updated = false;
  let finished = state.elapsed > state.args.height * perceivedSpeed;

  // create rain particle
  if (!state.particles.first) {
    const firstDrop = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: 0,
        offsetY: -state.args.height,
        offsetZ: fogHeight,
        amount: 1,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: rain,
    });
    state.particles.first = world.getEntityId(firstDrop);

    const secondDrop = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: 0,
        offsetY: 1 - state.args.height,
        offsetZ: fogHeight,
        amount: 0,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: rain,
    });
    state.particles.second = world.getEntityId(secondDrop);

    updated = true;
  }

  // move rain particle
  const firstParticle = world.assertByIdAndComponents(state.particles.first, [
    PARTICLE,
  ]);
  const secondParticle = world.assertByIdAndComponents(state.particles.second, [
    PARTICLE,
  ]);
  const doubleHeight =
    Math.floor((state.elapsed * 2) / perceivedSpeed) -
    state.args.height * 2 -
    1;
  const offsetY = Math.floor(doubleHeight / 2);

  if (firstParticle[PARTICLE].offsetY !== offsetY) {
    firstParticle[PARTICLE].offsetY = offsetY;
    secondParticle[PARTICLE].offsetY = offsetY + 1;
    updated = true;
  }

  const secondAmount = normalize(doubleHeight, 2);
  if (secondParticle[PARTICLE].amount !== secondAmount) {
    secondParticle[PARTICLE].amount = secondAmount;
    updated = true;
  }

  return { finished, updated };
};

const weatherConfigs: Record<
  DropSequence["type"],
  { sprite: Sprite; speed: number }
> = {
  rain: {
    sprite: rain,
    speed: 50,
  },
  snow: {
    sprite: snowflake,
    speed: 300,
  },
};
export const weatherDrop: Sequence<DropSequence> = (world, entity, state) => {
  let updated = false;
  const weatherConfig = weatherConfigs[state.args.type];
  const adjustedRainSpeed = state.args.fast
    ? weatherConfig.speed
    : weatherConfig.speed * 2;
  let finished = state.elapsed > state.args.height * adjustedRainSpeed;

  // create rain particle
  if (!state.particles.drop) {
    const dropParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: 0,
        offsetY: 0,
        offsetZ: fogHeight,
        amount: distribution(50, 30, 20) + 1,
        animatedOrigin: { x: 0, y: -state.args.height },
        duration: state.args.height * adjustedRainSpeed,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: weatherConfig.sprite,
    });
    state.particles.drop = world.getEntityId(dropParticle);
    updated = true;
  }

  return { finished, updated };
};

const progressParts = 17;
const progressTime = 60;

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
            offsetZ: particleHeight,
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
            offsetZ: particleHeight,
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

    // add item stats
    if (state.args.maxHp) {
      entity[STATS].maxHp = Math.min(
        entity[STATS].maxHpCap,
        entity[STATS].maxHp + state.args.maxHp
      );
      entity[PLAYER].receivedStats.maxHp += state.args.maxHp;
    }
    if (state.args.maxMp) {
      entity[STATS].maxMp = Math.min(
        entity[STATS].maxMpCap,
        entity[STATS].maxMp + state.args.maxMp
      );
      entity[PLAYER].receivedStats.maxMp += state.args.maxMp;
    }

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
    heroEntity[PLAYER].receivedStats.xp += 1;
  }

  return { finished, updated };
};

export const displayPopup: Sequence<PopupSequence> = (world, entity, state) => {
  const transaction = getTab(world, entity);
  let handler: Sequence<PopupSequence> = displayInfo;

  if (transaction === "buy") {
    handler = displayBuy;
  } else if (transaction === "sell") {
    handler = displaySell;
  } else if (transaction === "forge") {
    handler = displayForge;
  } else if (transaction === "craft") {
    handler = displayCraft;
  } else if (transaction === "quest") {
    handler = displayQuest;
  } else if (transaction === "inspect") {
    handler = displayInspect;
  } else if (transaction === "stats") {
    handler = displayStats;
  } else if (transaction === "gear") {
    handler = displayGear;
  } else if (transaction === "class") {
    handler = displayClass;
  } else if (transaction === "warp") {
    handler = displayWarp;
  }

  return handler(world, entity, state);
};

export const displayBuy: Sequence<PopupSequence> = (world, entity, state) => {
  const heroEntity = getIdentifierAndComponents(world, "hero", [POSITION]);
  const icon = shop;
  const verticalIndex = getVerticalIndex(world, entity);
  const inventoryItems = heroEntity
    ? (heroEntity[INVENTORY] as Inventory).items.map((itemId) =>
        world.assertByIdAndComponents(itemId, [ITEM])
      )
    : [];
  const deals = (entity[POPUP] as Popup).deals;

  const content: Sprite[][] =
    heroEntity && deals.length > 0
      ? deals.map((deal, rowIndex) => {
          const buyItem = deal.item;
          const priceItem = deal.prices[0];
          const selected = verticalIndex === rowIndex;
          const inStock = deal.stock > 0;
          const shoppable = canShop(world, heroEntity, deal);

          const itemSprite = getItemSprite(buyItem, "display");
          const textColor = selected && inStock ? colors.white : colors.grey;
          const itemText = createText(itemSprite.name, textColor);
          const inventoryAmount =
            inventoryItems.find((item) =>
              matchesItem(world, priceItem, item[ITEM])
            )?.[ITEM].amount || 0;
          const amountText =
            selected && inStock
              ? [
                  ...createText(`${inventoryAmount}`),
                  ...createText("/", colors.silver),
                  ...createText(`${priceItem.amount}`),
                ]
              : createText(`${priceItem.amount}`, colors.grey);
          const priceSprite = getItemSprite(priceItem, "display");
          const line = [
            ...itemText,
            ...repeat(
              none,
              frameWidth - 5 - itemText.length - amountText.length
            ),
            ...amountText,
          ];
          const displayedLine = [
            itemSprite,
            ...(selected
              ? shoppable
                ? shaded(line, colors.green, "▄")
                : inStock
                ? shaded(line, colors.grey)
                : dotted(line, colors.red)
              : line),
            priceSprite,
          ];

          return [
            none,
            ...(inStock ? displayedLine : strikethrough(displayedLine)),
          ];
        })
      : [createText("Nothing to buy", colors.grey)];
  const selectedDeal = deals[verticalIndex];
  const shoppable =
    selectedDeal && heroEntity && canShop(world, heroEntity, selectedDeal);
  const selectedOutOfStock = selectedDeal?.stock === 0;
  const details = selectedOutOfStock
    ? [createText("Out of stock", colors.grey)]
    : selectedDeal
    ? getItemDescription(selectedDeal.item)
    : undefined;

  const popupResult = renderPopup(
    world,
    entity,
    state,
    icon,
    content,
    deals.length === 0
      ? undefined
      : selectedDeal?.stock === 0
      ? "blocked"
      : shoppable
      ? "active"
      : "selected",
    details
  );
  return {
    updated: popupResult.updated,
    finished: popupResult.finished,
  };
};

export const displaySell: Sequence<PopupSequence> = (world, entity, state) => {
  const heroEntity = getIdentifierAndComponents(world, "hero", [POSITION]);
  const inventoryItems = heroEntity
    ? (heroEntity[INVENTORY] as Inventory).items.map((itemId) =>
        world.assertByIdAndComponents(itemId, [ITEM])
      )
    : [];
  const hasItems = inventoryItems.length > 0;
  const verticalIndex = getVerticalIndex(world, entity);

  const content: Sprite[][] = hasItems
    ? inventoryItems.map((itemEntity, rowIndex) => {
        const selected = verticalIndex === rowIndex;
        const itemSprite = getItemSprite(itemEntity[ITEM], "display");
        const sellPrice = getItemSellPrice(itemEntity[ITEM])[0];
        const sellable = canSell(world, itemEntity[ITEM]);
        const textColor = selected ? colors.white : colors.grey;

        const amountText = [
          ...createText(`${itemEntity[ITEM].amount}`, textColor),
          recolorSprite(times, {
            [colors.white]: textColor,
            [colors.black]: selected && sellable ? colors.green : colors.black,
          }),
        ];
        const rewardText = sellable
          ? [
              ...createText("\u0119", colors.lime),
              ...createText(`${sellPrice.amount}`, textColor),
              getItemSprite(sellPrice),
            ]
          : [];
        const itemText = createText(itemSprite.name, textColor);
        const line = [
          ...itemText,
          ...rewardText,
          ...repeat(
            none,
            frameWidth -
              4 -
              amountText.length -
              itemText.length -
              rewardText.length
          ),
          ...amountText,
        ];

        return [
          none,
          itemSprite,
          ...(selected
            ? sellable
              ? shaded(line, colors.green, "▄")
              : dotted(line, colors.red)
            : line),
        ];
      })
    : [createText("Nothing to sell", colors.grey)];

  const selectedItem = inventoryItems[verticalIndex];
  const sellable = selectedItem && canSell(world, selectedItem[ITEM]);
  const details = sellable
    ? getItemDescription(selectedItem[ITEM])
    : selectedItem
    ? [
        createText("Not able to sell", colors.grey),
        createText(
          getItemSprite(selectedItem[ITEM]).name.toLowerCase(),
          colors.grey
        ),
      ]
    : undefined;

  const popupResult = renderPopup(
    world,
    entity,
    state,
    info,
    content,
    !hasItems ? undefined : selectedItem && sellable ? "active" : "blocked",
    details
  );

  return {
    updated: popupResult.updated,
    finished: popupResult.finished,
  };
};

export const displayInspect: Sequence<PopupSequence> = (
  world,
  entity,
  state
) => {
  const bagItems = (entity[INVENTORY] as Inventory).items.filter(
    (item) => !world.assertByIdAndComponents(item, [ITEM])[ITEM].equipment
  );
  const hasItems = bagItems.length > 0;
  const verticalIndex = getVerticalIndex(world, entity);

  const content: Sprite[][] = hasItems
    ? bagItems.map((item, rowIndex) => {
        const itemEntity = world.assertByIdAndComponents(item, [ITEM]);

        if (itemEntity[ITEM].equipment) {
          return [];
        }

        const selected = verticalIndex === rowIndex;
        const itemConsumption = getItemConsumption(world, itemEntity);
        const consumptionConfig =
          itemEntity &&
          consumptionConfigs[itemEntity[ITEM].consume!]?.[
            itemEntity[ITEM].material!
          ]?.[itemEntity[ITEM].element!];

        const itemSprite = getItemSprite(itemEntity[ITEM], "display");
        const consumptionColor =
          (itemConsumption && getStatColor(itemConsumption.countable)) ||
          (consumptionConfig && getStatColor(consumptionConfig.countable));
        const textColor = selected ? colors.white : colors.grey;

        const amountText = [
          ...createText(`${itemEntity[ITEM].amount}`, textColor),
          recolorSprite(times, {
            [colors.white]: textColor,
            [colors.black]: selected ? darken(consumptionColor) : colors.black,
          }),
        ];
        const consumptionText = itemConsumption
          ? createCountable(
              { [itemConsumption.countable]: itemConsumption.amount },
              itemConsumption.countable
            )
          : consumptionConfig
          ? createCountable(
              { [consumptionConfig.countable]: consumptionConfig.amount },
              consumptionConfig.countable
            )
          : [];
        const useText = itemConsumption
          ? [...createText("\u0119", colors.lime), ...consumptionText]
          : consumptionConfig
          ? [delay, ...consumptionText]
          : [];
        const itemText = createText(itemSprite.name, textColor);
        const line = [
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
        ];

        return [
          none,
          itemSprite,
          ...(selected
            ? itemConsumption
              ? shaded(line, darken(consumptionColor), "▄")
              : consumptionConfig
              ? shaded(line, darken(consumptionColor))
              : shaded(line, colors.grey)
            : line),
        ];
      })
    : [createText("No items yet", colors.grey)];

  const selectedItem = world.getEntityByIdAndComponents(
    bagItems[verticalIndex],
    [ITEM]
  );
  const details = selectedItem && getItemDescription(selectedItem[ITEM]);

  const popupResult = renderPopup(
    world,
    entity,
    state,
    info,
    content,
    selectedItem && getItemConsumption(world, selectedItem)
      ? "active"
      : hasItems
      ? "selected"
      : undefined,
    details
  );
  return {
    updated: popupResult.updated,
    finished: popupResult.finished,
  };
};

export const displayStats: Sequence<PopupSequence> = (world, entity, state) => {
  const heroStats = getEntityStats(world, entity);
  const verticalIndex = getVerticalIndex(world, entity);
  const content: Sprite[][] = visibleStats.map((stat, rowIndex) => {
    const selected = verticalIndex === rowIndex;
    const statSprite = getStatSprite(stat);
    const statColor = getStatColor(stat);
    const statText = createText(
      statSprite.name,
      selected ? brighten(statColor) : statColor
    );
    const amountText = createText(
      heroStats[stat].toString(),
      selected ? colors.white : colors.grey
    );

    const line = [
      ...statText,
      ...repeat(none, frameWidth - 4 - statText.length - amountText.length),
      ...amountText,
    ];
    return [
      none,
      statSprite,
      ...(selected
        ? shaded(line, recolor(statColor, { [colors.silver]: colors.grey }))
        : line),
    ];
  });
  const details = getItemDescription({ stat: visibleStats[verticalIndex] });
  const popupResult = renderPopup(
    world,
    entity,
    state,
    info,
    content,
    "selected",
    details
  );
  return {
    updated: popupResult.updated,
    finished: popupResult.finished,
  };
};

const gearTitles: Record<Equipment, string> = {
  sword: "Sword",
  shield: "Shield",
  primary: "Spell",
  secondary: "Item",
  ring: "Ring",
  amulet: "Amulet",
  compass: "Compass",
  torch: "Torch",
};
const gearShadows: Record<Equipment, Sprite> = {
  sword: swordSlot,
  shield: shieldSlot,
  primary: primarySlot,
  secondary: secondarySlot,
  ring: ringSlot,
  amulet: amuletSlot,
  compass: compassSlot,
  torch: torchSlot,
};
const gearOverscan = 1;
const classPixels = {
  rogue: roguePixels,
  mage: magePixels,
  knight: knightPixels,
  "???": alienPixels,
};

export const displayGear: Sequence<PopupSequence> = (world, entity, state) => {
  const verticalIndex = getVerticalIndex(world, entity);
  const scrollIndex =
    verticalIndex -
    scrolledVerticalIndex(
      world,
      entity,
      state,
      Array.from({ length: gearSlots.length + gearOverscan }),
      "selected",
      [],
      gearOverscan
    );

  const swordItem = world.getEntityByIdAndComponents(entity[EQUIPPABLE].sword, [
    ITEM,
  ])?.[ITEM];
  const shieldItem = world.getEntityByIdAndComponents(
    entity[EQUIPPABLE].shield,
    [ITEM]
  )?.[ITEM];

  const heroPixels = overlay(
    shieldItem
      ? shieldItem.material
        ? recolorPixels(shieldPixels, {
            [colors.white]: materialElementColors[shieldItem.material],
          })
        : shieldPixels
      : [],
    shieldItem?.element
      ? recolorPixels(shieldElementPixels, {
          [colors.white]: materialElementColors[shieldItem.element],
        })
      : [],
    bodyPixels,
    classPixels[(entity[SPAWNABLE] as Spawnable).classKey],
    swordItem
      ? swordItem.material
        ? recolorPixels(swordPixels, {
            [colors.white]: materialElementColors[swordItem.material],
          })
        : swordPixels
      : [],
    swordItem?.element
      ? recolorPixels(swordElementPixels, {
          [colors.white]: materialElementColors[swordItem.element],
        })
      : []
  );

  const descriptions: Sprite[][][] = [];
  const content: Sprite[][] = gearSlots.map((gear, rowIndex) => {
    const equippedId = entity[EQUIPPABLE][gear];
    const item = world.getEntityByIdAndComponents(equippedId, [ITEM]);
    const name = gearTitles[gear];
    const selected = verticalIndex === rowIndex;
    const title = selected ? name : "─".repeat(name.length);

    if (!item) {
      descriptions.push([
        createText(`No ${title.toLowerCase()} yet`, colors.grey),
      ]);

      const line = [
        ...createText(title, colors.grey),
        ...repeat(none, 7 - title.length),
      ];
      return [
        none,
        selected ? gearShadows[gear] : none,
        ...(selected ? dotted(line, colors.red) : line),
        none,
        ...(heroPixels[rowIndex - scrollIndex] || []),
      ];
    }

    const gearSprite = getItemSprite(item[ITEM]);
    const gearTitle = createText(
      gearSprite.name,
      selected ? colors.white : colors.grey
    );
    const line = [
      ...gearTitle,
      ...repeat(none, frameWidth - 4 - gearTitle.length - 8),
    ];

    descriptions.push(getItemDescription(item[ITEM]));

    return [
      none,
      gearSprite,
      ...(selected ? shaded(line, colors.grey) : line),
      none,
      ...(heroPixels[rowIndex - scrollIndex] || []),
    ];
  });
  content.push([
    ...repeat(none, frameWidth - 2 - 7),
    ...(heroPixels[content.length - scrollIndex] || []),
  ]);
  const gearSelected = entity[EQUIPPABLE][gearSlots[verticalIndex]];
  const details = descriptions[verticalIndex];
  const popupResult = renderPopup(
    world,
    entity,
    state,
    info,
    content,
    gearSelected ? "selected" : "blocked",
    details,
    gearOverscan
  );
  return {
    updated: popupResult.updated,
    finished: popupResult.finished,
  };
};

const classOverscan = 6 - classes.length;
const classUnlock: Record<ClassKey, Sprite[][]> = {
  rogue: [],
  knight: [
    [
      ...createText("Defeat a ", colors.grey),
      mergeSprites(chief, hostileBar),
      ...createText("Chief", colors.maroon),
    ],
    createText("to unlock", colors.grey),
  ],
  mage: [
    [
      ...createText("Get a ", colors.grey),
      diamondGem,
      ...createText("Diamond", colors.aqua),
    ],
    createText("to unlock", colors.grey),
  ],
  "???": [
    [
      ...createText("?¿¿?¿ ? ", colors.grey),
      missing,
      ...createText("¿??¿¿?", colors.grey),
    ],
    createText("¿? ¿¿?¿??", colors.grey),
  ],
};

export const displayClass: Sequence<PopupSequence> = (world, entity, state) => {
  const verticalIndex = getVerticalIndex(world, entity);
  const scrollIndex =
    verticalIndex -
    scrolledVerticalIndex(
      world,
      entity,
      state,
      Array.from({ length: classes.length + classOverscan }),
      "selected",
      [],
      classOverscan
    );

  const selectedClass = classes[verticalIndex];
  const selectedAvailable = selectedClass === "rogue";
  const lines = overlay(
    bodyPixels,
    classPixels[classes[verticalIndex]],
    ...(selectedAvailable ? [] : [repeat(repeat(parseSprite("\x00░"), 7), 6)])
  );
  const heroPixels = selectedAvailable
    ? lines
    : lines.map((row) => row.map((cell) => recolorSprite(cell, colors.grey)));

  const content: Sprite[][] = Array.from({
    length: Math.max(classes.length, 6),
  }).map((_, rowIndex) => {
    const className = classes[rowIndex];

    if (!className)
      return [
        ...repeat(none, 10),
        ...(heroPixels[rowIndex - scrollIndex] || []),
      ];

    const selected = verticalIndex === rowIndex;
    const available = className === "rogue";
    const classSprite = entitySprites[className].sprite;
    const classTitle = createText(
      available || selected
        ? classSprite.name
        : "─".repeat(classSprite.name.length),
      available && selected ? colors.white : colors.grey
    );
    const line = [
      ...classTitle,
      ...repeat(none, frameWidth - 4 - classTitle.length - 8),
    ];

    return [
      none,
      ...(available
        ? createText("*", selected ? colors.lime : colors.green)
        : selected
        ? [blocked]
        : [none]),
      ...(selected
        ? available
          ? shaded(line, colors.grey)
          : dotted(line, colors.red)
        : line),
      none,
      ...(heroPixels[rowIndex - scrollIndex] || []),
    ];
  });
  content.push([
    ...repeat(none, frameWidth - 2 - 7),
    ...(heroPixels[content.length - scrollIndex] || []),
  ]);
  const details = selectedAvailable
    ? getEntityDescription(entitySprites[selectedClass])
    : classUnlock[selectedClass];
  const popupResult = renderPopup(
    world,
    entity,
    state,
    popupIdles[getTab(world, entity)],
    content,
    selectedAvailable ? "selected" : "blocked",
    details,
    classOverscan
  );
  return {
    updated: popupResult.updated,
    finished: popupResult.finished,
  };
};

const forgeWidth = 7;
const forgeHeight = 3;

export const displayForge: Sequence<PopupSequence> = (world, entity, state) => {
  const heroEntity = getIdentifierAndComponents(world, "hero", [INVENTORY]);
  const inventoryItems = heroEntity
    ? (heroEntity[INVENTORY] as Inventory).items.map((item) =>
        world.assertByIdAndComponents(item, [ITEM])
      )
    : [];
  const hasItems = inventoryItems.length > 0;
  const verticalIndex = getVerticalIndex(world, entity);
  const scrollIndex =
    verticalIndex -
    scrolledVerticalIndex(
      world,
      entity,
      state,
      Array.from({ length: inventoryItems.length }),
      "selected",
      []
    );
  const [firstIndex, secondIndex] = getTabSelections(world, entity);

  const firstItem = inventoryItems[firstIndex];
  const secondItem = inventoryItems[secondIndex];
  const selectedItem = inventoryItems[verticalIndex];

  const {
    forgeable: selectedForgeable,
    duplicate: selectedDuplicate,
    insufficient: selectedInsufficient,
    baseItem,
    addItem,
    resultItem,
  } = getForgeStatus(world, heroEntity, firstIndex, secondIndex, verticalIndex);
  const addColor = selectedForgeable
    ? colors.lime
    : selectedInsufficient
    ? colors.yellow
    : colors.red;
  const isAdding = firstItem && !resultItem;

  const baseSprite = baseItem ? getItemSprite(baseItem) : missing;
  const addSprite = addItem ? getItemSprite(addItem) : missing;
  const resultSprite = resultItem ? getItemSprite(resultItem) : missing;
  const selectedSprite = selectedItem
    ? getItemSprite(selectedItem[ITEM])
    : none;
  const addingAmount = addItem?.amount.toString() || "";

  const layers = [
    [
      ...repeat([], forgeHeight - 1),
      ...pixelFrame(
        forgeWidth,
        forgeHeight,
        resultItem ? colors.grey : isAdding ? addColor : colors.grey,
        (isAdding || resultItem) && selectedForgeable ? "solid" : "dotted",
        [
          centerSprites(
            isAdding || resultItem
              ? [...createText(addingAmount), addSprite]
              : [missing],
            forgeWidth - 2
          ),
        ],
        isAdding
          ? [
              ...addForeground(
                createText("-", addColor),
                colors.black,
                selectedForgeable ? " " : "▒"
              ),
              ...createText("Add", addColor),
            ]
          : [],
        true
      ),
    ],
    pixelFrame(
      forgeWidth,
      forgeHeight,
      resultItem ? colors.white : firstItem ? colors.grey : addColor,
      baseItem && !addItem && !selectedForgeable ? "dotted" : "solid",
      [
        centerSprites(
          [baseSprite, ...createText(" \u0119 "), resultSprite],
          forgeWidth - 2
        ),
      ],
      resultItem
        ? createText("Yield")
        : firstItem
        ? []
        : createText("Base", addColor)
    ),
  ];
  const forgePreview = overlay(
    ...(isAdding
      ? selectedForgeable
        ? reversed(layers)
        : [
            ...reversed(layers),
            [
              ...repeat([], forgeHeight - 1),
              [
                parseSprite(`\x08┘${colorToCode(addColor)}·\x00▌`),
                ...repeat(none, forgeWidth - 2),
                parseSprite(`\x08└${colorToCode(addColor)}·\x00▐`),
              ],
            ],
          ]
      : layers)
  );

  const resultDiff =
    baseItem && resultItem && getItemDiff(world, baseItem, resultItem);
  const resultContent = resultItem && [
    createText("Preview:  ", colors.grey),
    [
      popupActive,
      resultSprite,
      ...shaded(
        createText(
          `${resultSprite.name}${" ".repeat(7 - resultSprite.name.length)}`
        ),
        colors.green,
        "▄"
      ),
      none,
    ],
    createText("Upgrades: ", colors.grey),
    ...Object.entries(resultDiff || {})
      .filter(([key, value]) => value !== 0)
      .map(([key, value]) => {
        const stat = key as keyof ItemStats;
        const statSprite = getStatSprite(stat, "display");
        const statColor = getStatColor(stat);
        const valueText = `${value > 0 ? "+" : ""}${value}`;
        return [
          ...createText(valueText, statColor),
          statSprite,
          ...createText(statSprite.name, statColor),
          ...repeat(none, 9 - valueText.length - statSprite.name.length),
        ];
      }),
  ];

  const content: Sprite[][] = hasItems
    ? Array.from({
        length: Math.max(5, inventoryItems.length, resultContent?.length || 0),
      }).map((_, rowIndex) => {
        const forgeItem = inventoryItems[rowIndex];

        if (!forgeItem || resultContent) {
          return [
            ...(resultContent?.[rowIndex] || repeat(none, 10)),
            ...(forgePreview[rowIndex - scrollIndex] || []),
          ];
        }

        const selected = verticalIndex === rowIndex;
        const added = rowIndex === firstIndex || rowIndex === secondIndex;
        const itemSprite = getItemSprite(forgeItem[ITEM], "display");
        const textColor = selected && !added ? colors.white : colors.grey;
        const itemText = createText(itemSprite.name, textColor);
        const forgeOptions = getForgeOptions(
          firstItem?.[ITEM] || forgeItem[ITEM]
        );
        const materialOption = forgeOptions.find((option) =>
          matchesItem(world, forgeItem[ITEM], option.add)
        );
        const insufficientMaterials =
          materialOption && forgeItem[ITEM].amount < materialOption.add.amount;
        const forgeable =
          !added &&
          ((!firstItem && forgeOptions.length > 0) ||
            (firstItem &&
              !secondItem &&
              materialOption &&
              !insufficientMaterials));

        if (added) {
          const placeholder = [
            itemSprite,
            ...itemText,
            ...repeat(none, 7 - itemText.length),
          ];
          return [
            none,
            ...strikethrough(
              selected ? dotted(placeholder, colors.red) : placeholder
            ),
            none,
            ...(forgePreview[rowIndex - scrollIndex] || []),
          ];
        }

        const line = [...itemText, ...repeat(none, 7 - itemText.length)];

        if (!forgeable) {
          return [
            none,
            itemSprite,
            ...(selected ? dotted(line, colors.red) : line),
            none,
            ...(forgePreview[rowIndex - scrollIndex] || []),
          ];
        }

        return [
          none,
          itemSprite,
          ...(selected ? shaded(line, colors.grey) : line),
          none,
          ...(forgePreview[rowIndex - scrollIndex] || []),
        ];
      })
    : [createText("No items to forge", colors.grey)];

  const details = !hasItems
    ? undefined
    : resultItem
    ? getItemDescription(resultItem)
    : selectedForgeable
    ? getItemDescription(selectedItem[ITEM])
    : [
        selectedInsufficient && addItem
          ? createText(
              `Only have ${selectedInsufficient.amount} of ${addItem.amount}`,
              colors.grey
            )
          : selectedDuplicate
          ? createText("Already added", colors.grey)
          : createText(
              `Not able to ${isAdding ? "add" : "forge"}`,
              colors.grey
            ),
        createText(selectedSprite.name.toLowerCase(), colors.grey),
      ];

  const popupResult = renderPopup(
    world,
    entity,
    state,
    info,
    resultContent
      ? content.slice(0, Math.max(5, resultContent.length))
      : content,
    !hasItems || resultItem
      ? undefined
      : selectedForgeable
      ? "selected"
      : "blocked",
    details
  );

  return {
    updated: popupResult.updated,
    finished: popupResult.finished,
  };
};

export const displayCraft: Sequence<PopupSequence> = (world, entity, state) => {
  const heroEntity = getIdentifierAndComponents(world, "hero", [POSITION]);
  const icon = craft;
  const verticalIndex = getVerticalIndex(world, entity);
  const inventoryItems = heroEntity
    ? (heroEntity[INVENTORY] as Inventory).items.map((itemId) =>
        world.assertByIdAndComponents(itemId, [ITEM])
      )
    : [];
  const recipes = (entity[POPUP] as Popup).recipes;
  const selectedRecipe = recipes[verticalIndex];

  const [recipeIndex] = getTabSelections(world, entity);
  const viewedRecipe = recipes[recipeIndex];
  const viewedSprite = viewedRecipe && getItemSprite(viewedRecipe.item);
  const viewedDeal =
    viewedRecipe && getCraftingDeal(viewedRecipe, verticalIndex);
  const viewedShoppable =
    viewedDeal && heroEntity && canShop(world, heroEntity, viewedDeal);

  let content = [createText("Nothing to craft", colors.grey)];

  if (heroEntity && viewedRecipe) {
    const optionItem = viewedRecipe.item;
    const optionDeal = getCraftingDeal(viewedRecipe, verticalIndex);
    const optionShoppable = canShop(world, heroEntity, optionDeal);
    const amountText = [
      recolorSprite(times, {
        [colors.black]: optionShoppable ? colors.green : colors.black,
      }),
      ...createText(`${optionItem.amount}`),
    ];
    const line = [
      ...createText(viewedSprite.name),
      ...amountText,
      ...repeat(
        none,
        frameWidth - 4 - viewedSprite.name.length - amountText.length
      ),
    ];
    content = [
      ...repeat([], verticalIndex),
      [
        optionShoppable ? popupActive : popupBlocked,
        viewedSprite,
        ...(optionShoppable
          ? shaded(line, colors.green, "▄")
          : dotted(line, colors.red)),
      ],
      createText(
        viewedRecipe.options.length > 1
          ? `Recipe ${verticalIndex + 1} of ${viewedRecipe.options.length}:`
          : `Recipe:`,
        colors.grey
      ),
      ...optionDeal.prices.map((price) => {
        const priceSprite = getItemSprite(price);
        const hasIngredient =
          missingFunds(world, heroEntity, {
            prices: [price],
            stock: 1,
            item: { amount: 0 },
          }).length === 0;

        const ingredientColor = hasIngredient ? colors.lime : colors.red;
        const inventoryAmount =
          inventoryItems.find((item) =>
            matchesItem(world, price, item[ITEM])
          )?.[ITEM].amount || 0;
        const ingredientAmount = [
          ...createText(`${inventoryAmount}`),
          ...createText("/", colors.grey),
          ...createText(`${price.amount}`, ingredientColor),
        ];

        return [
          none,
          priceSprite,
          ...createText(priceSprite.name),
          ...repeat(
            none,
            frameWidth - 4 - priceSprite.name.length - ingredientAmount.length
          ),
          ...ingredientAmount,
        ];
      }),
      ...repeat(
        [],
        3 -
          optionDeal.prices.length +
          viewedRecipe.options.length -
          1 -
          verticalIndex
      ),
    ];
  } else if (heroEntity && selectedRecipe) {
    content = recipes.map((recipe, rowIndex) => {
      const selected = verticalIndex === rowIndex;
      const craftItem = recipe.item;
      const textColor = selected ? colors.white : colors.grey;
      const itemSprite = getItemSprite(craftItem, "display");

      const recipeShoppable = recipe.options.some((_, optionIndex) =>
        canShop(world, heroEntity, getCraftingDeal(recipe, optionIndex))
      );
      const amountText = [
        recolorSprite(times, textColor),
        ...createText(`${craftItem.amount}`, textColor),
      ];
      const line = [
        ...createText(itemSprite.name, textColor),
        ...amountText,
        ...repeat(
          none,
          frameWidth - 5 - amountText.length - itemSprite.name.length
        ),
        recipeShoppable ? recolorSprite(star, colors.lime) : none,
      ];

      return [
        none,
        itemSprite,
        ...(selected ? shaded(line, colors.grey) : line),
      ];
    });
  }

  const details =
    !(viewedRecipe && selectedRecipe) || viewedShoppable
      ? getItemDescription(viewedRecipe?.item || selectedRecipe.item)
      : [
          createText("Unable to craft", colors.grey),
          createText(viewedSprite.name.toLowerCase(), colors.grey),
        ];
  const popupResult = renderPopup(
    world,
    entity,
    state,
    icon,
    content,
    viewedDeal ? undefined : "selected",
    details
  );
  return {
    updated: popupResult.updated,
    finished: popupResult.finished,
  };
};

const warpHeight = 5;
const warpWidth = 11;
const warpBlink = 2;

export const displayWarp: Sequence<PopupSequence> = (world, entity, state) => {
  const generation = world.metadata.gameEntity[RENDERABLE].generation;
  const blinkGeneration = Math.floor(generation / warpBlink) * warpBlink;
  const showPlayer = generation % (warpBlink * 2) < warpBlink;

  // value container to rerender content
  if (!state.particles.blink) {
    const blinkParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: 0,
        offsetY: 0,
        offsetZ: particleHeight,
        amount: blinkGeneration,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: none,
    });
    state.particles.blink = world.getEntityId(blinkParticle);
  }

  const blinkParticle = world.assertByIdAndComponents(state.particles.blink, [
    PARTICLE,
  ]);
  const lastBlinkGeneration = blinkParticle[PARTICLE].amount;

  // rerender content on blinking
  if (lastBlinkGeneration !== blinkGeneration) {
    rerenderEntity(world, entity);
    blinkParticle[PARTICLE].amount = blinkGeneration;
  }

  const map: Sprite[][] = [
    ...(
      (entity[POPUP] as Popup).lines[entity[POPUP].horizontalIndex] || []
    ).map((line) => [...line, ...repeat(none, frameWidth - 4 - line.length)]),
  ];
  const selectedLevel = getSelectedLevel(world, entity);
  const level = levelConfig[selectedLevel];
  const currentLevel = selectedLevel === world.metadata.gameEntity[LEVEL].name;
  const lockedLevel = !currentLevel && !canWarp(world, {}, entity);

  const warpColor = lockedLevel
    ? colors.red
    : currentLevel
    ? colors.white
    : colors.lime;

  const content = overlay(
    map,
    ...[
      [
        ...repeat([], level.mapOffsetY),
        ...pixelFrame(
          warpWidth,
          warpHeight,
          warpColor,
          lockedLevel || currentLevel ? "dashed" : "thick",
          [],
          createText(level?.name || "", colors.black, warpColor)
        ),
      ],
      [
        ...repeat([], level.mapOffsetY + (warpHeight - 1) / 2),
        [
          lockedLevel
            ? blocked
            : showPlayer
            ? mergeSprites(shadow, createText("\u010b", warpColor)[0])
            : none,
        ],
      ],
    ].map((layer) =>
      layer.map((line) =>
        centerSprites(
          [
            ...repeat(none, level.mapOffsetX * 2),
            ...line,
            ...repeat(none, level.mapOffsetX * -2),
          ],
          frameWidth - 2
        )
      )
    )
  );

  const popupResult = renderPopup(
    world,
    entity,
    state,
    popupIdles[getTab(world, entity)],
    content
  );

  return {
    updated: popupResult.updated,
    finished: popupResult.finished,
  };
};

export const displayInfo: Sequence<PopupSequence> = (world, entity, state) => {
  const content: Sprite[][] = [
    ...(
      (entity[POPUP] as Popup).lines[entity[POPUP].horizontalIndex] || []
    ).map((line) => [...line, ...repeat(none, frameWidth - 4 - line.length)]),
  ];

  const popupResult = renderPopup(
    world,
    entity,
    state,
    popupIdles[getTab(world, entity)],
    content
  );

  return {
    updated: popupResult.updated,
    finished: popupResult.finished,
  };
};

export const displayQuest: Sequence<PopupSequence> = (world, entity, state) => {
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
  const gathers = popup.deals.map((deal) => {
    const gathered = heroEntity && canRedeem(world, heroEntity, deal);

    const name = getItemSprite(deal.prices[0]).name;
    return [
      ...createText("GATHER:", colors.grey),
      ...(gathered ? strikethrough : id)([
        ...getActivationRow(deal.prices[0]),
        ...createText(name, gathered ? colors.grey : colors.white),
        ...repeat(none, frameWidth - 2 - 7 - 3 - name.length),
      ]),
    ];
  });
  const rewards = popup.deals.map((deal, index) => {
    const received = deal.stock === 0;
    return [
      ...(index === 0 ? createText("REWARD:", colors.lime) : repeat(none, 7)),
      ...(received ? strikethrough : id)([
        ...getActivationRow(deal.item),
        ...createText(
          getItemSprite(deal.item).name,
          received ? colors.grey : colors.white
        ),
      ]),
    ];
  });

  const content: Sprite[][] = [
    ...(entity[POPUP] as Popup).lines[entity[POPUP].horizontalIndex].map(
      (line) => [...line, ...repeat(none, frameWidth - 4 - line.length)]
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

  const popupResult = renderPopup(
    world,
    entity,
    state,
    popupIdles[getTab(world, entity)],
    content
  );
  return {
    updated: popupResult.updated,
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
  wood: {
    default: woodWave,
    air: woodAirWave,
    fire: woodFireWave,
    water: woodWaterWave,
    earth: woodEarthWave,
  },
};
const waveCornerSprites = {
  wood: {
    default: woodWaveCorner,
    air: woodAirWaveCorner,
    fire: woodFireWaveCorner,
    water: woodWaterWaveCorner,
    earth: woodEarthWaveCorner,
  },
};

export const castWave1: Sequence<SpellSequence> = (world, entity, state) => {
  const entityId = world.getEntityId(entity);
  let updated = false;
  let finished = false;

  const outerRadius = Math.ceil(state.elapsed / waveSpeed);
  const innerRadius = Math.round(state.elapsed / waveSpeed);
  const material = "wood"; //state.args.material;
  const element = state.args.element || "default";

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
        [SPRITE]: waveSprites[material][element],
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

      // only show elements on inner corners
      const cornerSprite =
        waveCornerSprites[material][
          particleName.startsWith("inner") ? element : "default"
        ];
      if (waveParticle[SPRITE] === cornerSprite) continue;

      waveParticle[SPRITE] = cornerSprite;
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
  const worldDelta = world.metadata.gameEntity[REFERENCE].delta;
  const heroEntity = getIdentifierAndComponents(world, "hero", [POSITION]);
  const size = world.metadata.gameEntity[LEVEL].size;
  const entityId = world.getEntityId(entity);

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
        ...getEmptyCastable(world, entity),
        true: 1,
        retrigger: 1,
        burn: 2,
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

  // synchronize generation tick
  const generation = isUnitBurning ? burnGeneration : worldGeneration;

  // animate particle
  if (generation && isBurning && generation !== state.args.generation) {
    state.args.generation = generation;

    // remove previous crackles
    if (state.particles.crackle) {
      const crackleParticle = world.assertByIdAndComponents(
        state.particles.crackle,
        [PARTICLE]
      );
      disposeEntity(world, crackleParticle);
      delete state.particles.crackle;
    }

    const fireParticle = world.assertByIdAndComponents(state.particles.fire, [
      PARTICLE,
    ]);
    const amount = fireParticle[PARTICLE].amount;
    fireParticle[PARTICLE].amount =
      amount === 2 ? [1, 3][distribution(40, 60)] : 2;
    updated = true;

    // handle damage
    if (isUnitBurning) {
      const castableEntity = getExertables(world, entity[POSITION])
        .map((exertable) =>
          world.getEntityByIdAndComponents(exertable[EXERTABLE].castable, [
            CASTABLE,
          ])
        )
        .filter(
          (castable) =>
            castable &&
            castable !== world.getEntityById(state.args.castable) &&
            castable[CASTABLE].burn > 0
        )[0];
      const castableId = castableEntity && world.getEntityId(castableEntity);

      if (!state.args.igniter) {
        if (castableEntity) {
          // persist igniting castable to stop dotting
          state.args.igniter = castableId;

          // remember reference to last affected
          state.args.lastAffected = castableEntity[CASTABLE].affected[entityId];
        } else if (!state.args.lastAffected) {
          // start burning on proc hits
          state.args.lastAffected = {
            generation: worldGeneration,
            delta: worldDelta,
          };
        }
      } else if (state.args.igniter) {
        const previousCastable = world.getEntityByIdAndComponents(
          state.args.igniter,
          [CASTABLE]
        );
        // remember copy of latest affected values
        const affected = previousCastable?.[CASTABLE].affected[entityId];

        state.args.lastAffected = (state.args.lastAffected || affected) && {
          ...state.args.lastAffected!,
          ...affected,
        };

        // reset on leaving to allow retriggering on re-enter
        if (!castableEntity) {
          // allow eternal fires to proc again
          const fireEntity = world.getEntityByIdAndComponents(
            previousCastable?.[CASTABLE].caster,
            [BURNABLE]
          );
          if (fireEntity?.[BURNABLE]?.eternal) {
            delete entity[AFFECTABLE]?.procs[state.args.igniter];
          }

          delete state.args.igniter;
        }
      }

      // process dot
      if (
        state.args.lastAffected &&
        !state.args.igniter &&
        hasTriggered(world, state.args.lastAffected, burnTicks)
      ) {
        entity[AFFECTABLE].dot += 1;
        entity[AFFECTABLE].burn -= 1;
        state.args.lastAffected.generation += burnTicks;
      }
    }

    // show crackle
    const isCrackle = !isUnitBurning && random(0, 4) === 0;
    if (isCrackle) {
      const crackleParticle = entities.createParticle(world, {
        [PARTICLE]: {
          offsetX: 0,
          offsetY: -1,
          offsetZ: particleHeight,
          animatedOrigin: { x: 0, y: 0 },
          amount: random(1, 3),
          duration: fireTick,
        },
        [RENDERABLE]: { generation: 1 },
        [SPRITE]: crackle,
      });
      state.particles.crackle = world.getEntityId(crackleParticle);

      updated = true;
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

      if (isCrackle) {
        play("crackle", {
          proximity,
          delay: random(0, fireTick),
          intensity: random(5, 10),
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
    const step = 2 - ((generation + 2) % 2);
    if (
      isExtinguishing ||
      (isBurning &&
        random(
          0,
          Object.keys(state.particles).length + (isEternalFire ? 0 : 4)
        ) <= 1 &&
        !(state.args.simmer && step === 1))
    ) {
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
    const wind =
      random(0, 2) === 0 && !state.args.simmer ? random(0, 2) - 1 : 0;
    for (const particleName in state.particles) {
      const smokeParticle = world.assertByIdAndComponents(
        state.particles[particleName],
        [PARTICLE, RENDERABLE]
      );

      const particleStep = (smokeParticle[PARTICLE].duration || 350) / 350;
      if (
        (generation + smokeParticle[RENDERABLE].generation) % particleStep ===
        0
      ) {
        const { offsetX, offsetY } = smokeParticle[PARTICLE];
        smokeParticle[PARTICLE].animatedOrigin = { x: offsetX, y: offsetY };
        smokeParticle[PARTICLE].offsetY -= 1;
        smokeParticle[PARTICLE].offsetX += wind;

        const distance = smokeParticle[PARTICLE].offsetY * -1;
        const amount = smokeParticle[PARTICLE].amount || 1;
        const smokeFade =
          !state.args.simmer && random(0, 2) < distance - amount;
        const simmerFade = state.args.simmer && distance > random(1, 2);

        if (smokeFade || simmerFade) {
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

    const holeParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: 0,
        offsetY: 0,
        offsetZ: tooltipHeight,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: keyHole,
    });
    state.particles.hole = world.getEntityId(holeParticle);
    updated = true;
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

const materialFlasks = {
  wood: bottle,
  iron: potion,
  gold: elixir,
  diamond: missing,
  ruby: missing,
};

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
    consumptionConfigs[itemEntity[ITEM].consume!]?.[
      itemEntity[ITEM].material!
    ]?.[itemEntity[ITEM].element!];

  const maxCountable =
    consumptionConfig && getMaxCounter(consumptionConfig.countable);

  if (!consumptionConfig || !maxCountable || isDead(world, entity)) {
    return { finished: true, updated: false };
  }

  // process item consumption and show amount marker
  if (countableId && state.elapsed >= consumeSpeed * 2) {
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
    if (entity[PLAYER]) {
      entity[PLAYER].receivedStats[consumptionConfig.countable] +=
        consumptionConfig.amount;
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
      consumableParticle[SPRITE] = materialFlasks[itemEntity[ITEM].material!];
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

    updated = true;
  }

  if (finished) {
    if (state.particles.consumable) {
      const consumableParticle = world.assertById(state.particles.consumable);
      disposeEntity(world, consumableParticle);
      delete state.particles.consumable;
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
  const compassEntity = world.getEntityByIdAndComponents(state.args.compassId, [
    ITEM,
  ]);

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

  if (state.elapsed > collectTime && state.elapsed < moveTime) {
    if (
      roundedLocation.x !== entity[POSITION].x ||
      roundedLocation.y !== entity[POSITION].y
    ) {
      moveEntity(world, entity, roundedLocation);
    }
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

const discoveryTime = 200;
const discoveryReveal = 50;
const discoveryEnter = 4;
const discoveryLeave = 6;

export const discoveryIdle: Sequence<DiscoverySequence> = (
  world,
  entity,
  state
) => {
  const heroEntity = getIdentifierAndComponents(world, "hero", [POSITION]);

  const size = world.metadata.gameEntity[LEVEL].size;
  const controlled = state.args.force !== undefined;
  const shouldHide = state.args.force === false;

  const finished = state.args.idle === none;
  let updated = false;

  if (!state.particles.discovery) {
    const discoveryParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: 0,
        offsetY: 0,
        offsetZ: idleHeight,
        amount: 1,
        animatedOrigin: { x: 0, y: 0 },
        duration: discoveryTime,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: discovery,
    });
    state.particles.discovery = world.getEntityId(discoveryParticle);
  }

  // delay revealing from hidden to allow rotating text
  if (state.args.hidden && !shouldHide) {
    state.args.timestamp = state.elapsed + discoveryReveal;
  }
  state.args.hidden = shouldHide;

  // pause while timestamp is active
  if (state.args.timestamp && state.elapsed < state.args.timestamp) {
    return { finished, updated };
  }

  const discoveryParticle = world.assertByIdAndComponents(
    state.particles.discovery,
    [PARTICLE, SPRITE]
  );

  const isUp = discoveryParticle[PARTICLE].offsetY === -1;
  const distance =
    heroEntity && !isDead(world, heroEntity)
      ? getDistance(entity[POSITION], heroEntity[POSITION], size)
      : Infinity;
  const isAdjacent = controlled
    ? !shouldHide
    : heroEntity &&
      !isDead(world, heroEntity) &&
      distance < (isUp ? discoveryLeave : discoveryEnter) &&
      !(isInside(world, heroEntity) && !onSameLayer(world, heroEntity, entity));

  // move up when close
  const active = (controlled ? !shouldHide : isAdjacent) && !isUp;
  if (active) {
    state.args.timestamp = state.elapsed + discoveryTime;
    discoveryParticle[PARTICLE].offsetY = -1;
    rerenderEntity(world, discoveryParticle);
    updated = true;
  }

  // move down when distant
  const inactive = (controlled ? shouldHide : !isAdjacent) && isUp;
  if (inactive) {
    discoveryParticle[PARTICLE].offsetY = 0;
    rerenderEntity(world, discoveryParticle);
    updated = true;
  }

  const visibleSprite =
    isAdjacent && state.elapsed > state.args.timestamp
      ? state.args.idle
      : discovery;

  // hide or reveal
  if (visibleSprite !== discoveryParticle[SPRITE]) {
    discoveryParticle[SPRITE] = visibleSprite;
    rerenderEntity(world, discoveryParticle);
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
    state.elapsed / charDelay > totalLength * 1.4 + 20;
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

    const nextDialog = Math.max(0, entity[TOOLTIP].nextDialog) + 1;
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

const pointerX = 5;
const pointerY = 3;

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
      pointerParticle[PARTICLE].offsetX = delta.x * pointerX;
      pointerParticle[PARTICLE].offsetY = delta.y * pointerY;
      pointerParticle[ORIENTABLE].facing = invertedOrientation;
      state.args.lastOrientation = invertedOrientation;
      state.args.target = targetId;
      updated = true;
    }
  }

  return { finished, updated };
};

const vortexTime = 150;
const vortexResolution = 6;
const vortexChars = "/-:·\u0106\u0108÷>±\u011f";
const vortexColors = ["red", "lime", "yellow"] as const;

export const vortexDots: Sequence<VortexSequence> = (world, entity, state) => {
  const generation = Math.floor(state.elapsed / vortexTime);
  const size = world.metadata.gameEntity[LEVEL].size;
  const heroEntity = getIdentifierAndComponents(world, "hero", [POSITION]);
  const particleCount = Object.keys(state.particles).length;

  let updated = false;
  let finished = false;

  // hide when hero dead
  const distance = heroEntity
    ? getDistance(heroEntity[POSITION], entity[POSITION], size)
    : Infinity;
  const isVisible = !!heroEntity && !isDead(world, heroEntity);

  // create particles
  if (particleCount === 0 && isVisible) {
    for (let i = 0; i < vortexResolution; i += 1) {
      const vortexParticle = entities.createParticle(world, {
        [PARTICLE]: {
          offsetX: 0,
          offsetY: 0,
          offsetZ: effectHeight,
        },
        [RENDERABLE]: { generation: 1 },
        [SPRITE]: none,
      });
      state.particles[`vortex-${i}`] = world.getEntityId(vortexParticle);
    }

    const backdropParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: 0,
        offsetY: 0,
        offsetZ: immersibleHeight,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: portalBackdrop,
    });
    state.particles.backdrop = world.getEntityId(backdropParticle);

    updated = true;
  }

  // update faster when moving closer
  if (
    isVisible &&
    generation > state.args.generation &&
    generation % Math.max(1, Math.round(distance)) === 0
  ) {
    if (distance === 0) {
      const backdropParticle = world.assertByIdAndComponents(
        state.particles.backdrop,
        [PARTICLE]
      );
      backdropParticle[SPRITE] = portalEntered;
    }

    const shuffledColors = shuffle([...vortexColors]);
    for (const particleName in state.particles) {
      if (!particleName.startsWith("vortex-")) continue;

      const vortexParticle = world.assertByIdAndComponents(
        state.particles[particleName],
        [PARTICLE]
      );
      vortexParticle[SPRITE] = {
        name: "",
        layers: [
          {
            color:
              colors[
                shuffledColors[
                  parseInt(particleName.split("-")[1]) % shuffledColors.length
                ]
              ],
            char: choice(...vortexChars),
          },
        ],
      };
    }

    state.args.generation = generation;
    updated = true;
  }

  return { finished, updated };
};

const fountainTicks = 3;
const fountainSteps = 5;

export const fountainSplash: Sequence<FountainSequence> = (
  world,
  entity,
  state
) => {
  const size = world.metadata.gameEntity[LEVEL].size;
  const generation = world.metadata.gameEntity[RENDERABLE].generation;
  const heroEntity = getIdentifierAndComponents(world, "hero", [POSITION]);

  const distance = heroEntity
    ? getDistance(heroEntity[POSITION], entity[POSITION], size, 1, false)
    : Infinity;
  let updated = false;
  const finished = false;

  if (!state.particles.fountain) {
    const fountainParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: 0,
        offsetY: 0,
        offsetZ: floatHeight,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: fountain,
    });
    state.particles.fountain = world.getEntityId(fountainParticle);
    updated = true;
  }

  if (generation > state.args.generation) {
    // reset timer when entering
    const previousEntered = state.args.entered;
    if (distance <= 1 && !previousEntered) {
      state.args.entered = generation;
    } else if (distance > 1 && previousEntered) {
      state.args.entered = undefined;
    }

    const healingAmount = heroEntity?.[STATS]
      ? Math.floor(heroEntity[STATS].maxHp / fountainSteps)
      : 0;

    // create and move drop particles
    for (const particleName in state.particles) {
      if (particleName === "fountain") continue;

      const waterParticle = world.assertByIdAndComponents(
        state.particles[particleName],
        [PARTICLE]
      );

      if (waterParticle[PARTICLE].offsetX === 0) {
        if (waterParticle[PARTICLE].offsetY > -2) {
          waterParticle[PARTICLE].offsetY -= 1;
        } else {
          waterParticle[PARTICLE].offsetX = particleName.endsWith("-left")
            ? -1
            : 1;
          waterParticle[PARTICLE].amount = (generation % 3) + 1;
        }
      } else if (waterParticle[PARTICLE].offsetY >= -1) {
        // disperse drop and heal player every X ticks
        if (waterParticle[SPRITE] === fountainHeal) {
          if (
            particleName.endsWith("-left") &&
            generation >= (state.args.healed || 0) + fountainTicks &&
            state.args.entered &&
            heroEntity &&
            heroEntity[PLAYER] &&
            heroEntity[STATS] &&
            heroEntity[STATS].hp < heroEntity[STATS].maxHp
          ) {
            const { hp, healing } = calculateHealing(
              heroEntity[STATS],
              healingAmount
            );
            heroEntity[STATS].hp = hp;
            heroEntity[PLAYER].receivedStats.hp += healing;
            state.args.healed = generation;
          }
        }

        disposeEntity(world, waterParticle);
        delete state.particles[particleName];
      } else {
        waterParticle[PARTICLE].offsetY += 1;
      }
    }

    // extinguish player
    if (heroEntity?.[AFFECTABLE]?.burn && distance <= 1) {
      extinguishEntity(world, heroEntity);
    }

    const emitHealing =
      heroEntity &&
      distance <= 1 &&
      heroEntity[STATS] &&
      heroEntity[STATS].hp < heroEntity[STATS].maxHp &&
      !(
        previousEntered &&
        heroEntity[STATS].hp >= heroEntity[STATS].maxHp - healingAmount
      );

    for (const orientation of ["left", "right"]) {
      const dropParticle = entities.createParticle(world, {
        [PARTICLE]: {
          offsetX: 0,
          offsetY: -1,
          offsetZ: immersibleHeight,
          duration: 350,
          animatedOrigin: { x: 0, y: 0 },
        },
        [RENDERABLE]: { generation: 1 },
        [SPRITE]: emitHealing ? fountainHeal : fountainDrop,
      });
      state.particles[`drop-${generation}-${orientation}`] =
        world.getEntityId(dropParticle);
    }

    // show active fountain while emitting
    const fountainParticle = world.assertByIdAndComponents(
      state.particles.fountain,
      [SPRITE]
    );
    if (emitHealing && fountainParticle[SPRITE] !== fountainHealing) {
      fountainParticle[SPRITE] = fountainHealing;
    } else if (!emitHealing && fountainParticle[SPRITE] !== fountain) {
      fountainParticle[SPRITE] = fountain;
    }

    state.args.generation = generation;
    updated = true;
  }

  return { finished, updated };
};
