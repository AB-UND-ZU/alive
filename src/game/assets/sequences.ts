import {
  decayHeight,
  dialogHeight,
  effectHeight,
  floatHeight,
  focusHeight,
  fogHeight,
  idleHeight,
  immersibleHeight,
  interactHeight,
  lootHeight,
  particleHeight,
  selectionHeight,
  tooltipHeight,
  transientHeight,
  wireHeight,
} from "../../components/Entity/utils";
import { entities } from "../../engine";
import { DROPPABLE } from "../../engine/components/droppable";
import {
  Equipment,
  EQUIPPABLE,
  gear,
  slots,
} from "../../engine/components/equippable";
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
  getLootable,
  isEmpty,
} from "../../engine/systems/collect";
import {
  calculateHealing,
  getAttackable,
  getEntityDisplayStats,
  getLimbs,
  getRoot,
  getStructure,
  isDead,
  isFriendlyFire,
  isTribe,
} from "../../engine/systems/damage";
import {
  disposeEntity,
  getCell,
  moveEntity,
  registerEntity,
} from "../../engine/systems/map";
import { rerenderEntity } from "../../engine/systems/renderer";
import {
  canWarp,
  getSelectedConstruction,
  openDoor,
} from "../../engine/systems/trigger";
import { brighten, colors, darken } from "../../game/assets/colors";
import {
  add,
  choice,
  chunked,
  combine,
  copy,
  distribution,
  getDistance,
  lerp,
  normalize,
  random,
  range,
  repeat,
  reversed,
  shuffle,
  sigmoid,
  signedDistance,
} from "../math/std";
import {
  iterations,
  pixelCircle,
  pointToDegree,
  reversedIterations,
} from "../math/tracing";
import {
  decay,
  fire,
  ghost,
  none,
  emptyBottle,
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
  smokeLight,
  smokeThick,
  levelProgress,
  freeze,
  hostileBar,
  xpDot,
  rain,
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
  missing,
  weaponSlot,
  offhandSlot,
  ringSlot,
  amuletSlot,
  compassSlot,
  torchSlot,
  spellSlot,
  skillSlot,
  times,
  delay,
  popupActive,
  emptyFlask,
  emptyPotion,
  popupBlocked,
  star,
  blocked,
  chief,
  diamondGem,
  snowflake,
  bootsSlot,
  zapParticle,
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
  interactBar,
  interactLeft,
  interactRight,
  auraEdge,
  tooltipLine,
  enemyLine,
  allyLine,
  lightningSide,
  lightninCorner,
  zapSwordParticle,
  healHit,
  trueHit,
  toolSlot,
  ninePlus,
  bait,
  wire,
  emptySlot,
  caret,
  craftCenterTop,
  scroll,
  craftDownLeft,
  craftDown,
  craftLeft,
  craftLeftActive,
  craftDownLeftActive,
  craftDownActive,
  forgeHammer,
  forgeHandle,
  popupCenterStart,
  popupCenterEnd,
  popupSide,
  forgeMiss,
  forgeHit,
  buildCenterTop,
  buildDown,
  buildDownActive,
  buildDownLeft,
  buildDownLeftActive,
  buildLeft,
  buildLeftActive,
  repair,
  build,
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
  TornadoSequence,
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
  InteractSequence,
  AuraSequence,
  FlashSequence,
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
  getItemSprite,
  getLootDelay,
  scrolledVerticalIndex,
  createUnitName,
  createItemName,
  questWidth,
  rewardWidth,
  hookSpeed,
} from "./utils";
import { getItemDescription } from "./descriptions";
import { getEntityDescription } from "./descriptions";
import { entitySprites } from "./descriptions";
import { isImmersible } from "../../engine/systems/immersion";
import { PLAYER } from "../../engine/components/player";
import { BELONGABLE } from "../../engine/components/belongable";
import {
  CASTABLE,
  getEmptyCastable,
  MarkerType,
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
  existingFund,
  gearSlots,
  gearTitles,
  getDefeated,
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
  spearPixels,
  weaponElementPixels,
  swordPixels,
  wandPixels,
  kettlePixels,
  brewingPixels,
  centerLayer,
  anvilPixels,
} from "./pixels";
import { brightenSprites, plot } from "./ui";
import { getItemSellPrice } from "../balancing/trading";
import {
  hittingOffset,
  hittingArea,
  getForgeOptions,
  getForgeStatus,
  hittingWidth,
  forgingCompleted,
  forgeTicks,
  performForgeHit,
} from "../balancing/forging";
import { getItemDiff, getItemStats } from "../balancing/equipment";
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
import { Harvestable, HARVESTABLE } from "../../engine/components/harvestable";
import {
  Conditionable,
  CONDITIONABLE,
} from "../../engine/components/conditionable";
import { FOG } from "../../engine/components/fog";
import { CellType } from "../../bindings/creation";
import { ACTIONABLE } from "../../engine/components/actionable";
import { COLLIDABLE } from "../../engine/components/collidable";
import { LAYER } from "../../engine/components/layer";
import { SHOOTABLE } from "../../engine/components/shootable";
import { ATTACKABLE } from "../../engine/components/attackable";
import { generateNpcData, generateUnitData } from "../balancing/units";
import { Vanishable, VANISHABLE } from "../../engine/components/vanishable";
import { colorPalettes } from "./templates";
import {
  addBackground,
  addForeground,
  blockedInactive,
  class_,
  colorToCode,
  craft,
  createButton,
  createCountable,
  createDialog,
  createProgress,
  createSpriteButton,
  createText,
  discovery,
  dotted,
  forge,
  getBlockedSlot,
  getMaxCounter,
  getStatColor,
  getStatSprite,
  mergeSprites,
  parseSprite,
  recolorSprite,
  shaded,
  shop,
  stretch,
  strikethrough,
  underline,
} from "./ui";
import {
  blast,
  blockCorner1,
  blockCorner2,
  blockSide1,
  blockSide2,
  bolt,
  dash,
  edge,
  gustCorner,
  gustSide,
  slashCorner,
  slashSide,
  spearLine,
  spearTip,
  trigger,
  waveCorner,
  waveCornerDouble,
  waveSide,
  waveSideDouble,
  windCorner,
  windSide,
} from "./templates/particles";
import {
  animateEvaporate,
  dropEntity,
  MAX_DROP_RADIUS,
} from "../../engine/systems/drop";
import {
  getHarvestTarget,
  isPlantable,
  performDig,
  performHarvest,
} from "../../engine/systems/harvest";
import { TypedEntity } from "../../engine/entities";
import { BUMPABLE } from "../../engine/components/bumpable";
import { getSequence } from "../../engine/systems/sequence";
import { POI } from "../../engine/components/poi";
import { isWalkable } from "../../engine/systems/movement";
import {
  getHookable,
  getHookables,
  isWireTossable,
} from "../../engine/systems/fishing";
import { BAITABLE } from "../../engine/components/baitable";
import { SWIMMABLE } from "../../engine/components/swimmable";
import { HOOKABLE } from "../../engine/components/hookable";
import {
  harvestConditions,
  harvestScratches,
  plantConfigs,
} from "../balancing/harvesting";
import { getKeyFromIndex } from "../../components/Keyboard";
import { brewingDurationFactor, getBrewingDeal } from "../balancing/brewing";
import { Brewable, BREWABLE } from "../../engine/components/brewable";
import { Forgable, FORGABLE } from "../../engine/components/forgable";
import { REMAINABLE } from "../../engine/components/remainable";
import { getBuildTarget } from "../../engine/systems/harvest";
import { buildConstructions, Construction } from "../balancing/building";
import {
  canConstruct,
  canPlot,
  getBuildingDeal,
  getPlotPreview,
} from "../../engine/systems/build";

export * from "./npcs";
export * from "./quests";

