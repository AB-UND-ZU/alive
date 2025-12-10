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
  popupHeight,
  selectionHeight,
} from "../../components/Entity/utils";
import {
  addBackground,
  createText,
  friendlyBar,
  hostileBar,
  info,
  mergeSprites,
  neutralBar,
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
  beamSpellWood,
  berry,
  berryDrop,
  bombActive,
  bowWood,
  charge,
  coconut,
  coconutDrop,
  coin,
  ironCompass,
  crystal,
  diamond,
  diamondShield,
  diamondSword,
  doorClosedGold,
  doorClosedIron,
  doorClosedWood,
  earthEssence,
  entryClosedIron,
  entryClosedWood,
  fenceDoor,
  fireEssence,
  flower,
  flowerDrop,
  fruit,
  gem,
  getStatSprite,
  gold,
  goldKey,
  goldShield,
  goldSword,
  herb,
  hpPotion,
  hpElixir,
  ingot,
  iron,
  ironKey,
  ironShield,
  ironSword,
  leaf,
  map,
  minCountable,
  mpPotion,
  mpElixir,
  ore,
  oreDrop,
  ruby,
  rubyShield,
  rubySword,
  seed,
  shroom,
  slashWood,
  stick,
  torch,
  waterEssence,
  waveSpellWood,
  wood,
  woodShield,
  woodStick,
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
  entryClosedWoodDisplay,
  entryClosedIronDisplay,
  portal,
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
  woodStickAir,
  woodStickFire,
  fire,
  woodShieldAir,
  woodShieldWater,
  vision,
  resist,
  damp,
  thaw,
  freeze,
  spike,
  magicHit,
  meleeHit,
  range,
  wisdom,
  haste,
  waveSpellWoodAir,
  waveSpellWoodFire,
  waveSpellWoodWater,
  waveSpellWoodEarth,
  heal,
  beamSpellWoodFire,
  beamSpellWoodWater,
  airEssence,
  fog,
  stretch,
  popupSeparatorSelected,
  popupSeparatorInverted,
  popupCenterCrop,
  beamSpellWoodEarth,
  beamSpellWoodAir,
  woodRing,
  woodAmulet,
  woodRingAir,
  woodRingFire,
  woodRingWater,
  woodRingEarth,
  woodAmuletAir,
  woodAmuletFire,
  woodAmuletWater,
  woodAmuletEarth,
  ironRing,
  ironAmulet,
  woodShieldFire,
  woodShieldEarth,
  missing,
  popupActive,
  popupBlocked,
  delay,
  nugget,
  hpBottle,
  mpBottle,
  ironLock,
  goldLock,
  rogue,
  mage,
  knight,
  alien,
  entryClosedGold,
  entryClosedGoldDisplay,
  oreDisplay,
  note,
  woodStickWater,
  woodStickEarth,
  drain,
} from "./sprites";
import { rerenderEntity } from "../../engine/systems/renderer";
import { MOVABLE } from "../../engine/components/movable";
import { REFERENCE } from "../../engine/components/reference";
import {
  Consumable,
  Craftable,
  Element,
  Item,
  Material,
  Materialized,
  Primary,
  Reloadable,
  Resource,
  Secondary,
} from "../../engine/components/item";
import { generateUnitData, UnitKey } from "../balancing/units";
import { Gear, Tools } from "../../engine/components/equippable";
import { getVerticalIndex, popupTitles } from "../../engine/systems/popup";
import { disposeEntity } from "../../engine/systems/map";
import { UnitStats } from "../../engine/components/stats";
import { ClassKey, getClassData } from "../balancing/classes";

export const lootSpeed = 200;
export const decayTime = 300;

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
export const popupTime = frameHeight * popupDelay;

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

