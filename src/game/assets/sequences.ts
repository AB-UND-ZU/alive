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
import { Position, POSITION } from "../../engine/components/position";
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
  getEntityDisplayStats,
  getLimbs,
  getRoot,
  getStructure,
  isDead,
} from "../../engine/systems/damage";
import {
  disposeEntity,
  getCell,
  moveEntity,
  registerEntity,
} from "../../engine/systems/map";
import { rerenderEntity } from "../../engine/systems/renderer";
import { canWarp, openDoor } from "../../engine/systems/trigger";
import { brighten, colors, darken, recolor } from "../../game/assets/colors";
import {
  add,
  choice,
  combine,
  copy,
  distribution,
  getDistance,
  lerp,
  normalize,
  random,
  repeat,
  reversed,
  shuffle,
  sigmoid,
  signedDistance,
} from "../math/std";
import { iterations, reversedIterations } from "../math/tracing";
import {
  createDialog,
  createText,
  decay,
  fire,
  ghost,
  none,
  getMaxCounter,
  emptyPotion,
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
  freeze,
  craft,
  shop,
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
  missing,
  swordSlot,
  shieldSlot,
  ringSlot,
  amuletSlot,
  compassSlot,
  torchSlot,
  primarySlot,
  secondarySlot,
  dotted,
  times,
  shaded,
  delay,
  addForeground,
  popupActive,
  emptyBottle,
  emptyElixir,
  popupBlocked,
  star,
  discovery,
  parseSprite,
  colorToCode,
  blocked,
  chief,
  diamondGem,
  snowflake,
  bootsSlot,
  raiseParticle,
  mapDiscovery,
  mapSlot,
  mapZoom1,
  mapZoom2,
  mapZoom3,
  mapPlayer,
  mapZoom4,
  oakBranchSide,
  oakBranchCorner,
  oakBranchEnd,
  oakBranchSplit,
  oakLoopSide,
  oakLoopCorner,
  wormMouthCornerLeft,
  wormMouthCornerRight,
  wormMouthSideLeft,
  wormMouthCenter,
  wormMouthSideRight,
  vanishGrow0,
  vanishGrow1,
  vanishGrow2,
  vanishGrow3,
  vanishGrow4,
  vanishGrow5,
  vanishShrink0,
  vanishShrink1,
  vanishShrink2,
  vanishEvaporate,
  golemStrikeUp,
  golemStrikeUpRight,
  golemStrikeRight,
  golemStrikeRightDown,
  golemStrikeDown,
  golemStrikeDownLeft,
  golemStrikeLeft,
  golemStrikeLeftUp,
} from "./sprites";
import {
  ArrowSequence,
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
  WeatherSequence,
  ConditionSequence,
  BranchSequence,
  LimbSequence,
  VanishSequence,
  EvaporateSequence,
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
  findPath,
  invertOrientation,
  orientationDelta,
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
  createUnitName,
  createItemName,
  questWidth,
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
  mapScroll,
  matchesItem,
  missingFunds,
  popupIdles,
  visibleStats,
} from "../../engine/systems/popup";
import { getIdentifierAndComponents, TEST_MODE } from "../../engine/utils";
import { play } from "../sound";
import { extinguishEntity } from "../../engine/systems/burn";
import {
  alienPixels,
  bodyPixels,
  brightenSprites,
  centerSprites,
  displayedClasses,
  hairColors,
  knightPixels,
  magePixels,
  overlay,
  pixelFrame,
  recolorLine,
  recolorPixels,
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
import {
  getFragments,
  isInside,
  onSameLayer,
} from "../../engine/systems/enter";
import { Spawnable, SPAWNABLE } from "../../engine/components/spawnable";
import { ClassKey } from "../balancing/classes";
import { getSelectedLevel, levelConfig } from "../levels";
import { getActiveViewable } from "../../bindings/hooks";
import {
  calculateWeatherIntensity,
  createBubble,
  Weather,
  weatherIntensity,
} from "../../engine/systems/water";
import { coverSnow } from "../../engine/systems/freeze";
import { aspectRatio } from "../../components/Dimensions/sizing";
import { HARVESTABLE, Resource } from "../../engine/components/harvestable";
import { CONDITIONABLE } from "../../engine/components/conditionable";
import { FOG } from "../../engine/components/fog";
import { CellType } from "../../bindings/creation";
import { ACTIONABLE } from "../../engine/components/actionable";
import { COLLIDABLE } from "../../engine/components/collidable";
import { LAYER } from "../../engine/components/layer";
import { SHOOTABLE } from "../../engine/components/shootable";
import { ATTACKABLE } from "../../engine/components/attackable";
import { generateNpcData } from "../balancing/units";
import { Vanishable, VANISHABLE } from "../../engine/components/vanishable";
import { colorPalettes, recolorSprite } from "./templates";
import {
  blast,
  blockCorner1,
  blockCorner2,
  blockSide1,
  blockSide2,
  bolt,
  edge,
  slashCorner,
  slashSide,
  waveCorner,
  waveSide,
} from "./templates/particles";
import {
  animateEvaporate,
  dropEntity,
  MAX_DROP_RADIUS,
  placeRemains,
} from "../../engine/systems/drop";
import { getHarvestTarget } from "../../engine/systems/harvesting";
import { TypedEntity } from "../../engine/entities";

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

export const raiseCondition: Sequence<ConditionSequence> = (
  world,
  entity,
  state
) => {
  const generation = Math.ceil(
    state.elapsed / world.metadata.gameEntity[REFERENCE].tick
  );
  let updated = false;
  const finished =
    !entity[CONDITIONABLE].raise || generation > state.args.duration;

  const swordEntity = world.getEntityByIdAndComponents(
    entity[EQUIPPABLE].sword,
    [SPRITE]
  );

  // requires sword to be worn
  if (!swordEntity) {
    return { updated: false, finished: false };
  }

  if (!state.particles.condition) {
    const conditionParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: 0,
        offsetY: 0,
        offsetZ: lootHeight,
        amount: 0,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: raiseParticle,
    });
    state.particles.condition = world.getEntityId(conditionParticle);

    const swordParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: 0,
        offsetY: 0,
        offsetZ: decayHeight,
        amount: 0,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: swordEntity[SPRITE],
    });
    state.particles.sword = world.getEntityId(swordParticle);

    updated = true;
  }

  // blink particle
  const targetAmount = generation % 2;

  const conditionParticle = world.assertByIdAndComponents(
    state.particles.condition,
    [PARTICLE]
  );

  if (conditionParticle[PARTICLE].amount !== targetAmount) {
    conditionParticle[PARTICLE].amount = targetAmount;
    rerenderEntity(world, conditionParticle);
    updated = true;
  }

  if (finished) {
    for (const particleName in state.particles) {
      const particleEntity = world.assertById(state.particles[particleName]);
      disposeEntity(world, particleEntity);
      delete state.particles[particleName];
    }

    // clear condition from entity
    delete entity[CONDITIONABLE].raise;
  }

  return { finished, updated };
};

export const blockCondition: Sequence<ConditionSequence> = (
  world,
  entity,
  state
) => {
  const tick = world.metadata.gameEntity[REFERENCE].tick;
  const generation = Math.ceil(state.elapsed / tick);
  let updated = false;
  const inactive =
    !entity[CONDITIONABLE].block || generation >= state.args.duration;

  // trim duration on popping bubble
  if (inactive && state.args.duration > generation + 1) {
    state.args.duration = generation;
  }

  const finished = generation >= state.args.duration + 1;

  const sideSprite = [
    blockSide1[state.args.material].default,
    blockSide2[state.args.material].default,
  ][generation % 2];
  const cornerSprite = [
    blockCorner1[state.args.material].default,
    blockCorner2[state.args.material].default,
  ][generation % 2];

  if (!state.particles["side-up"]) {
    for (const iteration of iterations) {
      const sidePosition = iteration.direction;
      const sideParticle = entities.createFibre(world, {
        [ORIENTABLE]: { facing: iteration.orientation },
        [PARTICLE]: {
          offsetX: sidePosition.x,
          offsetY: sidePosition.y,
          offsetZ: particleHeight,
          animatedOrigin: { x: 0, y: 0 },
          amount: 0,
          duration: tick,
        },
        [RENDERABLE]: { generation: 1 },
        [SPRITE]: sideSprite,
      });
      state.particles[`side-${iteration.orientation}`] =
        world.getEntityId(sideParticle);

      const cornerPosition = add(sidePosition, iteration.normal);
      const cornerParticle = entities.createFibre(world, {
        [ORIENTABLE]: { facing: iteration.orientation },
        [PARTICLE]: {
          offsetX: cornerPosition.x,
          offsetY: cornerPosition.y,
          offsetZ: particleHeight,
          animatedOrigin: { x: 0, y: 0 },
          amount: 0,
          duration: tick,
        },
        [RENDERABLE]: { generation: 1 },
        [SPRITE]: cornerSprite,
      });
      state.particles[`corner-${iteration.orientation}`] =
        world.getEntityId(cornerParticle);

      updated = true;
    }
  }

  // blink particles
  const targetAmount = generation % 2;

  const conditionParticle = world.assertByIdAndComponents(
    state.particles["side-up"],
    [PARTICLE]
  );

  if (conditionParticle[PARTICLE].amount !== targetAmount) {
    for (const particleName in state.particles) {
      const particleEntity = world.assertByIdAndComponents(
        state.particles[particleName],
        [PARTICLE, SPRITE]
      );
      particleEntity[PARTICLE].amount = targetAmount;
      particleEntity[SPRITE] = particleName.startsWith("side-")
        ? sideSprite
        : cornerSprite;
      rerenderEntity(world, particleEntity);
    }
    updated = true;
  }

  // burst bubble
  if (
    inactive &&
    (conditionParticle[PARTICLE].offsetX !== 0 ||
      conditionParticle[PARTICLE].offsetY !== 0)
  ) {
    for (const particleName in state.particles) {
      const particleEntity = world.assertByIdAndComponents(
        state.particles[particleName],
        [PARTICLE, SPRITE]
      );
      particleEntity[PARTICLE].offsetX = 0;
      particleEntity[PARTICLE].offsetY = 0;
      rerenderEntity(world, particleEntity);
    }
    updated = true;

    // clear condition from entity
    delete entity[CONDITIONABLE].block;
  }

  if (finished) {
    for (const particleName in state.particles) {
      const particleEntity = world.assertById(state.particles[particleName]);
      disposeEntity(world, particleEntity);
      delete state.particles[particleName];
    }
  }

  return { finished, updated };
};