export const swordAttack: Sequence<MeleeSequence> = (world, entity, state) => {
  // align sword with facing direction
  const finished =
    state.elapsed > state.args.tick / (state.args.rotate ? 0.5 : 2);
  const weaponEntity = world.getEntityByIdAndComponents(
    entity[EQUIPPABLE].weapon,
    [ORIENTABLE]
  );

  // abort if wood sword is converted to stick on entity death during animation
  if (!weaponEntity) {
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
  const currentFacing = weaponEntity[ORIENTABLE].facing;
  const updated = currentFacing !== facing;

  if (updated) {
    weaponEntity[ORIENTABLE].facing = facing;
    rerenderEntity(world, weaponEntity);
  }

  if (finished) {
    entity[MELEE].facing = undefined;
    weaponEntity[ORIENTABLE].facing = undefined;
    rerenderEntity(world, entity);
  }

  return { finished, updated };
};

const zapTick = 250;

export const zapCondition: Sequence<ConditionSequence> = (
  world,
  entity,
  state
) => {
  const generation = Math.ceil(state.elapsed / zapTick);
  let updated = false;
  const finished =
    !entity[CONDITIONABLE].zap ||
    entity[ACTIONABLE].toolEquipped ||
    generation > state.args.modifier;

  const weaponEntity = world.getEntityByIdAndComponents(
    entity[EQUIPPABLE].weapon,
    [SPRITE]
  );

  if (!state.particles.condition) {
    const conditionParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: 0,
        offsetY: 0,
        offsetZ: lootHeight,
        amount: 0,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: weaponEntity ? zapSwordParticle : zapParticle,
    });
    state.particles.condition = world.getEntityId(conditionParticle);

    if (weaponEntity) {
      const swordParticle = entities.createParticle(world, {
        [PARTICLE]: {
          offsetX: 0,
          offsetY: 0,
          offsetZ: decayHeight,
          amount: 0,
        },
        [RENDERABLE]: { generation: 1 },
        [SPRITE]: weaponEntity[SPRITE],
      });
      state.particles.sword = world.getEntityId(swordParticle);
    }

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
    delete entity[CONDITIONABLE].zap;
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
    !entity[CONDITIONABLE].block ||
    entity[ACTIONABLE].toolEquipped ||
    generation >= state.args.modifier;

  // trim duration on popping bubble
  if (inactive && state.args.modifier > generation + 1) {
    state.args.modifier = generation;
  }

  const finished = generation >= state.args.modifier + 1;

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

export const toolCondition: Sequence<ConditionSequence> = (
  world,
  entity,
  state
) => {
  const tick = world.getEntityByIdAndComponents(entity[MOVABLE]?.reference, [
    REFERENCE,
  ])?.[REFERENCE].tick;
  let updated = false;

  const toolEntity = world.getEntityByIdAndComponents(entity[EQUIPPABLE].tool, [
    ITEM,
    SPRITE,
  ]);
  const weaponEntity = world.getEntityByIdAndComponents(
    entity[EQUIPPABLE].weapon,
    [ITEM]
  );
  const offhandEntity = world.getEntityByIdAndComponents(
    entity[EQUIPPABLE].offhand,
    [ITEM]
  );
  const conditionName =
    toolEntity?.[ITEM].tool && harvestConditions[toolEntity[ITEM].tool];
  const condition =
    conditionName && (entity[CONDITIONABLE] as Conditionable)[conditionName];

  const finished =
    !toolEntity ||
    !condition ||
    !conditionName ||
    !entity[ACTIONABLE].toolEquipped ||
    !condition ||
    !tick ||
    (toolEntity?.[ITEM].tool !== "axe" &&
      toolEntity?.[ITEM].tool !== "pickaxe" &&
      toolEntity?.[ITEM].tool !== "hammer");

  if (finished) {
    // reset sword and shield
    if (weaponEntity) {
      weaponEntity[ITEM].amount = 1;
      rerenderEntity(world, weaponEntity);
    }
    if (offhandEntity) {
      offhandEntity[ITEM].amount = 1;
      rerenderEntity(world, offhandEntity);
    }
  }

  // requires tool to be worn
  if (!toolEntity || !condition || !conditionName) {
    return { updated: false, finished: true };
  }

  // hide sword and shield
  if (!finished && weaponEntity && weaponEntity[ITEM].amount !== 0) {
    weaponEntity[ITEM].amount = 0;
    rerenderEntity(world, weaponEntity);
    updated = true;
  }
  if (!finished && offhandEntity && offhandEntity[ITEM].amount !== 0) {
    offhandEntity[ITEM].amount = 0;
    rerenderEntity(world, offhandEntity);
    updated = true;
  }

  if (!state.particles.tool) {
    const toolParticle = entities.createFibre(world, {
      [ORIENTABLE]: {},
      [PARTICLE]: {
        offsetX: 0,
        offsetY: 0,
        offsetZ: particleHeight,
        amount: 0,
        animatedOrigin: { x: 0, y: 0 },
        duration: tick && tick / 2,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: toolEntity[SPRITE],
    });
    state.particles.tool = world.getEntityId(toolParticle);

    updated = true;
  }

  const toolParticle = world.assertByIdAndComponents(state.particles.tool, [
    ORIENTABLE,
    PARTICLE,
  ]);
  if (finished) {
    disposeEntity(world, toolParticle);
    delete state.particles.tool;
    delete entity[CONDITIONABLE][conditionName];
  } else {
    const targetModifier = condition.modifier;
    const targetOrientation = condition.orientation as Orientation | undefined;
    const targetEntity =
      toolEntity[ITEM].tool === "hammer"
        ? getBuildTarget(world, entity, toolEntity, targetOrientation || "up")
        : getHarvestTarget(
            world,
            entity,
            toolEntity,
            targetOrientation || "up"
          );
    const progress = state.elapsed - state.args.modifier;
    let scratching = true;

    if (
      targetEntity &&
      targetModifier &&
      targetModifier !== state.args.modifier &&
      targetOrientation
    ) {
      // move tool out
      state.args.modifier = targetModifier;
      state.args.orientation = targetOrientation;
      const delta = orientationPoints[targetOrientation];
      toolParticle[PARTICLE].offsetX = delta.x;
      toolParticle[PARTICLE].offsetY = delta.y;
      toolParticle[ORIENTABLE].facing = targetOrientation;
      rerenderEntity(world, toolParticle);
      scratching = false;
      updated = true;
    } else if (
      targetEntity &&
      state.args.orientation &&
      targetOrientation &&
      progress > tick / 2
    ) {
      if (toolEntity[ITEM].tool === "hammer") {
        targetEntity[STATS].hp = Math.min(
          targetEntity[STATS].maxHp,
          targetEntity[STATS].hp + condition.amount
        );
        rerenderEntity(world, targetEntity);
      } else {
        // perform harvest and get entities to show scratches
        const scratchEntities = performHarvest(
          world,
          entity,
          toolEntity,
          targetEntity,
          targetOrientation
        );

        for (const scratchEntity of scratchEntities) {
          const scratchOrientation =
            relativeOrientations(
              world,
              entity[POSITION],
              scratchEntity[POSITION]
            )[0] || targetOrientation;
          const delta = orientationPoints[scratchOrientation];
          const scratchParticle = entities.createParticle(world, {
            [PARTICLE]: {
              offsetX: delta.x * 2,
              offsetY: delta.y * 2,
              offsetZ: particleHeight,
              animatedOrigin: copy(delta),
              duration: tick / 2,
            },
            [RENDERABLE]: { generation: 1 },
            [SPRITE]: createText(
              choice(...scratchChars),
              harvestScratches[
                (targetEntity[HARVESTABLE] as Harvestable).resource
              ]
            )[0],
          });
          const scratchId = world.getEntityId(scratchEntity);
          state.particles[
            `scratch-${scratchId}-${scratchEntity[RENDERABLE].generation}`
          ] = world.getEntityId(scratchParticle);
        }
      }

      // move tool back
      condition.orientation = undefined;
      state.args.orientation = undefined;
      toolParticle[PARTICLE].offsetX = 0;
      toolParticle[PARTICLE].offsetY = 0;
      rerenderEntity(world, toolParticle);
      updated = true;
    } else if (
      !state.args.orientation &&
      !targetOrientation &&
      state.args.modifier &&
      targetModifier &&
      progress > tick
    ) {
      // reset tool
      condition.modifier = 0;
      toolParticle[ORIENTABLE].facing = undefined;
      state.args.modifier = 0;
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

export const shovelCondition: Sequence<ConditionSequence> = (
  world,
  entity,
  state
) => {
  const tick = world.getEntityByIdAndComponents(entity[MOVABLE]?.reference, [
    REFERENCE,
  ])?.[REFERENCE].tick;
  let updated = false;

  const toolEntity = world.getEntityByIdAndComponents(entity[EQUIPPABLE].tool, [
    ITEM,
    SPRITE,
  ]);
  const weaponEntity = world.getEntityByIdAndComponents(
    entity[EQUIPPABLE].weapon,
    [ITEM]
  );
  const offhandEntity = world.getEntityByIdAndComponents(
    entity[EQUIPPABLE].offhand,
    [ITEM]
  );
  const conditionName =
    toolEntity?.[ITEM].tool && harvestConditions[toolEntity[ITEM].tool];

  const harvestSpeed = tick && tick - 50;
  const finished =
    !conditionName ||
    !entity[ACTIONABLE].toolEquipped ||
    !entity[CONDITIONABLE][conditionName] ||
    !harvestSpeed ||
    state.elapsed > harvestSpeed ||
    toolEntity?.[ITEM].tool !== "shovel";

  // requires tool to be worn
  if (!toolEntity || !conditionName) {
    return { updated: false, finished: true };
  }

  // hide sword and shield
  if (!finished && weaponEntity && weaponEntity[ITEM].amount !== 0) {
    weaponEntity[ITEM].amount = 0;
    rerenderEntity(world, weaponEntity);
    updated = true;
  }
  if (!finished && offhandEntity && offhandEntity[ITEM].amount !== 0) {
    offhandEntity[ITEM].amount = 0;
    rerenderEntity(world, offhandEntity);
    updated = true;
  }

  if (!state.particles.tool) {
    const toolParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: 0,
        offsetY: 0,
        offsetZ: particleHeight,
        amount: 0,
        animatedOrigin: { x: 0, y: -1 },
        duration: harvestSpeed,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: toolEntity[SPRITE],
    });
    state.particles.tool = world.getEntityId(toolParticle);

    updated = true;
  }

  const toolParticle = world.assertByIdAndComponents(state.particles.tool, [
    PARTICLE,
  ]);
  if (finished) {
    performDig(world, entity, toolEntity);

    if (entity[BUMPABLE]) {
      entity[BUMPABLE].generation = entity[RENDERABLE].generation;
      entity[BUMPABLE].orientation = "down";
      rerenderEntity(world, entity);
    }

    disposeEntity(world, toolParticle);
    delete state.particles.tool;
    delete entity[CONDITIONABLE][conditionName];

    // reset sword and shield
    if (weaponEntity) {
      weaponEntity[ITEM].amount = 1;
      rerenderEntity(world, weaponEntity);
    }
    if (offhandEntity) {
      offhandEntity[ITEM].amount = 1;
      rerenderEntity(world, offhandEntity);
    }
  }

  return { finished, updated };
};

export const buildCondition: Sequence<ConditionSequence> = (
  world,
  entity,
  state
) => {
  let updated = false;
  const size = world.metadata.gameEntity[LEVEL].size;
  const worldGeneration = world.metadata.gameEntity[RENDERABLE].generation;
  const showPreview = worldGeneration % 2 === 0;

  const toolEntity = world.getEntityByIdAndComponents(entity[EQUIPPABLE].tool, [
    ITEM,
    SPRITE,
  ]);
  const weaponEntity = world.getEntityByIdAndComponents(
    entity[EQUIPPABLE].weapon,
    [ITEM]
  );
  const offhandEntity = world.getEntityByIdAndComponents(
    entity[EQUIPPABLE].offhand,
    [ITEM]
  );
  const conditionName = "build";
  const condition = (entity[CONDITIONABLE] as Conditionable)[conditionName];
  const construction = getSelectedConstruction(world, entity);

  const finished =
    !toolEntity ||
    !construction ||
    !conditionName ||
    !entity[ACTIONABLE].toolEquipped ||
    !condition ||
    toolEntity?.[ITEM].tool !== "hammer";

  if (finished) {
    // reset sword and shield
    if (weaponEntity) {
      weaponEntity[ITEM].amount = 1;
      rerenderEntity(world, weaponEntity);
    }
    if (offhandEntity) {
      offhandEntity[ITEM].amount = 1;
      rerenderEntity(world, offhandEntity);
    }
  }

  // requires tool to be worn
  if (!toolEntity || !construction || !condition) {
    return { updated: false, finished: true };
  }

  // hide sword and shield
  if (!finished && weaponEntity && weaponEntity[ITEM].amount !== 0) {
    weaponEntity[ITEM].amount = 0;
    rerenderEntity(world, weaponEntity);
    updated = true;
  }
  if (!finished && offhandEntity && offhandEntity[ITEM].amount !== 0) {
    offhandEntity[ITEM].amount = 0;
    rerenderEntity(world, offhandEntity);
    updated = true;
  }

  const orientation = (entity[ORIENTABLE].facing || "up") as Orientation;
  const delta = orientationPoints[orientation];
  const target = combine(size, entity[POSITION], delta);

  if (!state.particles.preview) {
    const previewParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: delta.x,
        offsetY: delta.y,
        offsetZ: particleHeight,
        amount: 0,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: none,
    });
    state.particles.preview = world.getEntityId(previewParticle);

    updated = true;
  }

  const previewParticle = world.assertByIdAndComponents(
    state.particles.preview,
    [PARTICLE]
  );

  const plottable = canPlot(world, entity, target);
  const targetAmount = showPreview
    ? plottable
      ? -condition.modifier
      : undefined
    : 1;

  if (previewParticle[PARTICLE].amount !== targetAmount) {
    previewParticle[SPRITE] = showPreview
      ? plottable
        ? getPlotPreview(world, construction, condition.modifier, target)
        : addBackground([blocked], colors.black)[0]
      : none;
    previewParticle[PARTICLE].amount = targetAmount;
    rerenderEntity(world, previewParticle);
    updated = true;
  }

  if (state.args.orientation !== orientation) {
    previewParticle[PARTICLE].offsetX = delta.x;
    previewParticle[PARTICLE].offsetY = delta.y;
    rerenderEntity(world, previewParticle);
    updated = true;
  }

  if (finished) {
    disposeEntity(world, previewParticle);
    delete state.particles.preview;
    delete entity[CONDITIONABLE][conditionName];
  }

  return { finished, updated };
};

export const hookCondition: Sequence<ConditionSequence> = (
  world,
  entity,
  state
) => {
  const size = world.metadata.gameEntity[LEVEL].size;
  const condition = (entity[CONDITIONABLE] as Conditionable).hook;
  const entityId = world.getEntityId(entity);
  const isCatching = state.args.modifier <= 0;
  const catchGeneration =
    isCatching && condition
      ? Math.ceil((state.elapsed - condition.generation) / hookSpeed)
      : 0;
  let updated = false;
  const finished = !condition || catchGeneration > condition.modifier + 1;

  const weaponEntity = world.getEntityByIdAndComponents(
    entity[EQUIPPABLE].weapon,
    [ITEM]
  );
  const offhandEntity = world.getEntityByIdAndComponents(
    entity[EQUIPPABLE].offhand,
    [ITEM]
  );

  const hookEntity = world.getEntityByIdAndComponents(entity[EQUIPPABLE].tool, [
    SPRITE,
    ITEM,
  ]);

  if (!hookEntity || !condition || finished) {
    delete entity[CONDITIONABLE].hook;

    // reset sword and shield
    if (weaponEntity) {
      weaponEntity[ITEM].amount = 1;
      rerenderEntity(world, weaponEntity);
    }
    if (offhandEntity) {
      offhandEntity[ITEM].amount = 1;
      rerenderEntity(world, offhandEntity);
    }
    return { finished: true, updated };
  }

  const hookGeneration = isCatching
    ? condition.modifier
    : state.particles.bait
    ? Math.ceil((state.elapsed - condition.generation) / hookSpeed)
    : 0;

  // hide sword and shield
  if (weaponEntity && weaponEntity[ITEM].amount !== 0) {
    weaponEntity[ITEM].amount = 0;
    rerenderEntity(world, weaponEntity);
    updated = true;
  }
  if (offhandEntity && offhandEntity[ITEM].amount !== 0) {
    offhandEntity[ITEM].amount = 0;
    rerenderEntity(world, offhandEntity);
    updated = true;
  }

  if (!state.particles.tool) {
    const toolParticle = entities.createFibre(world, {
      [ORIENTABLE]: {},
      [PARTICLE]: {
        offsetX: 0,
        offsetY: 0,
        offsetZ: idleHeight,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: hookEntity[SPRITE],
    });
    state.particles.tool = world.getEntityId(toolParticle);

    updated = true;
  }

  const toolParticle = world.assertByIdAndComponents(state.particles.tool, [
    ORIENTABLE,
    PARTICLE,
  ]);

  // toss bait
  if (!toolParticle[ORIENTABLE].facing && condition.orientation) {
    toolParticle[ORIENTABLE].facing = condition.orientation;
    updated = true;

    const baitParticle = entities.createFibre(world, {
      [ORIENTABLE]: {},
      [PARTICLE]: {
        offsetX: 0,
        offsetY: 0,
        offsetZ: particleHeight,
        animatedOrigin: { x: 0, y: 0 },
        duration: hookSpeed,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: bait,
    });
    state.particles.bait = world.getEntityId(baitParticle);

    condition.generation = state.elapsed;
    condition.amount = -1;

    updated = true;
  }

  const baitParticle = world.getEntityByIdAndComponents(state.particles.bait, [
    PARTICLE,
  ]);

  // move bait and extend line
  if (condition.orientation && baitParticle && !isCatching) {
    const delta = orientationPoints[condition.orientation];

    for (
      let wireLength = condition.amount + 1;
      wireLength < hookGeneration && wireLength <= condition.modifier;
      wireLength += 1
    ) {
      condition.amount = wireLength;
      updated = true;

      if (wireLength >= condition.modifier) break;

      const current = {
        x: delta.x * wireLength,
        y: delta.y * wireLength,
      };
      const offset = {
        x: delta.x * (wireLength + 1),
        y: delta.y * (wireLength + 1),
      };
      const target = combine(size, entity[POSITION], offset);

      if (
        getHookable(world, combine(size, entity[POSITION], current)) ||
        !isWireTossable(world, target)
      ) {
        condition.modifier = wireLength;
        break;
      }

      // move bait
      baitParticle[PARTICLE].offsetX = offset.x;
      baitParticle[PARTICLE].offsetY = offset.y;
      rerenderEntity(world, baitParticle);

      // add wire part
      const wireParticle = entities.createFibre(world, {
        [ORIENTABLE]: { facing: condition.orientation },
        [PARTICLE]: {
          offsetX: offset.x,
          offsetY: offset.y,
          offsetZ: wireHeight,
          animatedOrigin: add(
            offset,
            orientationPoints[invertOrientation(condition.orientation)]
          ),
          duration: hookSpeed,
        },
        [RENDERABLE]: { generation: 1 },
        [SPRITE]: wire,
      });
      state.particles[`wire-${wireLength}`] = world.getEntityId(wireParticle);
    }
  }

  // create bait
  const baitEntity = world
    .getEntities([BAITABLE, POSITION])
    .find((entity) => entity[BAITABLE].caster === entityId);

  if (
    !isCatching &&
    condition.amount === condition.modifier &&
    hookGeneration > condition.amount + 1 &&
    !baitEntity &&
    baitParticle &&
    condition.orientation
  ) {
    // replace bait particle with unit
    baitParticle[SPRITE] = none;
    rerenderEntity(world, baitParticle);

    const delta = orientationPoints[condition.orientation];
    const baitStats = getItemStats(hookEntity[ITEM]);
    const baitEntity = entities.createBait(world, {
      [BAITABLE]: { caster: entityId, amount: baitStats.fishing },
      [BUMPABLE]: { generation: 0 },
      [FOG]: { type: "object", visibility: "hidden" },
      [LIGHT]: { darkness: 0, brightness: 0, visibility: 2 },
      [POSITION]: combine(size, entity[POSITION], {
        x: delta.x * condition.amount,
        y: delta.y * condition.amount,
      }),
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: bait,
      [SWIMMABLE]: { swimming: false },
    });
    registerEntity(world, baitEntity);

    updated = true;
  }

  // dispose bait if caught something
  if (isCatching && baitEntity && baitParticle) {
    if (!world.getEntityById(baitEntity[BAITABLE].caught)) {
      baitParticle[SPRITE] = bait;
      rerenderEntity(world, baitParticle);
    }
    disposeEntity(world, baitEntity);
    updated = true;
  }

  // catch wire
  if (isCatching && condition.orientation && baitParticle) {
    const delta = orientationPoints[condition.orientation];

    for (
      let wireLength = condition.modifier + state.args.modifier;
      wireLength >= 0 && state.args.modifier * -1 < catchGeneration;
      wireLength -= 1
    ) {
      const previous = {
        x: delta.x * (wireLength + 1),
        y: delta.y * (wireLength + 1),
      };
      const offset = {
        x: delta.x * wireLength,
        y: delta.y * wireLength,
      };
      const target = combine(size, entity[POSITION], offset);

      // move bait
      baitParticle[PARTICLE].offsetX = offset.x;
      baitParticle[PARTICLE].offsetY = offset.y;
      rerenderEntity(world, baitParticle);

      // remove previous wire
      const extensionName = `wire-${wireLength + 1}`;
      const extensionParticle = world.getEntityById(
        state.particles[extensionName]
      );
      if (extensionParticle) {
        disposeEntity(world, extensionParticle);
        delete state.particles[extensionName];
      }

      // pull in wire
      const wireName = `wire-${wireLength}`;
      const wireParticle = world.getEntityByIdAndComponents(
        state.particles[wireName],
        [PARTICLE]
      );
      if (wireParticle) {
        wireParticle[PARTICLE].offsetX = offset.x;
        wireParticle[PARTICLE].offsetY = offset.y;
        rerenderEntity(world, wireParticle);
      }
      state.args.modifier = wireLength - condition.modifier - 1;

      // move catch
      const caughtEntity = getHookables(
        world,
        combine(size, entity[POSITION], previous)
      ).filter((hookable) => hookable[HOOKABLE].catching === entityId)[0];

      if (caughtEntity && wireLength > 0) {
        moveEntity(world, caughtEntity, target);
        rerenderEntity(world, caughtEntity);
      } else if (caughtEntity && wireLength === 0) {
        caughtEntity[HOOKABLE].hooked = undefined;
        caughtEntity[HOOKABLE].catching = undefined;
        caughtEntity[HOOKABLE].escaping = false;
        rerenderEntity(world, caughtEntity);
      }

      updated = true;
    }
  }

  return { finished, updated };
};

export const arrowShot: Sequence<ArrowSequence> = (world, entity, state) => {
  const tick = world.assertByIdAndComponents(entity[MOVABLE].reference, [
    REFERENCE,
  ])[REFERENCE].tick;
  const orientation = (entity[ORIENTABLE].facing || "up") as Orientation;
  const delta = orientationPoints[orientation];
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

const tornadoTicks = 21;
const tornadoSpeed = 25;
const gustLength = 11;

export const tornadoSpin: Sequence<TornadoSequence> = (
  world,
  entity,
  state
) => {
  const size = world.metadata.gameEntity[LEVEL].size;
  const entityId = world.getEntityId(entity);
  const material = state.args.material || "default";
  const element = state.args.element || "default";
  const windSideSprite = (state.args.amount <= 1 ? windSide : gustSide)[
    material
  ][element];
  const windCornerSprite = (state.args.amount <= 1 ? windCorner : gustCorner)[
    material
  ][element];
  const tornadoGeneration = Math.floor(state.elapsed / tornadoSpeed);
  const ringSize = state.args.radius * 8;
  const targetKnock = Math.min(state.args.radius, 2);
  const nextGeneration = Math.floor(tornadoGeneration / tornadoTicks);

  const finished = false;
  let updated = false;

  // create new gusts in random direction
  if (state.args.last !== nextGeneration && state.args.radius > 0) {
    const orientation = choice(...orientations);
    state.args.last = nextGeneration;
    state.args.gusts.push(
      ...range(0, gustLength - 1).map((offset) => ({
        index: nextGeneration * gustLength + offset,
        generation: tornadoGeneration + gustLength + offset,
        orientation,
        radius: state.args.radius,
      }))
    );

    updated = true;
  }

  // update knock intensity
  if (entity[CASTABLE].knock !== targetKnock) {
    entity[CASTABLE].knock = targetKnock;
    rerenderEntity(world, entity);
    updated = true;
  }

  // create exertables on sides only
  if (state.args.exertables.length !== ringSize - 4) {
    // clear previous exertables first
    for (const exertableId of state.args.exertables) {
      const exertableEntity = world.assertById(exertableId);
      disposeEntity(world, exertableEntity);
    }
    state.args.exertables = [];

    // create sides
    const sideLength = (state.args.radius - 1) * 2 + 1;

    for (const iteration of iterations) {
      for (let sideIndex = 0; sideIndex < sideLength; sideIndex += 1) {
        const invertedOrientation = invertOrientation(iteration.orientation);
        const offset = {
          x:
            iteration.direction.x * state.args.radius +
            iteration.normal.x * (state.args.radius - sideLength + sideIndex),
          y:
            iteration.direction.y * state.args.radius +
            iteration.normal.y * (state.args.radius - sideLength + sideIndex),
        };
        const effectEntity = entities.createEffect(world, {
          [EXERTABLE]: { castable: entityId },
          [ORIENTABLE]: { facing: invertedOrientation },
          [POSITION]: combine(size, entity[POSITION], offset),
        });
        state.args.exertables.push(world.getEntityId(effectEntity));
        registerEntity(world, effectEntity);
      }
    }
    updated = true;
  }

  // update exertable positions
  const moved = {
    x: signedDistance(state.args.position.x, entity[POSITION].x, size),
    y: signedDistance(state.args.position.y, entity[POSITION].y, size),
  };
  if (moved.x !== 0 || moved.y !== 0) {
    for (const exertableId of state.args.exertables) {
      const exertableEntity = world.assertByIdAndComponents(exertableId, [
        POSITION,
      ]);
      moveEntity(
        world,
        exertableEntity,
        combine(size, exertableEntity[POSITION], moved)
      );
    }
    state.args.position = copy(entity[POSITION]);
  }

  // move particles in inward circular motion around the square, or remove
  if (state.args.generation !== tornadoGeneration) {
    state.args.generation = tornadoGeneration;
    updated = true;

    const remainingGusts: TornadoSequence["gusts"] = [];
    state.args.gusts.forEach((gust) => {
      const { generation, index, orientation, radius } = gust;
      const gustProgress = tornadoGeneration - generation;
      const gustName = `gust-${index}`;

      // deduct current ring and offset from progress
      const gustMaximum = (radius * 2 + 1) ** 2;
      const gustGeneration = gustMaximum - gustProgress;
      const gustRing = Math.ceil((Math.sqrt(1 + gustGeneration) - 1) / 2);
      const gustRingSize = gustRing * 8;
      const ringOffset = 4 * gustRing * (gustRing - 1);
      const ringIndex = gustGeneration - ringOffset - 1;
      const sideIndex = gustRing === 0 ? 0 : ringIndex % (gustRingSize / 4);
      const sideLength = (gustRing - 1) * 2 + 1;
      const isCorner =
        ringIndex === 0 ||
        (sideIndex === gustRingSize / 4 - 1 && ringIndex !== gustRingSize - 1);

      // wait until gust becomes visible
      if (gustGeneration >= gustMaximum - 1) {
        remainingGusts.push(gust);
        return;
      }

      // create new gusts
      if (!state.particles[gustName]) {
        const delta = orientationPoints[orientation];
        const gustParticle = entities.createFibre(world, {
          [ORIENTABLE]: { facing: orientation },
          [PARTICLE]: {
            offsetX: delta.x,
            offsetY: delta.y,
            offsetZ: particleHeight,
            duration: tornadoSpeed,
          },
          [RENDERABLE]: { generation: 1 },
          [SPRITE]: none,
        });
        state.particles[`gust-${index}`] = world.getEntityId(gustParticle);
      }

      const gustEntity = world.assertByIdAndComponents(
        state.particles[gustName],
        [ORIENTABLE, PARTICLE, SPRITE]
      );

      const gustOrientation = rotateOrientation(
        orientation,
        gustRing === 0 ? -1 : Math.floor(ringIndex / (gustRingSize / 4))
      );

      // delete finished gusts
      if (gustGeneration < 0) {
        disposeEntity(world, gustEntity);
        delete state.particles[gustName];
        return;
      }

      remainingGusts.push(gust);

      // update particle position and sprite
      const iteration = iterations.find(
        (iter) => iter.orientation === gustOrientation
      )!;
      gustEntity[PARTICLE].offsetX =
        gustRing === 0
          ? 0
          : iteration.direction.x * gustRing +
            iteration.normal.x * (gustRing - sideLength + sideIndex);
      gustEntity[PARTICLE].offsetY =
        gustRing === 0
          ? 0
          : iteration.direction.y * gustRing +
            iteration.normal.y * (gustRing - sideLength + sideIndex);
      gustEntity[ORIENTABLE].facing = rotateOrientation(
        gustOrientation,
        ringIndex === 0 && gustGeneration !== 0 ? 0 : 1
      );
      gustEntity[SPRITE] = isCorner ? windCornerSprite : windSideSprite;
      rerenderEntity(world, gustEntity);
    });

    state.args.gusts = remainingGusts;

    updated = true;
  }

  // clean up particles and exertables
  if (finished) {
    for (const particleName in state.particles) {
      const particleEntity = world.assertById(state.particles[particleName]);
      disposeEntity(world, particleEntity);
      delete state.particles[particleName];
    }

    for (const exertableId of state.args.exertables) {
      const exertableEntity = world.assertById(exertableId);
      disposeEntity(world, exertableEntity);
    }
    state.args.exertables = [];
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

const spearTicks = 5;
const spearRange = 3;

export const chargeSpear: Sequence<SlashSequence> = (world, entity, state) => {
  const size = world.metadata.gameEntity[LEVEL].size;
  const castableEntity = world.assertByIdAndComponents(state.args.castable, [
    BELONGABLE,
    CASTABLE,
    POSITION,
  ]);
  const targetProgress = Math.min(
    Math.ceil((state.elapsed * spearTicks) / state.args.tick),
    spearTicks
  );
  const spearSpeed = (state.args.tick / spearTicks) * 2;
  const material = state.args.material;
  const element = state.args.element || "default";
  const casterEntity = world.getEntityByIdAndComponents(
    entity[CASTABLE].caster,
    [EQUIPPABLE, MELEE]
  );
  const weaponEntity = world.getEntityByIdAndComponents(
    casterEntity?.[EQUIPPABLE].weapon,
    [ORIENTABLE]
  );

  if (!casterEntity || !weaponEntity) {
    return { updated: false, finished: true };
  }

  let finished = targetProgress >= spearTicks - 1;
  let updated = false;
  const orientation = (castableEntity[ORIENTABLE]?.facing ||
    "right") as Orientation;

  if (state.args.exertables.length === 0 && !finished) {
    // orient weapon
    weaponEntity[ORIENTABLE].facing = orientation;
    rerenderEntity(world, weaponEntity);

    // create individual damage areas along spear
    const delta = orientationPoints[orientation];
    const { affected, ...castableData } = castableEntity[CASTABLE];
    for (let rangeIndex = 0; rangeIndex < spearRange; rangeIndex += 1) {
      const offset = {
        x: delta.x * (rangeIndex + 1),
        y: delta.y * (rangeIndex + 1),
      };
      const rangePosition = combine(size, castableEntity[POSITION], offset);
      const rangeDamage = entities.createDamage(world, {
        [BELONGABLE]: castableEntity[BELONGABLE],
        [CASTABLE]: {
          ...getEmptyCastable(world, entity),
          ...castableData,
        },
        [EXERTABLE]: { castable: -1 },
        [FRAGMENT]: { structure: world.getEntityId(entity) },
        [ORIENTABLE]: { facing: orientation },
        [POSITION]: rangePosition,
        [RENDERABLE]: { generation: 0 },
        [SEQUENCABLE]: { states: {} },
        [SPRITE]: none,
      });
      const damageId = world.getEntityId(rangeDamage);
      rangeDamage[EXERTABLE].castable = damageId;
      state.args.exertables.push(damageId);

      // create spear line and tip particles
      const spearParticle = entities.createFibre(world, {
        [ORIENTABLE]: { facing: orientation },
        [PARTICLE]: {
          offsetX: offset.x,
          offsetY: offset.y,
          offsetZ: particleHeight,
          duration: spearSpeed,
          animatedOrigin: { x: 0, y: 0 },
        },
        [RENDERABLE]: { generation: 1 },
        [SPRITE]: (rangeIndex === spearRange - 1 ? spearTip : spearLine)[
          material
        ][rangeIndex === 0 ? element : "default"],
      });
      state.particles[`spear-${rangeIndex}`] = world.getEntityId(spearParticle);
    }

    updated = true;
  }

  if (finished) {
    // reset weapon
    casterEntity[MELEE].facing = undefined;
    weaponEntity[ORIENTABLE].facing = undefined;
    rerenderEntity(world, weaponEntity);

    // delete castable and AoE
    for (const exertableId of state.args.exertables) {
      disposeEntity(world, world.assertById(exertableId));
    }
    state.args.exertables = [];

    // delete particles
    for (const particleName in state.particles) {
      const particleEntity = world.assertByIdAndComponents(
        state.particles[particleName],
        [PARTICLE]
      );

      disposeEntity(world, particleEntity);
      delete state.particles[particleName];
    }
  }

  return { finished, updated };
};

const beamSpeed = 100;
const beamTicks = 3;

export const castBeam1: Sequence<SpellSequence> = (world, entity, state) => {
  const entityId = world.getEntityId(entity);
  const size = world.metadata.gameEntity[LEVEL].size;
  const progress = Math.ceil(state.elapsed / beamSpeed);
  const orientation = (entity[ORIENTABLE].facing || "up") as Orientation;
  const delta = orientationPoints[orientation];
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
    state.args.areas = [];
  }

  return { finished, updated };
};

export const trapAura: Sequence<AuraSequence> = (world, entity, state) => {
  const entityId = world.getEntityId(entity);
  const size = world.metadata.gameEntity[LEVEL].size;
  const progress = Math.ceil(
    state.elapsed / world.metadata.gameEntity[REFERENCE].tick
  );
  const material = state.args.material || "default";
  const element = state.args.element || "default";

  let finished =
    progress > state.args.duration ||
    Object.keys(entity[CASTABLE].affected).length > 0;
  let updated = false;

  // create bolt particle
  const casterEntity = world.getEntityByIdAndComponents(
    entity[CASTABLE].caster,
    [POSITION]
  );
  const hasMoved =
    !casterEntity ||
    getDistance(entity[POSITION], casterEntity[POSITION], size) !== 0;
  if (!state.particles.trap && hasMoved) {
    const trapParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: 0,
        offsetY: 0,
        offsetZ: effectHeight,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: trigger[material][element],
    });
    state.particles.trap = world.getEntityId(trapParticle);

    // create effect areas
    const aoeEntity = entities.createAoe(world, {
      [EXERTABLE]: { castable: entityId },
      [POSITION]: copy(entity[POSITION]),
    });
    registerEntity(world, aoeEntity);
    state.args.areas.push(world.getEntityId(aoeEntity));
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
    state.args.areas = [];

    updated = true;
  }

  state.args.progress = progress;

  return { finished, updated };
};

const dashRemain = 2;
const dashTime = 50;

export const castDash: Sequence<SpellSequence> = (world, entity, state) => {
  const casterEntity = world.getEntityByIdAndComponents(
    entity[CASTABLE].caster,
    [POSITION, RENDERABLE]
  );
  const size = world.metadata.gameEntity[LEVEL].size;
  const entityId = world.getEntityId(entity);
  const orientation = (entity[ORIENTABLE].facing || "up") as Orientation;
  const delta = orientationPoints[orientation];
  const progress = Math.ceil(state.elapsed / dashTime);
  const material = state.args.material || "default";
  const element = state.args.element || "default";
  const teleportTicks = state.args.duration;

  let finished =
    progress >= teleportTicks + dashRemain ||
    (casterEntity && isDead(world, casterEntity));
  let updated = false;

  // create dash particles and teleport anchor
  if (!state.args.memory?.position && progress < teleportTicks) {
    let position = copy(entity[POSITION]);

    // dash through attackables and lootables
    let offset = 0;
    let target = 0;

    while (offset < state.args.range) {
      position = combine(size, position, delta);
      offset += 1;
      if (isWalkable(world, position)) {
        target = offset;
        continue;
      }
      const attackable = getAttackable(world, position);
      const lootable = getLootable(world, position);
      if (
        !(attackable && !isFriendlyFire(world, entity, attackable)) &&
        !lootable
      )
        break;
    }

    // create particles
    offset = 0;
    position = { x: 0, y: 0 };
    while (offset <= target) {
      const particleEntity = entities.createFibre(world, {
        [ORIENTABLE]: { facing: orientation },
        [PARTICLE]: {
          offsetX: position.x,
          offsetY: position.y,
          offsetZ: effectHeight,
        },
        [RENDERABLE]: { generation: 1 },
        [SPRITE]: dash[material][offset % 2 === 0 ? "default" : element],
      });
      state.particles[`dash-${offset}`] = world.getEntityId(particleEntity);

      position = add(position, delta);
      offset += 1;
    }

    if (target === 0) {
      finished = true;
    } else {
      updated = true;
      state.args.memory = { position, target };

      // create blocking anchor
      const teleportEntity = entities.createTeleport(world, {
        [COLLIDABLE]: {},
        [POSITION]: combine(size, entity[POSITION], {
          x: delta.x * target,
          y: delta.y * target,
        }),
        [RENDERABLE]: { generation: 1 },
        [LIGHT]: {
          brightness: 0,
          visibility: casterEntity?.[LIGHT]?.visibility || 0,
          darkness: 0,
        },
      });
      registerEntity(world, teleportEntity);
      state.args.memory.teleport = world.getEntityId(teleportEntity);

      // prevent movements
      if (
        casterEntity &&
        casterEntity[MOVABLE] &&
        !isDead(world, casterEntity)
      ) {
        state.args.memory.movable = casterEntity[MOVABLE];
        world.removeComponentFromEntity(
          casterEntity as TypedEntity<"MOVABLE">,
          MOVABLE
        );
      }
    }
  }

  // move entity and activate areas
  if (
    casterEntity &&
    progress >= teleportTicks &&
    state.args.memory?.position
  ) {
    delete state.args.memory.position;
    const target = state.args.memory.target;

    let offset = 0;
    let origin = copy(entity[POSITION]);
    while (offset <= target) {
      const aoeEntity = entities.createAoe(world, {
        [EXERTABLE]: { castable: entityId },
        [POSITION]: origin,
      });
      registerEntity(world, aoeEntity);
      state.args.areas.push(world.getEntityId(aoeEntity));

      origin = combine(size, origin, delta);
      offset += 1;
    }

    moveEntity(
      world,
      casterEntity,
      combine(size, entity[POSITION], {
        x: delta.x * target,
        y: delta.y * target,
      })
    );
    rerenderEntity(world, casterEntity);
    const teleportEntity = world.assertById(state.args.memory.teleport);
    disposeEntity(world, teleportEntity);
    delete state.args.memory.teleport;

    updated = true;
  }

  // reactivate movement and disable damage
  if (casterEntity && progress > teleportTicks && !casterEntity[MOVABLE]) {
    for (const aoeId of state.args.areas) {
      const aoeEntity = world.assertById(aoeId);
      disposeEntity(world, aoeEntity);
    }
    state.args.areas = [];

    world.addComponentToEntity(
      casterEntity,
      MOVABLE,
      state.args.memory.movable
    );
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
    state.args.areas = [];

    const teleportEntity = world.getEntityById(state.args.memory?.teleport);
    if (teleportEntity) {
      disposeEntity(world, teleportEntity);
      delete state.args.memory?.teleport;
    }

    updated = true;
  }

  state.args.progress = progress;

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
    state.args.areas = [];

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
      ).filter((exertable) => exertable[EXERTABLE].castable === entityId);

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
    state.args.areas = [];

    updated = true;
  }

  state.args.progress = progress;

  return { finished, updated };
};

const auraSpeed = 75;

export const totemAura: Sequence<AuraSequence> = (world, entity, state) => {
  const entityId = world.getEntityId(entity);
  const size = world.metadata.gameEntity[LEVEL].size;
  const generation = Math.floor(
    state.elapsed / world.metadata.gameEntity[REFERENCE].tick
  );
  const auraGeneration = Math.floor(state.elapsed / auraSpeed);

  let finished = isDead(world, entity);
  let updated = false;

  // create effect areas
  if (state.args.areas.length === 0) {
    state.args.memory = {
      position: copy(entity[POSITION]),
      generation: auraGeneration,
    };

    const areaPoints = pixelCircle(
      { x: 0, y: 0 },
      state.args.range,
      undefined,
      true
    );

    for (const aoePoint of areaPoints) {
      const aoeEntity = entities.createAoe(world, {
        [EXERTABLE]: { castable: entityId },
        [POSITION]: combine(size, entity[POSITION], aoePoint),
      });
      registerEntity(world, aoeEntity);
      state.args.areas.push(world.getEntityId(aoeEntity));
    }

    const circlePoints = pixelCircle({ x: 0, y: 0 }, state.args.range);
    const sortedPoints = circlePoints.sort(
      (left, right) =>
        pointToDegree({
          x: signedDistance(0, left.x, size) * aspectRatio,
          y: signedDistance(0, left.y, size),
        }) -
        pointToDegree({
          x: signedDistance(0, right.x, size) * aspectRatio,
          y: signedDistance(0, right.y, size),
        })
    );
    state.args.memory.circle = sortedPoints;
    for (const auraPoint of sortedPoints) {
      const auraParticle = entities.createParticle(world, {
        [PARTICLE]: {
          offsetX: auraPoint.x,
          offsetY: auraPoint.y,
          offsetZ: particleHeight,
          amount: 0,
        },
        [RENDERABLE]: { generation: 1 },
        [SPRITE]: auraEdge,
      });
      state.particles[`aura-${auraPoint.x}-${auraPoint.y}`] =
        world.getEntityId(auraParticle);
    }

    updated = true;
  }

  // reduce hp each tick
  if (state.args.progress !== generation) {
    entity[STATS].hp = Math.max(entity[STATS].hp - 1, 0);
    rerenderEntity(world, entity);
    state.args.progress = generation;
  }

  // move if totem was pushed
  const delta = {
    x: signedDistance(state.args.memory.position.x, entity[POSITION].x, size),
    y: signedDistance(state.args.memory.position.y, entity[POSITION].y, size),
  };
  if (delta.x !== 0 || delta.y !== 0) {
    for (const aoeId of state.args.areas) {
      const aoeEntity = world.assertByIdAndComponents(aoeId, [POSITION]);
      moveEntity(world, aoeEntity, combine(size, aoeEntity[POSITION], delta));
      if (RENDERABLE in aoeEntity) {
        rerenderEntity(world, aoeEntity);
      }
    }

    state.args.memory.position = copy(entity[POSITION]);
    updated = true;
  }

  // animate aura
  if (state.args.memory.generation !== auraGeneration) {
    const points = state.args.memory.circle.length;
    for (let auraIndex = 0; auraIndex < points; auraIndex += 1) {
      const auraPoint = state.args.memory.circle[auraIndex];
      const auraParticle = world.assertByIdAndComponents(
        state.particles[`aura-${auraPoint.x}-${auraPoint.y}`],
        [PARTICLE]
      );
      const amount = Math.max(
        0,
        Math.abs(((auraGeneration + 10) % 15) - 7) -
          4 -
          Math.abs((auraIndex % 2) - 0) -
          (auraIndex % 4 === 0 ? 2 : 0)
      );
      if (auraParticle[PARTICLE].amount !== amount) {
        auraParticle[PARTICLE].amount = amount;
        rerenderEntity(world, auraParticle);
      }
    }

    state.args.memory.generation = auraGeneration;
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
    state.args.areas = [];

    updated = true;
  }

  return { finished, updated };
};

const markerDuration = 150;
const healMultiplier = 2;
const markerType: Record<MarkerType, Sprite> = {
  melee: meleeHit,
  magic: magicHit,
  true: trueHit,
  heal: healHit,
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
    state.args.type !== "heal"
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
      [PARTICLE]: {
        offsetX: 0,
        offsetY: 0,
        offsetZ: entity[LIGHT]?.darkness ? floatHeight : decayHeight,
      },
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
            return;
          }

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

    // add max stats and add to current stats
    if (state.args.maxHp) {
      entity[STATS].maxHp = Math.min(
        entity[STATS].maxHpCap,
        entity[STATS].maxHp + state.args.maxHp
      );
      entity[STATS].hp = Math.min(
        entity[STATS].maxHp,
        entity[STATS].hp + state.args.maxHp
      );
      entity[PLAYER].receivedStats.maxHp += state.args.maxHp;
    }
    if (state.args.maxMp) {
      entity[STATS].maxMp = Math.min(
        entity[STATS].maxMpCap,
        entity[STATS].maxMp + state.args.maxMp
      );
      entity[STATS].mp = Math.min(
        entity[STATS].maxMp,
        entity[STATS].mp + state.args.maxMp
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
  } else if (transaction === "brew") {
    handler = displayBrew;
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
  } else if (transaction === "use") {
    handler = displayUse;
  } else if (transaction === "equip") {
    handler = displayEquip;
  } else if (transaction === "class") {
    handler = displayClass;
  } else if (transaction === "style") {
    handler = displayStyle;
  } else if (transaction === "warp") {
    handler = displayWarp;
  } else if (transaction === "plant") {
    handler = displayPlant;
  } else if (transaction === "build") {
    handler = displayBuild;
  } else if (transaction === "chat") {
    handler = displayChat;
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
    details,
    undefined,
    createButton("BUY", 5, !shoppable, false, false, "lime")
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
    : inventoryItems.length > 0
    ? []
    : undefined;

  const popupResult = renderPopup(
    world,
    entity,
    state,
    shop,
    content,
    !hasItems ? undefined : selectedItem && sellable ? "active" : "blocked",
    details,
    undefined,
    createButton("SELL", 6, !sellable, false, false, "lime")
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
  const heroEntity = getIdentifierAndComponents(world, "hero", [
    INVENTORY,
    POSITION,
  ]);

  if (!heroEntity) {
    return { updated: false, finished: true };
  }

  const bagItems = (heroEntity[INVENTORY] as Inventory).items.filter(
    (item) =>
      !slots.some(
        (slot) => world.assertByIdAndComponents(item, [ITEM])[ITEM][slot]
      )
  );
  const hasItems = bagItems.length > 0;
  const verticalIndex = getVerticalIndex(world, entity);

  const content: Sprite[][] = hasItems
    ? bagItems.map((item, rowIndex) => {
        const itemEntity = world.assertByIdAndComponents(item, [ITEM]);

        if (slots.some((slot) => itemEntity[ITEM][slot])) {
          return [];
        }

        const selected = verticalIndex === rowIndex;
        const itemConsumption = getItemConsumption(itemEntity);
        const consumptionConfig =
          itemEntity &&
          consumptionConfigs[itemEntity[ITEM].consume!]?.[
            itemEntity[ITEM].material!
          ]?.[itemEntity[ITEM].stat!];

        const itemSprite = getItemSprite(
          itemEntity[ITEM],
          "display",
          undefined,
          1
        );
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
              itemConsumption.countable,
              "text",
              itemConsumption.percentage
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
    : [createText("No items yet.", colors.grey)];

  const selectedItem = world.getEntityByIdAndComponents(
    bagItems[verticalIndex],
    [ITEM]
  );
  const selectedUsable = selectedItem && getItemConsumption(selectedItem);
  const details = selectedItem && getItemDescription(selectedItem[ITEM]);

  const popupResult = renderPopup(
    world,
    entity,
    state,
    undefined,
    content,
    selectedUsable ? "active" : hasItems ? "selected" : undefined,
    details,
    undefined,
    createButton(
      selectedUsable ? "EAT" : "USE",
      5,
      !selectedUsable,
      false,
      false,
      "lime"
    )
  );
  return {
    updated: popupResult.updated,
    finished: popupResult.finished,
  };
};

export const displayPlant: Sequence<PopupSequence> = (world, entity, state) => {
  const heroEntity = getIdentifierAndComponents(world, "hero", [
    INVENTORY,
    POSITION,
  ]);

  if (!heroEntity) {
    return { updated: false, finished: true };
  }

  const plantItems = (heroEntity[INVENTORY] as Inventory).items.filter((item) =>
    isPlantable(world, world.assertByIdAndComponents(item, [ITEM])[ITEM])
  );
  const hasItems = plantItems.length > 0;
  const verticalIndex = getVerticalIndex(world, entity);

  const content: Sprite[][] = hasItems
    ? plantItems.map((item, rowIndex) => {
        const itemEntity = world.assertByIdAndComponents(item, [ITEM]);

        const selected = verticalIndex === rowIndex;
        const plantConfig =
          itemEntity && plantConfigs[itemEntity[ITEM].stackable!];

        const itemSprite = getItemSprite(
          itemEntity[ITEM],
          "display",
          undefined,
          1
        );
        const textColor = selected ? colors.white : colors.grey;

        const amountText = [
          ...createText(`${itemEntity[ITEM].amount}`, textColor),
          recolorSprite(times, {
            [colors.white]: textColor,
          }),
        ];
        const plantText = [
          delay,
          ...createText(
            plantConfig?.duration.toString() || "0",
            selected ? colors.yellow : colors.olive
          ),
        ];
        const itemText = createText(itemSprite.name, textColor);
        const line = [
          ...itemText,
          ...plantText,
          ...repeat(
            none,
            frameWidth -
              4 -
              amountText.length -
              itemText.length -
              plantText.length
          ),
          ...amountText,
        ];

        return [
          none,
          itemSprite,
          ...(selected ? shaded(line, colors.grey) : line),
        ];
      })
    : [createText("Nothing to plant.", colors.grey)];

  const selectedItem = world.getEntityByIdAndComponents(
    plantItems[verticalIndex],
    [ITEM]
  );
  const details = selectedItem && getItemDescription(selectedItem[ITEM]);

  const popupResult = renderPopup(
    world,
    entity,
    state,
    undefined,
    content,
    hasItems ? "selected" : undefined,
    details,
    undefined,
    createButton("PLANT", 6, !hasItems, false, false, "lime")
  );
  return {
    updated: popupResult.updated,
    finished: popupResult.finished,
  };
};

const buildSeparator = 9;

export const displayBuild: Sequence<PopupSequence> = (world, entity, state) => {
  const heroEntity = getIdentifierAndComponents(world, "hero", [
    EQUIPPABLE,
    POSITION,
  ]);
  const verticalIndex = getVerticalIndex(world, entity);
  const toolEntity = world.getEntityByIdAndComponents(
    heroEntity?.[EQUIPPABLE].tool,
    [ITEM, SPRITE]
  );

  if (!heroEntity || !toolEntity) {
    return { finished: true, updated: true };
  }

  const buildStat = getItemStats(toolEntity[ITEM]).build;
  const entityConstructions: Construction[] = [
    {
      description: [
        [
          ...createText("Select to "),
          build,
          ...createText("Build", colors.green),
        ],
        [
          ...createText("a "),
          plot,
          ...createText("Plot", colors.grey),
          ...createText(" or fix"),
        ],
        createText("damaged objects."),
      ],
      variants: [
        {
          cell: "air",
          sprite: repair,
        },
      ],
      grounds: [],
      parts: [toolEntity[ITEM]],
      level: buildStat || 1,
      effort: 0,
    },
    ...buildConstructions,
  ];
  const selectedConstruction = entityConstructions[verticalIndex];
  const selectedShoppable =
    selectedConstruction &&
    canShop(world, heroEntity, getBuildingDeal(selectedConstruction));
  const selectedConstructable =
    selectedConstruction &&
    canConstruct(world, heroEntity, selectedConstruction);
  const selectedBuildable = selectedShoppable && selectedConstructable;

  let content = [createText("Nothing to build.", colors.grey)];

  if (heroEntity && selectedConstruction) {
    const scrollIndex =
      verticalIndex -
      scrolledVerticalIndex(
        world,
        entity,
        state,
        Array.from({ length: entityConstructions.length }),
        "selected",
        []
      );
    const constructionLines = [
      ...selectedConstruction.parts
        .map((item, index) => {
          const existingPart = existingFund(world, heroEntity, item);
          const itemLine = [
            ...createText(existingPart.toString()),
            ...createText("/", colors.grey),
            ...createText(
              item.amount.toString(),
              existingPart >= item.amount ? colors.lime : colors.red
            ),
            getItemSprite(item),
          ];
          const padding =
            selectedConstruction.parts.length === 1 && index === 0;
          return [
            ...(padding
              ? [
                  [
                    selectedBuildable ? buildLeftActive : buildLeft,
                    ...repeat(none, frameWidth - 3 - buildSeparator),
                  ],
                ]
              : []),
            [
              selectedBuildable ? buildLeftActive : buildLeft,
              ...createText(getItemSprite(item).name, colors.grey),
            ],
            [
              selectedBuildable ? buildLeftActive : buildLeft,
              ...repeat(
                none,
                frameWidth - 3 - buildSeparator - itemLine.length
              ),
              ...itemLine,
            ],
            ...(padding
              ? [
                  [
                    selectedBuildable ? buildLeftActive : buildLeft,
                    ...repeat(none, frameWidth - 3 - buildSeparator),
                  ],
                ]
              : []),
          ];
        })
        .flat(),
      selectedBuildable
        ? [
            buildDownLeftActive,
            ...repeat(buildDownActive, frameWidth - 3 - buildSeparator),
          ]
        : [
            buildDownLeft,
            ...repeat(buildDown, frameWidth - 3 - buildSeparator),
          ],
    ];
    content = entityConstructions.map((construction, rowIndex) => {
      const selected = verticalIndex === rowIndex;
      const textColor = selected ? colors.white : colors.grey;
      const itemSprite = construction.variants[0].sprite;

      const rowShoppable = canShop(
        world,
        heroEntity,
        getBuildingDeal(construction)
      );
      const rowConstructable = canConstruct(world, heroEntity, construction);
      const itemLine = [
        ...createText(
          selected ? itemSprite.name : "─".repeat(itemSprite.name.length),
          textColor
        ),
        ...repeat(none, 7 - itemSprite.name.length),
      ];
      const visibleIndex = rowIndex - scrollIndex;
      const line = constructionLines[visibleIndex] || [];

      return [
        !rowConstructable && !selected
          ? blocked
          : rowShoppable && !selected
          ? recolorSprite(star, colors.lime)
          : none,
        itemSprite,
        ...(selected
          ? selectedConstructable
            ? shaded(
                itemLine,
                selectedBuildable ? colors.green : colors.grey,
                selectedBuildable ? "▄" : undefined
              )
            : dotted(itemLine, colors.red)
          : itemLine),
        ...line,
      ];
    });
  }

  const details = selectedConstructable
    ? selectedConstruction.description
    : [
        [
          ...createText("Requires ", colors.grey),
          ...createCountable(
            { build: selectedConstruction.level },
            "build",
            "display"
          ),
          ...createText(".", colors.grey),
        ],
      ];
  const popupResult = renderPopup(
    world,
    entity,
    state,
    undefined,
    content,
    !selectedConstructable
      ? "blocked"
      : selectedShoppable
      ? "active"
      : selectedConstruction
      ? "selected"
      : undefined,
    details,
    undefined,
    verticalIndex === 0
      ? createButton("USE", 5, false, false, false, "lime")
      : createButton("PICK", 6, !selectedBuildable, false, false, "lime")
  );

  // draw top separator
  const topSeparatorParticle = world.assertByIdAndComponents(
    state.particles[`popup-up-${buildSeparator}`],
    [ORIENTABLE, PARTICLE, SPRITE]
  );
  const separatorFacing = selectedBuildable ? "right" : "down";
  if (
    topSeparatorParticle[ORIENTABLE].facing !== separatorFacing &&
    selectedConstruction
  ) {
    topSeparatorParticle[SPRITE] = buildCenterTop;
    topSeparatorParticle[ORIENTABLE].facing = separatorFacing;
    popupResult.updated = true;
  }

  return {
    updated: popupResult.updated,
    finished: popupResult.finished,
  };
};

export const displayStats: Sequence<PopupSequence> = (world, entity, state) => {
  const heroEntity = getIdentifierAndComponents(world, "hero", [
    SPAWNABLE,
    POSITION,
  ]);

  if (!heroEntity) {
    return { updated: false, finished: true };
  }

  const displayStats = getEntityDisplayStats(world, heroEntity);
  const verticalIndex = getVerticalIndex(world, entity);
  const classSelected = verticalIndex === 0;
  const classConfig = entitySprites[heroEntity[SPAWNABLE].classKey as ClassKey];
  const className = classConfig.sprite.name;
  const classLine = [
    ...createText("Class"),
    ...repeat(none, frameWidth - 9 - className.length),
    ...createText(className, classSelected ? colors.white : colors.grey),
  ];
  const content: Sprite[][] = [
    [
      none,
      class_,
      ...(classSelected ? shaded(classLine, colors.grey) : classLine),
    ],
    ...visibleStats.map((stat, rowIndex) => {
      const selected = verticalIndex === rowIndex + 1;
      const statSprite = getStatSprite(stat);
      const statColor = getStatColor(stat);
      const statText = createText(
        statSprite.name,
        selected
          ? statColor === colors.grey
            ? colors.white
            : brighten(statColor)
          : statColor
      );
      const amountText = createText(
        displayStats[stat].toString(),
        selected ? colors.white : colors.grey
      );

      const line = [
        ...statText,
        ...repeat(none, frameWidth - 5 - statText.length - amountText.length),
        ...amountText,
        ...createText(
          "₧",
          selected
            ? statColor === colors.grey
              ? colors.white
              : brighten(statColor)
            : statColor
        ),
      ];
      return [
        none,
        statSprite,
        ...(selected
          ? shaded(
              line,
              statColor === colors.white ? colors.grey : darken(statColor)
            )
          : line),
      ];
    }),
  ];
  const details = classSelected
    ? getEntityDescription({}, classConfig)
    : getItemDescription({ stat: visibleStats[verticalIndex - 1] });
  const popupResult = renderPopup(
    world,
    entity,
    state,
    undefined,
    content,
    "selected",
    details
  );
  return {
    updated: popupResult.updated,
    finished: popupResult.finished,
  };
};

const gearShadows: Record<Equipment, Sprite> = {
  weapon: weaponSlot,
  offhand: offhandSlot,
  spell: spellSlot,
  skill: skillSlot,
  tool: toolSlot,
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
  const heroEntity = getIdentifierAndComponents(world, "hero", [
    EQUIPPABLE,
    SPAWNABLE,
  ]);

  if (!heroEntity) {
    return { updated: false, finished: true };
  }

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

  const weaponItem = world.getEntityByIdAndComponents(
    heroEntity[EQUIPPABLE].weapon,
    [ITEM]
  )?.[ITEM];
  const offhandItem = world.getEntityByIdAndComponents(
    heroEntity[EQUIPPABLE].offhand,
    [ITEM]
  )?.[ITEM];

  const heroPixels = overlay(
    offhandItem?.material || offhandItem?.element
      ? recolorPixels(shieldPixels, {
          [colors.white]:
            colorPalettes[(offhandItem.material || offhandItem.element)!]
              .primary,
        })
      : [],
    offhandItem?.material && offhandItem?.element
      ? recolorPixels(shieldElementPixels, {
          [colors.white]:
            // adjust low constrast on gold material and air element
            offhandItem.material === "gold" && offhandItem.element === "air"
              ? colors.grey
              : colorPalettes[offhandItem.element].primary,
        })
      : [],
    bodyPixels,
    recolorPixels(
      classPixels[(heroEntity[SPAWNABLE] as Spawnable).classKey] || [],
      {
        [colors.white]: heroEntity[SPAWNABLE].hairColor,
      }
    ),
    weaponItem?.material || weaponItem?.element
      ? recolorPixels(
          weaponItem.weapon === "spear"
            ? spearPixels
            : weaponItem.weapon === "wand"
            ? wandPixels
            : swordPixels,
          {
            [colors.white]:
              colorPalettes[(weaponItem?.material || weaponItem?.element)!]
                .primary,
            [colors.grey]:
              weaponItem.material === "iron"
                ? colors.white
                : colorPalettes[(weaponItem?.material || weaponItem?.element)!]
                    .secondary,
          }
        )
      : [],
    weaponItem?.material && weaponItem?.element
      ? recolorPixels(weaponElementPixels, {
          [colors.white]:
            // adjust low constrast on gold material and air element
            weaponItem.material === "gold" && weaponItem.element === "air"
              ? colors.grey
              : colorPalettes[weaponItem.element].primary,
        })
      : []
  );

  const descriptions: Sprite[][][] = [];
  const content: Sprite[][] = gearSlots.map((gear, rowIndex) => {
    const equippedId = heroEntity[EQUIPPABLE][gear];
    const duplicateSlot =
      equippedId &&
      gearSlots
        .slice(0, rowIndex)
        .find((slot) => heroEntity[EQUIPPABLE][slot] === equippedId);
    const item = world.getEntityByIdAndComponents(equippedId, [ITEM]);
    const name = gearTitles[gear];
    const selected = verticalIndex === rowIndex;
    const title = selected ? name : "─".repeat(name.length);

    if (!item) {
      descriptions.push([
        createText(`No ${title.toLowerCase()} item.`, colors.grey),
      ]);

      const line = [
        ...createText(title, selected ? colors.white : colors.grey),
        ...repeat(none, 7 - title.length),
      ];
      return [
        none,
        selected ? mergeSprites(emptySlot, gearShadows[gear]) : none,
        ...(selected ? dotted(line, colors.red) : line),
        none,
        ...(heroPixels[rowIndex - scrollIndex] || []),
      ];
    }

    if (duplicateSlot) {
      descriptions.push([
        createText(`${title} occupied`, colors.grey),
        [
          ...createText(`by `, colors.grey),
          ...createItemName(item[ITEM]),
          ...createText(".", colors.grey),
        ],
      ]);

      const line = [
        ...createText(title, selected ? colors.white : colors.grey),
        ...repeat(none, 7 - title.length),
      ];
      return [
        none,
        selected ? getBlockedSlot(gearShadows[gear]) : blockedInactive,
        ...(selected ? dotted(line, colors.red) : line),
        none,
        ...(heroPixels[rowIndex - scrollIndex] || []),
      ];
    }

    const gearSprite = getItemSprite(item[ITEM], "display", undefined, 1);
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
  const gearSelected = heroEntity[EQUIPPABLE][gearSlots[verticalIndex]];
  const details = descriptions[verticalIndex];
  const popupResult = renderPopup(
    world,
    entity,
    state,
    undefined,
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
  beach: [colors.olive, 2],
  // TODO: draw path using line chars
  // path: [colors.white, 5],
  mountain: [colors.silver, 4],
  ore: [colors.silver, 4],
  rock: [colors.silver, 3],
  tree: [colors.green, 1],
  hedge: [colors.green, 1],
  cactus: [colors.green, 3],
  ice: [colors.aqua, 1],
  palm: [colors.olive, 1],
  palm_fruit: [colors.olive, 1],
  fence: [colors.maroon, 3],
  palisade: [colors.silver, 3],
  fruit: [colors.green, 1],
};

const gridPixels = 2;
const halfBlockChars = "▀▐▄▌▀▐▄▌";

export const displayMap: Sequence<PopupSequence> = (world, entity, state) => {
  const generation = world.metadata.gameEntity[RENDERABLE].generation;
  const heroEntity = getIdentifierAndComponents(world, "hero", [POSITION]);

  if (!heroEntity?.[EQUIPPABLE]?.map) {
    const popupResult = renderPopup(world, entity, state, undefined, [
      createText("No map item yet.", colors.grey),
    ]);
    return {
      updated: popupResult.updated,
      finished: popupResult.finished,
    };
  }

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
  const size = world.metadata.gameEntity[LEVEL].size;
  const fogSprite = [mapZoom1, mapZoom2, mapZoom3, mapZoom4][verticalIndex];

  const poiMap = world.getEntities([FOG, POI, POSITION]).reduce((pois, poi) => {
    const row = pois[poi[POSITION].x] || {};
    pois[poi[POSITION].x] = row;
    row[poi[POSITION].y] = poi;
    return pois;
  }, {} as Record<number, Record<number, TypedEntity<"FOG" | "POI">>>);

  const content: Sprite[][] = heroEntity
    ? Array.from({ length: frameHeight - 2 }).map((_, gridY) =>
        Array.from({ length: frameWidth - 2 }).map((_, gridX) => {
          const topLeft = combine(size, heroEntity[POSITION], {
            x: (gridX - (frameWidth - 3) / 2) * resolution * gridPixels,
            y: (gridY - (frameHeight - 3) / 2) * resolution * gridPixels,
          });

          const gridColorPixels: Record<string, number>[] = [];
          const pois = [];
          for (let pixelX = 0; pixelX < gridPixels; pixelX += 1) {
            for (let pixelY = 0; pixelY < gridPixels; pixelY += 1) {
              const gridColors: Record<string, number> = {};
              for (let offsetX = 0; offsetX < resolution; offsetX += 1) {
                for (let offsetY = 0; offsetY < resolution; offsetY += 1) {
                  const target = combine(size, topLeft, {
                    x: offsetX + pixelX * resolution,
                    y: offsetY + pixelY * resolution,
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

                  const poi = poiMap[target.x]?.[target.y];
                  if (poi && poi[FOG].visibility !== "hidden") {
                    pois.push(poi);
                  }

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

            // determine adjacent cells with highest cell sum
            const pixelPairs = [
              [gridColorPixels[0], gridColorPixels[2]],
              [gridColorPixels[2], gridColorPixels[3]],
              [gridColorPixels[3], gridColorPixels[1]],
              [gridColorPixels[1], gridColorPixels[0]],
            ];
            const mergedPairs = pixelPairs.map(([left, right]) =>
              Object.keys(left).reduce(
                (sums, key) => {
                  sums[key] = left[key] + (right[key] || 0);
                  return sums;
                },
                { ...right }
              )
            );
            const maxMerged = mergedPairs.reduce(
              (best, pair) => {
                const pairMax = Math.max(...Object.values(pair));
                return pairMax > best.max ? { pair, max: pairMax } : best;
              },
              { pair: {}, max: -Infinity }
            );
            const maxIndex = mergedPairs.indexOf(maxMerged.pair);
            const halfBlockIndex =
              maxIndex === -1
                ? (gridX + gridY) % orientations.length
                : maxIndex;

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

          // add points of interest
          if (pois.length > 0) {
            cellSprite = pois.reduce(
              (merged, poi) => mergeSprites(merged, poi[POI].sprite),
              cellSprite
            );
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

  const popupResult = renderPopup(world, entity, state, undefined, content);
  return {
    updated: popupResult.updated,
    finished: popupResult.finished,
  };
};

export const displayUse: Sequence<PopupSequence> = (world, entity, state) => {
  const heroEntity = getIdentifierAndComponents(world, "hero", [
    EQUIPPABLE,
    PLAYER,
  ]);

  if (!heroEntity) {
    return { updated: false, finished: true };
  }

  const useButtons: [string, string, boolean][] = [
    ["BAG", "B", true],
    ["EQUIP", "Q", true],
    ["GEAR", "G", true],
    ["STATS", "T", true],
    ["MAP", "M", !!heroEntity[EQUIPPABLE].map],
  ];

  const verticalIndex = getVerticalIndex(world, entity);
  const [firstIndex, secondIndex] = getTabSelections(world, entity);
  const isOverview = firstIndex === undefined;
  const isEditing = !isOverview && secondIndex === undefined;
  const isSelecting = !isOverview && !isEditing;
  const quickItems = (heroEntity[INVENTORY] as Inventory).items.filter(
    (item) => {
      const itemEntity = world.assertByIdAndComponents(item, [ITEM]);
      const itemConsumption = getItemConsumption(itemEntity);
      return !!itemConsumption || slots.some((slot) => itemEntity[ITEM][slot]);
    }
  );
  const hasItems = quickItems.length > 0;

  let content;

  if (isSelecting) {
    content = hasItems
      ? quickItems.map((item, rowIndex) => {
          const itemEntity = world.assertByIdAndComponents(item, [ITEM]);

          const selected = verticalIndex === rowIndex;
          const itemConsumption = getItemConsumption(itemEntity);
          const itemSprite = getItemSprite(
            itemEntity[ITEM],
            "display",
            undefined,
            1
          );
          const consumptionColor =
            itemConsumption && getStatColor(itemConsumption.countable);
          const textColor = selected ? colors.white : colors.grey;

          const amountText = itemConsumption
            ? [
                ...createText(`${itemEntity[ITEM].amount}`, textColor),
                recolorSprite(times, {
                  [colors.white]: textColor,
                  [colors.black]:
                    selected && consumptionColor
                      ? darken(consumptionColor)
                      : colors.black,
                }),
              ]
            : (itemEntity[ITEM].weapon && !itemEntity[ITEM].skill) ||
              itemEntity[ITEM].offhand ||
              itemEntity[ITEM].accessory
            ? createText(
                itemEntity[ITEM].accessory
                  ? "Utility"
                  : itemEntity[ITEM].weapon
                  ? gearTitles.weapon
                  : gearTitles.offhand,
                selected ? colors.lime : colors.grey
              )
            : createButton(
                itemEntity[ITEM].skill || itemEntity[ITEM].tool
                  ? "SKILL"
                  : "SPELL",
                7,
                !selected,
                false,
                false,
                selected ? "lime" : "silver"
              );
          const consumptionText = itemConsumption
            ? createCountable(
                { [itemConsumption.countable]: itemConsumption.amount },
                itemConsumption.countable,
                "text",
                itemConsumption.percentage
              )
            : [];
          const useText = itemConsumption
            ? [...createText("\u0119", colors.lime), ...consumptionText]
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
              ? shaded(
                  line,
                  itemConsumption && consumptionColor
                    ? darken(consumptionColor)
                    : colors.green,
                  "▄"
                )
              : line),
          ];
        })
      : [createText("No usable items.", colors.grey)];
  } else {
    content = Array.from({ length: frameHeight - 2 }).map((_, rowIndex) => {
      if (rowIndex % 2 === 1) return [];

      const index = (rowIndex - (rowIndex % 2)) / 2;
      const [title, hotkey, enabled] = useButtons[index];
      const underlineIndex = title.indexOf(hotkey);

      const leftIndex = index * 2 + 1;
      const leftItem = heroEntity[PLAYER].quickItems[leftIndex];
      const leftExisting = leftItem
        ? existingFund(world, heroEntity, leftItem)
        : 0;

      const rightIndex = index === 4 ? 0 : (index + 1) * 2;
      const rightItem = heroEntity[PLAYER].quickItems[rightIndex];
      const rightExisting = rightItem
        ? existingFund(world, heroEntity, rightItem)
        : 0;

      return [
        ...createSpriteButton(
          underline(
            createText(leftIndex.toString(), colors.black),
            colors.black
          ),
          3,
          !isEditing && (!leftItem || leftExisting === 0),
          false,
          false,
          !leftItem ? "white" : isEditing ? "red" : "lime"
        ),
        leftItem
          ? leftExisting > 9
            ? ninePlus
            : createText(leftExisting.toString(), colors.grey)[0]
          : none,
        leftItem ? getItemSprite(leftItem) : none,
        ...createSpriteButton(
          underline(
            createText(rightIndex.toString(), colors.black),
            colors.black
          ),
          3,
          !isEditing && (!rightItem || rightExisting === 0),
          false,
          false,
          !rightItem ? "white" : isEditing ? "red" : "lime"
        ),
        rightItem
          ? rightExisting > 9
            ? ninePlus
            : createText(rightExisting.toString(), colors.grey)[0]
          : none,
        rightItem ? getItemSprite(rightItem) : none,
        ...repeat(none, 5 - title.length),
        ...(index >= useButtons.length || isEditing
          ? []
          : createSpriteButton(
              [
                ...createText(title.slice(0, underlineIndex), colors.black),
                ...underline(
                  createText(title[underlineIndex], colors.black),
                  colors.black
                ),
                ...createText(title.slice(underlineIndex + 1), colors.black),
              ],
              title.length + 2,
              !enabled,
              false,
              false,
              "yellow"
            )),
      ];
    });
  }

  const popupResult = renderPopup(
    world,
    entity,
    state,
    popupIdles[getTab(world, entity)],
    content,
    isSelecting && hasItems ? "active" : undefined,
    isSelecting && hasItems && secondIndex !== undefined
      ? [
          createText("Select an item", colors.grey),
          createText(`for quick slot ${secondIndex}`, colors.grey),
        ]
      : undefined,
    undefined,
    isEditing
      ? undefined
      : createButton(
          isOverview ? "EDIT\u0119" : "PICK",
          isOverview ? 7 : 6,
          isEditing || (isSelecting && !hasItems),
          false,
          false,
          "lime"
        ),
    isSelecting || isEditing
      ? createButton("\u011aBACK", 7, false, false, false, "red")
      : undefined
  );

  return {
    updated: popupResult.updated,
    finished: popupResult.finished,
  };
};

export const displayEquip: Sequence<PopupSequence> = (world, entity, state) => {
  const heroEntity = getIdentifierAndComponents(world, "hero", [
    ACTIONABLE,
    EQUIPPABLE,
    INVENTORY,
    PLAYER,
  ]);

  if (!heroEntity) {
    return { updated: false, finished: true };
  }

  const equipItems = (heroEntity[INVENTORY] as Inventory).items.filter((item) =>
    slots.some(
      (slot) => world.assertByIdAndComponents(item, [ITEM])[ITEM][slot]
    )
  );
  const hasItems = equipItems.length > 0;
  const verticalIndex = getVerticalIndex(world, entity);
  const selectedItem = world.getEntityByIdAndComponents(
    equipItems[verticalIndex],
    [ITEM]
  );
  const selectedEquipped = selectedItem
    ? heroEntity[EQUIPPABLE][
        selectedItem[ITEM].accessory
          ? selectedItem[ITEM].accessory
          : gear.find((slot) => selectedItem[ITEM][slot])!
      ] === equipItems[verticalIndex] &&
      !(
        heroEntity[ACTIONABLE].toolEquipped &&
        heroEntity[EQUIPPABLE].skill &&
        selectedItem[ITEM].skill
      ) &&
      !(
        !heroEntity[ACTIONABLE].toolEquipped &&
        heroEntity[EQUIPPABLE].tool &&
        selectedItem[ITEM].tool
      )
    : false;

  const content = hasItems
    ? equipItems.map((item, rowIndex) => {
        const itemEntity = world.assertByIdAndComponents(item, [ITEM]);

        const selected = verticalIndex === rowIndex;
        const itemSprite = getItemSprite(
          itemEntity[ITEM],
          "display",
          undefined,
          1
        );
        const textColor = selected ? colors.white : colors.grey;
        const slotText = selected
          ? (itemEntity[ITEM].weapon && !itemEntity[ITEM].skill) ||
            itemEntity[ITEM].offhand ||
            itemEntity[ITEM].accessory
            ? createText(
                itemEntity[ITEM].accessory
                  ? "Utility"
                  : itemEntity[ITEM].weapon
                  ? gearTitles.weapon
                  : gearTitles.offhand,
                selectedEquipped ? colors.grey : colors.lime
              )
            : createButton(
                itemEntity[ITEM].skill || itemEntity[ITEM].tool
                  ? "SKILL"
                  : "SPELL",
                7,
                selectedEquipped,
                false,
                false,
                selectedEquipped ? "silver" : "lime"
              )
          : [];

        const itemText = createText(itemSprite.name, textColor);
        const line = [...itemText, ...repeat(none, 7 - itemText.length)];

        return [
          none,
          itemSprite,
          ...(selected
            ? shaded(
                line,
                selectedEquipped ? colors.grey : colors.green,
                selectedEquipped ? undefined : "▄"
              )
            : line),
          ...repeat(none, 8 - slotText.length),
          ...slotText,
        ];
      })
    : [createText("No equipments.", colors.grey)];

  const details = selectedItem && getItemDescription(selectedItem[ITEM]);

  const popupResult = renderPopup(
    world,
    entity,
    state,
    popupIdles[getTab(world, entity)],
    content,
    hasItems ? (selectedEquipped ? "selected" : "active") : undefined,
    hasItems ? details : undefined,
    undefined,
    hasItems
      ? createButton("SWAP", 6, selectedEquipped, false, false, "lime")
      : undefined
  );

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
  const [firstIndex] = getTabSelections(world, entity);
  const chosenIndex = firstIndex ?? 0;

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
    const chosen = chosenIndex === rowIndex;
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
        ? createText(
            chosen ? "*" : selected ? "\u0108" : "·",
            selected ? colors.lime : colors.green
          )
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
    ? getEntityDescription({}, entitySprites[selectedClass])
    : classUnlock[selectedClass];
  const popupResult = renderPopup(
    world,
    entity,
    state,
    popupIdles[getTab(world, entity)],
    content,
    selectedAvailable ? "selected" : "blocked",
    details,
    classOverscan,
    createButton("PICK", 6, !selectedAvailable, false, false, "lime")
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
  const [firstIndex] = getTabSelections(world, entity);
  const chosenIndex = firstIndex ?? 0;

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
    const chosen = chosenIndex === rowIndex;
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
      ...createText(
        chosen ? "*" : selected ? "\u0108" : "·",
        selected || chosen ? style.color : colors.grey
      ),
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
    styleOverscan,
    createButton("PICK", 6, false, false, false, "lime")
  );
  return {
    updated: popupResult.updated,
    finished: popupResult.finished,
  };
};

const forgeWidth = 7;
const forgeHeight = 3;
const forgeBlink = 3;
const forgeSeparator = 2;

export const displayForge: Sequence<PopupSequence> = (world, entity, state) => {
  const heroEntity = getIdentifierAndComponents(world, "hero", [INVENTORY]);
  const generation = world.metadata.gameEntity[RENDERABLE].generation;
  let updated = false;

  const showItem = generation % forgeBlink > 0;

  // value container to rerender content
  if (!state.particles.blink) {
    const blinkParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: 0,
        offsetY: 0,
        offsetZ: particleHeight,
        amount: generation,
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
  if (lastBlinkGeneration !== generation) {
    rerenderEntity(world, entity);
    blinkParticle[PARTICLE].amount = generation;
  }

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
  const selections = getTabSelections(world, entity);
  const [firstIndex, secondIndex] = selections;

  const isHitting = selections.length === 3;
  const hittingDone = isHitting && forgingCompleted(entity);
  const isCompleted = selections.length === 4;
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
  const isBasing = !firstItem && !resultItem;
  const isAdding = firstItem && !resultItem;
  const isYielding = firstItem && resultItem;

  const baseSprite =
    isBasing && !showItem
      ? none
      : baseItem
      ? getItemSprite(baseItem, undefined, undefined, 1)
      : missing;
  const addSprite =
    isAdding && !showItem
      ? none
      : addItem
      ? getItemSprite(addItem, undefined, undefined, 1)
      : missing;
  const yieldSprite = resultItem
    ? getItemSprite(resultItem, undefined, undefined, 1)
    : missing;
  const resultSprite = isYielding && !showItem ? none : yieldSprite;
  const selectedSprite = selectedItem
    ? getItemSprite(selectedItem[ITEM], undefined, undefined, 1)
    : none;
  const addingAmount = addItem ? `+${addItem.amount}` : "";

  const resultDiff =
    baseItem && resultItem && getItemDiff(world, baseItem, resultItem);
  const resultContent = resultItem && [
    createText("Preview:  ", colors.grey),
    [
      popupActive,
      yieldSprite,
      ...shaded(
        createText(
          `${yieldSprite.name}${" ".repeat(7 - yieldSprite.name.length)}`
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
  const layers = [
    [
      ...repeat([], forgeHeight - 1),
      ...pixelFrame(
        forgeWidth,
        forgeHeight,
        resultItem ? colors.green : isAdding ? addColor : colors.grey,
        (isAdding || resultItem) && selectedForgeable ? "solid" : "dotted",
        [
          centerSprites(
            isAdding || resultItem
              ? [...createText(addingAmount), addSprite]
              : [...createText("+", colors.grey), none, missing],
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
      resultItem ? colors.lime : firstItem ? colors.grey : addColor,
      baseItem && !addItem && !selectedForgeable ? "dotted" : "solid",
      [
        centerSprites(
          [baseSprite, ...createText(" \u0119 "), resultSprite],
          forgeWidth - 2
        ),
      ],
      resultItem
        ? createText("Yield", colors.lime)
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

  // show hammer for hitting
  const steps = (entity[FORGABLE] as Forgable).steps;
  const step = steps[entity[FORGABLE].progress];
  const tick = world.metadata.gameEntity[REFERENCE].tick;
  const hammerGeneration = Math.floor(
    (state.elapsed - entity[FORGABLE].lastElapsed) / tick
  );
  const hammerStart = {
    x: (hittingWidth + 1) / -2,
    y: -8,
  };
  if (!state.particles.hammer) {
    const hammerParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: hammerStart.x,
        offsetY: hammerStart.y,
        offsetZ: selectionHeight,
        animatedOrigin: copy(hammerStart),
        amount: hammerGeneration,
        duration: tick,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: none,
    });
    state.particles.hammer = world.getEntityId(hammerParticle);
    const handleParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: hammerStart.x + 1,
        offsetY: hammerStart.y,
        offsetZ: selectionHeight,
        animatedOrigin: add(hammerStart, { x: 1, y: 0 }),
        duration: tick,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: none,
    });
    state.particles.handle = world.getEntityId(handleParticle);
    const endParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: hammerStart.x + 2,
        offsetY: hammerStart.y,
        offsetZ: selectionHeight,
        animatedOrigin: add(hammerStart, { x: 2, y: 0 }),
        duration: tick,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: none,
    });
    state.particles.end = world.getEntityId(endParticle);
  }

  const hammerParticle = world.assertByIdAndComponents(state.particles.hammer, [
    PARTICLE,
  ]);
  const handleParticle = world.assertByIdAndComponents(state.particles.handle, [
    PARTICLE,
  ]);
  const endParticle = world.assertByIdAndComponents(state.particles.end, [
    PARTICLE,
  ]);
  const lastHammerGeneration = hammerParticle[PARTICLE].amount;
  const isAnimating = hammerParticle[PARTICLE].duration !== tick;
  const animateHammer =
    isHitting && !hittingDone && entity[FORGABLE].lastAction;

  // rerender content on blinking
  if (
    (animateHammer && lastHammerGeneration !== hammerGeneration) ||
    (!animateHammer && isAnimating)
  ) {
    updated = true;
    hammerParticle[PARTICLE].amount = hammerGeneration;

    const particles: [TypedEntity<"PARTICLE">, Sprite][] = [
      [hammerParticle, forgeHammer],
      [handleParticle, forgeHandle],
      [endParticle, forgeHandle],
    ];
    if (animateHammer && entity[FORGABLE].lastAction === "swing") {
      particles.forEach(([particleEntity, sprite], index) => {
        particleEntity[SPRITE] = sprite;
        particleEntity[PARTICLE].offsetX =
          hammerGeneration % (forgeTicks * 2) < forgeTicks
            ? (hittingWidth + 1) / -2 + index
            : (hittingWidth + 1) / 2 - 2 + index;
        particleEntity[PARTICLE].duration = tick * forgeTicks;
        rerenderEntity(world, particleEntity);
      });
    } else if (
      animateHammer &&
      ["trigger", "hit", "miss"].includes(entity[FORGABLE].lastAction)
    ) {
      if (hammerGeneration >= 5) {
        entity[FORGABLE].lastElapsed = state.elapsed;
        if (entity[FORGABLE].lastAction === "hit") {
          entity[FORGABLE].progress += 1;
        }
        entity[FORGABLE].lastAction = "swing";
        rerenderEntity(world, entity);
      } else {
        const trigger = entity[FORGABLE].lastAction === "trigger";
        particles.forEach(([particleEntity], index) => {
          if (hammerGeneration < 2) {
            particleEntity[PARTICLE].offsetX =
              (hittingWidth + 1) / -2 + index + entity[FORGABLE].hitIndex;
            particleEntity[PARTICLE].duration = tick / 2;
          } else if (hammerGeneration < 3) {
            particleEntity[PARTICLE].offsetY = -6;
          } else if (hammerGeneration < 4 && trigger) {
            performForgeHit(world, entity);
            particleEntity[PARTICLE].offsetY = -8;
          } else if (hammerGeneration < 5) {
            particleEntity[PARTICLE].offsetX = (hittingWidth + 1) / -2 + index;
          }
          rerenderEntity(world, particleEntity);
        });
      }
    } else if (!animateHammer && isAnimating) {
      particles.forEach(([particleEntity], index) => {
        particleEntity[SPRITE] = none;
        particleEntity[PARTICLE].offsetX = (hittingWidth + 1) / -2 + index;
        particleEntity[PARTICLE].duration = tick;
        rerenderEntity(world, particleEntity);
      });
    }
  }

  let content: Sprite[][] = [createText("Nothing to forge.", colors.grey)];
  let details: Sprite[][] | undefined = undefined;

  if (isCompleted) {
    content = centerLayer(
      [
        [],
        ...pixelFrame(
          rewardWidth,
          3,
          colors.lime,
          "solid",
          [
            centerSprites(
              createItemName(entity[FORGABLE].completed),
              rewardWidth - 2
            ),
          ],
          createText("Result", colors.lime)
        ),
      ],
      frameWidth - 2
    );
    details = getItemDescription(entity[FORGABLE].completed);
  } else if (isHitting && addItem && entity[FORGABLE]) {
    const hittingPreview = [
      hittingDone
        ? centerSprites([forgeHammer, forgeHandle, forgeHandle], 7)
        : [],
      ...pixelFrame(7, 3, colors.grey, undefined, [
        centerSprites(
          hittingDone
            ? createText("Done!")
            : [
                ...createText((entity[FORGABLE].progress + 1).toString()),
                ...createText("/", colors.grey),
                ...createText(entity[FORGABLE].steps.length.toString()),
              ],
          5
        ),
      ]),
    ];
    const hitBox = step
      ? [
          ...repeat(none, hittingOffset),
          ...repeat(forgeMiss, step.offset),
          ...repeat(forgeHit, Math.floor((step.width - 1) / 2)),
          mergeSprites(getItemSprite(step.item), forgeHit),
          ...repeat(forgeHit, Math.ceil((step.width - 1) / 2)),
          ...repeat(forgeMiss, hittingArea - step.offset - step.width),
        ]
      : resultItem
      ? [
          ...repeat(none, hittingOffset + Math.floor((hittingArea - 1) / 2)),
          getItemSprite(resultItem),
        ]
      : [];
    content = [
      [
        ...(hittingDone ? [] : createText("Steps: ")),
        ...steps
          .slice(entity[FORGABLE].progress)
          .map((step) => getItemSprite(step.item)),
      ],
      createText("─".repeat(frameWidth - 2), colors.silver),
      [],
      [],
      hitBox,
      ...overlay(
        anvilPixels.map((line) => [...repeat(none, hittingOffset), ...line]),
        hittingPreview.map((line) => [...repeat(none, 10), ...line])
      ),
    ];
  } else if (hasItems) {
    content = Array.from({
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
      const itemSprite = getItemSprite(
        forgeItem[ITEM],
        "display",
        undefined,
        1
      );
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
    });

    details = resultItem
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
          createText(`${selectedSprite.name.toLowerCase()}.`, colors.grey),
        ];
  }

  const popupResult = renderPopup(
    world,
    entity,
    state,
    forge,
    resultContent && !isHitting
      ? content.slice(0, Math.max(5, resultContent.length))
      : content,
    !hasItems || resultItem || isHitting || isCompleted
      ? undefined
      : selectedForgeable
      ? "selected"
      : "blocked",
    details,
    undefined,
    hittingDone
      ? createButton("YIELD", 7, false, false, false, "lime")
      : isHitting
      ? entity[FORGABLE].hitGeneration
        ? createButton("NEXT", 6, false, false, false, "lime")
        : createButton("HIT", 5, false, false, false, "lime")
      : resultItem
      ? createButton("START", 7, !selectedForgeable, false, false, "lime")
      : hasItems && !isCompleted
      ? createButton(
          `${isAdding ? "ADD" : "BASE"}\u0119`,
          isAdding ? 5 : 6,
          !selectedForgeable,
          false,
          false,
          "lime"
        )
      : undefined,
    isHitting
      ? createButton("ABORT", 7, false, false, false, "red")
      : addItem
      ? createButton("\u011aBACK", 7, false, false, false, "red")
      : undefined
  );

  // draw side separators
  const leftSeparatorParticle = world.assertByIdAndComponents(
    state.particles[`popup-left-${frameHeight - 2 - forgeSeparator}`],
    [ORIENTABLE, PARTICLE, SPRITE]
  );
  const rightSeparatorParticle = world.assertByIdAndComponents(
    state.particles[`popup-right-${forgeSeparator - 1}`],
    [ORIENTABLE, PARTICLE, SPRITE]
  );
  const separatorVisible = isHitting;
  if (
    separatorVisible &&
    state.args.contentIndex > 0 &&
    entity[POPUP].tabs.length === 1 &&
    leftSeparatorParticle[ORIENTABLE].facing
  ) {
    leftSeparatorParticle[SPRITE] = popupCenterStart;
    leftSeparatorParticle[ORIENTABLE].facing = undefined;
    rightSeparatorParticle[SPRITE] = popupCenterEnd;
    rightSeparatorParticle[ORIENTABLE].facing = undefined;
    updated = true;
  } else if (!separatorVisible && !leftSeparatorParticle[ORIENTABLE].facing) {
    leftSeparatorParticle[SPRITE] = popupSide;
    leftSeparatorParticle[ORIENTABLE].facing = "left";
    rightSeparatorParticle[SPRITE] = popupSide;
    rightSeparatorParticle[ORIENTABLE].facing = "right";
    updated = true;
  }

  return {
    updated: updated || popupResult.updated,
    finished: popupResult.finished,
  };
};

const craftSeparator = 9;

export const displayCraft: Sequence<PopupSequence> = (world, entity, state) => {
  const heroEntity = getIdentifierAndComponents(world, "hero", [POSITION]);
  const icon = craft;
  const verticalIndex = getVerticalIndex(world, entity);
  const ingredients = (entity[POPUP] as Popup).ingredients;
  const selectedIngredients = ingredients[verticalIndex];
  const selectedShoppable =
    heroEntity &&
    selectedIngredients &&
    canShop(world, heroEntity, getCraftingDeal(selectedIngredients));

  let content = [createText("Nothing to craft.", colors.grey)];

  if (heroEntity && selectedIngredients) {
    const scrollIndex =
      verticalIndex -
      scrolledVerticalIndex(
        world,
        entity,
        state,
        Array.from({ length: ingredients.length }),
        "selected",
        []
      );
    const ingredientLines = [
      ...selectedIngredients.parts
        .map((item, index) => {
          const existingIngredient = existingFund(world, heroEntity, item);
          const itemLine = [
            ...createText(existingIngredient.toString()),
            ...createText("/", colors.grey),
            ...createText(
              item.amount.toString(),
              existingIngredient >= item.amount ? colors.lime : colors.red
            ),
            getItemSprite(item),
          ];
          const padding = selectedIngredients.parts.length === 1 && index === 0;
          return [
            ...(padding
              ? [
                  [
                    selectedShoppable ? craftLeftActive : craftLeft,
                    ...repeat(none, frameWidth - 3 - craftSeparator),
                  ],
                ]
              : []),
            [
              selectedShoppable ? craftLeftActive : craftLeft,
              ...createText(getItemSprite(item).name, colors.grey),
            ],
            [
              selectedShoppable ? craftLeftActive : craftLeft,
              ...repeat(
                none,
                frameWidth - 3 - craftSeparator - itemLine.length
              ),
              ...itemLine,
            ],
            ...(padding
              ? [
                  [
                    selectedShoppable ? craftLeftActive : craftLeft,
                    ...repeat(none, frameWidth - 3 - craftSeparator),
                  ],
                ]
              : []),
          ];
        })
        .flat(),
      selectedShoppable
        ? [
            craftDownLeftActive,
            ...repeat(craftDownActive, frameWidth - 3 - craftSeparator),
          ]
        : [
            craftDownLeft,
            ...repeat(craftDown, frameWidth - 3 - craftSeparator),
          ],
    ];
    content = ingredients.map((ingredient, rowIndex) => {
      const selected = verticalIndex === rowIndex;
      const craftItem = ingredient.item;
      const textColor = selected ? colors.white : colors.grey;
      const itemSprite = getItemSprite(craftItem, "display");

      const ingredientShoppable =
        heroEntity && canShop(world, heroEntity, getCraftingDeal(ingredient));
      const itemLine = [
        ...createText(
          selected ? itemSprite.name : "─".repeat(itemSprite.name.length),
          textColor
        ),
        ...repeat(none, 7 - itemSprite.name.length),
      ];
      const visibleIndex = rowIndex - scrollIndex;
      const line = ingredientLines[visibleIndex] || [];

      return [
        ingredientShoppable && !selected
          ? recolorSprite(star, colors.lime)
          : none,
        itemSprite,
        ...(selected
          ? shaded(
              itemLine,
              selectedShoppable ? colors.green : colors.grey,
              selectedShoppable ? "▄" : undefined
            )
          : itemLine),
        ...line,
      ];
    });
  }

  const details =
    selectedIngredients && getItemDescription(selectedIngredients.item);
  const popupResult = renderPopup(
    world,
    entity,
    state,
    icon,
    content,
    selectedShoppable ? "active" : selectedIngredients ? "selected" : undefined,
    details,
    undefined,
    createButton("MAKE", 6, !selectedShoppable, false, false, "lime")
  );

  // draw top separator
  const topSeparatorParticle = world.assertByIdAndComponents(
    state.particles[`popup-up-${craftSeparator}`],
    [ORIENTABLE, PARTICLE, SPRITE]
  );
  const separatorFacing = selectedShoppable ? "right" : "down";
  if (
    state.args.contentIndex > 0 &&
    entity[POPUP].tabs.length === 1 &&
    topSeparatorParticle[ORIENTABLE].facing !== separatorFacing &&
    selectedIngredients
  ) {
    topSeparatorParticle[SPRITE] = craftCenterTop;
    topSeparatorParticle[ORIENTABLE].facing = separatorFacing;
    popupResult.updated = true;
  }

  return {
    updated: popupResult.updated,
    finished: popupResult.finished,
  };
};

export const displayBrew: Sequence<PopupSequence> = (world, entity, state) => {
  const heroEntity = getIdentifierAndComponents(world, "hero", [POSITION]);
  const icon = craft;
  const verticalIndex = getVerticalIndex(world, entity);
  const inventoryItems = heroEntity
    ? (heroEntity[INVENTORY] as Inventory).items.map((itemId) =>
        world.assertByIdAndComponents(itemId, [ITEM])
      )
    : [];
  const recipes = (entity[POPUP] as Popup).recipes;

  const [firstIndex, recipeIndex] = getTabSelections(world, entity);
  const isOverview = firstIndex === undefined;
  const selectedRecipe = isOverview ? undefined : recipes[verticalIndex];
  const selectedShoppable =
    selectedRecipe &&
    heroEntity &&
    selectedRecipe.options.some((_, optionIndex) =>
      canShop(world, heroEntity, getBrewingDeal(selectedRecipe, optionIndex))
    );
  const viewedRecipe = recipes[recipeIndex];
  const viewedSprite = viewedRecipe && getItemSprite(viewedRecipe.item);
  const viewedDeal =
    viewedRecipe && getBrewingDeal(viewedRecipe, verticalIndex);
  const viewedShoppable =
    viewedDeal && heroEntity && canShop(world, heroEntity, viewedDeal);

  // value container to rerender content
  const worldGeneration = world.metadata.gameEntity[RENDERABLE].generation;
  if (!state.particles.brew) {
    const brewParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: 0,
        offsetY: 0,
        offsetZ: particleHeight,
        amount: worldGeneration,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: none,
    });
    state.particles.brew = world.getEntityId(brewParticle);
  }

  const brewParticle = world.assertByIdAndComponents(state.particles.brew, [
    PARTICLE,
  ]);
  const lastBrewGeneration = brewParticle[PARTICLE].amount;

  // rerender content on blinking
  if (lastBrewGeneration !== worldGeneration) {
    rerenderEntity(world, entity);
    brewParticle[PARTICLE].amount = worldGeneration;
  }

  let content = [createText("Nothing to brew.", colors.grey)];

  if (heroEntity && viewedRecipe) {
    const showScroll =
      viewedRecipe.options.length > 1 && worldGeneration % 3 > 0;
    const optionItem = viewedRecipe.item;
    const optionDeal = getBrewingDeal(viewedRecipe, verticalIndex);
    const optionShoppable = canShop(world, heroEntity, optionDeal);
    const amountText = [
      recolorSprite(times, {
        [colors.black]: optionShoppable ? colors.green : colors.black,
      }),
      ...createText(`${optionItem.amount}`),
    ];
    const durationText = [
      delay,
      ...createText(viewedRecipe.duration.toString(), colors.yellow),
    ];
    const line = [
      ...createText(viewedSprite.name),
      ...amountText,
      ...repeat(none, 10 - amountText.length - viewedSprite.name.length),
    ];
    content = [
      ...repeat([], verticalIndex),
      [
        optionShoppable ? popupActive : popupBlocked,
        viewedSprite,
        ...(optionShoppable
          ? shaded(line, colors.green, "▄")
          : dotted(line, colors.red)),
        ...repeat(none, frameWidth - 4 - durationText.length - line.length),
        ...durationText,
      ],
      viewedRecipe.options.length > 1
        ? [
            ...createText("Recipe ", colors.grey),
            ...underline(
              createText((verticalIndex + 1).toString(), colors.silver),
              colors.grey
            ),
            ...createText(" of ", colors.grey),
            ...createText(
              viewedRecipe.options.length.toString(),
              colors.silver
            ),
            ...createText(":", colors.grey),
            ...repeat(none, 2),
            showScroll ? scroll : none,
          ]
        : createText("Recipe:", colors.grey),
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
        canShop(world, heroEntity, getBrewingDeal(recipe, optionIndex))
      );
      const amountText = [
        recolorSprite(times, textColor),
        ...createText(`${craftItem.amount}`, textColor),
      ];
      const durationText = selected
        ? [
            delay,
            ...createText(selectedRecipe.duration.toString(), colors.yellow),
          ]
        : [];
      const line = [
        ...createText(itemSprite.name, textColor),
        ...amountText,
        ...repeat(none, 10 - amountText.length - itemSprite.name.length),
      ];

      return [
        recipeShoppable ? recolorSprite(star, colors.lime) : none,
        itemSprite,
        ...(selected
          ? shaded(
              line,
              recipeShoppable ? colors.green : colors.grey,
              recipeShoppable ? "▄" : undefined
            )
          : line),
        ...repeat(none, frameWidth - 4 - durationText.length - line.length),
        ...durationText,
      ];
    });
  } else {
    const brewedItems = (entity[INVENTORY] as Inventory).items.map((itemId) =>
      world.assertByIdAndComponents(itemId, [ITEM])
    );
    const hasLoot = brewedItems.length > 0;
    const frameColor = hasLoot ? colors.blue : colors.grey;
    const frameOverflow = brewedItems.length > 4;
    const brewingQueue = (entity[BREWABLE] as Brewable).queue;
    const brewingItem = brewingQueue[0];
    const queuedItems = brewingQueue.slice(1, 3);
    const queueOverflow = brewingQueue.length > 3;
    const barWidth = frameWidth - 5;
    const progress = brewingItem?.generation
      ? worldGeneration - brewingItem.generation
      : 0;

    content = overlay(
      overlay(kettlePixels, hasLoot ? brewingPixels : []).map((line) => [
        ...repeat(none, 9),
        ...line,
      ]),
      pixelFrame(
        8,
        4,
        frameColor,
        undefined,
        centerLayer(
          hasLoot
            ? chunked(
                [
                  ...brewedItems
                    .slice(0, frameOverflow ? 3 : 4)
                    .map((item) => [
                      ...(item[ITEM].amount > 99
                        ? [...createText("9", colors.grey), ninePlus]
                        : createText(
                            item[ITEM].amount.toString().padStart(2),
                            colors.grey
                          )),
                      getItemSprite(item[ITEM]),
                    ])
                    .flat(),
                  ...(frameOverflow ? createText("...", colors.white) : []),
                ],
                6
              )
            : [
                createText("Kettle", colors.grey),
                createText("empty.", colors.grey),
              ],
          6
        ),
        hasLoot ? createText("-Done", frameColor) : undefined
      ),
      [
        ...repeat([], 4),
        ...pixelFrame(
          frameWidth - 2,
          5,
          brewingItem ? colors.blue : colors.grey,
          "dotted",
          brewingItem
            ? [
                [
                  getItemSprite(brewingItem.item),
                  ...createProgress(
                    {
                      duration: progress,
                    },
                    "duration",
                    barWidth,
                    true,
                    [
                      ...createText(getItemSprite(brewingItem.item).name),
                      times,
                      ...createText(brewingItem.item.amount.toString()),
                    ],
                    brewingItem.duration * brewingDurationFactor - 1,
                    colors.blue
                  ),
                ],
                ...queuedItems.map((queue, index) =>
                  stretch(
                    [
                      ...createItemName(queue.item),
                      recolorSprite(times, colors.grey),
                      ...createText(queue.item.amount.toString(), colors.grey),
                    ],
                    index === 0 || !queueOverflow
                      ? createCountable(
                          { retrigger: queue.duration },
                          "retrigger"
                        )
                      : index === 1 && queueOverflow
                      ? createText(`+${brewingQueue.length - 3}`, colors.silver)
                      : [],
                    barWidth + 1
                  )
                ),
              ]
            : [
                createText("Select recipes", colors.grey),
                createText("for brewing.", colors.grey),
              ]
        ),
      ]
    );
  }

  const details = isOverview
    ? undefined
    : !(viewedRecipe && selectedRecipe) || viewedShoppable
    ? getItemDescription(viewedRecipe?.item || selectedRecipe?.item)
    : [
        createText("Not enough items", colors.grey),
        createText(`for ${viewedSprite.name.toLowerCase()}.`, colors.grey),
      ];
  const popupResult = renderPopup(
    world,
    entity,
    state,
    icon,
    content,
    viewedDeal || isOverview
      ? undefined
      : selectedShoppable
      ? "active"
      : "selected",
    details,
    undefined,
    isOverview
      ? createButton("ADD\u0119", 6, false, false, false, "lime")
      : viewedRecipe
      ? createButton("COOK", 6, !viewedShoppable, false, false, "lime")
      : createButton("VIEW\u0119", 7, false, false, false, "lime"),
    !isOverview
      ? createButton("\u011aBACK", 7, false, false, false, "red")
      : undefined
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
  const level = selectedLevel && levelConfig[selectedLevel];
  const currentLevel = selectedLevel === world.metadata.gameEntity[LEVEL].name;
  const lockedLevel = !currentLevel && !canWarp(world, {}, entity);

  const warpColor = lockedLevel
    ? colors.red
    : currentLevel
    ? colors.white
    : colors.lime;

  const content = level
    ? overlay(
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
      )
    : map;

  const popupResult = renderPopup(
    world,
    entity,
    state,
    popupIdles[getTab(world, entity)],
    content,
    undefined,
    undefined,
    undefined,
    createButton(
      "GO!",
      5,
      !level || lockedLevel || currentLevel,
      false,
      false,
      "lime"
    )
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
  const findTarget =
    heroEntity &&
    popup.targets.some((target) =>
      isFriendlyFire(world, heroEntity, {
        [BELONGABLE]: {
          faction: generateUnitData(target.unit).faction,
        },
      })
    );
  const completed = allDefeated && allGathered;
  const selections = getTabSelections(world, entity);
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
            allDefeated ? colors.grey : findTarget ? colors.yellow : colors.red,
            completed ? "dotted" : "solid",
            popup.targets.map((target) => {
              const killed = heroEntity
                ? getDefeated(world, heroEntity, target)
                : 0;
              const defeated =
                heroEntity && hasDefeated(world, heroEntity, target);
              const [sprite, ...name] = createUnitName(target.unit);
              const text = [
                ...(target.amount > 1
                  ? defeated
                    ? createText(
                        target.amount.toString().padStart(5),
                        colors.grey
                      )
                    : [
                        ...createText(
                          killed
                            .toString()
                            .padStart(4 - target.amount.toString().length),
                          colors.silver
                        ),
                        ...createText("/", colors.grey),
                        ...createText(target.amount.toString(), colors.silver),
                      ]
                  : repeat(none, 5)),
                sprite,
                ...(defeated ? name : brightenSprites(name)),
              ];
              const line = [
                ...text,
                ...repeat(none, questWidth - text.length - 2),
              ];
              return defeated ? strikethrough(line) : line;
            }),
            heroEntity && findTarget
              ? createText("Find", allDefeated ? colors.grey : colors.yellow)
              : createText("Defeat", allDefeated ? colors.grey : colors.red)
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
              const existing = heroEntity
                ? existingFund(world, heroEntity, price)
                : 0;
              const gathered = heroEntity && canRedeem(world, heroEntity, deal);
              const color = gathered ? colors.grey : colors.silver;

              const text = [
                ...(gathered
                  ? repeat(none, 3)
                  : [
                      ...createText(
                        existing
                          .toString()
                          .padStart(4 - price.amount.toString().length),
                        color
                      ),
                      ...createText("/", colors.grey),
                    ]),
                ...createText(price.amount.toString(), color),
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
            rewardWidth,
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
              return [...text, ...repeat(none, rewardWidth - text.length - 2)];
            }),
            createText("Reward", completed ? colors.lime : colors.grey)
          );
    const choices =
      popup.choices.length === 0
        ? []
        : pixelFrame(
            rewardWidth,
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
              return [...text, ...repeat(none, rewardWidth - text.length - 2)];
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
      ...rewards.map((line) => [
        ...repeat(none, frameWidth - 2 - rewardWidth),
        ...line,
      ]),
      ...choices.map((line) => [
        ...repeat(none, frameWidth - 2 - rewardWidth),
        ...line,
      ]),
    ];
  } else if (selections.length === 2) {
    // show completed screen
    content = popup.lines[entity[POPUP].horizontalIndex];
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
  }

  const popupResult = renderPopup(
    world,
    entity,
    state,
    popupIdles[getTab(world, entity)],
    content,
    selections.length !== 1 ? undefined : completed ? "active" : "blocked",
    completed && selections.length === 1 && selectedChoice
      ? getItemDescription(selectedChoice)
      : undefined,
    undefined,
    selections.length === 0 &&
      !completed &&
      popup.focuses[popup.horizontalIndex]
      ? createButton("FOCUS", 7, false, false, false, "lime")
      : selections.length < 2
      ? createButton(
          popup.choices.length > 0 && selections.length === 0
            ? "VIEW\u0119"
            : "CLAIM",
          7,
          !completed,
          false,
          false,
          "lime"
        )
      : undefined,
    selections.length === 1
      ? createButton("\u011aBACK", 7, false, false, false, "red")
      : undefined
  );
  return {
    updated: popupResult.updated,
    finished: popupResult.finished,
  };
};

export const displayChat: Sequence<PopupSequence> = (world, entity, state) => {
  const generation = world.metadata.gameEntity[RENDERABLE].generation;
  const showCaret = generation % 2 === 0;

  // show blinking caret
  if (!state.particles.caret) {
    const caretParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: 0,
        offsetY: 0,
        offsetZ: particleHeight,
        amount: generation,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: none,
    });
    state.particles.caret = world.getEntityId(caretParticle);
  }

  const caretParticle = world.assertByIdAndComponents(state.particles.caret, [
    PARTICLE,
  ]);
  const lastGeneration = caretParticle[PARTICLE].amount;

  // rerender content on blinking
  if (lastGeneration !== generation) {
    rerenderEntity(world, entity);
    caretParticle[PARTICLE].amount = generation;
  }

  const selections = getTabSelections(world, entity);
  const verticalIndex = getVerticalIndex(world, entity);
  const lines = [
    ...selections.map((keyIndex) =>
      recolorSprite(parseSprite(`\x0f█\x00${getKeyFromIndex(keyIndex)}`), {
        [colors.black]: colors.white,
        [colors.white]: colors.black,
      })
    ),
    showCaret ? caret : none,
  ];
  const content: Sprite[][] = [
    ...repeat([], verticalIndex),
    ...chunked(lines, frameWidth - 2),
  ];

  const popupResult = renderPopup(
    world,
    entity,
    state,
    popupIdles[getTab(world, entity)],
    content,
    undefined,
    undefined,
    undefined,
    createButton("SEND", 6, selections.length === 0, false, false, "lime"),
    createButton("CLEAR", 7, selections.length === 0, false, false, "red"),
    6
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
  const sideTemplate = entity[CASTABLE].knock > 0 ? waveSideDouble : waveSide;
  const cornerTemplate =
    entity[CASTABLE].knock > 0 ? waveCornerDouble : waveCorner;

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
        [SPRITE]: sideTemplate[material][element],
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
        cornerTemplate[material][
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
    entity[FRAGMENT]?.structure && entity[REMAINABLE]?.cell
      ? 5
      : entity[FRAGMENT]?.structure || entity[REMAINABLE]?.cell
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

const lightningTime = 200;

export const lightningFlash: Sequence<FlashSequence> = (
  world,
  entity,
  state
) => {
  const finished = state.elapsed > lightningTime;
  let updated = false;

  // create lightning
  if (!state.particles["flash-0"]) {
    updated = true;
    const size = world.metadata.gameEntity[LEVEL].size;
    let currentPosition = copy(entity[POSITION]);
    let currentOffset = { x: 0, y: 0 };
    let currentOrientation = choice(...orientations);
    const targets = [...state.args.targets];
    const particles: [Position, Sprite, Orientation | undefined][] = [
      [currentOffset, lightningSide, undefined],
    ];

    let nextTarget = targets.shift();
    currentPosition = combine(
      size,
      currentPosition,
      orientationPoints[currentOrientation]
    );
    currentOffset = add(currentOffset, orientationPoints[currentOrientation]);

    // calculate lightning path
    while (nextTarget) {
      while (
        nextTarget &&
        (currentPosition.x !== nextTarget.x ||
          currentPosition.y !== nextTarget.y)
      ) {
        const targetOrientations = relativeOrientations(
          world,
          currentPosition,
          nextTarget,
          1
        );

        // let flash go on sides if directly facing target
        if (targetOrientations.length === 1) {
          targetOrientations.push(
            rotateOrientation(targetOrientations[0], 1),
            rotateOrientation(targetOrientations[0], -1)
          );
        }

        // ensure not passing through itself
        const oppositeOrientation = invertOrientation(currentOrientation);
        const nextOrientation = choice(
          ...targetOrientations.filter(
            (orientation) => orientation !== oppositeOrientation
          )
        );
        const delta = orientationPoints[nextOrientation];

        particles.push([
          currentOffset,
          nextOrientation === currentOrientation
            ? lightningSide
            : lightninCorner,
          nextOrientation === currentOrientation
            ? nextOrientation
            : rotateOrientation(
                currentOrientation,
                orientationDelta(currentOrientation, nextOrientation) > 0
                  ? 0
                  : 1
              ),
        ]);

        currentPosition = combine(size, currentPosition, delta);
        currentOffset = add(currentOffset, delta);
        currentOrientation = nextOrientation;
      }

      nextTarget = targets.shift();
    }

    // add final particle
    particles.push([currentOffset, lightningSide, undefined]);

    // create lightning particles
    for (
      let particleIndex = 0;
      particleIndex < particles.length;
      particleIndex += 1
    ) {
      const [offset, sprite, orientation] = particles[particleIndex];
      const flashParticle = entities.createFibre(world, {
        [ORIENTABLE]: { facing: orientation },
        [PARTICLE]: {
          offsetX: offset.x,
          offsetY: offset.y,
          offsetZ: particleHeight,
        },
        [RENDERABLE]: { generation: 1 },
        [SPRITE]: sprite,
      });
      state.particles[`flash-${particleIndex}`] =
        world.getEntityId(flashParticle);
    }
  }

  if (finished) {
    for (const particleName in state.particles) {
      disposeEntity(world, world.assertById(state.particles[particleName]));
      delete state.particles[particleName];
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
  const spawnTime = ripTime + 1500;
  const finished = state.elapsed > spawnTime;

  if (state.elapsed > ripTime && !entity[TOOLTIP].dialogs.length) {
    entity[TOOLTIP].dialogs = [createDialog("RIP")];
    entity[TOOLTIP].changed = true;
    entity[TOOLTIP].override = "visible";
    updated = true;
  }

  if (finished) {
    entity[REVIVABLE].available = true;
    entity[TOOLTIP].dialogs = [];
    entity[TOOLTIP].changed = true;
    entity[TOOLTIP].override = undefined;
    updated = true;
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
      rerenderEntity(world, entity);
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
      [SPRITE]: getItemSprite(itemEntity[ITEM]),
    });
    state.particles.loot = world.getEntityId(lootParticle);
    updated = true;
  }

  return { finished, updated };
};

const consumeSpeed = 500;

const materialFlasks = {
  wood: emptyFlask,
  iron: emptyBottle,
  gold: emptyPotion,
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
    ]?.[itemEntity[ITEM].stat!];

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

const interactTime = 100;
const horizontalTime = 50;
const interactHighlight = 10;

export const popupInteract: Sequence<InteractSequence> = (
  world,
  entity,
  state
) => {
  const heroEntity = getIdentifierAndComponents(world, "hero", [POSITION]);
  const orientation = state.args.orientation;
  const delta = orientationPoints[orientation];
  const horizontal = orientation === "left" || orientation === "right";
  const interactSpeed = horizontal ? horizontalTime : interactTime;
  const generation = Math.floor(state.elapsed / interactSpeed);
  const shouldHide = !heroEntity || !state.args.active;
  const interactWidth = state.args.text.length + 2;
  const interactButton = createButton(
    state.args.text,
    interactWidth,
    false,
    false,
    generation > interactWidth && normalize(generation, interactHighlight) <= 1,
    "lime"
  );
  const paddingLeft = Math.floor((interactWidth - 1) / 2);
  const paddingRight = Math.ceil((interactWidth - 1) / 2);

  const initial = !state.particles.discovery;
  const finished = shouldHide && !state.args.active;
  let updated = false;

  if (initial) {
    updated = true;

    const discoveryParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX:
          delta.x * (horizontal ? 2 + interactWidth : 3) + state.args.offset.x,
        offsetY: delta.y * 3 + state.args.offset.y,
        offsetZ: particleHeight,
        amount: 1,
        animatedOrigin: add(delta, state.args.offset),
        duration: interactSpeed * (horizontal ? interactWidth + 2 : 2),
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: state.args.sprite,
    });
    state.particles.discovery = world.getEntityId(discoveryParticle);

    const innerBarParticle = entities.createFibre(world, {
      [ORIENTABLE]: { facing: orientation },
      [PARTICLE]: {
        offsetX: delta.x + state.args.offset.x,
        offsetY: delta.y + state.args.offset.y,
        offsetZ: interactHeight,
        amount: 1,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: interactBar,
    });
    state.particles.inner = world.getEntityId(innerBarParticle);
  }

  // render bar extension after one tick
  if (state.args.generation === 0 && generation === 1) {
    state.args.generation = generation;

    const outerBarParticle = entities.createFibre(world, {
      [ORIENTABLE]: { facing: orientation },
      [PARTICLE]: {
        offsetX: delta.x * 2 + state.args.offset.x,
        offsetY: delta.y * 2 + state.args.offset.y,
        offsetZ: interactHeight,
        amount: 1,
        animatedOrigin: add(delta, state.args.offset),
        duration: interactSpeed,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: interactBar,
    });
    state.particles.outer = world.getEntityId(outerBarParticle);
    updated = true;
  }

  // render button content and shadows
  if (state.args.generation === 1 && generation === 2) {
    state.args.generation = generation;
    updated = true;

    const barLeftParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX:
          (orientation === "left"
            ? -interactWidth - 1
            : orientation === "right"
            ? 2
            : -paddingLeft) + state.args.offset.x,
        offsetY: delta.y * 2 + state.args.offset.y,
        offsetZ: dialogHeight,
        amount: 1,
        animatedOrigin: add(
          orientation === "left" ? { x: -2, y: 0 } : add(delta, delta),
          state.args.offset
        ),
        duration:
          interactSpeed *
          (orientation === "left" ? interactWidth : paddingLeft),
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: interactLeft,
    });
    state.particles.left = world.getEntityId(barLeftParticle);

    const barRightParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX:
          (orientation === "right"
            ? interactWidth + 1
            : orientation === "left"
            ? -2
            : paddingRight) + state.args.offset.x,
        offsetY: delta.y * 2 + state.args.offset.y,
        offsetZ: dialogHeight,
        amount: 1,
        animatedOrigin: add(
          orientation === "right" ? { x: 2, y: 0 } : add(delta, delta),
          state.args.offset
        ),
        duration:
          interactSpeed *
          (orientation === "right" ? interactWidth : paddingRight),
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: interactRight,
    });
    state.particles.right = world.getEntityId(barRightParticle);

    for (
      let columnIndex = 0;
      columnIndex < interactButton.length;
      columnIndex += 1
    ) {
      const offset = columnIndex - Math.ceil(interactWidth / 2) + 1;
      const cellParticle = entities.createParticle(world, {
        [PARTICLE]: {
          offsetX:
            (orientation === "left"
              ? columnIndex - interactWidth - 1
              : orientation === "right"
              ? columnIndex + 2
              : offset) + state.args.offset.x,
          offsetY: delta.y * 2 + state.args.offset.y,
          offsetZ: particleHeight,
          amount: 1,
          animatedOrigin: add(
            orientation === "right"
              ? { x: 2, y: 0 }
              : orientation === "left"
              ? { x: -2, y: 0 }
              : add(delta, delta),
            state.args.offset
          ),
          duration:
            interactSpeed *
            (orientation === "left"
              ? interactWidth - columnIndex
              : orientation === "right"
              ? columnIndex + 1
              : Math.abs(offset)),
        },
        [RENDERABLE]: { generation: 1 },
        [SPRITE]: interactButton[columnIndex],
      });
      state.particles[`cell-${columnIndex}`] = world.getEntityId(cellParticle);
    }
  }

  if (
    (orientation === "left" &&
      state.args.generation === interactWidth + 1 &&
      generation === interactWidth + 2) ||
    (orientation === "right" &&
      state.args.generation === 2 &&
      generation === 3) ||
    (!horizontal &&
      state.args.generation === paddingLeft + 1 &&
      generation === paddingLeft + 2)
  ) {
    updated = true;
    const leftParticle = world.assertById(state.particles.left);
    disposeEntity(world, leftParticle);
    delete state.particles.left;
  }

  if (
    (orientation === "right" &&
      state.args.generation === interactWidth + 1 &&
      generation === interactWidth + 2) ||
    (orientation === "left" &&
      state.args.generation === 2 &&
      generation === 3) ||
    (!horizontal &&
      state.args.generation === paddingRight + 1 &&
      generation === paddingRight + 2)
  ) {
    updated = true;
    const rightParticle = world.assertById(state.particles.right);
    disposeEntity(world, rightParticle);
    delete state.particles.right;
  }

  // highlight button
  if (state.args.generation !== generation) {
    state.args.generation = generation;
    updated = true;
    for (
      let columnIndex = 0;
      columnIndex < interactButton.length;
      columnIndex += 1
    ) {
      const cellParticle = world.assertByIdAndComponents(
        state.particles[`cell-${columnIndex}`],
        [PARTICLE, SPRITE]
      );
      cellParticle[SPRITE] = interactButton[columnIndex];
      rerenderEntity(world, cellParticle);
    }
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
  const interactSequence = getSequence(world, entity, "interact");
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
  const isAdjacent =
    controlled || interactSequence
      ? !shouldHide
      : heroEntity &&
        !isDead(world, heroEntity) &&
        distance < (isUp ? discoveryLeave : discoveryEnter) &&
        !(
          isInside(world, heroEntity) && !onSameLayer(world, heroEntity, entity)
        );

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

  const visibleSprite = !!interactSequence
    ? none
    : isAdjacent && state.elapsed > state.args.timestamp
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
      state.elapsed / charDelay > totalLength * 1.3 + 20);
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
  const leftOffset = Math.floor((totalLength - 1) / 2);
  const charsLength = Object.keys(state.particles).filter(
    (key) => key.startsWith("char-") || key === "bubble"
  ).length;
  if (charsLength === 0 && !expired) {
    for (let i = 0; i < totalLength; i += 1) {
      const origin = add(orientationPoints[state.args.orientation], {
        x: -leftOffset,
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
  if (updated && charsLength > 0) {
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

  // reorient line
  const tooltipCorner = world.getEntityByIdAndComponents(
    state.particles["tooltip-corner"],
    [ORIENTABLE, PARTICLE, SPRITE]
  );
  const tooltipOrientation = tooltipCorner?.[ORIENTABLE].facing;
  if (
    !state.args.isDialog &&
    !state.args.isIdle &&
    totalLength >= 3 &&
    tooltipOrientation !== orientation
  ) {
    const isAlly = isTribe(world, entity);

    // create tooltip line
    if (!tooltipCorner) {
      const cornerParticle = entities.createFibre(world, {
        [ORIENTABLE]: { facing: orientation },
        [PARTICLE]: {
          offsetX: -leftOffset,
          offsetY: 0,
          offsetZ: tooltipHeight,
        },
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: state.args.isEnemy
          ? enemyLine
          : isAlly
          ? allyLine
          : tooltipLine,
      });
      state.particles["tooltip-corner"] = world.getEntityId(cornerParticle);
      for (let tooltipIndex = 1; tooltipIndex < leftOffset; tooltipIndex += 1) {
        const tooltipParticle = entities.createParticle(world, {
          [PARTICLE]: {
            offsetX: -tooltipIndex,
            offsetY: 0,
            offsetZ: tooltipHeight,
          },
          [RENDERABLE]: { generation: 0 },
          [SPRITE]: state.args.isEnemy
            ? enemyLine
            : isAlly
            ? allyLine
            : tooltipLine,
        });
        state.particles[`tooltip-line-${tooltipIndex}`] =
          world.getEntityId(tooltipParticle);
      }
    } else {
      tooltipCorner[ORIENTABLE].facing = orientation;
      rerenderEntity(world, tooltipCorner);
    }
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
    for (const particleName in state.particles) {
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
const pointerDistance = 3.9;

export const pointerArrow: Sequence<PointerSequence> = (
  world,
  entity,
  state
) => {
  let updated = false;
  let finished = false;

  const highlightEntity = world.getEntities([
    FOCUSABLE,
    TRACKABLE,
    ORIENTABLE,
  ])[0];
  const targetId = highlightEntity?.[FOCUSABLE].target;
  const highlight = highlightEntity?.[FOCUSABLE].highlight;
  const targetEntity = world.getEntityByIdAndComponents(targetId, [POSITION]);

  if (!state.args.lastOrientation && (!highlightEntity || !targetEntity)) {
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
    getDistance(entity[POSITION], targetEntity[POSITION], size) >
      pointerDistance;
  const targetChanged = state.args.target !== targetId;
  if (
    state.args.lastOrientation &&
    (!highlightEntity || !targetEntity || targetChanged || !shouldDisplay)
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
  } else if (highlightEntity && targetEntity && shouldDisplay) {
    // invert orientation as needle from highlight is pointing to hero
    const orientation = highlightEntity[ORIENTABLE].facing;
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
              spellTriggered: false,
              skillTriggered: false,
              toolEquipped: false,
            },
            [BUMPABLE]: { generation: 0 },
            [COLLIDABLE]: {},
            [DROPPABLE]: { decayed: false, evaporate: bossUnit.evaporate },
            [FOG]: { visibility: "hidden", type: "object" },
            [FRAGMENT]: { structure: world.getEntityId(oakEntity) },
            [LAYER]: {},
            [MOVABLE]: {
              orientations: [],
              reference: world.getEntityId(world.metadata.gameEntity),
              lastInteraction: 0,
              flying: false,
              swimming: false,
            },
            [ORIENTABLE]: {
              facing: iteration.orientation,
            },
            [POSITION]: sidePosition,
            [REMAINABLE]: {},
            [RENDERABLE]: { generation: 0 },
            [SEQUENCABLE]: { states: {} },
            [SHOOTABLE]: { shots: 0 },
            [SPRITE]: oakLoopSide,
          });
          state.args.limbs.push(world.getEntityId(sideEntity));

          const cornerPosition = combine(size, sidePosition, iteration.normal);
          const cornerEntity = entities.createLimb(world, {
            [ACTIONABLE]: {
              spellTriggered: false,
              skillTriggered: false,
              toolEquipped: false,
            },
            [BUMPABLE]: { generation: 0 },
            [COLLIDABLE]: {},
            [DROPPABLE]: { decayed: false, evaporate: bossUnit.evaporate },
            [FOG]: { visibility: "hidden", type: "object" },
            [FRAGMENT]: { structure: world.getEntityId(oakEntity) },
            [LAYER]: {},
            [MOVABLE]: {
              orientations: [],
              reference: world.getEntityId(world.metadata.gameEntity),
              lastInteraction: 0,
              flying: false,
              swimming: false,
            },
            [ORIENTABLE]: {
              facing: rotateOrientation(iteration.orientation, 1),
            },
            [POSITION]: cornerPosition,
            [REMAINABLE]: {},
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
        [ACTIONABLE]: {
          spellTriggered: false,
          skillTriggered: false,
          toolEquipped: false,
        },
        [BUMPABLE]: { generation: 0 },
        [COLLIDABLE]: {},
        [DROPPABLE]: { decayed: false, evaporate: bossUnit.evaporate },
        [FOG]: { visibility: "hidden", type: "object" },
        [FRAGMENT]: { structure: world.getEntityId(oakEntity) },
        [LAYER]: {},
        [MOVABLE]: {
          orientations: [],
          reference: world.getEntityId(world.metadata.gameEntity),
          lastInteraction: 0,
          flying: false,
          swimming: false,
        },
        [ORIENTABLE]: {
          facing: limbOrientation,
        },
        [POSITION]: limbPosition,
        [REMAINABLE]: {},
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
        dropEntity(world, fragmentEntity, fragmentEntity[POSITION]);
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
  const finished = !state.args.type || isDead(world, entity);
  let updated = false;
  const size = world.metadata.gameEntity[LEVEL].size;
  const rootEntity = getRoot(world, entity);
  const entityId = world.getEntityId(rootEntity);
  const orientation = entity[ORIENTABLE].facing as Orientation | undefined;

  if (!orientation || !state.args.type || finished) {
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
