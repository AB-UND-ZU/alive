import { Entity } from "ecs";
import { entities, World } from "../../engine";
import type * as npcTypes from "./npcs";
import type * as questTypes from "./quests";
import { createSequence, getSequence } from "../../engine/systems/sequence";
import {
  Message,
  MessageSequence,
  NpcSequence,
  PopupSequence,
  QuestSequence,
  SEQUENCABLE,
  SequenceState,
} from "../../engine/components/sequencable";
import { colors } from "./colors";
import { Popup, POPUP } from "../../engine/components/popup";
import { RENDERABLE } from "../../engine/components/renderable";
import { iterations } from "../math/tracing";
import { add, lerp, padCenter } from "../math/std";
import { ORIENTABLE, Orientation } from "../../engine/components/orientable";
import { PARTICLE } from "../../engine/components/particle";
import { Sprite, SPRITE } from "../../engine/components/sprite";
import {
  getFacingLayers,
  overlayHeight,
  popupHeight,
  selectionHeight,
} from "../../components/Entity/utils";
import {
  addBackground,
  createText,
  friendlyBar,
  hostileBar,
  mergeSprites,
  popupBackground,
  popupCenter,
  popupCenterEnd,
  popupCenterStart,
  popupCorner,
  popupDownEnd,
  popupDownStart,
  popupSide,
  scrollBar,
  scrollBarBottom,
  scrollBarTop,
  scrollHandle,
  apple,
  appleDrop,
  arrow,
  banana,
  bananaDrop,
  berry,
  berryDrop,
  bombActive,
  charge,
  coconut,
  coconutDrop,
  coin,
  crystal,
  diamond,
  fenceDoor,
  flower,
  flowerDrop,
  fruit,
  gem,
  getStatSprite,
  gold,
  herb,
  ingot,
  iron,
  leaf,
  minCountable,
  ore,
  oreDrop,
  ruby,
  seed,
  shroom,
  stick,
  wood,
  worm,
  createCountable,
  tree1,
  tree2,
  hedge1,
  hedge2,
  maxCountable,
  rock1,
  rock2,
  goldMine,
  ironMine,
  ironMineDisplay,
  goldMineDisplay,
  popupSeparator,
  popupSelection,
  level,
  heartUp,
  heart,
  manaUp,
  mana,
  xp,
  armor,
  power,
  fire,
  vision,
  resist,
  damp,
  thaw,
  freeze,
  spike,
  magicHit,
  meleeHit,
  wisdom,
  haste,
  fog,
  stretch,
  popupSeparatorSelected,
  popupSeparatorInverted,
  popupCenterCrop,
  missing,
  popupActive,
  popupBlocked,
  nugget,
  rogue,
  mage,
  knight,
  alien,
  oreDisplay,
  none,
  absorb,
  scout,
  wall,
  golemHead,
  plank,
  createSpriteButton,
  close,
  stats,
  aura,
  popupHint,
  popupOverlay,
  times,
  quickSide,
  quickCorner,
  getStatColor,
  quickSeparatorSelected,
  quickCenterStart,
  quickCenterEnd,
  salmon,
  tuna,
  pike,
  cod,
  pearl,
  seastar,
  eel,
  algae,
  fishing,
  bubble,
  getBlockedSlot,
  skillSlot,
  swimmingEel,
  letter,
  schema,
} from "./sprites";
import { rerenderEntity } from "../../engine/systems/renderer";
import { MOVABLE } from "../../engine/components/movable";
import { REFERENCE } from "../../engine/components/reference";
import {
  Consumable,
  Craftable,
  Element,
  emptyItemStats,
  Item,
  ItemStats,
  Material,
  Materialized,
  Spell,
  Reloadable,
  ResourceItem,
  Skill,
  Tool,
  ITEM,
  Weapon,
  Offhand,
} from "../../engine/components/item";
import { generateUnitData, UnitKey } from "../balancing/units";
import { Accessory } from "../../engine/components/equippable";
import {
  getTab,
  getVerticalIndex,
  popupTitles,
} from "../../engine/systems/popup";
import { disposeEntity } from "../../engine/systems/map";
import { UnitStats } from "../../engine/components/stats";
import { ClassKey, getClassData } from "../balancing/classes";
import { brightenSprites } from "./pixels";
import {
  amulet,
  axe,
  beamSpell,
  block,
  boots,
  bow,
  compass,
  dashSpell,
  map,
  pickaxe,
  zap,
  ring,
  shield,
  slash,
  sword,
  torch,
  totem,
  trapSpell,
  waveSpell,
  hook,
  spear,
  wand,
} from "./templates/equipments";
import { flask, potion, key, bottle, spirit } from "./templates/items";
import {
  doorClosed,
  doorOpen,
  entryClosed,
  entryClosedDisplay,
  lock,
  portClosed,
  portOpen,
} from "./templates/units";
import { getItemStats } from "../balancing/equipment";
import {
  colorPalettes,
  PartialSpriteTemplate,
  recolorSprite,
} from "./templates";
import {
  consumptionConfigs,
  getItemConsumption,
} from "../../engine/systems/consume";

export const lootSpeed = 200;
export const decayTime = 300;
export const hookSpeed = 100;

export const START_STEP = "START_STEP";
export const END_STEP = "END_STEP";

export const npcSequence = (
  world: World,
  entity: Entity,
  name: keyof typeof npcTypes,
  memory: any
) =>
  createSequence<"npc", NpcSequence>(world, entity, "npc", name, {
    step: START_STEP,
    memory,
  });

export const questSequence = (
  world: World,
  entity: Entity,
  name: keyof typeof questTypes,
  memory: any,
  giver?: Entity
) =>
  createSequence<"quest", QuestSequence>(world, entity, "quest", name, {
    step: START_STEP,
    memory,
    giver: giver && world.getEntityId(giver),
  });

type StepAnimations = QuestSequence | NpcSequence;
export type QuestStage<T extends StepAnimations> = {
  world: World;
  entity: Entity;
  state: SequenceState<T>;
  updated: boolean;
  finished: boolean;
};

const STEP_DEBUG = false;

export const step = <T extends StepAnimations>({
  stage,
  name,
  forceEnter = () => false,
  onEnter = () => true,
  isCompleted = () => false,
  onLeave = () => END_STEP,
}: {
  stage: QuestStage<T>;
  name: string;
  forceEnter?: () => boolean;
  onEnter?: () => boolean;
  isCompleted?: () => boolean;
  onLeave?: () => string;
}) => {
  const forced = forceEnter();
  const questName =
    STEP_DEBUG &&
    (stage.entity[SEQUENCABLE].states.quest?.name ||
      stage.entity[SEQUENCABLE].states.npc.name);

  // execute for current step or if forced enter
  if (stage.state.args.step !== name && !forced) return;

  // execute enter callback only once
  if (stage.state.args.lastStep !== name) {
    const shouldEnter = onEnter();

    if (STEP_DEBUG)
      console.info(
        Date.now(),
        `${questName}: ${forceEnter() ? "forced " : ""}${
          shouldEnter ? "enter" : "skip"
        } "${name}" (from "${stage.state.args.lastStep}")`
      );

    if (shouldEnter) {
      stage.state.args.lastStep = name;

      if (forced) {
        stage.state.args.step = name;
      }
    }
  }

  // leave if condition is met and calculate next step
  if (isCompleted()) {
    const nextStep = onLeave();
    stage.state.args.step = nextStep;
    stage.updated = true;

    if (STEP_DEBUG)
      console.info(
        Date.now(),
        `${questName}: complete "${name}" (to "${nextStep}")`
      );

    if (nextStep === END_STEP) {
      stage.finished = true;
    }
  }
};

export const frameWidth = 19;
export const frameHeight = 11;
export const detailsHeight = 3;
export const contentDelay = 8;
export const popupDelay = 60;
export const questWidth = 16;
export const rewardWidth = 13;

export const scrolledVerticalIndex = (
  world: World,
  entity: Entity,
  state: SequenceState<PopupSequence>,
  content: Sprite[][],
  selection?: PopupSelection,
  details?: Sprite[][],
  overscan = 0
) => {
  if (!selection) return 0;

  const verticalIndex = getVerticalIndex(world, entity);
  const innerHeight = details
    ? frameHeight - detailsHeight - 3
    : frameHeight - 2;
  const padding = (innerHeight - 1) / 2;

  const lines = content.length - overscan;
  const remainingItems = Math.max(0, lines - verticalIndex - 1);

  if (lines > innerHeight && remainingItems <= padding)
    return innerHeight - remainingItems - 1;
  if (
    lines > innerHeight &&
    verticalIndex >= padding &&
    remainingItems >= padding
  )
    return padding;

  return Math.min(verticalIndex, innerHeight - 1);
};

export type PopupSelection = "blocked" | "selected" | "active";

const selectionSprites = {
  blocked: popupBlocked,
  selected: popupSelection,
  active: popupActive,
};

const buttonWidth = 7;
const popupSprites = {
  corner: popupCorner,
  side: popupSide,
  downStart: popupDownStart,
  downEnd: popupDownEnd,
  background: popupBackground,
  scrollBarTop,
  scrollBarBottom,
  scrollBar,
  scrollHandle,
  separatorSelected: popupSeparatorSelected,
  separatorInverted: popupSeparatorInverted,
  separator: popupSeparator,
  centerStart: popupCenterStart,
  centerEnd: popupCenterEnd,
  center: popupCenter,
  centerCrop: popupCenterCrop,
};
const quickSprites = Object.fromEntries(
  Object.entries(popupSprites).map(([name, sprite]) => [
    name,
    recolorSprite(sprite, {
      [colors.white]: colors.yellow,
      [colors.silver]: colors.olive,
      [colors.grey]: colors.olive,
    }),
  ])
);
quickSprites.side = quickSide;
quickSprites.corner = quickCorner;
quickSprites.separatorSelected = quickSeparatorSelected;
quickSprites.centerStart = quickCenterStart;
quickSprites.centerEnd = quickCenterEnd;