const harvestScratches: Record<Resource, string> = {
  tree: colors.maroon,
  rock: colors.silver,
};

export const axeCondition: Sequence<ConditionSequence> = (
  world,
  entity,
  state
) => {
  const tick = world.getEntityByIdAndComponents(entity[MOVABLE]?.reference, [
    REFERENCE,
  ])?.[REFERENCE].tick;
  let updated = false;

  const axeEntity = world.getEntityByIdAndComponents(
    entity[EQUIPPABLE].secondary,
    [ITEM, SPRITE]
  );
  const swordEntity = world.getEntityByIdAndComponents(
    entity[EQUIPPABLE].sword,
    [ITEM]
  );
  const shieldEntity = world.getEntityByIdAndComponents(
    entity[EQUIPPABLE].shield,
    [ITEM]
  );

  const finished =
    !entity[CONDITIONABLE].axe ||
    !tick ||
    axeEntity?.[ITEM].secondary !== "axe";

  // requires axe to be worn
  if (!axeEntity) {
    return { updated: false, finished: false };
  }

  // hide sword and shield
  if (swordEntity && swordEntity[ITEM].amount !== 0) {
    swordEntity[ITEM].amount = 0;
    rerenderEntity(world, swordEntity);
    updated = true;
  }
  if (shieldEntity && shieldEntity[ITEM].amount !== 0) {
    shieldEntity[ITEM].amount = 0;
    rerenderEntity(world, shieldEntity);
    updated = true;
  }

  if (!state.particles.condition) {
    const conditionParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: 0,
        offsetY: 0,
        offsetZ: lootHeight,
        amount: 0,
        animatedOrigin: { x: 0, y: 0 },
        duration: tick && tick / 2,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: axeEntity[SPRITE],
    });
    state.particles.condition = world.getEntityId(conditionParticle);

    updated = true;
  }

  const conditionParticle = world.assertByIdAndComponents(
    state.particles.condition,
    [PARTICLE]
  );
  if (finished) {
    disposeEntity(world, conditionParticle);
    delete state.particles.condition;
    delete entity[CONDITIONABLE].axe;

    // reset sword and shield
    if (swordEntity) {
      swordEntity[ITEM].amount = 1;
      rerenderEntity(world, swordEntity);
    }
    if (shieldEntity) {
      shieldEntity[ITEM].amount = 1;
      rerenderEntity(world, shieldEntity);
    }
  } else {
    const targetDuration = entity[CONDITIONABLE].axe.duration;
    const targetOrientation = entity[CONDITIONABLE].axe.orientation as
      | Orientation
      | undefined;
    const targetEntity = getHarvestTarget(world, entity, axeEntity);
    const progress = state.elapsed - state.args.duration;
    let scratching = true;

    if (
      targetEntity &&
      targetDuration &&
      targetDuration !== state.args.duration &&
      targetOrientation
    ) {
      // move axe out
      state.args.duration = targetDuration;
      state.args.orientation = targetOrientation;
      const delta = orientationPoints[targetOrientation];
      conditionParticle[PARTICLE].offsetX = delta.x;
      conditionParticle[PARTICLE].offsetY = delta.y;
      rerenderEntity(world, conditionParticle);
      scratching = false;
      updated = true;
    } else if (
      targetEntity &&
      state.args.orientation &&
      targetOrientation &&
      progress > tick / 2
    ) {
      // perform harvest
      targetEntity[HARVESTABLE].amount -= entity[CONDITIONABLE].axe.amount;
      rerenderEntity(world, targetEntity);

      // bump target resource
      if (targetEntity[ORIENTABLE] && targetEntity[MOVABLE]) {
        targetEntity[ORIENTABLE].facing = state.args.orientation;
        targetEntity[MOVABLE].bumpGeneration =
          targetEntity[RENDERABLE].generation;
        targetEntity[MOVABLE].bumpOrientation = state.args.orientation;
      }

      // create scratch
      const delta = orientationPoints[targetOrientation];
      const scratchParticle = entities.createParticle(world, {
        [PARTICLE]: {
          offsetX: delta.x * 2,
          offsetY: delta.y * 2,
          offsetZ: particleHeight,
          animatedOrigin: copy(delta),
          duration: tick / 2,
        },
        [RENDERABLE]: { generation: 1 },
        [SPRITE]: createText(choice(...scratchChars), harvestScratches.tree)[0],
      });
      state.particles[`scratch-${targetEntity[RENDERABLE].generation}`] =
        world.getEntityId(scratchParticle);

      // move axe back
      entity[CONDITIONABLE].axe.orientation = undefined;
      state.args.orientation = undefined;
      conditionParticle[PARTICLE].offsetX = 0;
      conditionParticle[PARTICLE].offsetY = 0;
      rerenderEntity(world, conditionParticle);
      updated = true;
    } else if (
      !state.args.orientation &&
      !targetOrientation &&
      state.args.duration &&
      targetDuration &&
      progress > tick
    ) {
      // reset axe
      entity[CONDITIONABLE].axe.duration = 0;
      state.args.duration = 0;
      scratching = false;
      updated = true;
    }

    if (!scratching) {
      // clear scratch
      for (const particleName in state.particles) {
        if (!particleName.startsWith("scratch-")) continue;
        const particleEntity = world.assertById(state.particles[particleName]);
        disposeEntity(world, particleEntity);
        delete state.particles[particleName];
      }
    }
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
const slashInverse = true;

export const chargeSlash: Sequence<SlashSequence> = (world, entity, state) => {
  // TODO: resolve circular dependencies and move outside of handler
  const slashIterations = slashInverse
    ? [...iterations.slice(1), ...iterations.slice(0, 3)]
    : [...reversedIterations.slice(2), ...reversedIterations.slice(0, 2)];
  const size = world.metadata.gameEntity[LEVEL].size;
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
      const sidePosition = combine(
        size,
        castableEntity[POSITION],
        iteration.direction
      );
      const sideExertable = entities.createAoe(world, {
        [EXERTABLE]: { castable: state.args.castable },
        [POSITION]: sidePosition,
      });
      const cornerExertable = entities.createAoe(world, {
        [EXERTABLE]: { castable: state.args.castable },
        [POSITION]: combine(size, sidePosition, iteration.normal),
      });
      state.args.exertables.push(
        world.getEntityId(sideExertable),
        world.getEntityId(cornerExertable)
      );
    }

    updated = true;
  }

  if (targetProgress > currentProgress && !finished) {
    const slashSideSprite = slashSide[state.args.material].default;
    const slashCornerSprite = slashCorner[state.args.material].default;

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
        [SPRITE]: isCorner ? slashCornerSprite : slashSideSprite,
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

export const castBeam1: Sequence<SpellSequence> = (world, entity, state) => {
  const entityId = world.getEntityId(entity);
  const size = world.metadata.gameEntity[LEVEL].size;
  const progress = Math.ceil(state.elapsed / beamSpeed);
  const delta = orientationPoints[entity[ORIENTABLE].facing as Orientation];
  const material = state.args.material || "default";
  const element = state.args.element || "default";
  const limit = {
    x: delta.x * state.args.range,
    y: delta.y * state.args.range,
  };

  // stop casting if caster is dead
  const casterEntity = world.getEntityById(entity[CASTABLE].caster);
  const abort = !casterEntity || isDead(world, casterEntity);

  if (abort && state.args.duration > progress + state.args.range) {
    state.args.duration = progress + state.args.range;
  }

  let finished = progress > state.args.duration;
  let updated = false;

  // create edge particles
  if (!state.particles.start) {
    updated = true;

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
      [SPRITE]: edge[material][element],
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
      [SPRITE]: edge[material][element],
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
      [POSITION]: combine(size, entity[POSITION], offset),
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

  if (state.args.progress !== progress && progress > 3) {
    // create bolts
    if (
      progress <= state.args.duration - state.args.range &&
      (progress - 1) % beamTicks === 0
    ) {
      const boltParticle = entities.createParticle(world, {
        [PARTICLE]: {
          offsetX: limit.x,
          offsetY: limit.y,
          offsetZ: particleHeight,
          duration: beamSpeed * (state.args.range - 1),
          amount: 2,
          animatedOrigin: copy(delta),
        },
        [RENDERABLE]: { generation: 1 },
        [SPRITE]: bolt[material][element],
      });

      state.particles[`bolt-${progress}`] = world.getEntityId(boltParticle);
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
        ? progress - parseInt(particleName.split("-")[1]) + 1
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
  }

  return { finished, updated };
};

const boltSpeed = 200;

export const castBolt1: Sequence<SpellSequence> = (world, entity, state) => {
  const entityId = world.getEntityId(entity);
  const size = world.metadata.gameEntity[LEVEL].size;
  const progress = Math.ceil(state.elapsed / boltSpeed);
  const delta = orientationPoints[entity[ORIENTABLE].facing as Orientation];
  const material = state.args.material || "default";
  const element = state.args.element || "default";
  const limit = {
    x: delta.x * state.args.range,
    y: delta.y * state.args.range,
  };

  let finished =
    progress > state.args.duration ||
    Object.keys(entity[CASTABLE].affected).length > 0;
  let updated = false;

  // create bolt particle
  if (!state.particles.bolt) {
    const boltParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: limit.x,
        offsetY: limit.y,
        offsetZ: particleHeight,
        duration: boltSpeed * state.args.range,
        animatedOrigin: { x: 0, y: 0 },
        amount: 3,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: bolt[material][element],
    });
    state.particles.bolt = world.getEntityId(boltParticle);
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
      [POSITION]: combine(size, entity[POSITION], offset),
    });
    registerEntity(world, aoeEntity);
    state.args.areas.push(world.getEntityId(aoeEntity));
    updated = true;
  }

  // remove effect areas
  for (
    let clearProgress = state.args.progress - 1;
    clearProgress > 0 && clearProgress < progress - 1;
    clearProgress += 1
  ) {
    const aoeId = state.args.areas.shift();

    if (!aoeId) break;

    const aoeEntity = world.assertById(aoeId);
    disposeEntity(world, aoeEntity);
    updated = true;
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

  state.args.progress = progress;

  return { finished, updated };
};