export const renderPopup = (
  world: World,
  entity: Entity,
  state: SequenceState<PopupSequence>,
  icon: Sprite = info,
  content: Sprite[][],
  selection?: PopupSelection,
  details?: Sprite[][],
  overscan = 0
) => {
  let updated = false;
  let finished = !entity[POPUP].active;
  const generation = entity[RENDERABLE].generation;
  const popupMiddle = { x: 0, y: (frameHeight + 1) / -2 };
  const initial = !state.args.generation;
  const generationChanged = state.args.generation !== generation;
  const heightChanged = state.args.contentHeight !== content.length;
  const verticalIndex = getVerticalIndex(world, entity);
  const horizontalIndex = entity[POPUP].horizontalIndex;
  const tabs = entity[POPUP].tabs.length;
  const lines = content.length - overscan;
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
  const contentSize =
    ((details ? frameHeight - detailsHeight : frameHeight) - 2) *
    (frameWidth - 2);
  const foldSize = (verticalIndex - scrollIndex) * (frameWidth - 2);
  const settled =
    state.args.contentIndex >= foldSize && state.elapsed > popupTime;
  let renderContent = false;
  let renderTabs = horizontalIndex !== state.args.horizontalIndex;
  let renderDetails = settled;
  let renderSeparator = details && renderTabs;

  // create popup
  if (!state.args.generation) {
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
          offsetY: popupMiddle.y + cornerDelta.y * ((frameHeight - 1) / 2),
          offsetZ: popupHeight,
        },
        [RENDERABLE]: { generation: 1 },
        [SPRITE]: popupCorner,
      });
      state.particles[`popup-${iteration.orientation}-corner`] =
        world.getEntityId(cornerParticle);

      // sides
      const directionLength = Math.abs(
        frameWidth * iteration.direction.x + frameHeight * iteration.direction.y
      );
      const normalLength =
        Math.abs(
          frameWidth * iteration.normal.x + frameHeight * iteration.normal.y
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
              (iteration.direction.y * (directionLength - 1)) / 2,
            offsetZ: popupHeight,
          },
          [RENDERABLE]: { generation: 1 },
          [SPRITE]: popupSide,
        });
        state.particles[`popup-${iteration.orientation}-${i}`] =
          world.getEntityId(sideParticle);
      }
    }

    // add bottom decoration
    const downStartParticle = world.assertByIdAndComponents(
      state.particles[`popup-down-${(frameWidth - 3) / 2 + 1}`],
      [PARTICLE]
    );
    downStartParticle[SPRITE] = popupDownStart;
    const downEndParticle = world.assertByIdAndComponents(
      state.particles[`popup-down-${(frameWidth - 3) / 2 - 1}`],
      [PARTICLE]
    );
    downEndParticle[SPRITE] = popupDownEnd;
    const downCenterName = `popup-down-${(frameWidth - 3) / 2}`;
    const downCenterParticle = world.assertByIdAndComponents(
      state.particles[downCenterName],
      [PARTICLE]
    );
    downCenterParticle[SPRITE] = addBackground([icon], colors.black)[0];

    // add background
    for (let row = 0; row < frameHeight - 2; row += 1) {
      for (let column = 0; column < frameWidth - 2; column += 1) {
        const charParticle = entities.createParticle(world, {
          [PARTICLE]: {
            offsetX: popupMiddle.x - (frameWidth - 3) / 2 + column,
            offsetY: popupMiddle.y - (frameHeight - 3) / 2 + row,
            offsetZ: popupHeight,
          },
          [RENDERABLE]: { generation: 1 },
          [SPRITE]: popupBackground,
        });
        state.particles[`popup-content-${row}-${column}`] =
          world.getEntityId(charParticle);
      }
    }

    renderTabs = true;
    renderContent = true;
    renderSeparator = true;
  }

  // rerender scroll handle
  const visibleScroll =
    lines > (details ? frameHeight - detailsHeight - 3 : frameHeight - 2);

  if (visibleScroll && (generationChanged || renderContent || renderTabs)) {
    // top and bottom handles
    world.assertByIdAndComponents(state.particles["popup-right-0"], [PARTICLE])[
      SPRITE
    ] = scrollBarTop;
    world.assertByIdAndComponents(
      state.particles[`popup-right-${frameHeight - 3}`],
      [PARTICLE]
    )[SPRITE] = scrollBarBottom;

    // render bar
    for (let row = 1; row < frameHeight - 3; row += 1) {
      world.assertByIdAndComponents(state.particles[`popup-right-${row}`], [
        PARTICLE,
      ])[SPRITE] = scrollBar;
    }

    const progress = Math.floor(
      lerp(
        2,
        (frameHeight - 5) * 2,
        verticalIndex /
          (lines -
            (selection
              ? 1
              : details
              ? frameHeight - detailsHeight - 3
              : frameHeight - 2))
      )
    );

    // add handle
    const handleStart = world.assertByIdAndComponents(
      state.particles[`popup-right-${Math.floor(progress / 2)}`],
      [PARTICLE, ORIENTABLE]
    );
    handleStart[SPRITE] = scrollHandle;
    handleStart[ORIENTABLE].facing = progress % 2 === 1 ? "down" : undefined;
    const handleCenter = world.assertByIdAndComponents(
      state.particles[`popup-right-${Math.floor(progress / 2) + 1}`],
      [PARTICLE, ORIENTABLE]
    );
    handleCenter[SPRITE] = scrollHandle;
    handleCenter[ORIENTABLE].facing = undefined;
    const handleEnd = world.assertByIdAndComponents(
      state.particles[`popup-right-${Math.ceil(progress / 2) + 1}`],
      [PARTICLE, ORIENTABLE]
    );
    handleEnd[SPRITE] = scrollHandle;
    handleEnd[ORIENTABLE].facing = progress % 2 === 1 ? "up" : undefined;

    state.args.scrollIndex = scrollIndex;
    renderContent = true;
  } else if (!visibleScroll && (renderTabs || heightChanged)) {
    for (let row = 0; row < frameHeight - 2; row += 1) {
      const sideParticle = world.assertByIdAndComponents(
        state.particles[`popup-right-${row}`],
        [PARTICLE, ORIENTABLE]
      );
      sideParticle[SPRITE] = popupSide;
      sideParticle[ORIENTABLE].facing = "right";
    }

    renderContent = true;
  }

  if (renderTabs) {
    state.args.horizontalIndex = horizontalIndex;

    // add top decoration
    for (let tabIndex = 0; tabIndex < tabs; tabIndex += 1) {
      const selected = tabIndex === horizontalIndex;
      const offset = (tabs - 1) * -3 + tabIndex * 6;

      const upStartParticle = world.assertByIdAndComponents(
        state.particles[
          tabs === 3 && tabIndex === 0
            ? "popup-up-corner"
            : `popup-up-${(frameWidth - 3) / 2 - 3 + offset}`
        ],
        [PARTICLE, ORIENTABLE]
      );
      upStartParticle[SPRITE] = selected
        ? popupSeparatorSelected
        : tabIndex === horizontalIndex + 1
        ? popupSeparatorInverted
        : popupSeparator;
      upStartParticle[ORIENTABLE].facing =
        tabIndex === 0 ? (tabs === 3 ? "up" : "right") : undefined;
      if (tabIndex === tabs - 1) {
        const upEndParticle = world.assertByIdAndComponents(
          state.particles[
            tabs === 3 && tabIndex === 2
              ? "popup-right-corner"
              : `popup-up-${(frameWidth - 3) / 2 + 3 + offset}`
          ],
          [PARTICLE, ORIENTABLE]
        );
        upEndParticle[SPRITE] = selected
          ? popupSeparatorSelected
          : popupSeparator;
        upEndParticle[ORIENTABLE].facing = tabIndex === 2 ? "down" : "left";
      }
      const transaction = entity[POPUP].tabs[tabIndex] as Popup["tabs"][number];
      const title = popupTitles[transaction];
      const titleText = createText(
        padCenter(title.toUpperCase(), 5),
        selected ? colors.lime : colors.black
      );
      const titleSprites = addBackground(
        selected ? titleText : addBackground(titleText, colors.black, "░"),
        selected ? colors.black : colors.silver
      );
      titleSprites.forEach((char, index) => {
        const charParticle = world.assertByIdAndComponents(
          state.particles[
            `popup-up-${(frameWidth - 3) / 2 + index - 2 + offset}`
          ],
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
    centerStartParticle[SPRITE] = details ? popupCenterStart : popupSide;
    if (!visibleScroll) {
      const centerEndParticle = world.assertByIdAndComponents(
        state.particles[`popup-right-${frameHeight - detailsHeight - 3}`],
        [PARTICLE]
      );
      centerEndParticle[SPRITE] = details ? popupCenterEnd : popupSide;
    }

    updated = true;
  }

  // clear content on changes
  if (
    (generationChanged || scrollIndex !== state.args.scrollIndex) &&
    state.elapsed > popupTime
  ) {
    state.args.generation = generation;
    state.args.scrollIndex = scrollIndex;

    for (const particleName in state.particles) {
      // don't clear separator
      if (
        !particleName.startsWith("popup-content-") ||
        (details &&
          particleName.startsWith(
            `popup-content-${frameHeight - detailsHeight - 3}-`
          ))
      )
        continue;

      const particleEntity = world.assertByIdAndComponents(
        state.particles[particleName],
        [PARTICLE, SPRITE]
      );

      particleEntity[SPRITE] = popupBackground;
    }

    renderContent = true;
    renderDetails = settled;
    renderSeparator = true;
  }

  if (renderSeparator) {
    for (let i = 0; i < frameWidth - 2; i += 1) {
      const centerParticle = world.assertByIdAndComponents(
        state.particles[
          `popup-content-${frameHeight - detailsHeight - 3}-${i}`
        ],
        [PARTICLE]
      );
      centerParticle[SPRITE] = details ? popupCenter : popupBackground;
    }

    updated = true;
  }

  // popup content
  if (
    renderContent ||
    (state.elapsed > popupTime && state.args.contentIndex < contentSize)
  ) {
    const contentIndex = Math.floor((state.elapsed - popupTime) / contentDelay);
    const scrollContent = content
      .slice(scrollIndex)
      .slice(0, details ? frameHeight - detailsHeight - 2 : frameHeight - 2);

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
          lines >= frameHeight - 2 - detailsHeight - overscan &&
          row === scrollContent.length - 1 &&
          scrollContent.length > frameHeight - detailsHeight - 3;
        charParticle[SPRITE] = cropContent
          ? mergeSprites(char, popupCenterCrop)
          : char;
        rerenderEntity(world, charParticle);
      }
    }

    if (!renderContent) state.args.contentIndex = contentIndex;

    updated = true;
  }

  // popup details
  if (renderDetails && details) {
    for (let row = 0; row < Math.min(detailsHeight, details.length); row += 1) {
      for (let column = 0; column < details[row].length; column += 1) {
        const char = mergeSprites(popupBackground, details[row][column]);
        const charParticle = world.assertByIdAndComponents(
          state.particles[
            `popup-content-${row + frameHeight - detailsHeight - 2}-${column}`
          ],
          [PARTICLE, SPRITE]
        );
        charParticle[SPRITE] = char;
        rerenderEntity(world, charParticle);
      }
    }
    updated = true;
  }

  if (initial) {
    // interpolate frame on initial render
    for (const particleName in state.particles) {
      const particleEntity = world.assertByIdAndComponents(
        state.particles[particleName],
        [PARTICLE]
      );

      const { offsetX, offsetY } = particleEntity[PARTICLE];
      if (offsetY <= -frameHeight) {
        particleEntity[PARTICLE].animatedOrigin = { x: offsetX, y: -3 };
        particleEntity[PARTICLE].duration = (frameHeight - 1) * popupDelay;
      } else if (offsetY < -1) {
        particleEntity[PARTICLE].animatedOrigin = { x: offsetX, y: -2 };
        particleEntity[PARTICLE].duration = -offsetY * popupDelay;
      }
    }
  } else if (settled) {
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
  const popupOrigin = { x: 0, y: (frameHeight + 1) / -2 };
  const selectionX = popupOrigin.x - (frameWidth - 3) / 2;
  const selectionY = popupOrigin.y - (frameHeight - 3) / 2;

  if (
    !state.particles.selection &&
    state.elapsed >
      popupTime +
        (verticalIndex - scrollIndex) * (frameWidth - 2) * contentDelay &&
    selection
  ) {
    // add selection arrow
    const selectionParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: selectionX,
        offsetY: selectionY + (verticalIndex - scrollIndex),
        offsetZ: selectionHeight,
        animatedOrigin: {
          x: selectionX - 1,
          y: selectionY + (verticalIndex - scrollIndex),
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
      selectionY + (verticalIndex - scrollIndex);
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

type SpriteDefinition = {
  sprite: Sprite;
  resource?: Sprite;
  display?: Sprite;
  description?: Sprite[][];
  getDescription?: () => Sprite[][]; // lazily initialized to avoid circular references
};

export const entitySprites: Record<
  Craftable | Reloadable | keyof UnitStats | ClassKey,
  SpriteDefinition
> = {
  // classes
  rogue: {
    sprite: rogue,
    getDescription: () => {
      const { stats } = getClassData("rogue");

      return [
        createText("Fast and strong."),
        stretch(
          createCountable(stats, "hp", "progression"),
          createCountable(stats, "power", "display"),
          frameWidth - 2
        ),
        stretch(
          createCountable(stats, "mp", "progression"),
          createCountable(stats, "haste", "display"),
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
          createCountable(stats, "wisdom", "display"),
          frameWidth - 2
        ),
        stretch(
          createCountable(stats, "mp", "progression"),
          createCountable(stats, "vision", "display"),
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
          createCountable(stats, "armor", "display"),
          frameWidth - 2
        ),
        stretch(
          createCountable(stats, "mp", "progression"),
          createCountable(stats, "resist", "display"),
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
          createCountable(stats, "damp", "display"),
          frameWidth - 2
        ),
        stretch(
          createCountable(stats, "spike", "display"),
          createCountable(stats, "thaw", "display"),
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
        createUnitName("prism")[0],
        createUnitName("goldEye")[0],
        createUnitName("diamondOrb")[0],
        createUnitName("banditKnight")[0],
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
    getDescription: () => [
      createText("Crisp apple from"),
      [
        ...createText("a "),
        minCountable(apple),
        ...createText("Tree", colors.grey),
        ...createText("."),
      ],
      createCountable({ hp: 2 }, "hp", "display"),
    ],
  },
  shroom: {
    sprite: shroom,
    getDescription: () => [
      createText("A savoury shroom"),
      createText("from the forest."),
      createCountable({ mp: 1 }, "mp", "display"),
    ],
  },
  banana: {
    sprite: bananaDrop,
    resource: banana,
    getDescription: () => [
      createText("Ripe banana from"),
      [
        ...createText("a "),
        minCountable(banana),
        ...createText("Palm", colors.grey),
        ...createText("."),
      ],
      createCountable({ hp: 5 }, "hp", "display"),
    ],
  },
  coconut: {
    sprite: coconutDrop,
    resource: coconut,
    getDescription: () => [
      createText("A tender coconut"),
      [
        ...createText("from a "),
        minCountable(coconut),
        ...createText("Palm", colors.grey),
        ...createText("."),
      ],
      createCountable({ mp: 2 }, "mp", "display"),
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
    getDescription: () => [
      [...createItemName({ stackable: "flower" }), ...createText(" extract.")],
      [
        ...createText("Base for "),
        ...createItemName({
          consume: "potion",
          material: "wood",
          element: "water",
        }),
        ...createText("."),
      ],
      createCountable({ mp: 2 }, "mp", "display"),
    ],
  },
  fruit: {
    sprite: fruit,
    getDescription: () => [
      [
        ...createText("Made from "),
        ...createItemName({ stackable: "berry" }),
        ...createText("."),
      ],
      [
        ...createText("Base for "),
        ...createItemName({
          consume: "potion",
          material: "wood",
          element: "fire",
        }),
        ...createText("."),
      ],
      createCountable({ hp: 5 }, "hp", "display"),
    ],
  },
  seed: {
    sprite: seed,
    getDescription: () => [
      createText("About to sprout."),
      [
        ...createText("Made from "),
        ...createItemName({ stackable: "leaf" }),
        ...createText("."),
      ],
    ],
  },
  ingot: { sprite: ingot },
  nugget: { sprite: nugget },
  worm: { sprite: worm },
  arrow: {
    sprite: arrow,
    getDescription: () => [
      createText("To be used with a"),
      [
        ...createItemName({
          equipment: "secondary",
          material: "wood",
          secondary: "bow",
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
      createText("Can be used with"),
      [
        ...createItemName({
          equipment: "secondary",
          material: "wood",
          secondary: "slash",
        }),
        ...createText(" as short-"),
      ],
      createText("range attack."),
    ],
  },
  note: {
    sprite: note,
    getDescription: () => [
      createText("A beautifully"),
      createText("written letter"),
      createText("to someone."),
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
      createText("Reduces damage"),
      [
        ...createText("during "),
        maxCountable(fire),
        ...createText("Burn", colors.yellow),
        ...createText("."),
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

export const materialSprites: Record<
  Tools | Gear | Primary | Secondary | Consumable | Resource | Materialized,
  Partial<Record<Material, SpriteDefinition>>
> = {
  sword: {
    wood: {
      sprite: woodStick,
      getDescription: () => [
        createText("Simple sword made"),
        [
          ...createText("out of a "),
          ...createItemName({ stackable: "stick" }),
          ...createText("."),
        ],
        [
          ...createText("2", colors.red),
          minCountable(meleeHit),
          ...createText("Melee", colors.red),
        ],
      ],
    },
    iron: {
      sprite: ironSword,
      getDescription: () => [
        createText("Heavy sword made"),
        [
          ...createText("of "),
          ...createItemName({ stackable: "resource", material: "iron" }),
          ...createText("."),
        ],
        [
          ...createText("4", colors.red),
          minCountable(meleeHit),
          ...createText("Melee", colors.red),
        ],
      ],
    },
    gold: {
      sprite: goldSword,
      getDescription: () => [
        createText("Shiny sword made"),
        [
          ...createText("of "),
          ...createItemName({ stackable: "resource", material: "gold" }),
          ...createText("."),
        ],
        [
          ...createText("6", colors.red),
          minCountable(meleeHit),
          ...createText("Melee", colors.red),
        ],
      ],
    },

    diamond: { sprite: diamondSword },
    ruby: { sprite: rubySword },
  },
  shield: {
    wood: {
      sprite: woodShield,
      getDescription: () => [
        createText("A simple shield"),
        [
          ...createText("made of "),
          ...createItemName({ stackable: "resource", material: "wood" }),
          ...createText("."),
        ],
        stretch(
          createCountable({ armor: 1 }, "armor", "display"),
          createCountable({ haste: -1 }, "haste", "display"),
          frameWidth - 2
        ),
      ],
    },
    iron: {
      sprite: ironShield,
      getDescription: () => [
        createText("A heavy shield"),
        [
          ...createText("made of "),
          ...createItemName({ stackable: "resource", material: "iron" }),
          ...createText("."),
        ],
        stretch(
          createCountable({ armor: 2 }, "armor", "display"),
          createCountable({ haste: -1 }, "haste", "display"),
          frameWidth - 2
        ),
      ],
    },
    gold: {
      sprite: goldShield,
      getDescription: () => [
        createText("A shiny shield"),
        [
          ...createText("made of "),
          ...createItemName({ stackable: "resource", material: "gold" }),
          ...createText("."),
        ],
        stretch(
          createCountable({ armor: 3 }, "armor", "display"),
          createCountable({ haste: -1 }, "haste", "display"),
          frameWidth - 2
        ),
      ],
    },
    diamond: { sprite: diamondShield },
    ruby: { sprite: rubyShield },
  },
  ring: {
    wood: {
      sprite: woodRing,
    },
    iron: {
      sprite: ironRing,
    },
  },
  amulet: {
    wood: {
      sprite: woodAmulet,
    },
    iron: {
      sprite: ironAmulet,
    },
  },

  // tools
  compass: {
    iron: {
      sprite: ironCompass,
      getDescription: () => [
        createText("Shows the way"),
        createText("back to your"),
        createText("spawn point."),
      ],
    },
  },
  torch: {
    wood: {
      sprite: torch,
      getDescription: () => [
        createText("Glows bright and"),
        createText("keeps you warm."),
        [...createCountable({ vision: 2 }, "vision", "display")],
      ],
    },
  },

  // primary spells
  wave: {
    wood: {
      sprite: waveSpellWood,
      getDescription: () => [
        createText("Use to cast a"),
        createText("wave of magic."),
        stretch(
          [
            ...createText("2", colors.fuchsia),
            minCountable(magicHit),
            ...createText("Magic", colors.fuchsia),
          ],
          createCountable({ mp: -1 }, "mp", "display"),
          frameWidth - 2
        ),
      ],
    },
  },
  beam: {
    wood: {
      sprite: beamSpellWood,
      getDescription: () => [
        createText("Shoots multiple"),
        createText("bolts in a beam."),
        stretch(
          [
            ...createText("5", colors.fuchsia),
            minCountable(magicHit),
            ...createText("Magic", colors.fuchsia),
          ],
          createCountable({ mp: -1 }, "mp", "display"),
          frameWidth - 2
        ),
      ],
    },
  },

  // secondary items
  slash: {
    wood: {
      sprite: slashWood,

      getDescription: () => [
        createText("Spins and damages"),
        createText("nearby enemies."),
        stretch(
          [
            ...createText("2", colors.red),
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
  },
  bow: {
    wood: {
      sprite: bowWood,

      getDescription: () => [
        createText("Shoots a ranged"),
        createText("projectile."),
        stretch(
          [
            ...createText("2", colors.red),
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
  },

  // resource
  resource: {
    wood: {
      sprite: wood,
      getDescription: () => [
        [
          ...createText("Made from "),
          ...createItemName({ stackable: "stick" }),
          ...createText("."),
        ],
        createText("Craft into wooden"),
        [
          woodStick,
          woodShield,
          ...createText("Gear", colors.grey),
          ...createText("."),
        ],
      ],
    },
    iron: {
      sprite: iron,
      getDescription: () => [
        [
          ...createText("Made from "),
          ...createItemName({ stackable: "ore" }),
          ...createText("."),
        ],
        createText("Craft into iron"),
        [
          ironSword,
          ironShield,
          ...createText("Gear", colors.grey),
          ...createText("."),
        ],
      ],
    },
    gold: {
      sprite: gold,
      getDescription: () => [
        [
          ...createText("Found at a "),
          ...createItemName({ materialized: "mine", material: "gold" }),
          ...createText("."),
        ],
        createText("Craft into golden"),
        [
          goldSword,
          goldShield,
          ...createText("Gear", colors.grey),
          ...createText("."),
        ],
      ],
    },
    diamond: { sprite: diamond },
    ruby: { sprite: ruby },
  },

  // consumable
  potion: {},
  map: {
    wood: {
      sprite: map,
      getDescription: () => [
        [...createText("FOREST", colors.yellow), ...createText(" world.")],
        [
          ...createText("Use at a "),
          portal,
          ...createText("Portal", colors.grey),
        ],
        createText("to enter."),
      ],
    },
  },
  key: {
    iron: {
      sprite: ironKey,
      getDescription: () => [
        [
          ...createText("Opens a "),
          ...createItemName({ materialized: "lock", material: "iron" }),
          ...createText("."),
        ],
        createText("Disappears after"),
        createText("use."),
      ],
    },
    gold: {
      sprite: goldKey,

      getDescription: () => [
        [
          ...createText("Opens a "),
          ...createItemName({ materialized: "lock", material: "gold" }),
          ...createText("."),
        ],
        createText("Disappears after"),
        createText("use."),
      ],
    },
  },

  // materialized
  lock: {
    iron: { sprite: ironLock },
    gold: { sprite: goldLock },
  },
  door: {
    wood: { sprite: doorClosedWood },
    iron: { sprite: doorClosedIron },
    gold: { sprite: doorClosedGold },
  },
  entry: {
    wood: { sprite: entryClosedWood, display: entryClosedWoodDisplay },
    iron: { sprite: entryClosedIron, display: entryClosedIronDisplay },
    gold: { sprite: entryClosedGold, display: entryClosedGoldDisplay },
  },
  gate: {
    wood: { sprite: fenceDoor },
  },
  mine: {
    iron: { sprite: ironMine, display: ironMineDisplay },
    gold: { sprite: goldMine, display: goldMineDisplay },
  },
};

export const elementSprites: Record<
  Gear | Primary | Secondary | Consumable | Resource,
  Partial<Record<Material, Partial<Record<Element, SpriteDefinition>>>>
> = {
  // gear
  sword: {
    wood: {
      air: {
        sprite: woodStickAir,
        getDescription: () => [
          [
            ...createText("A "),
            ...createItemName({ stackable: "stick" }),
            ...createText(" sword"),
          ],
          [
            ...createText("with a "),
            ...createItemName({
              stackable: "resource",
              material: "wood",
              element: "air",
            }),
            ...createText("."),
          ],
          stretch(
            [
              ...createText("2", colors.red),
              minCountable(meleeHit),
              ...createText("Melee", colors.red),
            ],
            createCountable({ power: 1 }, "power", "display"),
            frameWidth - 2
          ),
        ],
      },
      fire: {
        sprite: woodStickFire,
        getDescription: () => [
          [
            ...createText("A "),
            ...createItemName({ stackable: "stick" }),
            ...createText(" sword"),
          ],
          [
            ...createText("with a "),
            ...createItemName({
              stackable: "resource",
              material: "wood",
              element: "fire",
            }),
            ...createText("."),
          ],
          stretch(
            [
              ...createText("2", colors.red),
              minCountable(meleeHit),
              ...createText("Melee", colors.red),
            ],
            [
              ...createText("2", colors.yellow),
              maxCountable(fire),
              ...createText("Burn", colors.yellow),
            ],
            frameWidth - 2
          ),
        ],
      },
      water: {
        sprite: woodStickWater,
        getDescription: () => [
          [
            ...createText("A "),
            ...createItemName({ stackable: "stick" }),
            ...createText(" sword"),
          ],
          [
            ...createText("with a "),
            ...createItemName({
              stackable: "resource",
              material: "wood",
              element: "water",
            }),
            ...createText("."),
          ],
          stretch(
            [
              ...createText("2", colors.red),
              minCountable(meleeHit),
              ...createText("Melee", colors.red),
            ],
            [
              ...createText("3", colors.aqua),
              maxCountable(freeze),
              ...createText("Freeze", colors.aqua),
            ],
            frameWidth - 2
          ),
        ],
      },
      earth: {
        sprite: woodStickEarth,
        getDescription: () => [
          [
            ...createText("A "),
            ...createItemName({ stackable: "stick" }),
            ...createText(" sword"),
          ],
          [
            ...createText("with a "),
            ...createItemName({
              stackable: "resource",
              material: "wood",
              element: "earth",
            }),
            ...createText("."),
          ],
          stretch(
            [
              ...createText("2", colors.red),
              minCountable(meleeHit),
              ...createText("Melee", colors.red),
            ],
            [
              ...createText("1", colors.purple),
              drain,
              ...createText("Drain", colors.purple),
            ],
            frameWidth - 2
          ),
        ],
      },
    },
  },
  shield: {
    wood: {
      air: {
        sprite: woodShieldAir,
        getDescription: () => [
          [
            ...createText("A "),
            ...createItemName({
              stackable: "resource",
              material: "wood",
              element: "air",
            }),
            ...createText(" shield"),
          ],
          stretch(
            createCountable({ armor: 1 }, "armor", "display"),
            createCountable({ haste: -1 }, "haste", "display"),
            frameWidth - 2
          ),
          createCountable({ resist: 1 }, "resist", "display"),
        ],
      },
      fire: {
        sprite: woodShieldFire,
        getDescription: () => [
          [
            ...createText("A "),
            ...createItemName({
              stackable: "resource",
              material: "wood",
              element: "fire",
            }),
            ...createText(" shield"),
          ],
          stretch(
            createCountable({ armor: 1 }, "armor", "display"),
            createCountable({ haste: -1 }, "haste", "display"),
            frameWidth - 2
          ),
          createCountable({ damp: 2 }, "damp", "display"),
        ],
      },
      water: {
        sprite: woodShieldWater,
        getDescription: () => [
          [
            ...createText("A "),
            ...createItemName({
              stackable: "resource",
              material: "wood",
              element: "water",
            }),
            ...createText(" shield"),
          ],
          stretch(
            createCountable({ armor: 1 }, "armor", "display"),
            createCountable({ haste: -1 }, "haste", "display"),
            frameWidth - 2
          ),
          createCountable({ thaw: 5 }, "thaw", "display"),
        ],
      },
      earth: {
        sprite: woodShieldEarth,
        getDescription: () => [
          [
            ...createText("A "),
            ...createItemName({
              stackable: "resource",
              material: "wood",
              element: "earth",
            }),
            ...createText(" shield"),
          ],
          stretch(
            createCountable({ armor: 1 }, "armor", "display"),
            createCountable({ haste: -1 }, "haste", "display"),
            frameWidth - 2
          ),
          createCountable({ spike: 1 }, "spike", "display"),
        ],
      },
    },
  },
  ring: {
    wood: {
      air: {
        sprite: woodRingAir,
      },
      fire: {
        sprite: woodRingFire,
      },
      water: {
        sprite: woodRingWater,
      },
      earth: {
        sprite: woodRingEarth,
      },
    },
  },
  amulet: {
    wood: {
      air: {
        sprite: woodAmuletAir,
      },
      fire: {
        sprite: woodAmuletFire,
      },
      water: {
        sprite: woodAmuletWater,
      },
      earth: {
        sprite: woodAmuletEarth,
      },
    },
  },

  // equipments
  slash: {
    wood: {
      air: {
        sprite: slashWood,

        getDescription: () => [
          createText("Spin with damage."),
          stretch(
            [
              ...createText("1", colors.red),
              minCountable(meleeHit),
              ...createText("Melee", colors.red),
            ],
            [
              ...createText("-1", colors.grey),
              ...createItemName({ stackable: "charge" }),
            ],
            frameWidth - 2
          ),
          [
            ...createText("2", colors.olive),
            minCountable(range),
            ...createText("Range", colors.olive),
          ],
        ],
      },
    },
  },
  bow: {
    wood: {
      air: {
        sprite: bowWood,

        getDescription: () => [
          createText("Shoots at range."),
          stretch(
            [
              ...createText("1", colors.red),
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
    },
  },

  // spells
  wave: {
    wood: {
      air: {
        sprite: waveSpellWoodAir,
        getDescription: () => [
          createText("A wave of magic."),
          stretch(
            [
              ...createText("2", colors.fuchsia),
              minCountable(magicHit),
              ...createText("Magic", colors.fuchsia),
            ],
            createCountable({ mp: -1 }, "mp", "display"),
            frameWidth - 2
          ),
          [...createCountable({ wisdom: 1 }, "wisdom", "display")],
        ],
      },
      fire: {
        sprite: waveSpellWoodFire,
        getDescription: () => [
          createText("A wave of magic."),
          stretch(
            [
              ...createText("2", colors.fuchsia),
              minCountable(magicHit),
              ...createText("Magic", colors.fuchsia),
            ],
            createCountable({ mp: -1 }, "mp", "display"),
            frameWidth - 2
          ),
          [
            ...createText("2", colors.yellow),
            maxCountable(fire),
            ...createText("Burn", colors.yellow),
          ],
        ],
      },
      water: {
        sprite: waveSpellWoodWater,
        getDescription: () => [
          createText("A wave of magic."),
          stretch(
            [
              ...createText("2", colors.fuchsia),
              minCountable(magicHit),
              ...createText("Magic", colors.fuchsia),
            ],
            createCountable({ mp: -1 }, "mp", "display"),
            frameWidth - 2
          ),
          [
            ...createText("5", colors.aqua),
            maxCountable(freeze),
            ...createText("Freeze", colors.aqua),
          ],
        ],
      },
      earth: {
        sprite: waveSpellWoodEarth,
        getDescription: () => [
          createText("A wave of magic."),
          stretch(
            [
              ...createText("2", colors.lime),
              minCountable(heal),
              ...createText("Heal", colors.lime),
            ],
            createCountable({ mp: -1 }, "mp", "display"),
            frameWidth - 2
          ),
        ],
      },
    },
  },
  beam: {
    wood: {
      air: {
        sprite: beamSpellWoodAir,
        getDescription: () => [
          createText("A beam of bolts."),
          stretch(
            [
              ...createText("5", colors.fuchsia),
              minCountable(magicHit),
              ...createText("Magic", colors.fuchsia),
            ],
            createCountable({ mp: -1 }, "mp", "display"),
            frameWidth - 2
          ),
          [...createCountable({ wisdom: 1 }, "wisdom", "display")],
        ],
      },
      fire: {
        sprite: beamSpellWoodFire,
        getDescription: () => [
          createText("A beam of bolts."),
          stretch(
            [
              ...createText("5", colors.fuchsia),
              minCountable(magicHit),
              ...createText("Magic", colors.fuchsia),
            ],
            createCountable({ mp: -1 }, "mp", "display"),
            frameWidth - 2
          ),
          [
            ...createText("2", colors.yellow),
            maxCountable(fire),
            ...createText("Burn", colors.yellow),
          ],
        ],
      },
      water: {
        sprite: beamSpellWoodWater,
        getDescription: () => [
          createText("A beam of bolts."),
          stretch(
            [
              ...createText("5", colors.fuchsia),
              minCountable(magicHit),
              ...createText("Magic", colors.fuchsia),
            ],
            createCountable({ mp: -1 }, "mp", "display"),
            frameWidth - 2
          ),
          [
            ...createText("5", colors.aqua),
            maxCountable(freeze),
            ...createText("Freeze", colors.aqua),
          ],
        ],
      },
      earth: {
        sprite: beamSpellWoodEarth,
        getDescription: () => [
          createText("A beam of bolts."),
          stretch(
            [
              ...createText("3", colors.lime),
              minCountable(heal),
              ...createText("Heal", colors.lime),
            ],
            createCountable({ mp: -1 }, "mp", "display"),
            frameWidth - 2
          ),
        ],
      },
    },
  },

  // consumable
  key: {},
  map: {},
  potion: {
    wood: {
      fire: {
        sprite: hpBottle,
        getDescription: () => [
          createText("Automatic healing"),
          createText("on low health."),
          stretch(
            [
              ...createText("5", colors.olive),
              delay,
              ...createText("Delay", colors.olive),
            ],
            createCountable({ hp: 2 }, "hp", "display"),
            frameWidth - 2
          ),
        ],
      },
      water: {
        sprite: mpBottle,
        getDescription: () => [
          createText("Refills low mana"),
          createText("automatically."),
          stretch(
            [
              ...createText("5", colors.olive),
              delay,
              ...createText("Delay", colors.olive),
            ],
            createCountable({ mp: 1 }, "mp", "display"),
            frameWidth - 2
          ),
        ],
      },
    },
    iron: {
      fire: {
        sprite: hpPotion,
        getDescription: () => [
          createText("Automatic healing"),
          createText("on low health."),
          stretch(
            [
              ...createText("8", colors.olive),
              delay,
              ...createText("Delay", colors.olive),
            ],
            createCountable({ hp: 5 }, "hp", "display"),
            frameWidth - 2
          ),
        ],
      },
      water: {
        sprite: mpPotion,
        getDescription: () => [
          createText("Refills low mana"),
          createText("automatically."),
          stretch(
            [
              ...createText("8", colors.olive),
              delay,
              ...createText("Delay", colors.olive),
            ],
            createCountable({ mp: 2 }, "mp", "display"),
            frameWidth - 2
          ),
        ],
      },
    },
    gold: {
      fire: {
        sprite: hpElixir,
        getDescription: () => [
          createText("Automatic healing"),
          createText("on low health."),
          stretch(
            [
              ...createText("10", colors.olive),
              delay,
              ...createText("Delay", colors.olive),
            ],
            createCountable({ hp: 8 }, "hp", "display"),
            frameWidth - 2
          ),
        ],
      },
      water: {
        sprite: mpElixir,
        getDescription: () => [
          createText("Refills low mana"),
          createText("automatically."),
          stretch(
            [
              ...createText("10", colors.olive),
              delay,
              ...createText("Delay", colors.olive),
            ],
            createCountable({ mp: 3 }, "mp", "display"),
            frameWidth - 2
          ),
        ],
      },
    },
  },

  resource: {
    wood: {
      air: {
        sprite: airEssence,
        getDescription: () => [
          createText("Elemental spirit"),
          createText("to craft items."),
        ],
      },
      fire: {
        sprite: fireEssence,
        getDescription: () => [
          createText("Elemental spirit"),
          createText("to craft items"),
          [
            ...createText("with "),
            ...createText("fire", colors.red),
            ...createText("."),
          ],
        ],
      },
      water: {
        sprite: waterEssence,
        getDescription: () => [
          createText("Elemental spirit"),
          createText("to craft items"),
          [
            ...createText("with "),
            ...createText("water", colors.blue),
            ...createText("."),
          ],
        ],
      },
      earth: {
        sprite: earthEssence,
        getDescription: () => [
          createText("Elemental spirit"),
          createText("to craft items"),
          [
            ...createText("with "),
            ...createText("earth", colors.lime),
            ...createText("."),
          ],
        ],
      },
    },
  },
};

export const getItemConfig = (
  item: Omit<Item, "amount" | "carrier" | "bound"> & {
    materialized?: Materialized;
  }
) => {
  const material = item.material;
  const element = item.element;

  if (!material && !element) {
    const lookup = item.stackable || item.stat;

    if (!lookup || lookup === "resource") return;

    return entitySprites[lookup];
  }

  if (material && !element) {
    let lookup =
      item.primary ||
      item.secondary ||
      item.consume ||
      (item.stackable === "resource" ? item.stackable : undefined) ||
      (item.equipment !== "primary" && item.equipment !== "secondary"
        ? item.equipment
        : undefined) ||
      item.materialized;

    if (!lookup) return;

    return materialSprites[lookup]?.[material];
  }

  if (material && element) {
    let lookup =
      item.primary ||
      item.secondary ||
      item.consume ||
      (item.stackable === "resource" ? item.stackable : undefined) ||
      (item.equipment !== "primary" &&
      item.equipment !== "secondary" &&
      item.equipment !== "torch" &&
      item.equipment !== "compass"
        ? item.equipment
        : undefined);

    if (!lookup) return;

    return elementSprites[lookup]?.[material]?.[element];
  }
};

export const getItemSprite = (
  item: Omit<Item, "amount" | "carrier" | "bound"> & {
    materialized?: Materialized;
  },
  variant?: "resource" | "display",
  orientation?: Orientation
) => {
  if (item.stat) return getStatSprite(item.stat, variant);

  const itemConfig = getItemConfig(item);

  if (!itemConfig) return missing;

  const sprite = (variant && itemConfig[variant]) || itemConfig.sprite;

  if (!sprite || (item.equipment === "sword" && !item.material)) return missing;

  return {
    ...sprite,
    layers: getFacingLayers(sprite, orientation),
  };
};

export const createItemText = (
  item: Omit<Item, "carrier" | "bound"> & { materialized?: Materialized }
) => {
  const stringified = item.amount.toString();

  return [...createText(stringified, colors.grey), ...createItemName(item)];
};

export const createItemName = (
  item: Omit<Item, "carrier" | "bound" | "amount"> & {
    materialized?: Materialized;
  }
) => {
  const sprite = getItemSprite(item, "display");

  return [
    sprite,
    ...createText(
      item.materialized
        ? `${item.materialized[0].toUpperCase()}${item.materialized.slice(1)}`
        : sprite.name,
      colors.grey
    ),
  ];
};

export const createUnitName = (unit: UnitKey) => {
  const unitData = generateUnitData(unit);

  return [
    mergeSprites(
      unitData.sprite,
      unitData.faction === "unit"
        ? neutralBar
        : unitData.faction === "wild"
        ? hostileBar
        : friendlyBar
    ),
    ...createText(
      unitData.sprite.name,
      unitData.faction === "wild" ? colors.maroon : colors.grey
    ),
  ];
};

export const getEntityDescription = (definition: SpriteDefinition) => {
  if (definition.description) return definition.description;

  if (definition.getDescription) {
    definition.description = definition.getDescription();
    definition.getDescription = undefined;
    return definition.description;
  }

  return [createText(definition.sprite.name, colors.white, colors.black)];
};

export const getItemDescription = (
  item: Omit<Item, "carrier" | "bound" | "amount">
) => {
  const itemConfig = getItemConfig(item);

  if (!itemConfig) return [[]];

  return getEntityDescription(itemConfig);
};