export const renderPopup = (
  world: World,
  entity: Entity,
  state: SequenceState<PopupSequence>,
  icon: Sprite | undefined = undefined,
  content: Sprite[][],
  selection?: PopupSelection,
  details?: Sprite[][],
  overscan = 0,
  rightButton?: Sprite[],
  leftButton?: Sprite[],
  windowHeight = frameHeight
) => {
  let updated = false;
  let finished = !entity[POPUP].active;
  const worldGeneration = world.metadata.gameEntity[RENDERABLE].generation;
  const generation = entity[RENDERABLE].generation;
  const popupMiddle = { x: 0, y: (windowHeight + 1) / -2 };
  const initial = !state.args.generation;
  const spriteConfig = state.args.instant ? quickSprites : popupSprites;
  const windowChanged = state.args.windowHeight !== windowHeight;
  const generationChanged =
    state.args.generation !== generation || windowChanged;
  const heightChanged = state.args.contentHeight !== content.length;
  const verticalIndex = getVerticalIndex(world, entity);
  const horizontalIndex = entity[POPUP].horizontalIndex;
  const lines = content.length - overscan;
  const detailsPadding = details ? detailsHeight : 0;
  const scrollIndex =
    verticalIndex -
    scrolledVerticalIndex(
      world,
      entity,
      state,
      content,
      selection,
      details,
      overscan
    );
  const scrollRatio =
    verticalIndex /
    (lines -
      (selection
        ? 1
        : details
        ? windowHeight - detailsHeight - 3
        : windowHeight - 2));
  const contentSize =
    ((details ? windowHeight - detailsHeight : windowHeight) - 2) *
    (frameWidth - 2);
  const foldSize = (verticalIndex - scrollIndex) * (frameWidth - 2);
  const windowOffset = Math.floor((windowHeight - frameHeight) / 2);
  const popupTime = windowHeight * popupDelay;
  const settled =
    (state.args.contentIndex >= foldSize && state.elapsed > popupTime) ||
    state.args.instant;
  const hintGeneration = world.getEntityByIdAndComponents(
    state.particles["hint-0"],
    [PARTICLE]
  )?.[PARTICLE].amount;
  const tab = getTab(world, entity);
  const visibleScroll =
    lines > (details ? windowHeight - detailsHeight - 3 : windowHeight - 2) &&
    tab !== "chat";
  const visibleOverlay =
    visibleScroll &&
    !details &&
    !selection &&
    !["use", "map", "chat"].includes(tab);
  const topOverlayTarget = visibleOverlay && scrollRatio > 0 ? 1 : 0;
  const topOverlayAmount = world.getEntityByIdAndComponents(
    state.particles["overlay-up-0"],
    [PARTICLE]
  )?.[PARTICLE].amount;
  const bottomOverlayTarget = visibleOverlay && scrollRatio < 1 ? 1 : 0;
  const bottomOverlayAmount = world.getEntityByIdAndComponents(
    state.particles["overlay-down-0"],
    [PARTICLE]
  )?.[PARTICLE].amount;
  const hintAmount =
    details || selection || !settled || bottomOverlayTarget === 0
      ? 0
      : worldGeneration % 4 === 0
      ? 1
      : 0;
  let renderContent = generationChanged;
  let renderTabs =
    horizontalIndex !== state.args.horizontalIndex || generationChanged;
  let renderDetails = settled;
  let renderSeparator = details && renderTabs;
  let renderButtons = generationChanged;
  let renderHint = renderTabs || (!details && hintGeneration !== hintAmount);
  let renderScroll =
    visibleScroll && (generationChanged || renderContent || renderTabs);
  let renderTopOverlay =
    renderTabs ||
    generationChanged ||
    (visibleScroll && topOverlayAmount !== topOverlayTarget);
  let renderBottomOverlay =
    renderTabs ||
    generationChanged ||
    (visibleScroll && bottomOverlayAmount !== bottomOverlayTarget);

  // reset entire popup on window height change
  if (windowChanged) {
    state.args.windowHeight = windowHeight;

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

  // create popup
  if (initial || windowChanged) {
    state.args.generation = generation;

    for (const iteration of iterations) {
      // corners
      const cornerDelta = add(iteration.direction, {
        x: -iteration.normal.x,
        y: -iteration.normal.y,
      });
      const cornerParticle = entities.createFibre(world, {
        [ORIENTABLE]: { facing: iteration.orientation },
        [PARTICLE]: {
          offsetX: popupMiddle.x + cornerDelta.x * ((frameWidth - 1) / 2),
          offsetY:
            popupMiddle.y +
            cornerDelta.y * ((windowHeight - 1) / 2) +
            windowOffset,
          offsetZ: popupHeight,
        },
        [RENDERABLE]: { generation: 1 },
        [SPRITE]: spriteConfig.corner,
      });
      state.particles[`popup-${iteration.orientation}-corner`] =
        world.getEntityId(cornerParticle);

      // sides
      const directionLength = Math.abs(
        frameWidth * iteration.direction.x +
          windowHeight * iteration.direction.y
      );
      const normalLength =
        Math.abs(
          frameWidth * iteration.normal.x + windowHeight * iteration.normal.y
        ) - 2;
      for (let i = 0; i < normalLength; i += 1) {
        const sideParticle = entities.createFibre(world, {
          [ORIENTABLE]: { facing: iteration.orientation },
          [PARTICLE]: {
            offsetX:
              popupMiddle.x +
              iteration.normal.x * (i - (normalLength - 1) / 2) +
              (iteration.direction.x * (directionLength - 1)) / 2,
            offsetY:
              popupMiddle.y +
              iteration.normal.y * (i - (normalLength - 1) / 2) +
              (iteration.direction.y * (directionLength - 1)) / 2 +
              windowOffset,
            offsetZ: popupHeight,
          },
          [RENDERABLE]: { generation: 1 },
          [SPRITE]: spriteConfig.side,
        });
        state.particles[`popup-${iteration.orientation}-${i}`] =
          world.getEntityId(sideParticle);
      }
    }

    // add bottom decoration
    if (icon) {
      const downStartParticle = world.assertByIdAndComponents(
        state.particles[`popup-down-${(frameWidth - 3) / 2 + 1}`],
        [PARTICLE]
      );
      downStartParticle[SPRITE] = spriteConfig.downStart;
      const downEndParticle = world.assertByIdAndComponents(
        state.particles[`popup-down-${(frameWidth - 3) / 2 - 1}`],
        [PARTICLE]
      );
      downEndParticle[SPRITE] = spriteConfig.downEnd;
      const downCenterName = `popup-down-${(frameWidth - 3) / 2}`;
      const downCenterParticle = world.assertByIdAndComponents(
        state.particles[downCenterName],
        [PARTICLE]
      );
      downCenterParticle[SPRITE] = addBackground([icon], colors.black)[0];
    }

    // add background
    for (let row = 0; row < windowHeight - 2; row += 1) {
      for (let column = 0; column < frameWidth - 2; column += 1) {
        const charParticle = entities.createParticle(world, {
          [PARTICLE]: {
            offsetX: popupMiddle.x - (frameWidth - 3) / 2 + column,
            offsetY:
              popupMiddle.y - (windowHeight - 3) / 2 + row + windowOffset,
            offsetZ: popupHeight,
          },
          [RENDERABLE]: { generation: 1 },
          [SPRITE]: spriteConfig.background,
        });
        state.particles[`popup-content-${row}-${column}`] =
          world.getEntityId(charParticle);
      }
    }

    // placeholders for tabs
    for (let column = 0; column < frameWidth; column += 1) {
      const tabParticle = entities.createFibre(world, {
        [ORIENTABLE]: {},
        [PARTICLE]: {
          offsetX: -(frameWidth + 1) / 2 + column,
          offsetY: -windowHeight + windowOffset,
          offsetZ: selectionHeight,
        },
        [RENDERABLE]: { generation: 1 },
        [SPRITE]: none,
      });
      state.particles[`popup-tab-${column}`] = world.getEntityId(tabParticle);
    }

    renderTabs = true;
    renderContent = true;
    renderSeparator = true;
    renderButtons = true;
  }

  // rerender scroll handle and bars
  if (renderScroll) {
    // top and bottom handles
    world.assertByIdAndComponents(state.particles["popup-right-0"], [PARTICLE])[
      SPRITE
    ] = spriteConfig.scrollBarTop;
    world.assertByIdAndComponents(
      state.particles[`popup-right-${windowHeight - 3}`],
      [PARTICLE]
    )[SPRITE] = spriteConfig.scrollBarBottom;

    // render bar
    for (let row = 1; row < windowHeight - 3; row += 1) {
      world.assertByIdAndComponents(state.particles[`popup-right-${row}`], [
        PARTICLE,
      ])[SPRITE] = spriteConfig.scrollBar;
    }

    const progress = Math.floor(lerp(2, (windowHeight - 5) * 2, scrollRatio));

    // add handle
    const handleStart = world.assertByIdAndComponents(
      state.particles[`popup-right-${Math.floor(progress / 2)}`],
      [PARTICLE, ORIENTABLE]
    );
    handleStart[SPRITE] = spriteConfig.scrollHandle;
    handleStart[ORIENTABLE].facing = progress % 2 === 1 ? "down" : undefined;
    const handleCenter = world.assertByIdAndComponents(
      state.particles[`popup-right-${Math.floor(progress / 2) + 1}`],
      [PARTICLE, ORIENTABLE]
    );
    handleCenter[SPRITE] = spriteConfig.scrollHandle;
    handleCenter[ORIENTABLE].facing = undefined;
    const handleEnd = world.assertByIdAndComponents(
      state.particles[`popup-right-${Math.ceil(progress / 2) + 1}`],
      [PARTICLE, ORIENTABLE]
    );
    handleEnd[SPRITE] = spriteConfig.scrollHandle;
    handleEnd[ORIENTABLE].facing = progress % 2 === 1 ? "up" : undefined;

    state.args.scrollIndex = scrollIndex;
    renderContent = true;
  } else if (!visibleScroll && (renderTabs || heightChanged)) {
    // reset scroll bar
    for (let row = 0; row < windowHeight - 2; row += 1) {
      const sideParticle = world.assertByIdAndComponents(
        state.particles[`popup-right-${row}`],
        [PARTICLE, ORIENTABLE]
      );
      sideParticle[SPRITE] = spriteConfig.side;
      sideParticle[ORIENTABLE].facing = "right";
    }

    renderContent = true;
  }

  if (renderTabs) {
    state.args.horizontalIndex = horizontalIndex;

    // add top decoration
    const displayedTabs: Popup["tabs"] = state.args.instant
      ? [entity[POPUP].tabs[horizontalIndex]]
      : entity[POPUP].tabs;
    for (let tabIndex = 0; tabIndex < displayedTabs.length; tabIndex += 1) {
      const displayedHorizontalIndex = state.args.instant ? 0 : horizontalIndex;
      const selected = tabIndex === displayedHorizontalIndex;
      const offset = tabIndex * 6;

      const upStartParticle = world.assertByIdAndComponents(
        state.particles[`popup-tab-${offset}`],
        [PARTICLE, ORIENTABLE]
      );
      upStartParticle[SPRITE] = selected
        ? spriteConfig.separatorSelected
        : tabIndex === displayedHorizontalIndex + 1
        ? spriteConfig.separatorInverted
        : spriteConfig.separator;
      upStartParticle[ORIENTABLE].facing =
        tabIndex === 0
          ? displayedTabs.length === 3
            ? "up"
            : "right"
          : undefined;
      if (tabIndex === displayedTabs.length - 1) {
        const upEndParticle = world.assertByIdAndComponents(
          state.particles[`popup-tab-${offset + 6}`],
          [PARTICLE, ORIENTABLE]
        );
        upEndParticle[SPRITE] = selected
          ? spriteConfig.separatorSelected
          : spriteConfig.separator;
        upEndParticle[ORIENTABLE].facing = tabIndex === 2 ? "down" : "left";
      }
      const transaction = displayedTabs[tabIndex];
      const title = popupTitles[transaction];
      const titleText = createText(
        padCenter(title.toUpperCase(), 5),
        selected
          ? colors.black
          : state.args.instant
          ? colors.yellow
          : colors.white
      );
      const titleSprites = addBackground(
        addBackground(
          titleText,
          selected
            ? state.args.instant
              ? colors.yellow
              : colors.white
            : state.args.instant
            ? colors.olive
            : colors.grey,
          selected ? undefined : "▄"
        ),
        colors.black
      );
      titleSprites.forEach((char, index) => {
        const charParticle = world.assertByIdAndComponents(
          state.particles[`popup-tab-${offset + index + 1}`],
          [PARTICLE]
        );
        charParticle[SPRITE] = char;
      });
    }
    updated = true;
  }

  if (renderTabs || heightChanged) {
    state.args.contentHeight = content.length;

    // add center decoration
    const centerStartParticle = world.assertByIdAndComponents(
      state.particles[`popup-left-${detailsHeight}`],
      [PARTICLE]
    );
    centerStartParticle[SPRITE] = details
      ? spriteConfig.centerStart
      : spriteConfig.side;
    if (!visibleScroll) {
      const centerEndParticle = world.assertByIdAndComponents(
        state.particles[`popup-right-${windowHeight - detailsHeight - 3}`],
        [PARTICLE]
      );
      centerEndParticle[SPRITE] = details
        ? spriteConfig.centerEnd
        : spriteConfig.side;
    }

    updated = true;
  }

  // clear content on changes
  if (
    (generationChanged || scrollIndex !== state.args.scrollIndex) &&
    (state.elapsed > popupTime || state.args.instant)
  ) {
    state.args.generation = generation;
    state.args.scrollIndex = scrollIndex;

    for (const particleName in state.particles) {
      // don't clear separator
      if (
        !particleName.startsWith("popup-content-") ||
        (details &&
          particleName.startsWith(
            `popup-content-${windowHeight - detailsHeight - 3}-`
          ))
      )
        continue;

      const particleEntity = world.assertByIdAndComponents(
        state.particles[particleName],
        [PARTICLE, SPRITE]
      );

      particleEntity[SPRITE] = spriteConfig.background;
    }

    renderContent = true;
    renderDetails = settled;
    renderSeparator = true;
  }

  if (renderSeparator) {
    for (let i = 0; i < frameWidth - 2; i += 1) {
      const centerParticle = world.assertByIdAndComponents(
        state.particles[
          `popup-content-${windowHeight - detailsHeight - 3}-${i}`
        ],
        [PARTICLE]
      );
      centerParticle[SPRITE] = details
        ? spriteConfig.center
        : spriteConfig.background;
    }

    updated = true;
  }

  // popup content
  if (
    renderContent ||
    (state.elapsed > popupTime && state.args.contentIndex < contentSize)
  ) {
    const contentIndex = state.args.instant
      ? contentSize
      : Math.floor((state.elapsed - popupTime) / contentDelay);
    const scrollContent = content
      .slice(scrollIndex)
      .slice(0, details ? windowHeight - detailsHeight - 2 : windowHeight - 2);

    // gradually animate typed content
    for (
      let row = renderContent
        ? 0
        : Math.floor(state.args.contentIndex / (frameWidth - 2));
      row < scrollContent.length;
      row += 1
    ) {
      for (let column = 0; column < scrollContent[row].length; column += 1) {
        const charIndex = row * (frameWidth - 2) + column;

        if (charIndex > contentIndex) {
          row = scrollContent.length - 1;
          break;
        } else if (!renderContent && charIndex < state.args.contentIndex)
          continue;

        const char = mergeSprites(popupBackground, scrollContent[row][column]);
        const charParticle = world.assertByIdAndComponents(
          state.particles[`popup-content-${row}-${column}`],
          [PARTICLE, SPRITE]
        );
        const cropContent =
          details &&
          lines >= windowHeight - 2 - detailsHeight - overscan &&
          row === scrollContent.length - 1 &&
          scrollContent.length > windowHeight - detailsHeight - 3;
        charParticle[SPRITE] = cropContent
          ? mergeSprites(char, spriteConfig.centerCrop)
          : char;
        rerenderEntity(world, charParticle);
      }
    }

    if (!renderContent) state.args.contentIndex = contentIndex;

    updated = true;
  }

  // popup details
  state.args.detailsPadding = detailsPadding;
  if (renderDetails && details) {
    for (let row = 0; row < Math.min(detailsHeight, details.length); row += 1) {
      for (let column = 0; column < details[row].length; column += 1) {
        const char = mergeSprites(popupBackground, details[row][column]);
        const charParticle = world.assertByIdAndComponents(
          state.particles[
            `popup-content-${row + windowHeight - detailsHeight - 2}-${column}`
          ],
          [PARTICLE, SPRITE]
        );
        charParticle[SPRITE] = char;
        rerenderEntity(world, charParticle);
      }
    }
    updated = true;
  }

  if (renderButtons) {
    // add close button
    if (initial || windowChanged) {
      const closeButton = createSpriteButton(
        [close],
        3,
        false,
        false,
        false,
        "red"
      );

      for (let column = 0; column < closeButton.length; column += 1) {
        const closeParticle = entities.createParticle(world, {
          [PARTICLE]: {
            offsetX: (frameWidth - 3) / 2 + column,
            offsetY: -windowHeight + windowOffset,
            offsetZ: selectionHeight,
          },
          [RENDERABLE]: { generation: 1 },
          [SPRITE]: closeButton[column],
        });
        state.particles[`popup-close-${column}`] =
          world.getEntityId(closeParticle);
      }
    }

    for (let column = 0; column < buttonWidth; column += 1) {
      const leftSprite = leftButton?.[column];
      const leftName = `popup-prev-${column}`;

      if (!leftSprite) {
        const leftParticle = world.getEntityByIdAndComponents(
          state.particles[leftName],
          [PARTICLE]
        );
        if (leftParticle) {
          disposeEntity(world, leftParticle);
          delete state.particles[leftName];
        }
        continue;
      }

      const leftParticle = entities.createParticle(world, {
        [PARTICLE]: {
          offsetX: -(frameWidth + 1) / 2 + column,
          offsetY: -1 + windowOffset,
          offsetZ: selectionHeight,
        },
        [RENDERABLE]: { generation: 1 },
        [SPRITE]: leftSprite,
      });
      state.particles[leftName] = world.getEntityId(leftParticle);
    }

    for (let column = 0; column < buttonWidth; column += 1) {
      const rightSprite = rightButton?.[column];
      const rightName = `popup-next-${column}`;

      if (!rightSprite) {
        const rightParticle = world.getEntityByIdAndComponents(
          state.particles[rightName],
          [PARTICLE]
        );
        if (rightParticle) {
          disposeEntity(world, rightParticle);
          delete state.particles[rightName];
        }
        continue;
      }

      const rightParticle = entities.createParticle(world, {
        [PARTICLE]: {
          offsetX: (frameWidth - 1) / 2 + column - rightButton.length + 2,
          offsetY: -1 + windowOffset,
          offsetZ: selectionHeight,
        },
        [RENDERABLE]: { generation: 1 },
        [SPRITE]: rightSprite,
      });
      state.particles[rightName] = world.getEntityId(rightParticle);
    }
  }

  if ((initial || windowChanged) && !state.args.instant) {
    // interpolate frame on initial render
    for (const particleName in state.particles) {
      const particleEntity = world.assertByIdAndComponents(
        state.particles[particleName],
        [PARTICLE]
      );

      const { offsetX, offsetY } = particleEntity[PARTICLE];
      if (offsetY <= -windowHeight + windowOffset) {
        particleEntity[PARTICLE].animatedOrigin = {
          x: offsetX,
          y: -3 + windowOffset,
        };
        particleEntity[PARTICLE].duration = (windowHeight - 1) * popupDelay;
      } else if (offsetY < -1 + windowOffset) {
        particleEntity[PARTICLE].animatedOrigin = {
          x: offsetX,
          y: -2 + windowOffset,
        };
        particleEntity[PARTICLE].duration = -offsetY * popupDelay;
      }
    }
  } else if (settled && !state.args.instant) {
    // stop animating settled popup
    for (const particleName in state.particles) {
      if (particleName === "selection") continue;

      const particleEntity = world.assertByIdAndComponents(
        state.particles[particleName],
        [PARTICLE]
      );
      delete particleEntity[PARTICLE].animatedOrigin;
    }
  }

  // vertical selection
  const popupOrigin = { x: 0, y: (windowHeight + 1) / -2 };
  const selectionX = popupOrigin.x - (frameWidth - 3) / 2;
  const selectionY = popupOrigin.y - (windowHeight - 3) / 2;
  state.args.contentClickable = !!selection;

  if (
    !state.particles.selection &&
    selection &&
    (state.args.instant ||
      state.elapsed >
        popupTime +
          (verticalIndex - scrollIndex) * (frameWidth - 2) * contentDelay)
  ) {
    // add selection arrow
    const selectionParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: selectionX,
        offsetY: selectionY + (verticalIndex - scrollIndex) + windowOffset,
        offsetZ: selectionHeight,
        animatedOrigin: {
          x: selectionX - 1,
          y: selectionY + (verticalIndex - scrollIndex) + windowOffset,
        },
        duration: 100,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: selectionSprites[selection],
    });
    state.particles.selection = world.getEntityId(selectionParticle);
  }

  // move selection
  if (
    (verticalIndex !== state.args.verticalIndex ||
      renderTabs ||
      generationChanged) &&
    state.particles.selection &&
    selection
  ) {
    const selectionParticle = world.assertByIdAndComponents(
      state.particles.selection,
      [PARTICLE]
    );
    selectionParticle[PARTICLE].offsetY =
      selectionY + (verticalIndex - scrollIndex) + windowOffset;
    state.args.verticalIndex = verticalIndex;

    // update selection type if needed
    const selectionSprite = selectionSprites[selection];
    if (selectionParticle[SPRITE] !== selectionSprite) {
      selectionParticle[SPRITE] = selectionSprite;
      rerenderEntity(world, selectionParticle);
    }

    updated = true;
  }

  // delete selection
  if (state.particles.selection && !selection) {
    const selectionParticle = world.assertByIdAndComponents(
      state.particles.selection,
      [PARTICLE]
    );
    disposeEntity(world, selectionParticle);
    delete state.particles.selection;
    updated = true;
  }

  // scroll overlays
  if (renderTopOverlay) {
    updated = true;
    if (!state.particles["overlay-up-0"]) {
      for (
        let overlayIndex = 0;
        overlayIndex < frameWidth - 2;
        overlayIndex += 1
      ) {
        const overlayParticle = entities.createFibre(world, {
          [ORIENTABLE]: { facing: topOverlayTarget > 0 ? "up" : undefined },
          [PARTICLE]: {
            offsetX: (frameWidth - 3) / 2 - overlayIndex,
            offsetY: 1 - windowHeight + windowOffset,
            offsetZ: overlayHeight,
            amount: topOverlayTarget,
          },
          [RENDERABLE]: { generation: 1 },
          [SPRITE]: popupOverlay,
        });
        state.particles[`overlay-up-${overlayIndex}`] =
          world.getEntityId(overlayParticle);
      }
    }

    for (
      let overlayIndex = 0;
      overlayIndex < frameWidth - 2;
      overlayIndex += 1
    ) {
      const overlayParticle = world.assertByIdAndComponents(
        state.particles[`overlay-up-${overlayIndex}`],
        [PARTICLE, ORIENTABLE]
      );
      overlayParticle[PARTICLE].amount = topOverlayTarget;
      overlayParticle[ORIENTABLE].facing =
        topOverlayTarget > 0 ? "up" : undefined;
      rerenderEntity(world, overlayParticle);
    }
  }

  if (renderBottomOverlay) {
    updated = true;
    if (!state.particles["overlay-down-0"]) {
      for (
        let overlayIndex = 0;
        overlayIndex < frameWidth - 2;
        overlayIndex += 1
      ) {
        const overlayParticle = entities.createFibre(world, {
          [ORIENTABLE]: {
            facing: bottomOverlayTarget > 0 ? "down" : undefined,
          },
          [PARTICLE]: {
            offsetX: (frameWidth - 3) / 2 - overlayIndex,
            offsetY: -2 + windowOffset,
            offsetZ: overlayHeight,
            amount: bottomOverlayTarget,
          },
          [RENDERABLE]: { generation: 1 },
          [SPRITE]: popupOverlay,
        });
        state.particles[`overlay-down-${overlayIndex}`] =
          world.getEntityId(overlayParticle);
      }
    }

    for (
      let overlayIndex = 0;
      overlayIndex < frameWidth - 2;
      overlayIndex += 1
    ) {
      const overlayParticle = world.assertByIdAndComponents(
        state.particles[`overlay-down-${overlayIndex}`],
        [PARTICLE, ORIENTABLE]
      );
      overlayParticle[PARTICLE].amount = bottomOverlayTarget;
      overlayParticle[ORIENTABLE].facing =
        bottomOverlayTarget > 0 ? "down" : undefined;
      rerenderEntity(world, overlayParticle);
    }
  }

  // blinking scroll hint
  if (renderHint) {
    updated = true;
    if (!state.particles["hint-0"]) {
      for (let hintIndex = 0; hintIndex < 3; hintIndex += 1) {
        const hintParticle = entities.createParticle(world, {
          [PARTICLE]: {
            offsetX: (hintIndex - 1) * -3,
            offsetY: -2 + windowOffset,
            offsetZ: selectionHeight,
            amount: hintAmount,
          },
          [RENDERABLE]: { generation: 1 },
          [SPRITE]: popupHint,
        });
        state.particles[`hint-${hintIndex}`] = world.getEntityId(hintParticle);
      }
    }

    for (let hintIndex = 0; hintIndex < 3; hintIndex += 1) {
      const hintParticle = world.assertByIdAndComponents(
        state.particles[`hint-${hintIndex}`],
        [PARTICLE]
      );
      hintParticle[PARTICLE].amount = hintAmount;
      rerenderEntity(world, hintParticle);
    }
  }

  return { finished, updated };
};