const blastSpeed = 700;

export const castBlast: Sequence<SpellSequence> = (world, entity, state) => {
  const entityId = world.getEntityId(entity);
  const size = world.metadata.gameEntity[LEVEL].size;
  const progress = Math.round(state.elapsed / blastSpeed);
  const orientation = entity[ORIENTABLE].facing as Orientation;
  const delta = orientationPoints[orientation];
  const material = state.args.material || "default";
  const element = state.args.element || "default";
  const limit = {
    x: delta.x * state.args.range,
    y: delta.y * state.args.range,
  };

  let finished = progress > state.args.duration;
  let updated = false;

  // create blast particles
  if (!state.particles.blast) {
    const blastParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: 0,
        offsetY: 0,
        offsetZ: particleHeight,
        duration: blastSpeed * state.args.range,
        animatedOrigin: { x: 0, y: 0 },
        amount: 3,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: blast[material][element],
    });
    state.particles.blast = world.getEntityId(blastParticle);

    for (const iteration of iterations) {
      const sideParticle = entities.createFibre(world, {
        [ORIENTABLE]: { facing: iteration.orientation },
        [PARTICLE]: {
          offsetX: iteration.direction.x,
          offsetY: iteration.direction.y,
          offsetZ: particleHeight,
          duration: blastSpeed * state.args.range,
          animatedOrigin: copy(iteration.direction),
        },
        [RENDERABLE]: { generation: 1 },
        [SPRITE]: blast[material][element],
      });
      state.particles[`side-${iteration.orientation}`] =
        world.getEntityId(sideParticle);
    }
  }

  // initiate movement
  const blastEntity = world.assertByIdAndComponents(state.particles.blast, [
    PARTICLE,
  ]);

  if (
    progress > 0 &&
    blastEntity[PARTICLE].offsetX === 0 &&
    blastEntity[PARTICLE].offsetY === 0
  ) {
    blastEntity[PARTICLE].offsetX = limit.x;
    blastEntity[PARTICLE].offsetY = limit.y;
    rerenderEntity(world, blastEntity);

    // move side particles
    for (const iteration of iterations) {
      const sideEntity = world.assertByIdAndComponents(
        state.particles[`side-${iteration.orientation}`],
        [PARTICLE]
      );
      sideEntity[PARTICLE].offsetX = limit.x + iteration.direction.x;
      sideEntity[PARTICLE].offsetY = limit.y + iteration.direction.y;
      rerenderEntity(world, sideEntity);
    }

    updated = true;
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
    const positions =
      aoeProgress === 0
        ? [
            offset,
            ...iterations.map((iteration) => add(offset, iteration.direction)),
          ]
        : iterations
            .filter(
              (iteration) =>
                orientation !== invertOrientation(iteration.orientation)
            )
            .map((iteration) => add(offset, iteration.direction));

    for (const position of positions) {
      const aoeEntity = entities.createAoe(world, {
        [EXERTABLE]: { castable: entityId },
        [POSITION]: combine(size, entity[POSITION], position),
      });
      registerEntity(world, aoeEntity);
      state.args.areas.push(world.getEntityId(aoeEntity));
    }
    updated = true;
  }

  // remove effect areas
  for (
    let clearProgress = state.args.progress - 1;
    clearProgress > 0 && clearProgress < progress - 1;
    clearProgress += 1
  ) {
    const offset = {
      x: delta.x * clearProgress,
      y: delta.y * clearProgress,
    };

    const positions = iterations
      .filter((iteration) => orientation !== iteration.orientation)
      .map((iteration) => add(offset, iteration.direction));

    for (const position of positions) {
      const aoeEntities = getExertables(
        world,
        combine(size, entity[POSITION], position)
      );

      for (const aoeEntity of aoeEntities) {
        const aoeId = world.getEntityId(aoeEntity);

        const aoeIndex = state.args.areas.indexOf(aoeId);

        if (aoeIndex === -1) {
          console.log("error", position);
        } else {
          state.args.areas.splice(aoeIndex, 1);
        }
        disposeEntity(world, aoeEntity);
      }
    }

    updated = true;
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

  state.args.progress = progress;

  return { finished, updated };
};

const markerDuration = 150;
const healMultiplier = 2;
const markerType: Record<DamageType, Sprite> = {
  melee: meleeHit,
  magic: magicHit,
  true: heal,
};

const scratchChars = [..."',.`·∙"];

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

  // create hit marker
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

  // create scratch
  const orientation = state.args.orientation;
  const rootEntity = getRoot(world, entity);
  const scratchColor = rootEntity?.[ATTACKABLE]?.scratchColor;

  if (
    orientation &&
    scratchColor &&
    !state.particles.scratch &&
    state.args.type !== "true"
  ) {
    const delta = orientationPoints[orientation];
    const scratchParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: delta.x,
        offsetY: delta.y,
        offsetZ: particleHeight,
        animatedOrigin: { x: 0, y: 0 },
        duration: markerTime,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: createText(choice(...scratchChars), scratchColor)[0],
    });
    state.particles.scratch = world.getEntityId(scratchParticle);

    updated = true;
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

  // create decay particle
  if (!state.particles.decay && state.elapsed > decayDelay && !finished) {
    const decayParticle = entities.createParticle(world, {
      [PARTICLE]: { offsetX: 0, offsetY: 0, offsetZ: decayHeight },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: decay,
    });
    state.particles.decay = world.getEntityId(decayParticle);
    updated = true;
  }

  // delete decay particles and make entity lootable
  if (finished) {
    const decayParticle = world.assertByIdAndComponents(state.particles.decay, [
      PARTICLE,
    ]);

    disposeEntity(world, decayParticle);
    delete state.particles.decay;

    if (entity[DROPPABLE]) entity[DROPPABLE].decayed = true;
    if (entity[BURNABLE]) entity[BURNABLE].decayed = true;
  }

  return { finished, updated };
};

const evaporateTime = 100;
const evaporateHeight = 10;

export const creatureEvaporate: Sequence<EvaporateSequence> = (
  world,
  entity,
  state
) => {
  let updated = false;
  const evaporateSpeed = state.args.fast ? evaporateTime : evaporateTime * 4;
  const finished = state.elapsed > evaporateSpeed * evaporateHeight;

  // create evaporate particle
  if (!state.particles.evaporate) {
    const evaporateParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: 0,
        offsetY: -evaporateHeight,
        offsetZ: particleHeight,
        animatedOrigin: { x: 0, y: 0 },
        duration: evaporateSpeed * evaporateHeight,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: state.args.sprite,
    });
    state.particles.evaporate = world.getEntityId(evaporateParticle);
    updated = true;
  }

  // delete evaporate particle
  if (finished) {
    const evaporateParticle = world.assertByIdAndComponents(
      state.particles.evaporate,
      [PARTICLE]
    );

    disposeEntity(world, evaporateParticle);
    delete state.particles.evaporate;
  }

  return { finished, updated };
};

const vanishConfig: Record<
  Vanishable["type"],
  { grow: Sprite[]; shrink: Sprite[]; evaporate?: Sprite }
> = {
  plant: {
    grow: [
      vanishGrow0,
      vanishGrow1,
      vanishGrow2,
      vanishGrow3,
      vanishGrow4,
      vanishGrow5,
      vanishGrow5,
    ],
    shrink: [vanishShrink0, vanishShrink1, vanishShrink2],
    evaporate: vanishEvaporate,
  },
  evaporate: { grow: [decay], shrink: [] },
};
const evaporateTicks = 3;