export const getLootDelay = (world: World, entity: Entity, distance: number) =>
  MOVABLE in entity
    ? Math.min(
        200,
        world.assertByIdAndComponents(entity[MOVABLE].reference, [REFERENCE])[
          REFERENCE
        ].tick - 50
      )
    : lootSpeed * distance;

const messageDelay = 250;

export const queueMessage = (
  world: World,
  entity: Entity,
  message: Message
) => {
  const messageState = getSequence(world, entity, "message") as
    | SequenceState<MessageSequence>
    | undefined;

  if (messageState) {
    let delay = messageState.elapsed + message.delay;

    if (!message.fast) {
      // prevent overlapping messages
      const lastMessage = Math.max(
        messageState.elapsed + message.delay,
        messageState.args.lastMessage + messageDelay
      );
      delay = lastMessage;

      messageState.args.lastMessage = lastMessage;
    }

    messageState.args.messages.push({
      ...message,
      delay,
    });
  } else {
    createSequence<"message", MessageSequence>(
      world,
      entity,
      "message",
      "transientMessage",
      {
        messages: [message],
        index: 0,
        lastMessage: 0,
      }
    );
  }
};

type PartialDescriptionTemplate = Partial<
  Record<Material | "default", Partial<Record<Element | "default", Sprite[][]>>>
>;
type SpriteDefinition = {
  sprite: Sprite;
  resource?: Sprite;
  display?: Sprite;
  descriptions?: PartialDescriptionTemplate;
  getDescription?: (
    stats: ItemStats,
    item: Omit<Item, "carrier" | "amount" | "bound">
  ) => Sprite[][]; // lazily initialized to avoid circular references
};

export const entitySprites: Record<
  Craftable | Reloadable | keyof UnitStats | ClassKey,
  SpriteDefinition
> = {
  // classes
  scout: {
    sprite: scout,
  },
  rogue: {
    sprite: rogue,
    getDescription: () => {
      const { stats } = getClassData("rogue");

      return [
        createText("Fast and strong."),
        stretch(
          createCountable(stats, "hp", "progression"),
          [
            ...createText("+", getStatColor("power")),
            ...createCountable(stats, "power", "display"),
          ],
          frameWidth - 2
        ),
        stretch(
          createCountable(stats, "mp", "progression"),
          [
            ...createText("+", getStatColor("haste")),
            ...createCountable(stats, "haste", "display"),
          ],
          frameWidth - 2
        ),
      ];
    },
  },
  mage: {
    sprite: mage,
    getDescription: () => {
      const { stats } = getClassData("mage");

      return [
        createText("Powerful spells."),
        stretch(
          createCountable(stats, "hp", "progression"),
          [
            ...createText("+", getStatColor("wisdom")),
            ...createCountable(stats, "wisdom", "display"),
          ],
          frameWidth - 2
        ),
        stretch(
          createCountable(stats, "mp", "progression"),
          [
            ...createText("+", getStatColor("vision")),
            ...createCountable(stats, "vision", "display"),
          ],
          frameWidth - 2
        ),
      ];
    },
  },
  knight: {
    sprite: knight,
    getDescription: () => {
      const { stats } = getClassData("knight");

      return [
        createText("Survives a lot."),
        stretch(
          createCountable(stats, "hp", "progression"),
          [
            ...createText("+", getStatColor("armor")),
            ...createCountable(stats, "armor", "display"),
          ],
          frameWidth - 2
        ),
        stretch(
          createCountable(stats, "mp", "progression"),
          [
            ...createText("+", getStatColor("resist")),
            ...createCountable(stats, "resist", "display"),
          ],
          frameWidth - 2
        ),
      ];
    },
  },
  "???": {
    sprite: alien,
    getDescription: () => {
      const { stats } = getClassData("???");

      return [
        createText("??¿ ?¿¿?¿ ¿? ??"),
        stretch(
          createCountable(stats, "hp", "progression"),
          [
            ...createText("+", getStatColor("damp")),
            ...createCountable(stats, "damp", "display"),
          ],
          frameWidth - 2
        ),
        stretch(
          createCountable(stats, "spike", "display"),
          [
            ...createText("+", getStatColor("thaw")),
            ...createCountable(stats, "thaw", "display"),
          ],
          frameWidth - 2
        ),
      ];
    },
  },

  // stackable
  coin: {
    sprite: coin,
    display: minCountable(coin),
    getDescription: () => [
      createText("The currency to"),
      createText("buy items. Drops"),
      [
        ...createText("from "),
        getUnitSprite("prism"),
        getUnitSprite("goldEye"),
        getUnitSprite("diamondOrb"),
        getUnitSprite("banditKnight"),
        ...createText("Enemies", colors.maroon),
        ...createText("."),
      ],
    ],
  },
  stick: {
    sprite: stick,
    display: minCountable(stick),
    getDescription: () => [
      createText("Branch which fell"),
      [
        ...createText("from a "),
        tree1,
        tree2,
        ...createText("Tree", colors.grey),
        ...createText("."),
      ],
      [
        ...createText("Craft into "),
        ...createItemName({ stackable: "resource", material: "wood" }),
        ...createText("."),
      ],
    ],
  },
  plank: {
    sprite: plank,
    getDescription: () => [
      createText("Sturdy board made"),
      [
        ...createText("from "),
        ...createItemName({ stackable: "resource", material: "wood" }),
        ...createText("."),
      ],
    ],
  },
  ore: {
    sprite: oreDrop,
    resource: ore,
    display: minCountable(oreDrop),
    getDescription: () => [
      createText("Traces of metal"),
      [
        ...createText("found in a "),
        oreDisplay,
        ...createText("Rock", colors.grey),
        ...createText("."),
      ],
      [
        ...createText("Craft into "),
        ...createItemName({ stackable: "resource", material: "iron" }),
        ...createText("."),
      ],
    ],
  },
  berry: {
    sprite: berryDrop,
    resource: berry,
    display: minCountable(berryDrop),
    getDescription: () => [
      createText("Tasty berry found"),
      [
        ...createText("on a "),
        maxCountable(berry),
        ...createText("Bush", colors.grey),
        ...createText("."),
      ],
      [
        ...createText("Crafts to "),
        ...createItemName({ stackable: "fruit" }),
        ...createText("."),
      ],
    ],
  },
  flower: {
    sprite: flowerDrop,
    resource: flower,
    display: minCountable(flowerDrop),
    getDescription: () => [
      createText("Beautiful flower"),
      [
        ...createText("from the "),
        maxCountable(flower),
        ...createText("Grass", colors.grey),
        ...createText("."),
      ],
      [
        ...createText("Craft into "),
        ...createItemName({ stackable: "herb" }),
        ...createText("."),
      ],
    ],
  },
  leaf: {
    sprite: leaf,
    display: minCountable(leaf),
    getDescription: () => [
      createText("A green leaf from"),
      [
        ...createText("a "),
        hedge1,
        hedge2,
        ...createText("Hedge", colors.grey),
        ...createText("."),
      ],
      [
        ...createText("Craft into "),
        ...createItemName({ stackable: "seed" }),
        ...createText("."),
      ],
    ],
  },
  apple: {
    sprite: appleDrop,
    resource: apple,
    getDescription: (stats) => [
      createText("Crisp apple from"),
      [
        ...createText("a "),
        minCountable(apple),
        ...createText("Tree", colors.grey),
        ...createText("."),
      ],
      createCountable(stats, "hp", "display"),
    ],
  },
  shroom: {
    sprite: shroom,
    getDescription: (stats) => [
      createText("A savoury shroom"),
      createText("from the forest."),
      createCountable(stats, "mp", "display"),
    ],
  },
  banana: {
    sprite: bananaDrop,
    resource: banana,
    getDescription: (stats) => [
      createText("Ripe banana from"),
      [
        ...createText("a "),
        minCountable(banana),
        ...createText("Palm", colors.grey),
        ...createText("."),
      ],
      createCountable(stats, "hp", "display"),
    ],
  },
  coconut: {
    sprite: coconutDrop,
    resource: coconut,
    getDescription: (stats) => [
      createText("A tender coconut"),
      [
        ...createText("from a "),
        minCountable(coconut),
        ...createText("Palm", colors.grey),
        ...createText("."),
      ],
      createCountable(stats, "mp", "display"),
    ],
  },
  gem: {
    sprite: gem,
    getDescription: () => [
      createText("A valuable gem"),
      [
        ...createText("from a "),
        rock2,
        ...createText("Stone", colors.grey),
        ...createText("."),
      ],
    ],
  },
  crystal: {
    sprite: crystal,
    getDescription: () => [
      createText("A sparkly crystal"),
      [
        ...createText("from a "),
        rock1,
        ...createText("Stone", colors.grey),
        ...createText("."),
      ],
    ],
  },
  herb: {
    sprite: herb,
    getDescription: (stats) => [
      [...createItemName({ stackable: "flower" }), ...createText(" extract.")],
      [
        ...createText("Base for "),
        ...createItemName({
          consume: "potion",
          material: "iron",
          stat: "mp",
        }),
        ...createText("."),
      ],
      createCountable(stats, "mp", "display"),
    ],
  },
  fruit: {
    sprite: fruit,
    getDescription: (stats) => [
      [
        ...createText("Made from "),
        ...createItemName({ stackable: "berry" }),
        ...createText("."),
      ],
      [
        ...createText("Base for "),
        ...createItemName({
          consume: "potion",
          material: "iron",
          stat: "hp",
        }),
        ...createText("."),
      ],
      createCountable(stats, "hp", "display"),
    ],
  },
  seed: {
    sprite: seed,
    getDescription: (stats) => [
      createText("About to sprout."),
      [
        ...createText("Made from "),
        ...createItemName({ stackable: "leaf" }),
        ...createText("."),
      ],
      createCountable(stats, "xp", "display"),
    ],
  },
  ingot: {
    sprite: ingot,
    getDescription: () => [
      createText("Valuable bar made"),
      [
        ...createText("from "),
        ...createItemName({
          stackable: "resource",
          material: "gold",
        }),
        ...createText(" worth"),
      ],
      createItemText({
        amount: 1000,
        stackable: "coin",
      }),
    ],
  },
  nugget: {
    sprite: nugget,
    getDescription: () => [
      createText("A small clump of"),
      createText("raw gold worth"),
      [
        ...createItemText({
          amount: 10,
          stackable: "coin",
        }),
        ...createText("."),
      ],
    ],
  },
  worm: {
    sprite: worm,
    getDescription: () => [
      createText("A tasty bait used"),
      [
        ...createText("for "),
        fishing,
        ...createText("Fishing", colors.green),
        ...createText("."),
      ],
    ],
  },
  salmon: {
    sprite: salmon,
    getDescription: (stats) => [
      createText("A delicious fish"),
      createText("with red meat."),
      createCountable(stats, "hp", "display"),
    ],
  },
  tuna: {
    sprite: tuna,
    getDescription: (stats) => [
      createText("A large fish with"),
      createText("dark red meat."),
      createCountable(stats, "hp", "display"),
    ],
  },
  pike: {
    sprite: pike,
    getDescription: (stats) => [
      createText("A fierce fish"),
      createText("with white meat."),
      createCountable(stats, "mp", "display"),
    ],
  },
  cod: {
    sprite: cod,
    getDescription: (stats) => [
      createText("A mild fish with"),
      createText("white flaky meat."),
      createCountable(stats, "mp", "display"),
    ],
  },
  algae: {
    sprite: algae,
    getDescription: (stats) => [
      createText("Slimy green sea"),
      createText("weed from oceans."),
      createCountable(stats, "xp", "display"),
    ],
  },
  eel: {
    sprite: eel,
    resource: swimmingEel,
    getDescription: (stats) => [
      createText("A slithering fish"),
      createText("with smooth skin."),
      createCountable(stats, "xp", "display"),
    ],
  },
  pearl: {
    sprite: pearl,
    getDescription: () => [
      createText("An exceptionally"),
      createText("rare creation of"),
      createText("an oyster."),
    ],
  },
  seastar: {
    sprite: seastar,
    getDescription: () => [
      createText("A colorful star-"),
      createText("shaped creature."),
      createText("Not edible."),
    ],
  },
  arrow: {
    sprite: arrow,
    getDescription: () => [
      createText("To be used with a"),
      [
        ...createItemName({
          material: "wood",
          skill: "bow",
        }),
        ...createText(" for a long-"),
      ],
      createText("range attack."),
    ],
  },
  bomb: { sprite: bombActive },
  charge: {
    sprite: charge,
    getDescription: () => [
      createText("Used for skills."),
      createText("Drops on hitting"),
      [
        ...createText("with a "),
        ...createItemName({
          weapon: "sword",
          material: "wood",
        }),
        ...createText("."),
      ],
    ],
  },
  golem: {
    sprite: golemHead,
    getDescription: () => [
      createText("Head of a slain"),
      [...createUnitName("golem"), ...createText(". Might be")],
      createText("worth something."),
    ],
  },
  letter: {
    sprite: letter,
    getDescription: () => [
      createText("A beautifully"),
      createText("written note for"),
      createText("someone."),
    ],
  },
  schema: {
    sprite: schema,
    getDescription: () => [
      createText("Detailed drawing"),
      createText("how to build"),
      createText("something."),
    ],
  },

  // stats
  level: {
    sprite: level,
    getDescription: () => [
      createText("Gain levels by"),
      [
        ...createText("collecting "),
        xp,
        ...createText("XP", colors.lime),
        ...createText("."),
      ],
    ],
  },
  hp: { sprite: heart },
  maxHp: {
    sprite: heartUp,
    getDescription: () => [
      createText("Total amount of"),
      [heart, ...createText("HP", colors.red), ...createText(" available.")],
    ],
  },
  maxHpCap: { sprite: heartUp },
  mp: { sprite: mana },
  maxMp: {
    sprite: manaUp,
    getDescription: () => [
      createText("Increases your"),
      [
        ...createText("maximum "),
        mana,
        ...createText("MP", colors.blue),
        ...createText(" to"),
      ],
      createText("cast spells."),
    ],
  },
  maxMpCap: { sprite: manaUp },
  xp: { sprite: xp },
  maxXp: { sprite: xp },
  maxXpCap: { sprite: xp },
  power: {
    sprite: power,
    getDescription: () => [
      createText("Additional damage"),
      createText("inflicted with"),
      [
        minCountable(meleeHit),
        ...createText("Melee", colors.red),
        ...createText(" attacks."),
      ],
    ],
  },
  wisdom: {
    sprite: wisdom,
    getDescription: () => [
      createText("Extra healing"),
      createText("or damage for own"),
      [
        minCountable(magicHit),
        ...createText("Magic", colors.fuchsia),
        ...createText(" spells."),
      ],
    ],
  },
  armor: {
    sprite: armor,
    getDescription: () => [
      createText("Reduces incoming"),
      [
        minCountable(meleeHit),
        ...createText("Melee", colors.red),
        ...createText(" damage."),
      ],
    ],
  },
  resist: {
    sprite: resist,
    getDescription: () => [
      createText("Receive less"),
      createText("damage from enemy"),
      [
        minCountable(magicHit),
        ...createText("Magic", colors.fuchsia),
        ...createText(" attacks."),
      ],
    ],
  },
  haste: {
    sprite: haste,
    getDescription: () => [
      createText("Movement speed"),
      createText("and attack speed."),
    ],
  },
  vision: {
    sprite: vision,
    getDescription: () => [
      createText("Range of vision"),
      [
        ...createText("to reveal "),
        fog,
        ...createText("Fog", colors.grey),
        ...createText("."),
      ],
    ],
  },
  damp: {
    sprite: damp,
    getDescription: () => [
      createText("Reduces total"),
      [
        maxCountable(fire),
        ...createText("Burn", colors.yellow),
        ...createText(" damage."),
      ],
    ],
  },
  thaw: {
    sprite: thaw,
    getDescription: () => [
      createText("Shorter duration"),
      [
        ...createText("of "),
        minCountable(freeze),
        ...createText("Freeze", colors.aqua),
        ...createText("."),
      ],
    ],
  },
  spike: {
    sprite: spike,
    getDescription: () => [
      createText("Deals damage to"),
      createText("the attacker on"),
      [
        minCountable(meleeHit),
        ...createText("Melee", colors.red),
        ...createText(" hits."),
      ],
    ],
  },
};