export const creatureVanish: Sequence<VanishSequence> = (
  world,
  entity,
  state
) => {
  const entityId = world.getEntityId(entity);
  const size = world.metadata.gameEntity[LEVEL].size;
  const tick = world.metadata.gameEntity[REFERENCE].tick;
  const vanishGeneration = Math.floor(state.elapsed / tick);
  let updated = false;
  const existingLimbs = state.args.limbs;
  const finished = state.args.remaining <= 0 && !!existingLimbs;
  let limbs = existingLimbs || {};
  const vanishGrowSprites = vanishConfig[state.args.type].grow;
  const vanishShrinkSprites = vanishConfig[state.args.type].shrink;
  const evaporateSprite = vanishConfig[state.args.type].evaporate;

  if (vanishGeneration === 0 && !existingLimbs) {
    // create initial limb
    state.args.remaining += 1;
    limbs[entityId] = {
      generation: 0,
      delta: { x: 0, y: 0 },
      evaporated: !evaporateSprite,
      decayed: false,
    };
    state.args.limbs = limbs;
    const vanishParticle = entities.createParticle(world, {
      [PARTICLE]: { offsetX: 0, offsetY: 0, offsetZ: decayHeight },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: vanishGrowSprites[0] || none,
    });
    state.particles[entityId] = world.getEntityId(vanishParticle);
    updated = true;
  } else if (state.args.generation !== vanishGeneration) {
    state.args.generation = vanishGeneration;
    updated = true;

    // grow vanishing limbs
    if (state.args.grow) {
      for (const { delta } of Object.values(limbs)) {
        // add adjacent limbs
        for (const iteration of iterations) {
          const target = combine(
            size,
            entity[POSITION],
            delta,
            iteration.direction
          );
          const fragmentEntity = getFragments(world, target).filter(
            (fragment) => fragment[FRAGMENT].structure === entityId
          )[0];

          if (fragmentEntity) {
            const fragmentId = world.getEntityId(fragmentEntity);

            // skip already added limbs in previous iterations
            if (fragmentId in limbs) continue;

            const delta = {
              x: signedDistance(
                entity[POSITION].x,
                fragmentEntity[POSITION].x,
                size
              ),
              y: signedDistance(
                entity[POSITION].y,
                fragmentEntity[POSITION].y,
                size
              ),
            };
            const delay = random(0, 1);
            limbs[fragmentId] = {
              generation: vanishGeneration + delay,
              delta: copy(delta),
              evaporated: !evaporateSprite,
              decayed: false,
            };
            const vanishParticle = entities.createParticle(world, {
              [PARTICLE]: {
                offsetX: delta.x,
                offsetY: delta.y,
                offsetZ: decayHeight,
              },
              [RENDERABLE]: { generation: 1 },
              [SPRITE]: none,
            });
            state.particles[fragmentId] = world.getEntityId(vanishParticle);
          }
        }
      }
    }
  }

  // update vanish and evaporate particles
  if (updated) {
    for (const [
      limbId,
      { generation, delta, evaporated, decayed },
    ] of Object.entries(limbs)) {
      // expire finished particles
      const progress = vanishGeneration - generation;
      const evaporateName = `${limbId}-evaporate`;
      const evaporateParticle = world.getEntityByIdAndComponents(
        state.particles[evaporateName],
        [SPRITE, PARTICLE]
      );
      const shouldEvaporate =
        !evaporated &&
        evaporateParticle &&
        (evaporateParticle[PARTICLE].amount || 0) + evaporateTicks <= progress;
      const vanishParticle = world.getEntityByIdAndComponents(
        state.particles[limbId],
        [SPRITE, PARTICLE]
      );
      const vanished =
        progress >= vanishGrowSprites.length + vanishShrinkSprites.length;

      // dispose evaporate and vanish
      if (evaporateParticle && shouldEvaporate) {
        disposeEntity(world, evaporateParticle);
        delete state.particles[evaporateName];
        updated = true;
      }
      if (vanishParticle && vanished) {
        disposeEntity(world, vanishParticle);
        delete state.particles[limbId];
        updated = true;
      }

      // decay limb
      if (!decayed && vanished && (evaporated || shouldEvaporate)) {
        state.args.remaining -= 1;
        limbs[limbId].decayed = true;
        const decayingLimbs = getFragments(world, add(entity[POSITION], delta));
        decayingLimbs.forEach((fragmentEntity) => {
          if (fragmentEntity[FRAGMENT].structure !== entityId) return;

          if (fragmentEntity === entity) {
            // drop and evaporate before unit is fully decayed with all limbs
            dropEntity(world, entity, entity[POSITION], false, MAX_DROP_RADIUS);
            animateEvaporate(world, entity);
            entity[SPRITE] = none;

            // place remains if available
            const remainsLimb = getLimbs(world, entity).find(
              (limb) => limb[DROPPABLE]?.remains
            );
            if (remainsLimb) {
              placeRemains(world, remainsLimb, entity[POSITION]);
            }
            return;
          }

          placeRemains(world, fragmentEntity);
          dropEntity(world, fragmentEntity, fragmentEntity[POSITION]);
          fragmentEntity[DROPPABLE].decayed = true;
        });
        updated = true;
      }

      if (
        progress > vanishGrowSprites.length + vanishShrinkSprites.length ||
        progress < 0
      )
        continue;

      if (progress === vanishGrowSprites.length) {
        // evaporate limb
        if (vanishParticle) {
          vanishParticle[SPRITE] = vanishShrinkSprites[0] || none;
          rerenderEntity(world, vanishParticle);
        }

        if (evaporateSprite) {
          const newEvaporateParticle = entities.createParticle(world, {
            [PARTICLE]: {
              amount: progress,
              offsetX: delta.x,
              offsetY: delta.y - evaporateTicks * 3,
              offsetZ: particleHeight,
              duration: tick * evaporateTicks,
              animatedOrigin: copy(delta),
            },
            [RENDERABLE]: { generation: 1 },
            [SPRITE]: evaporateSprite,
          });
          state.particles[evaporateName] =
            world.getEntityId(newEvaporateParticle);
        }

        // hide limbs
        const limbs = getFragments(world, add(entity[POSITION], delta));
        limbs.forEach((fragmentEntity) => {
          fragmentEntity[SPRITE] = none;
          rerenderEntity(world, fragmentEntity);
        });
      } else if (progress > vanishGrowSprites.length && vanishParticle) {
        // animate shrink
        vanishParticle[SPRITE] =
          vanishShrinkSprites[progress - vanishGrowSprites.length];
        rerenderEntity(world, vanishParticle);
      } else if (progress >= 0 && vanishParticle) {
        // animate grow
        vanishParticle[SPRITE] = vanishGrowSprites[progress];
        rerenderEntity(world, vanishParticle);
      }
    }
  }

  // wait for limbs to dispose
  if (finished) {
    if (getLimbs(world, entity).length > 1) {
      return { updated, finished: false };
    }

    for (const particleName in state.particles) {
      const particleEntity = world.assertByIdAndComponents(
        state.particles[particleName],
        [PARTICLE]
      );

      disposeEntity(world, particleEntity);
      delete state.particles[particleName];
    }

    entity[VANISHABLE].decayed = true;
  }

  return { finished, updated };
};

const weatherConfigs: Record<Weather, { sprite: Sprite; speed: number }> = {
  rain: {
    sprite: rain,
    speed: 50,
  },
  snow: {
    sprite: snowflake,
    speed: 300,
  },
};
const weatherArea = { x: 36, y: 16 };
const dropHeight = 12;