type SpriteTemplateDefinition = {
  sprite: PartialSpriteTemplate;
  resource?: PartialSpriteTemplate;
  display?: PartialSpriteTemplate;
  descriptions?: PartialDescriptionTemplate;
  getDescription?: (
    stats: ItemStats,
    item: Omit<Item, "carrier" | "amount" | "bound">
  ) => Sprite[][]; // lazily initialized to avoid circular references
};

export const materialSprites: Partial<
  Record<
    | Accessory
    | Weapon
    | Offhand
    | Spell
    | Skill
    | Tool
    | Consumable
    | ResourceItem
    | Materialized,
    SpriteTemplateDefinition
  >
> = {
  sword: {
    sprite: sword,
    getDescription: (stats, item) => {
      if (item.material === "wood") {
        return [
          createText("Simple sword made"),
          [
            ...createText("out of a "),
            ...createItemName({ stackable: "stick" }),
            ...createText("."),
          ],
          [
            ...createText(stats.melee.toString(), colors.red),
            minCountable(meleeHit),
            ...createText("Melee", colors.red),
          ],
        ];
      }

      return [
        createText(
          `${
            { iron: "Heavy", gold: "Shiny", diamond: "Sharp", ruby: "Mighty" }[
              item.material!
            ]
          } sword made`
        ),
        [
          ...createText("of "),
          ...createItemName({ stackable: "resource", material: item.material }),
          ...createText("."),
        ],
        [
          ...createText(stats.melee.toString(), colors.red),
          minCountable(meleeHit),
          ...createText("Melee", colors.red),
        ],
      ];
    },
  },
  spear: {
    sprite: spear,
    getDescription: (stats, item) => {
      if (item.material === "wood") {
        return [
          createText("A long spear made"),
          [
            ...createText("out of a "),
            ...createItemName({ stackable: "stick" }),
            ...createText("."),
          ],
          stretch(
            [
              ...createText(stats.melee.toString(), colors.red),
              minCountable(meleeHit),
              ...createText("Melee", colors.red),
            ],
            [
              ...createText("-1", colors.silver),
              getBlockedSlot(skillSlot),
              ...createText("Slot", colors.silver),
            ],
            frameWidth - 2
          ),
        ];
      }

      return [
        createText(
          `${
            { iron: "Heavy", gold: "Shiny", diamond: "Sharp", ruby: "Mighty" }[
              item.material!
            ]
          } spear made`
        ),
        [
          ...createText("of "),
          ...createItemName({ stackable: "resource", material: item.material }),
          ...createText("."),
        ],
        stretch(
          [
            ...createText(stats.melee.toString(), colors.red),
            minCountable(meleeHit),
            ...createText("Melee", colors.red),
          ],
          [
            ...createText("-1", colors.silver),
            getBlockedSlot(skillSlot),
            ...createText("Slot", colors.silver),
          ],
          frameWidth - 2
        ),
      ];
    },
  },
  wand: {
    sprite: wand,
    getDescription: (stats, item) => {
      if (item.material === "wood") {
        return [
          createText("A short wand made"),
          [
            ...createText("out of a "),
            ...createItemName({ stackable: "stick" }),
            ...createText("."),
          ],
          stretch(
            [
              ...createText(stats.magic.toString(), colors.fuchsia),
              minCountable(magicHit),
              ...createText("Magic", colors.fuchsia),
            ],
            [
              ...createText("-1", colors.silver),
              getBlockedSlot(skillSlot),
              ...createText("Slot", colors.silver),
            ],
            frameWidth - 2
          ),
        ];
      }

      return [
        createText(
          `${
            { iron: "Heavy", gold: "Shiny", diamond: "Sharp", ruby: "Mighty" }[
              item.material!
            ]
          } wand made`
        ),
        [
          ...createText("of "),
          ...createItemName({ stackable: "resource", material: item.material }),
          ...createText("."),
        ],
        stretch(
          [
            ...createText(stats.magic.toString(), colors.fuchsia),
            minCountable(magicHit),
            ...createText("Magic", colors.fuchsia),
          ],
          [
            ...createText("-1", colors.silver),
            getBlockedSlot(skillSlot),
            ...createText("Slot", colors.silver),
          ],
          frameWidth - 2
        ),
      ];
    },
  },
  shield: {
    sprite: shield,
    getDescription: (stats, item) => [
      createText(
        `${
          {
            wood: "Simple",
            iron: "Heavy",
            gold: "Shiny",
            diamond: "Rigid",
            ruby: "Mighty",
          }[item.material!]
        } shield`
      ),
      [
        ...createText("made of "),
        ...createItemName({ stackable: "resource", material: item.material }),
        ...createText("."),
      ],
      createCountable(stats, "armor", "display"),
    ],
  },
  ring: {
    sprite: ring,
    getDescription: (stats, item) => [
      createText(
        `A ${
          {
            wood: "fragile",
            iron: "crude",
            gold: "shiny",
            diamond: "pure",
            ruby: "mighty",
          }[item.material!]
        } ring`
      ),
      createText("with arcane aura."),
      brightenSprites(createCountable(stats, "maxMp", "display")),
    ],
  },
  amulet: {
    sprite: amulet,
    getDescription: (stats, item) => [
      createText("A protective and"),
      createText(
        `${
          {
            wood: "delicate",
            iron: "sturdy",
            gold: "shiny",
            diamond: "radiant",
            ruby: "mighty",
          }[item.material!]
        } amulet.`
      ),
      brightenSprites(createCountable(stats, "maxHp", "display")),
    ],
  },

  // tools
  axe: {
    sprite: axe,
    getDescription: (stats) => [
      createText("Stand in front of"),
      [
        ...createText("a "),
        tree1,
        tree2,
        ...createText("Tree", colors.grey),
        ...createText(" to chop."),
      ],
      stretch(
        createCountable(stats, "logging", "display"),
        createCountable(stats, "range", "display"),
        frameWidth - 2
      ),
    ],
  },
  hook: {
    sprite: hook,
    getDescription: (stats) => [
      [
        ...createText("Catch "),
        salmon,
        cod,
        ...createText("Fish", colors.grey),
        ...createText(" from"),
      ],
      [
        ...createText("the "),
        maxCountable(bubble),
        ...createText("Water", colors.blue),
        ...createText("."),
      ],
      stretch(
        createCountable(stats, "fishing", "display"),
        createCountable(stats, "range", "display"),
        frameWidth - 2
      ),
    ],
  },
  pickaxe: {
    sprite: pickaxe,
    getDescription: (stats) => [
      createText("Stand in front of"),
      [
        ...createText("a "),
        wall,
        ...createText("Rock", colors.grey),
        ...createText(" to mine."),
      ],
      stretch(
        createCountable(stats, "mining", "display"),
        createCountable(stats, "range", "display"),
        frameWidth - 2
      ),
    ],
  },

  // slots
  compass: {
    sprite: compass,
    getDescription: () => [
      createText("Shows the way"),
      createText("back to your"),
      createText("spawn point."),
    ],
  },
  map: {
    sprite: map,
    getDescription: () => [
      createText("View the area you"),
      createText("revealed so far."),
    ],
  },
  torch: {
    sprite: torch,
    getDescription: (stats) => [
      createText("Glows bright and"),
      createText("keeps you warm."),
      [...createCountable(stats, "vision", "display")],
    ],
  },
  boots: {
    sprite: boots,
    getDescription: (stats, item) => [
      createText(
        `${
          {
            wood: "Simple",
            iron: "Heavy",
            gold: "Shiny",
            diamond: "Rigid",
            ruby: "Mighty",
          }[item.material!]
        } but soft`
      ),
      createText("boots."),
      [...createCountable(stats, "haste", "display")],
    ],
  },

  // primary spells
  wave: {
    sprite: waveSpell,
    getDescription: (stats) => [
      createText("Use to cast a"),
      createText("wave of magic."),
      stretch(
        [
          ...createText(stats.magic.toString(), colors.fuchsia),
          minCountable(magicHit),
          ...createText("Magic", colors.fuchsia),
        ],
        createCountable({ mp: -1 }, "mp", "display"),
        frameWidth - 2
      ),
    ],
  },
  beam: {
    sprite: beamSpell,
    getDescription: (stats) => [
      createText("Shoots multiple"),
      createText("bolts in a beam."),
      stretch(
        [
          ...createText(stats.magic.toString(), colors.fuchsia),
          minCountable(magicHit),
          ...createText("Magic", colors.fuchsia),
        ],
        createCountable({ mp: -1 }, "mp", "display"),
        frameWidth - 2
      ),
    ],
  },
  trap: {
    sprite: trapSpell,
    getDescription: (stats) => [
      createText("Damages enemies"),
      createText("walking over it."),
      stretch(
        [
          ...createText(stats.magic.toString(), colors.fuchsia),
          minCountable(magicHit),
          ...createText("Magic", colors.fuchsia),
        ],
        createCountable({ mp: -1 }, "mp", "display"),
        frameWidth - 2
      ),
    ],
  },
  dash: {
    sprite: dashSpell,
    getDescription: (stats) => [
      createText("Leap forward and"),
      createText("pierce enemies."),
      stretch(
        [
          ...createText(stats.magic.toString(), colors.fuchsia),
          minCountable(magicHit),
          ...createText("Magic", colors.fuchsia),
        ],
        createCountable({ mp: -1 }, "mp", "display"),
        frameWidth - 2
      ),
    ],
  },

  // secondary skills
  slash: {
    sprite: slash,

    getDescription: (stats) => [
      createText("Spins sword with"),
      createText("extra damage."),
      stretch(
        [
          ...createText(stats.melee.toString(), colors.red),
          minCountable(meleeHit),
          ...createText("Melee", colors.red),
        ],
        [
          ...createText("-1", colors.grey),
          ...createItemName({ stackable: "charge" }),
        ],
        frameWidth - 2
      ),
    ],
  },
  bow: {
    sprite: bow,

    getDescription: (stats) => [
      createText("Shoots a ranged"),
      createText("projectile."),
      stretch(
        [
          ...createText(stats.melee.toString(), colors.red),
          minCountable(meleeHit),
          ...createText("Melee", colors.red),
        ],
        [
          ...createText("-1", colors.grey),
          ...createItemName({ stackable: "arrow" }),
        ],
        frameWidth - 2
      ),
    ],
  },
  zap: {
    sprite: zap,
    getDescription: (stats) => [
      [
        ...createText("Strikes "),
        ...createText(stats.range.toString()),
        times,
        ...createText(" times"),
      ],
      createText("to near enemies."),
      stretch(
        [
          ...createText(stats.magic.toString(), colors.fuchsia),
          minCountable(magicHit),
          ...createText("Magic", colors.fuchsia),
        ],
        [
          ...createText("-1", colors.grey),
          ...createItemName({ stackable: "charge" }),
        ],
        frameWidth - 2
      ),
    ],
  },
  block: {
    sprite: block,
    getDescription: (stats) => [
      [
        ...createText("Defends "),
        minCountable(meleeHit),
        ...createText("Melee", colors.red),
        ...createText(" or"),
      ],
      [
        minCountable(magicHit),
        ...createText("Magic", colors.fuchsia),
        ...createText(" attacks."),
      ],
      stretch(
        [
          ...createText(stats.absorb.toString(), colors.olive),
          minCountable(absorb),
          ...createText("Absorb", colors.olive),
        ],
        [
          ...createText("-1", colors.grey),
          ...createItemName({ stackable: "charge" }),
        ],
        frameWidth - 2
      ),
    ],
  },
  totem: {
    sprite: totem,
    getDescription: (itemStats) => [
      [
        ...createText("Grants "),
        ...createText("+1", colors.lime),
        ...createText(" of all"),
      ],
      [
        stats,
        ...createText("Stats", colors.lime),
        ...createText(" in "),
        aura,
        ...createText("Aura", colors.silver),
        ...createText("."),
      ],
      stretch(
        createCountable(itemStats, "duration", "display"),
        [
          ...createText("-1", colors.grey),
          ...createItemName({ stackable: "charge" }),
        ],
        frameWidth - 2
      ),
    ],
  },

  // resource
  resource: {
    sprite: {
      wood: { default: wood },
      iron: { default: iron },
      gold: { default: gold },
      diamond: { default: diamond },
      ruby: { default: ruby },
    },
    getDescription: (_, item) => {
      if (item.material === "wood") {
        return [
          [
            ...createText("Made from "),
            ...createItemName({ stackable: "stick" }),
            ...createText("."),
          ],
          createText("Used to forge"),
          [...createText("wooden", colors.maroon), ...createText(" gear.")],
        ];
      } else if (item.material === "iron") {
        return [
          [
            ...createText("Made from "),
            ...createItemName({ stackable: "ore" }),
            ...createText("."),
          ],
          createText("Used to forge"),
          [...createText("iron", colors.grey), ...createText(" gear.")],
        ];
      }
      return [
        [
          ...createText("Found at a "),
          ...createItemName({ materialized: "mine", material: item.material }),
          ...createText("."),
        ],
        createText("Used to forge"),
        [
          ...createText(
            { gold: "golden", diamond: "diamond", ruby: "ruby" }[
              item.material!
            ],
            colorPalettes[item.material!].primary
          ),
          ...createText(" gear."),
        ],
      ];
    },
  },

  // consumable
  key: {
    sprite: key,
    getDescription: (_, item) => [
      [
        ...createText("Opens a "),
        ...createItemName({ materialized: "lock", material: item.material }),
        ...createText("."),
      ],
      createText("Disappears after"),
      createText("use."),
    ],
  },

  // materialized
  lock: {
    sprite: lock,
  },
  door: {
    sprite: doorOpen,
    resource: doorClosed,
    display: doorClosed,
  },
  port: {
    sprite: portOpen,
    resource: portClosed,
    display: portClosed,
  },
  entry: {
    sprite: entryClosed,
    display: entryClosedDisplay,
  },
  gate: {
    sprite: { wood: { default: fenceDoor } },
  },
  mine: {
    sprite: {
      iron: { default: ironMine },
      gold: { default: goldMine },
    },
    display: {
      iron: { default: ironMineDisplay },
      gold: { default: goldMineDisplay },
    },
  },
};

export const elementSprites: Partial<
  Record<
    | "ring"
    | "amulet"
    | Weapon
    | Offhand
    | Spell
    | Skill
    | Consumable
    | ResourceItem
    | Materialized,
    SpriteTemplateDefinition
  >
> = {
  // gear
  sword: {
    sprite: sword,
    getDescription: (stats, item) => [
      [
        ...createText("A "),
        ...createItemName(
          item.material === "wood"
            ? { stackable: "stick" }
            : { stackable: "resource", material: item.material }
        ),
        ...createText(" sword"),
      ],
      [
        ...createText("with a "),
        ...createItemName({
          stackable: "resource",
          material: "wood",
          element: item.element,
        }),
        ...createText("."),
      ],
      stretch(
        [
          ...createText(stats.melee.toString(), colors.red),
          minCountable(meleeHit),
          ...createText("Melee", colors.red),
        ],
        createCountable(
          stats,
          (
            {
              air: "power",
              fire: "burn",
              water: "freeze",
              earth: "drain",
            } as const
          )[item.element!],
          "display"
        ),
        frameWidth - 2
      ),
    ],
  },
  spear: {
    sprite: spear,
    getDescription: (stats, item) => [
      [
        ...createText("A "),
        ...createItemName({
          stackable: "resource",
          material: "wood",
          element: item.element,
        }),
        ...createText(" spear."),
      ],
      stretch(
        [
          ...createText(stats.melee.toString(), colors.red),
          minCountable(meleeHit),
          ...createText("Melee", colors.red),
        ],
        createCountable(
          stats,
          (
            {
              air: "power",
              fire: "burn",
              water: "freeze",
              earth: "drain",
            } as const
          )[item.element!],
          "display"
        ),
        frameWidth - 2
      ),
      [
        ...createText("-1", colors.silver),
        getBlockedSlot(skillSlot),
        ...createText("Slot", colors.silver),
      ],
    ],
  },
  wand: {
    sprite: wand,
    getDescription: (stats, item) => [
      [
        ...createText("A "),
        ...createItemName({
          stackable: "resource",
          material: "wood",
          element: item.element,
        }),
        ...createText(" wand."),
      ],
      stretch(
        [
          ...createText(stats.magic.toString(), colors.fuchsia),
          minCountable(magicHit),
          ...createText("Magic", colors.fuchsia),
        ],
        createCountable(
          stats,
          (
            {
              air: "wisdom",
              fire: "burn",
              water: "freeze",
              earth: "drain",
            } as const
          )[item.element!],
          "display"
        ),
        frameWidth - 2
      ),
      [
        ...createText("-1", colors.silver),
        getBlockedSlot(skillSlot),
        ...createText("Slot", colors.silver),
      ],
    ],
  },
  shield: {
    sprite: shield,
    getDescription: (stats, item) => [
      [
        ...createText("A "),
        ...createItemName({
          stackable: "resource",
          material: "wood",
          element: item.element,
        }),
        ...createText(" shield"),
      ],
      [
        ...createText("made of "),
        ...createItemName({ stackable: "resource", material: item.material }),
        ...createText("."),
      ],
      stretch(
        createCountable(stats, "armor", "display"),
        createCountable(
          stats,
          (
            {
              air: "resist",
              fire: "damp",
              water: "thaw",
              earth: "spike",
            } as const
          )[item.element!],
          "display"
        ),
        frameWidth - 2
      ),
    ],
  },
  ring: {
    sprite: ring,
    getDescription: (stats, item) => [
      createText(
        `A ${
          {
            wood: "fragile",
            iron: "crude",
            gold: "shiny",
            diamond: "pure",
            ruby: "mighty",
          }[item.material!]
        } ring`
      ),
      [
        ...createText("with a "),
        ...createItemName({
          stackable: "resource",
          material: "wood",
          element: item.element,
        }),
        ...createText("."),
      ],
      stretch(
        brightenSprites(createCountable(stats, "maxMp", "display")),
        createCountable(
          stats,
          (
            {
              air: "haste",
              fire: "power",
              water: "wisdom",
              earth: "spike",
            } as const
          )[item.element!],
          "display"
        ),
        frameWidth - 2
      ),
    ],
  },
  amulet: {
    sprite: amulet,
    getDescription: (stats, item) => [
      createText(
        `${
          {
            wood: "Delicate",
            iron: "Sturdy",
            gold: "Shiny",
            diamond: "Radiant",
            ruby: "Mighty",
          }[item.material!]
        } amulet`
      ),
      [
        ...createText("with a "),
        ...createItemName({
          stackable: "resource",
          material: "wood",
          element: item.element,
        }),
        ...createText("."),
      ],
      stretch(
        brightenSprites(createCountable(stats, "maxHp", "display")),
        createCountable(
          stats,
          (
            {
              air: "armor",
              fire: "damp",
              water: "thaw",
              earth: "resist",
            } as const
          )[item.element!],
          "display"
        ),
        frameWidth - 2
      ),
    ],
  },

  // spells
  wave: {
    sprite: waveSpell,
    getDescription: (stats, item) => [
      createText("A wave of magic."),
      stretch(
        [
          ...createText(stats.magic.toString(), colors.fuchsia),
          minCountable(magicHit),
          ...createText("Magic", colors.fuchsia),
        ],
        createCountable({ mp: -1 }, "mp", "display"),
        frameWidth - 2
      ),
      createCountable(
        stats,
        (
          {
            air: "wisdom",
            fire: "burn",
            water: "freeze",
            earth: "drain",
          } as const
        )[item.element!],
        "display"
      ),
    ],
  },
  beam: {
    sprite: beamSpell,
    getDescription: (stats, item) => [
      createText("A beam of bolts."),
      stretch(
        [
          ...createText(stats.magic.toString(), colors.fuchsia),
          minCountable(magicHit),
          ...createText("Magic", colors.fuchsia),
        ],
        createCountable({ mp: -1 }, "mp", "display"),
        frameWidth - 2
      ),
      createCountable(
        stats,
        (
          {
            air: "wisdom",
            fire: "burn",
            water: "freeze",
            earth: "heal",
          } as const
        )[item.element!],
        "display"
      ),
    ],
  },
  trap: {
    sprite: trapSpell,
    getDescription: (stats, item) => [
      createText("Triggers effects."),
      stretch(
        [
          ...createText(stats.magic.toString(), colors.fuchsia),
          minCountable(magicHit),
          ...createText("Magic", colors.fuchsia),
        ],
        createCountable({ mp: -1 }, "mp", "display"),
        frameWidth - 2
      ),
      createCountable(
        stats,
        (
          {
            air: "wisdom",
            fire: "burn",
            water: "freeze",
            earth: "heal",
          } as const
        )[item.element!],
        "display"
      ),
    ],
  },
  dash: {
    sprite: dashSpell,
    getDescription: (stats, item) => [
      createText("Pierce forward."),
      stretch(
        [
          ...createText(stats.magic.toString(), colors.fuchsia),
          minCountable(magicHit),
          ...createText("Magic", colors.fuchsia),
        ],
        createCountable({ mp: -1 }, "mp", "display"),
        frameWidth - 2
      ),
      createCountable(
        stats,
        (
          {
            air: "wisdom",
            fire: "burn",
            water: "freeze",
            earth: "drain",
          } as const
        )[item.element!],
        "display"
      ),
    ],
  },

  resource: {
    sprite: spirit,
    getDescription: (_, item) => {
      if (item.element === "air") {
        return [
          createText("Elemental spirit"),
          createText("used for forging."),
        ];
      }

      return [
        createText("Elemental spirit"),
        createText("used for forging"),
        [
          ...createText("with "),
          ...createText(item.element!, colorPalettes[item.element!].primary),
          ...createText("."),
        ],
      ];
    },
  },

  // consumable
  key: {
    sprite: key,
    getDescription: (_, item) => [
      [
        ...createText("Opens a "),
        ...createItemName({
          materialized: "lock",
          element: item.element,
        }),
        ...createText("."),
      ],
      createText("Disappears after"),
      createText("use."),
    ],
  },

  // materialized
  lock: {
    sprite: lock,
  },
  door: {
    sprite: doorOpen,
    resource: doorClosed,
    display: doorClosed,
  },
  port: {
    sprite: portOpen,
    resource: portClosed,
    display: portClosed,
  },
  entry: {
    sprite: entryClosed,
    display: entryClosedDisplay,
  },
};