export const weatherStorm: Sequence<WeatherSequence> = (
  world,
  entity,
  state
) => {
  const finished = false;
  let updated = false;

  // keep track of absolutely positioned viewpoint
  const size = world.metadata.gameEntity[LEVEL].size;
  const viewables = world.getEntities([VIEWABLE, POSITION]);
  const viewable = getActiveViewable(viewables);

  const normalizedX = normalize(state.args.viewable.x, size);
  const normalizedY = normalize(state.args.viewable.y, size);
  if (normalizedX !== viewable[POSITION].x) {
    state.args.viewable.x += signedDistance(
      state.args.viewable.x,
      viewable[POSITION].x,
      size
    );
  }
  if (normalizedY !== viewable[POSITION].y) {
    state.args.viewable.y += signedDistance(
      state.args.viewable.y,
      viewable[POSITION].y,
      size
    );
  }

  const generation = world.metadata.gameEntity[RENDERABLE].generation;
  const duration = state.args.end - state.args.start;

  // create drops
  if (generation !== state.args.generation && generation < state.args.end) {
    const { sprite, speed } = weatherConfigs[state.args.type];
    const position = state.args.position;
    const proximity =
      state.args.intensity === 0
        ? 1
        : 1 -
          sigmoid(
            getDistance(
              viewable[POSITION],
              position,
              size,
              state.args.ratio || aspectRatio
            ),
            state.args.intensity,
            0.25
          );
    const intensity = calculateWeatherIntensity(
      duration,
      generation - state.args.start,
      weatherIntensity[state.args.type]
    );
    const precipitation = Math.round(intensity * proximity);

    for (let index = 0; index < precipitation; index += 1) {
      const offset = {
        x: random(-weatherArea.x / 2, weatherArea.x / 2),
        y: random(-weatherArea.y / 2, weatherArea.y / 2),
      };
      const fast = offset.y > 0;
      const target = add(state.args.viewable, offset);
      const dropName = `drop-${generation}-${index}`;
      state.args.drops.push({
        position: target,
        fast,
        timestamp: state.elapsed,
        particle: dropName,
      });

      const dropEntity = entities.createParticle(world, {
        [PARTICLE]: {
          offsetX: target.x,
          offsetY: target.y,
          offsetZ: particleHeight,
          duration: speed * dropHeight * (fast ? 1 : 2),
          animatedOrigin: { x: target.x, y: target.y - dropHeight },
          amount: distribution(50, 30, 20) + 1,
        },
        [RENDERABLE]: { generation: 1 },
        [SPRITE]: sprite,
      });
      state.particles[dropName] = world.getEntityId(dropEntity);
      updated = true;
    }

    state.args.generation = generation;
  }

  // convert drops to bubbles
  const remainingDrops = [];
  for (const drop of state.args.drops) {
    const age = state.elapsed - drop.timestamp;
    if (
      age >=
      (dropHeight * (drop.fast ? 1 : 2) - 1) *
        weatherConfigs[state.args.type].speed
    ) {
      updated = true;

      disposeEntity(world, world.assertById(state.particles[drop.particle]));
      delete state.particles[drop.particle];

      if (state.args.intensity !== 0) {
        if (state.args.type === "rain") {
          createBubble(world, drop.position, "rain");
        } else {
          coverSnow(world, drop.position);
        }
      }
      continue;
    }
    remainingDrops.push(drop);
  }

  if (updated) {
    state.args.drops = remainingDrops;
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

const xpTime = 180;

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
    for (const iteration of iterations) {
      const xpParticle = entities.createFibre(world, {
        [ORIENTABLE]: { facing: iteration.orientation },
        [PARTICLE]: {
          offsetX: (iteration.direction.x + iteration.normal.x) * 2,
          offsetY: (iteration.direction.y + iteration.normal.y) * 2,
          offsetZ: effectHeight,
          duration: xpTime * 2 * Math.sqrt(2),
          animatedOrigin: { x: 0, y: 0 },
        },
        [RENDERABLE]: { generation: 1 },
        [SPRITE]: xpDot,
      });
      state.particles[`xp-${iteration.orientation}`] =
        world.getEntityId(xpParticle);
    }

    updated = true;
  }

  if (generation > 2 && generation > state.args.generation && heroEntity) {
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
  } else if (transaction === "map") {
    handler = displayMap;
  } else if (transaction === "class") {
    handler = displayClass;
  } else if (transaction === "style") {
    handler = displayStyle;
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
            [colors.black]:
              selected && consumptionColor
                ? darken(consumptionColor)
                : colors.black,
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
            ? itemConsumption && consumptionColor
              ? shaded(line, darken(consumptionColor), "▄")
              : consumptionConfig && consumptionColor
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
  const displayStats = getEntityDisplayStats(world, entity);
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
      displayStats[stat].toString(),
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
  boots: "Boots",
  primary: "Spell",
  secondary: "Item",
  ring: "Ring",
  amulet: "Amulet",
  compass: "Compass",
  torch: "Torch",
  map: "Map",
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
  map: mapSlot,
  boots: bootsSlot,
};
const gearOverscan = 1;
const classPixels: Partial<Record<ClassKey, Sprite[][]>> = {
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
    shieldItem?.material || shieldItem?.element
      ? recolorPixels(shieldPixels, {
          [colors.white]:
            colorPalettes[(shieldItem.material || shieldItem.element)!].primary,
        })
      : [],
    shieldItem?.material && shieldItem?.element
      ? recolorPixels(shieldElementPixels, {
          [colors.white]:
            // adjust low constrast on gold material and air element
            shieldItem.material === "gold" && shieldItem.element === "air"
              ? colors.grey
              : colorPalettes[shieldItem.element].primary,
        })
      : [],
    bodyPixels,
    recolorPixels(
      classPixels[(entity[SPAWNABLE] as Spawnable).classKey] || [],
      {
        [colors.white]: entity[SPAWNABLE].hairColor,
      }
    ),
    swordItem?.material || swordItem?.element
      ? recolorPixels(swordPixels, {
          [colors.white]:
            colorPalettes[(swordItem?.material || swordItem?.element)!].primary,
        })
      : [],
    swordItem?.material && swordItem?.element
      ? recolorPixels(swordElementPixels, {
          [colors.white]:
            // adjust low constrast on gold material and air element
            swordItem.material === "gold" && swordItem.element === "air"
              ? colors.grey
              : colorPalettes[swordItem.element].primary,
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

const cellColorWeights: Partial<Record<CellType, [string, number]>> = {
  water_shallow: [colors.navy, 2],
  water_deep: [colors.navy, 4],
  sand: [colors.olive, 2],
  // TODO: draw path using line chars
  // path: [colors.white, 5],
  mountain: [colors.silver, 4],
  ore: [colors.silver, 4],
  desert_stone: [colors.olive, 1],
  rock: [colors.silver, 3],
  desert_rock: [colors.silver, 3],
  tree: [colors.green, 1],
  hedge: [colors.green, 1],
  cactus: [colors.green, 3],
  ice: [colors.aqua, 1],
  palm: [colors.olive, 1],
  palm_fruit: [colors.olive, 1],
  desert_palm: [colors.olive, 1],
  desert_palm_fruit: [colors.olive, 1],
  fence: [colors.maroon, 3],
  fruit: [colors.green, 1],
};

const gridPixels = 2;
const halfBlockChars = "▀▐▄▌▀▐▄▌";

export const displayMap: Sequence<PopupSequence> = (world, entity, state) => {
  const generation = world.metadata.gameEntity[RENDERABLE].generation;
  const blinkGeneration = Math.floor(generation / warpBlink) * warpBlink;
  const showPlayer = generation % (warpBlink * 2) < warpBlink;

  // show blinking player at center
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

  const verticalIndex = getVerticalIndex(world, entity);
  const resolution = (verticalIndex + 1) * 2;
  const heroEntity = getIdentifierAndComponents(world, "hero", [POSITION]);
  const size = world.metadata.gameEntity[LEVEL].size;
  const fogSprite = [mapZoom1, mapZoom2, mapZoom3, mapZoom4][verticalIndex];

  const content: Sprite[][] = heroEntity
    ? Array.from({ length: frameHeight - 2 }).map((_, gridY) =>
        Array.from({ length: frameWidth - 2 }).map((_, gridX) => {
          const topLeft = combine(size, heroEntity[POSITION], {
            x: (gridX - (frameWidth - 3) / 2) * resolution * gridPixels,
            y: (gridY - (frameHeight - 3) / 2) * resolution * gridPixels,
          });

          const gridColorPixels: Record<string, number>[] = [];
          for (let pixelX = 0; pixelX < gridPixels; pixelX += 1) {
            for (let pixelY = 0; pixelY < gridPixels; pixelY += 1) {
              const gridColors: Record<string, number> = {};
              for (let offsetX = 0; offsetX < resolution; offsetX += 1) {
                for (let offsetY = 0; offsetY < resolution; offsetY += 1) {
                  const target = combine(size, topLeft, {
                    x: offsetX + pixelX * gridPixels,
                    y: offsetY + pixelY * gridPixels,
                  });
                  const initialized =
                    world.metadata.gameEntity[LEVEL].initialized[target.x][
                      target.y
                    ];
                  const cell =
                    world.metadata.gameEntity[LEVEL].cells[target.x][target.y];
                  const entities = initialized
                    ? Object.values(getCell(world, target))
                    : [];
                  const discovered =
                    initialized &&
                    !entities.find(
                      (entity) =>
                        entity[FOG]?.type === "air" &&
                        entity[FOG]?.visibility === "hidden"
                    );

                  if (!discovered) continue;
                  const cellColor = cellColorWeights[cell]?.[0] || colors.black;
                  const cellWeight = cellColorWeights[cell]?.[1] || 0.5;
                  gridColors[cellColor] =
                    (gridColors[cellColor] || 0) + cellWeight;
                }
              }

              gridColorPixels.push(gridColors);
            }
          }

          let cellSprite;

          // show fog if all pixels are undiscovered
          if (
            gridColorPixels.every(
              (gridColors) => Object.keys(gridColors).length === 0
            )
          ) {
            cellSprite = fogSprite;
          } else {
            // construct padded array for easier pixel comparison
            const clockwisePixels = [
              gridColorPixels[0],
              gridColorPixels[2],
              gridColorPixels[3],
              gridColorPixels[1],
              gridColorPixels[0],
              gridColorPixels[2],
              gridColorPixels[3],
            ];
            const halfBlockIndex = (gridX + gridY) % orientations.length;
            const halfBlockColors = Object.entries(
              clockwisePixels[halfBlockIndex]
            )
              .concat(Object.entries(clockwisePixels[halfBlockIndex + 1]))
              .reduce((combined, [color, count]) => {
                combined[color] = (combined[color] || 0) + count;
                return combined;
              }, {} as Record<string, number>);

            const pixelColors = [
              halfBlockColors,
              clockwisePixels[halfBlockIndex + 2],
              clockwisePixels[halfBlockIndex + 3],
            ];
            const dominantColors = pixelColors.map(
              (gridColors) =>
                Object.entries(gridColors).reduce<[string, number]>(
                  (max, entry) => (entry[1] > max[1] ? entry : max),
                  ["", -Infinity]
                )[0]
            );

            const layers = [
              {
                char: halfBlockChars[halfBlockIndex + 2],
                color: dominantColors[1],
              },
              {
                char: halfBlockChars[halfBlockIndex + 3],
                color: dominantColors[2],
              },
              {
                char: halfBlockChars[halfBlockIndex],
                color: dominantColors[0],
              },
            ].filter((layer) => layer.color);

            cellSprite = {
              name: "",
              layers,
            };

            if (layers.length < 3) {
              cellSprite = mergeSprites(fogSprite, cellSprite);
            }
          }

          if (
            showPlayer &&
            gridX === (frameWidth - 3) / 2 &&
            gridY === (frameHeight - 3) / 2
          )
            return mergeSprites(cellSprite, mapPlayer);

          return cellSprite;
        })
      )
    : [];

  // add padding to show scroll bar
  for (let i = 0; i < verticalIndex; i += 1) {
    content.unshift([]);
  }

  for (let i = 0; i < mapScroll - verticalIndex - 1; i += 1) {
    content.push([]);
  }

  const popupResult = renderPopup(world, entity, state, mapDiscovery, content);
  return {
    updated: popupResult.updated,
    finished: popupResult.finished,
  };
};

const classOverscan = Math.max(6 - displayedClasses.length, 1);
const classUnlock: Partial<Record<ClassKey, Sprite[][]>> = {
  rogue: [],
  knight: [
    [
      ...createText("Defeat a ", colors.grey),
      mergeSprites(chief, hostileBar, createText("/", colors.grey)[0]),
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
      Array.from({ length: displayedClasses.length + classOverscan }),
      "selected",
      [],
      classOverscan
    );

  const selectedClass = displayedClasses[verticalIndex];
  const selectedAvailable = TEST_MODE || selectedClass === "rogue";
  const lines = overlay(
    bodyPixels,
    classPixels[displayedClasses[verticalIndex]] || [],
    ...(selectedAvailable ? [] : [repeat(repeat(parseSprite("\x00░"), 7), 6)])
  );
  const heroPixels = selectedAvailable
    ? lines
    : lines.map((row) => row.map((cell) => recolorSprite(cell, colors.grey)));

  const content: Sprite[][] = Array.from({
    length: Math.max(displayedClasses.length, 6),
  }).map((_, rowIndex) => {
    const className = displayedClasses[rowIndex];

    if (!className)
      return [
        ...repeat(none, 10),
        ...(heroPixels[rowIndex - scrollIndex] || []),
      ];

    const selected = verticalIndex === rowIndex;
    const available = TEST_MODE || className === "rogue";
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

const styleOverscan = Math.max(6 - hairColors.length, 1);
const styleSelections = {
  scout: "a hair",
  rogue: "a hair",
  knight: "a helmet",
  mage: "a hair",
  "???": "an ear",
};

export const displayStyle: Sequence<PopupSequence> = (world, entity, state) => {
  const verticalIndex = getVerticalIndex(world, entity);
  const scrollIndex =
    verticalIndex -
    scrolledVerticalIndex(
      world,
      entity,
      state,
      Array.from({ length: hairColors.length + styleOverscan }),
      "selected",
      [],
      styleOverscan
    );

  const selectedStyle = hairColors[verticalIndex];
  const heroEntity = getIdentifierAndComponents(world, "hero", [SPAWNABLE]);
  const classIndex = entity[POPUP].tabs.indexOf("class");
  const selectedClass =
    classIndex === -1 && heroEntity
      ? heroEntity[SPAWNABLE].classKey
      : TEST_MODE
      ? displayedClasses[entity[POPUP].verticalIndezes[classIndex]]
      : "rogue";
  const lines = overlay(
    bodyPixels,
    recolorPixels(classPixels[selectedClass] || [], {
      [colors.white]: selectedStyle.color,
    })
  );

  const content: Sprite[][] = Array.from({
    length: hairColors.length,
  }).map((_, rowIndex) => {
    const style = hairColors[rowIndex];

    const selected = verticalIndex === rowIndex;
    const styleTitle = createText(
      style.name,
      selected ? colors.white : colors.grey
    );
    const line = [
      ...styleTitle,
      ...repeat(none, frameWidth - 4 - styleTitle.length - 8),
    ];

    return [
      none,
      ...createText(selected ? "*" : "·", selected ? style.color : colors.grey),
      ...(selected ? shaded(line, colors.grey) : line),
      none,
      ...(lines[rowIndex - scrollIndex] || []),
    ];
  });
  for (let i = 0; i < Math.max(1, 7 - hairColors.length); i += 1) {
    content.push([
      ...repeat(none, frameWidth - 2 - 7),
      ...(lines[content.length - scrollIndex] || []),
    ]);
  }
  const popupResult = renderPopup(
    world,
    entity,
    state,
    popupIdles[getTab(world, entity)],
    content,
    "selected",
    [
      createText(`Choose ${styleSelections[selectedClass]}`),
      createText("color."),
    ],
    styleOverscan
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
    createText("Changes:  ", colors.grey),
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
  const verticalIndex = getVerticalIndex(world, entity);

  const allGathered =
    heroEntity && popup.deals.every((deal) => canShop(world, heroEntity, deal));
  const allDefeated =
    heroEntity &&
    popup.targets.every((target) => hasDefeated(world, heroEntity, target));
  const completed = allDefeated && allGathered;
  const objectives = popup.objectives;
  const selections = getTabSelections(world, entity);
  const selectedObjective =
    selections.length === 1 && !completed
      ? objectives[verticalIndex]
      : undefined;
  const selectedChoice =
    selections.length === 1 && completed
      ? popup.choices[verticalIndex]
      : undefined;

  let content: Sprite[][] = [];

  if (selections.length === 0) {
    // show quest details
    const targets =
      popup.targets.length === 0
        ? []
        : pixelFrame(
            questWidth,
            popup.targets.length + 2,
            allDefeated ? colors.grey : colors.red,
            completed ? "dotted" : "solid",
            popup.targets.map((target) => {
              const defeated =
                heroEntity && hasDefeated(world, heroEntity, target);
              const [sprite, ...name] = createUnitName(target.unit);
              const text = [
                ...createText(
                  target.amount > 1
                    ? target.amount.toString().padStart(2)
                    : "  ",
                  defeated ? colors.grey : colors.silver
                ),
                sprite,
                ...(defeated ? name : brightenSprites(name)),
              ];
              const line = [
                ...text,
                ...repeat(none, questWidth - text.length - 2),
              ];
              return defeated ? strikethrough(line) : line;
            }),
            createText("Defeat", allDefeated ? colors.grey : colors.red)
          );
    const prices = popup.deals[0]?.prices || [];
    const gathers =
      prices.length === 0
        ? []
        : pixelFrame(
            questWidth,
            prices.length + 2,
            allGathered ? colors.grey : colors.yellow,
            completed ? "dotted" : "solid",
            prices.map((price) => {
              const deal = { item: price, stock: 1, prices: [price] };
              const gathered = heroEntity && canRedeem(world, heroEntity, deal);
              const color = gathered ? colors.grey : colors.silver;

              const text = [
                ...createText(price.amount.toString().padStart(2), color),
                ...createItemName(price, color),
              ];
              const line = [
                ...text,
                ...repeat(none, questWidth - text.length - 2),
              ];
              return gathered ? strikethrough(line) : line;
            }),
            createText("Gather", allGathered ? colors.grey : colors.yellow)
          );
    const rewardColor = completed ? colors.silver : colors.grey;
    const rewards =
      popup.deals.length === 0
        ? []
        : pixelFrame(
            questWidth,
            popup.deals.length + 2,
            completed ? colors.lime : colors.grey,
            completed ? "solid" : "dotted",

            popup.deals.map((deal, index) => {
              const text = [
                ...createText(
                  deal.item.amount.toString().padStart(2),
                  rewardColor
                ),
                ...createItemName(deal.item, rewardColor),
              ];
              return [...text, ...repeat(none, questWidth - text.length - 2)];
            }),
            createText("Reward", completed ? colors.lime : colors.grey)
          );
    const choices =
      popup.choices.length === 0
        ? []
        : pixelFrame(
            questWidth,
            popup.choices.length + 2,
            completed ? colors.green : colors.grey,
            completed ? "solid" : "dotted",
            popup.choices.map((choice) => {
              const text = [
                ...createText(
                  choice.amount.toString().padStart(2),
                  rewardColor
                ),
                ...createItemName(choice, rewardColor),
              ];
              return [...text, ...repeat(none, questWidth - text.length - 2)];
            }),
            createText("Choose", completed ? colors.green : colors.grey)
          );

    const lines = (entity[POPUP] as Popup).lines[entity[POPUP].horizontalIndex];
    content = [
      ...lines,
      ...repeat(
        [],
        Math.max(
          1,
          frameHeight -
            2 -
            lines.length -
            targets.length -
            gathers.length -
            rewards.length -
            choices.length -
            1
        )
      ),
      ...targets,
      ...gathers,
      ...rewards.map((line) => [...repeat(none, 4), ...line]),
      ...choices.map((line) => [...repeat(none, 4), ...line]),
    ];
  } else if (selections.length === 2) {
    // show completed screen
    content = popup.lines[verticalIndex];
  } else if (completed) {
    // show reward choices
    content = popup.choices.map((choice, index) => {
      const selected = index === verticalIndex;
      const [sprite, ...name] = createItemName(choice);
      const title = [...name, ...repeat(none, frameWidth - 4 - name.length)];
      const line = selected
        ? shaded(recolorLine(title, colors.white), colors.green, "▄")
        : title;
      return [none, sprite, ...line];
    });
  } else {
    // show objectives
    content = objectives.map((objective, index) => {
      const selected = index === verticalIndex;
      let sprite: Sprite = none;
      let name: Sprite[] = [];

      if (objective.item) {
        [sprite, ...name] = createItemName(objective.item);
      } else {
        [sprite, ...name] = objective.title;
      }

      const title = [...name, ...repeat(none, frameWidth - 4 - name.length)];
      const line = !selected
        ? objective.available
          ? title
          : strikethrough(title)
        : objective.available
        ? shaded(brightenSprites(title), colors.grey)
        : dotted(strikethrough(title), colors.red);
      return [none, sprite, ...line];
    });
  }

  const popupResult = renderPopup(
    world,
    entity,
    state,
    popupIdles[getTab(world, entity)],
    content,
    selections.length !== 1
      ? undefined
      : completed
      ? "active"
      : selectedObjective?.available
      ? "selected"
      : "blocked",
    selectedObjective
      ? selectedObjective.available
        ? selectedObjective.item
          ? getItemDescription(selectedObjective.item)
          : selectedObjective.description
        : [
            createText("Objective not", colors.grey),
            createText("available.", colors.grey),
          ]
      : selectedChoice
      ? getItemDescription(selectedChoice)
      : undefined
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

export const castWave1: Sequence<SpellSequence> = (world, entity, state) => {
  const entityId = world.getEntityId(entity);
  const size = world.metadata.gameEntity[LEVEL].size;
  let updated = false;
  let finished = false;

  const outerRadius = Math.ceil(state.elapsed / waveSpeed);
  const innerRadius = Math.round(state.elapsed / waveSpeed);
  const material = state.args.material || "default";
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
        [SPRITE]: waveSide[material][element],
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
        waveCorner[material][
          particleName.startsWith("inner") || material === "default"
            ? element
            : "default"
        ];
      if (waveParticle[SPRITE] === cornerSprite) continue;

      waveParticle[SPRITE] = cornerSprite;
      rerenderEntity(world, waveParticle);
    }

    // create AoE
    for (const iteration of iterations) {
      const aoeSide = entities.createAoe(world, {
        [EXERTABLE]: { castable: entityId },
        [POSITION]: combine(size, entity[POSITION], {
          x: innerRadius * iteration.direction.x,
          y: innerRadius * iteration.direction.y,
        }),
      });
      const aoeCorner = entities.createAoe(world, {
        [EXERTABLE]: { castable: entityId },
        [POSITION]: combine(size, entity[POSITION], {
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
          [POSITION]: combine(size, entity[POSITION], {
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
      addToInventory(world, entity, itemEntity, state.args.amount);
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
  wood: emptyBottle,
  iron: emptyPotion,
  gold: emptyElixir,
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
    isDead(world, entity) ||
    (!state.args.overridden &&
      !state.args.isIdle &&
      state.elapsed / charDelay > totalLength * 1.4 + 20);
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

  // reveal characters and flip if needed
  if (updated && particlesLength > 0) {
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
    targetEntity &&
    !(
      Math.abs(
        signedDistance(entity[POSITION].x, targetEntity[POSITION].x, size)
      ) <=
        pointerX + 1 &&
      Math.abs(
        signedDistance(entity[POSITION].y, targetEntity[POSITION].y, size)
      ) <=
        pointerY + 1
    ) &&
    getDistance(entity[POSITION], targetEntity[POSITION], size) >=
      entity[LIGHT].visibility;
  const targetChanged = state.args.target !== targetId;
  if (
    state.args.lastOrientation &&
    (!highlighEntity || !targetEntity || targetChanged || !shouldDisplay)
  ) {
    pointerParticle[ORIENTABLE].facing = undefined;
    pointerParticle[PARTICLE].offsetX = 0;
    pointerParticle[PARTICLE].offsetY = 0;
    if (targetChanged) {
      disposeEntity(world, pointerParticle);
      delete state.particles.pointer;
      state.args.target = undefined;
    }
    state.args.lastOrientation = undefined;
    updated = true;
  } else if (highlighEntity && targetEntity && shouldDisplay) {
    // invert orientation as needle from highlight is pointing to hero
    const orientation = highlighEntity[ORIENTABLE].facing;
    const invertedOrientation = orientation && invertOrientation(orientation);
    if (
      invertedOrientation &&
      state.args.lastOrientation !== invertedOrientation
    ) {
      const delta = orientationPoints[invertedOrientation];
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

const branchTime = 100;

export const oakBranch: Sequence<BranchSequence> = (world, entity, state) => {
  const heroEntity = getIdentifierAndComponents(world, "hero", [POSITION]);
  const oakEntity = getStructure(world, entity);

  if (!oakEntity) return { finished: true, updated: false };

  const generation = Math.floor(state.elapsed / branchTime);
  const limbCount = state.args.limbs.length;
  const size = world.metadata.gameEntity[LEVEL].size;
  const finished = !!state.args.shrink && limbCount === 0;
  let updated = false;

  if (
    (state.args.grow || !state.args.shrink) &&
    (!heroEntity ||
      (oakEntity[STATS]?.hp || 0) < Math.max(state.args.threshold, 1))
  ) {
    state.args.grow = false;
    state.args.shrink = generation;
  }

  if (state.args.grow && heroEntity && generation > limbCount) {
    updated = true;

    const bossUnit = generateNpcData("oakBoss");
    const lastLimb =
      world.getEntityByIdAndComponents(state.args.limbs[limbCount - 1], [
        POSITION,
        ORIENTABLE,
      ]) || entity;

    const path = findPath(
      world.metadata.gameEntity[LEVEL].walkable,
      lastLimb[POSITION],
      heroEntity[POSITION]
    );
    const growth = Math.min(generation - limbCount, path.length);

    if (growth === 0) {
      state.args.grow = false;

      if (
        getDistance(
          lastLimb[POSITION],
          heroEntity[POSITION],
          size,
          1,
          false
        ) === 1
      ) {
        // update split
        const splitOrientation = relativeOrientations(
          world,
          lastLimb[POSITION],
          heroEntity[POSITION],
          1
        )[0];
        if (state.args.limbs.length > 0) {
          lastLimb[SPRITE] =
            splitOrientation === lastLimb[ORIENTABLE].facing
              ? oakBranchSplit
              : oakBranchSide;
          rerenderEntity(world, lastLimb);
        }

        // create loop around hero
        for (const iteration of iterations) {
          const sidePosition = combine(
            size,
            heroEntity[POSITION],
            iteration.direction
          );
          const sideEntity = entities.createLimb(world, {
            [ACTIONABLE]: {
              primaryTriggered: false,
              secondaryTriggered: false,
            },
            [COLLIDABLE]: {},
            [DROPPABLE]: { decayed: false, evaporate: bossUnit.evaporate },
            [FOG]: { visibility: "hidden", type: "object" },
            [FRAGMENT]: { structure: world.getEntityId(oakEntity) },
            [LAYER]: {},
            [MOVABLE]: {
              bumpGeneration: 0,
              orientations: [],
              reference: world.getEntityId(world.metadata.gameEntity),
              lastInteraction: 0,
              flying: false,
            },
            [ORIENTABLE]: {
              facing: iteration.orientation,
            },
            [POSITION]: sidePosition,
            [RENDERABLE]: { generation: 0 },
            [SEQUENCABLE]: { states: {} },
            [SHOOTABLE]: { shots: 0 },
            [SPRITE]: oakLoopSide,
          });
          state.args.limbs.push(world.getEntityId(sideEntity));

          const cornerPosition = combine(size, sidePosition, iteration.normal);
          const cornerEntity = entities.createLimb(world, {
            [ACTIONABLE]: {
              primaryTriggered: false,
              secondaryTriggered: false,
            },
            [COLLIDABLE]: {},
            [DROPPABLE]: { decayed: false, evaporate: bossUnit.evaporate },
            [FOG]: { visibility: "hidden", type: "object" },
            [FRAGMENT]: { structure: world.getEntityId(oakEntity) },
            [LAYER]: {},
            [MOVABLE]: {
              bumpGeneration: 0,
              orientations: [],
              reference: world.getEntityId(world.metadata.gameEntity),
              lastInteraction: 0,
              flying: false,
            },
            [ORIENTABLE]: {
              facing: rotateOrientation(iteration.orientation, 1),
            },
            [POSITION]: cornerPosition,
            [RENDERABLE]: { generation: 0 },
            [SEQUENCABLE]: { states: {} },
            [SHOOTABLE]: { shots: 0 },
            [SPRITE]: oakLoopCorner,
          });
          state.args.limbs.push(world.getEntityId(cornerEntity));
        }
      }
    }

    for (let limbIndex = 0; limbIndex < growth; limbIndex += 1) {
      const limbPosition = path[limbIndex];
      const previousLimb =
        world.getEntityByIdAndComponents(state.args.limbs.slice(-1)[0], [
          POSITION,
          ORIENTABLE,
        ]) || lastLimb;
      const limbOrientation = relativeOrientations(
        world,
        previousLimb[POSITION],
        limbPosition,
        1
      )[0];

      if (state.args.limbs.length === 0) {
        // update stem
        entity[ORIENTABLE].facing = limbOrientation;
      } else if (previousLimb[ORIENTABLE].facing) {
        // update last limb
        if (previousLimb[ORIENTABLE].facing === limbOrientation) {
          previousLimb[SPRITE] = oakBranchSide;
        } else {
          // rotate corners
          const cornerOrientation = rotateOrientation(
            previousLimb[ORIENTABLE].facing,
            orientationDelta(previousLimb[ORIENTABLE].facing, limbOrientation) >
              0
              ? 0
              : 1
          );
          previousLimb[SPRITE] = oakBranchCorner;
          previousLimb[ORIENTABLE].facing = cornerOrientation;
        }
      }
      rerenderEntity(world, previousLimb);

      const limbEntity = entities.createLimb(world, {
        [ACTIONABLE]: { primaryTriggered: false, secondaryTriggered: false },
        [COLLIDABLE]: {},
        [DROPPABLE]: { decayed: false, evaporate: bossUnit.evaporate },
        [FOG]: { visibility: "hidden", type: "object" },
        [FRAGMENT]: { structure: world.getEntityId(oakEntity) },
        [LAYER]: {},
        [MOVABLE]: {
          bumpGeneration: 0,
          orientations: [],
          reference: world.getEntityId(world.metadata.gameEntity),
          lastInteraction: 0,
          flying: false,
        },
        [ORIENTABLE]: {
          facing: limbOrientation,
        },
        [POSITION]: limbPosition,
        [RENDERABLE]: { generation: 0 },
        [SEQUENCABLE]: { states: {} },
        [SHOOTABLE]: { shots: 0 },
        [SPRITE]: oakBranchEnd,
      });
      state.args.limbs.push(world.getEntityId(limbEntity));
    }
  } else if (state.args.shrink) {
    updated = true;
    const shrinkage = Math.min(generation - state.args.shrink, limbCount);

    for (let limbIndex = 0; limbIndex < shrinkage; limbIndex += 1) {
      const limbId = state.args.limbs.slice(-1)[0];
      const limbEntity = world.getEntityByIdAndComponents(limbId, [POSITION]);

      if (!limbEntity) break;

      // find any overlapping limbs
      const fragments = getFragments(world, limbEntity[POSITION]);
      for (const fragmentEntity of fragments) {
        const limbIndex = state.args.limbs.indexOf(
          world.getEntityId(fragmentEntity)
        );
        if (limbIndex === -1) continue;
        disposeEntity(world, fragmentEntity);
        state.args.limbs.splice(limbIndex, 1);
      }
    }

    state.args.shrink = generation;
  }

  return { finished, updated };
};

const limbConfig: Record<
  NonNullable<LimbSequence["type"]>,
  {
    offset: Position;
    sprite: Sprite;
    name: string;
  }[]
> = {
  wormMouth: [
    {
      offset: { x: -1, y: 0 },
      sprite: wormMouthCornerLeft,
      name: "corner-left",
    },
    {
      offset: { x: 1, y: 0 },
      sprite: wormMouthCornerRight,
      name: "corner-right",
    },
    {
      offset: { x: -1, y: -1 },
      sprite: wormMouthSideLeft,
      name: "side-left",
    },
    {
      offset: { x: 0, y: -1 },
      sprite: wormMouthCenter,
      name: "limb",
    },
    {
      offset: { x: 1, y: -1 },
      sprite: wormMouthSideRight,
      name: "side-right",
    },
  ],
  golemFist: [
    {
      offset: { x: 0, y: -1 },
      sprite: golemStrikeUp,
      name: "limb",
    },
    {
      offset: { x: 1, y: -1 },
      sprite: golemStrikeUpRight,
      name: "up-right",
    },
    {
      offset: { x: 1, y: 0 },
      sprite: golemStrikeRight,
      name: "right",
    },
    {
      offset: { x: 1, y: 1 },
      sprite: golemStrikeRightDown,
      name: "right-down",
    },
    {
      offset: { x: 0, y: 1 },
      sprite: golemStrikeDown,
      name: "down",
    },
    {
      offset: { x: -1, y: 1 },
      sprite: golemStrikeDownLeft,
      name: "down-left",
    },
    {
      offset: { x: -1, y: 0 },
      sprite: golemStrikeLeft,
      name: "left",
    },
    {
      offset: { x: -1, y: -1 },
      sprite: golemStrikeLeftUp,
      name: "left-up",
    },
  ],
};

export const unitLimbs: Sequence<LimbSequence> = (world, entity, state) => {
  const finished = !state.args.type;
  let updated = false;
  const size = world.metadata.gameEntity[LEVEL].size;
  const rootEntity = getRoot(world, entity);
  const entityId = world.getEntityId(rootEntity);
  const orientation = entity[ORIENTABLE].facing as Orientation | undefined;

  if (!orientation || !state.args.type) {
    // clear inactive limb
    if (state.particles.limb) {
      for (const particleName in state.particles) {
        const limbParticle = world.assertByIdAndComponents(
          state.particles[particleName],
          [ORIENTABLE, PARTICLE]
        );
        disposeEntity(world, limbParticle);
        delete state.particles[particleName];
      }
      updated = true;
    }

    // clear AoE
    if (state.args.areas.length > 0) {
      state.args.areas.forEach((aoeId) => {
        const aoeEntity = world.assertById(aoeId);
        disposeEntity(world, aoeEntity);
      });
      state.args.areas = [];
      updated = true;
    }

    return { finished, updated };
  }

  // create limb particles and assume correct orientation
  if (!state.particles.limb) {
    limbConfig[state.args.type].forEach((limbConfig) => {
      const limbParticle = entities.createFibre(world, {
        [ORIENTABLE]: { facing: orientation },
        [PARTICLE]: {
          offsetX: limbConfig.offset.x,
          offsetY: limbConfig.offset.y,
          offsetZ: floatHeight,
        },
        [RENDERABLE]: { generation: 1 },
        [SPRITE]: limbConfig.sprite,
      });
      state.particles[limbConfig.name] = world.getEntityId(limbParticle);

      updated = true;

      // create AoE
      const aoeEntity = entities.createAoe(world, {
        [EXERTABLE]: { castable: entityId },
        [POSITION]: combine(size, entity[POSITION], limbConfig.offset),
      });
      // disable AoE if no visible oriented limb
      if (!limbConfig.sprite.facing?.[orientation]?.length) {
        world.removeComponentFromEntity(aoeEntity, EXERTABLE);
      }
      registerEntity(world, aoeEntity);
      state.args.areas.push(world.getEntityId(aoeEntity));
    });
    state.args.position = copy(entity[POSITION]);
    state.args.orientation = orientation;

    updated = true;
  }

  // move AoE
  if (
    state.args.position.x !== entity[POSITION].x ||
    state.args.position.y !== entity[POSITION].y
  ) {
    const delta = {
      x: signedDistance(state.args.position.x, entity[POSITION].x, size),
      y: signedDistance(state.args.position.y, entity[POSITION].y, size),
    };
    state.args.areas.forEach((aoeId) => {
      const aoeEntity = world.assertByIdAndComponents(aoeId, [POSITION]);
      moveEntity(world, aoeEntity, combine(size, aoeEntity[POSITION], delta));
    });
    state.args.position = copy(entity[POSITION]);
    updated = true;
  }

  // rotate limb
  if (
    orientation &&
    state.args.orientation &&
    orientation !== state.args.orientation
  ) {
    const rotation = Math.sign(
      orientationDelta(state.args.orientation, orientation)
    );
    state.args.orientation = orientation;

    for (const particleName in state.particles) {
      const limbParticle = world.assertByIdAndComponents(
        state.particles[particleName],
        [ORIENTABLE, PARTICLE, SPRITE]
      );

      const [offsetX, offsetY] = [
        -limbParticle[PARTICLE].offsetY * rotation,
        limbParticle[PARTICLE].offsetX * rotation,
      ];
      limbParticle[PARTICLE].offsetX = offsetX;
      limbParticle[PARTICLE].offsetY = offsetY;
      limbParticle[ORIENTABLE].facing = orientation;
    }

    // rotate AoE
    state.args.areas.forEach((aoeId) => {
      const aoeEntity = world.assertByIdAndComponents(aoeId, [POSITION]);
      const delta = {
        x: signedDistance(entity[POSITION].x, aoeEntity[POSITION].x, size),
        y: signedDistance(entity[POSITION].y, aoeEntity[POSITION].y, size),
      };
      const target = {
        x: -delta.y * rotation,
        y: delta.x * rotation,
      };
      const position = combine(size, entity[POSITION], target);

      // activate AoE if matching particle is visible
      const limbParticle = Object.values(state.particles)
        .map((particleId) =>
          world.assertByIdAndComponents(particleId, [
            ORIENTABLE,
            PARTICLE,
            SPRITE,
          ])
        )
        .find(
          (particleEntity) =>
            particleEntity[PARTICLE].offsetX === target.x &&
            particleEntity[PARTICLE].offsetY === target.y
        );
      if (limbParticle) {
        const needsAoE =
          limbParticle[SPRITE].facing?.[limbParticle[ORIENTABLE].facing!]
            ?.length;
        const hasAoE = EXERTABLE in aoeEntity;
        if (needsAoE && !hasAoE) {
          world.addComponentToEntity(aoeEntity, EXERTABLE, {
            castable: entityId,
          });
        } else if (!needsAoE && hasAoE) {
          world.removeComponentFromEntity(
            aoeEntity as TypedEntity<"EXERTABLE">,
            EXERTABLE
          );
        }
      }

      moveEntity(world, aoeEntity, position);
    });

    updated = true;
  }

  return { finished, updated };
};