type StatSprite = Partial<
  Record<Material, Partial<Record<keyof UnitStats, Sprite>>>
>;
type SpriteStatDefinition = {
  sprite: StatSprite;
  resource?: StatSprite;
  display?: StatSprite;
  descriptions?: PartialDescriptionTemplate;
  getDescription?: (
    stats: ItemStats,
    item: Omit<Item, "carrier" | "amount" | "bound">
  ) => Sprite[][]; // lazily initialized to avoid circular references
};
export const statSprites: Partial<Record<Consumable, SpriteStatDefinition>> = {
  // consumables
  potion: {
    sprite: {
      wood: {
        hp: flask.wood.fire,
        mp: flask.wood.water,
      },
      iron: {
        hp: bottle.wood.fire,
        mp: bottle.wood.water,
      },
      gold: {
        hp: potion.wood.fire,
        mp: potion.wood.water,
      },
    },
    getDescription: (stats, item) => {
      if (item.stat === "hp") {
        return [
          createText("Automatic healing"),
          createText("on low health."),
          stretch(
            createCountable(stats, "retrigger", "display"),
            createCountable(stats, "hp", "display"),
            frameWidth - 2
          ),
        ];
      }
      if (item.stat === "mp") {
        return [
          createText("Refills low mana"),
          createText("automatically."),
          stretch(
            createCountable(stats, "retrigger", "display"),
            createCountable(stats, "mp", "display"),
            frameWidth - 2
          ),
        ];
      }
      return [];
    },
  },
};

export const getItemConfig = (
  item: Omit<Item, "amount" | "carrier" | "bound"> & {
    materialized?: Materialized;
  }
): SpriteDefinition | undefined => {
  const material = item.material;
  const element = item.element;
  const stat = item.stat;

  if (!material && !element) {
    const lookup = item.stackable || item.stat;

    if (!lookup || lookup === "resource") return;

    return entitySprites[lookup];
  }

  if (material && stat) {
    let lookup = item.consume;
    const definition = lookup && statSprites[lookup];

    if (!definition) return;

    const resource = definition.resource?.[material]?.[stat];
    const display = definition.display?.[material]?.[stat];

    return {
      ...definition,
      sprite: definition.sprite[material]?.[stat] || missing,
      resource,
      display,
    };
  }

  if (material && !element) {
    let lookup =
      item.weapon ||
      item.offhand ||
      item.spell ||
      item.skill ||
      item.tool ||
      item.accessory ||
      item.consume ||
      item.materialized ||
      (item.stackable === "resource" ? item.stackable : undefined);
    const definition = lookup && materialSprites[lookup];

    if (!definition) return;

    const resource = definition.resource?.[material]?.default;
    const display = definition.display?.[material]?.default;

    return {
      ...definition,
      sprite: definition.sprite[material]?.default || missing,
      resource,
      display,
    };
  }

  if (element) {
    let lookup =
      item.weapon ||
      item.offhand ||
      item.spell ||
      item.skill ||
      item.consume ||
      item.materialized ||
      (item.stackable === "resource" ? item.stackable : undefined) ||
      (item.accessory === "ring" || item.accessory === "amulet"
        ? item.accessory
        : undefined);
    const definition = lookup && elementSprites[lookup];

    if (!definition) return;

    const resource = definition.resource?.[material || "default"]?.[element];
    const display = definition.display?.[material || "default"]?.[element];

    return {
      ...definition,
      sprite: definition.sprite[material || "default"]?.[element] || missing,
      resource,
      display,
    };
  }
};

export const getItemSprite = (
  item: Omit<Item, "amount" | "carrier" | "bound"> & {
    materialized?: Materialized;
    amount?: number;
  },
  variant?: "resource" | "display",
  orientation?: Orientation,
  amount?: number
) => {
  // allow hiding claws of mobs
  if (item.weapon && (amount ?? item.amount) === 0) return none;

  if (item.stat && !item.material) return getStatSprite(item.stat, variant);

  const itemConfig = getItemConfig(item);

  if (!itemConfig) return missing;

  const sprite = (variant && itemConfig[variant]) || itemConfig.sprite;

  if (!sprite) return missing;

  return {
    ...sprite,
    layers: getFacingLayers(sprite, orientation, amount),
  };
};

export const createItemText = (
  item: Omit<Item, "carrier" | "bound"> & { materialized?: Materialized },

  color = colors.grey
) => {
  const stringified = item.amount.toString();

  return [...createText(stringified, color), ...createItemName(item, color)];
};

export const createItemName = (
  item: Omit<Item, "carrier" | "bound" | "amount"> & {
    materialized?: Materialized;
  },
  color = colors.grey
) => {
  const sprite = getItemSprite(item, "display");

  return [
    sprite,
    ...createText(
      item.materialized
        ? `${item.materialized[0].toUpperCase()}${item.materialized.slice(1)}`
        : sprite.name,
      color
    ),
  ];
};

export const getUnitSprite = (unit: UnitKey) => {
  const unitData = generateUnitData(unit);

  return mergeSprites(
    unitData.backdrop || none,
    ...unitData.equipments
      .filter((equipment) => equipment.offhand === "shield")
      .map((equipment) => getItemSprite(equipment)),
    unitData.sprite,
    ...unitData.equipments
      .filter(
        (equipment) => equipment.amount !== 0 && equipment.weapon === "sword"
      )
      .map((equipment) => getItemSprite(equipment)),
    unitData.faction === "unit"
      ? none
      : unitData.faction === "wild"
      ? hostileBar
      : friendlyBar
  );
};

export const createUnitName = (unit: UnitKey) => {
  const unitData = generateUnitData(unit);
  const sprite = getUnitSprite(unit);

  return [
    sprite,
    ...createText(
      unitData.sprite.name,
      unitData.faction === "wild"
        ? colors.maroon
        : unitData.faction === "unit"
        ? colors.grey
        : colors.green
    ),
  ];
};

export const getEntityDescription = (
  item: Omit<Item, "carrier" | "bound" | "amount">,
  definition: SpriteDefinition
) => {
  const material = item.material || "default";
  const element = item.element || "default";
  const description = definition.descriptions?.[material]?.[element];
  if (description) return description;

  if (definition.getDescription) {
    const consumptionConfig =
      item.material &&
      item.stat &&
      item.consume === "potion" &&
      consumptionConfigs.potion?.[item.material]?.[item.stat];
    const itemConsumption = getItemConsumption({ [ITEM]: item });

    const itemStats = consumptionConfig
      ? {
          ...emptyItemStats,
          [consumptionConfig.countable]: consumptionConfig.amount,
          retrigger: consumptionConfig.cooldown,
        }
      : itemConsumption
      ? {
          ...emptyItemStats,
          [itemConsumption.countable]: itemConsumption.amount,
        }
      : getItemStats(item);

    const descriptions = definition.descriptions || {};
    definition.descriptions = descriptions;
    const materialDescriptions = descriptions[material] || {};
    descriptions[material] = materialDescriptions;

    const newDescription = definition.getDescription(itemStats, item);
    materialDescriptions[element] = newDescription;
    return newDescription;
  }

  return [createText(definition.sprite.name, colors.white, colors.black)];
};

export const getItemDescription = (
  item: Omit<Item, "carrier" | "bound" | "amount">
) => {
  const itemConfig = getItemConfig(item);

  if (!itemConfig) return [[]];

  return getEntityDescription(item, itemConfig);
};
