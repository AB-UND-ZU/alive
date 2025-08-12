import { Entity } from "ecs";
import { entities, World } from "../../engine";
import type * as npcTypes from "./npcs";
import type * as questTypes from "./quests";
import { createSequence, getSequence } from "../../engine/systems/sequence";
import {
  InfoSequence,
  Message,
  MessageSequence,
  NpcSequence,
  QuestSequence,
  SEQUENCABLE,
  SequenceState,
} from "../../engine/components/sequencable";
import * as colors from "./colors";
import { POPUP } from "../../engine/components/popup";
import { RENDERABLE } from "../../engine/components/renderable";
import { iterations } from "../math/tracing";
import { add, lerp, padCenter } from "../math/std";
import { ORIENTABLE } from "../../engine/components/orientable";
import { PARTICLE } from "../../engine/components/particle";
import { Sprite, SPRITE } from "../../engine/components/sprite";
import { popupHeight } from "../../components/Entity/utils";
import {
  addBackground,
  createText,
  popupBackground,
  popupCorner,
  popupDownEnd,
  popupDownStart,
  popupSide,
  popupUpEnd,
  popupUpStart,
  scrollBar,
  scrollBarBottom,
  scrollBarTop,
  scrollHandle,
} from "./sprites";
import { rerenderEntity } from "../../engine/systems/renderer";
import { MOVABLE } from "../../engine/components/movable";
import { REFERENCE } from "../../engine/components/reference";

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
export const contentDelay = 8;
export const popupDelay = 75;
export const popupTime = frameHeight * popupDelay;

export const scrolledVerticalIndex = (
  world: World,
  entity: Entity,
  state: SequenceState<InfoSequence>,
  content: Sprite[][]
) => {
  const verticalIndex = entity[POPUP].verticalIndex;
  const innerHeight = frameHeight - 2;
  const padding = (innerHeight - 1) / 2;

  const remainingItems = Math.max(0, content.length - verticalIndex - 1);

  if (content.length > innerHeight && remainingItems <= padding)
    return innerHeight - remainingItems - 1;
  if (
    content.length > innerHeight &&
    verticalIndex >= padding &&
    remainingItems >= padding
  )
    return padding;

  return Math.min(verticalIndex, innerHeight - 1);
};

export const displayPopup = (
  world: World,
  entity: Entity,
  state: SequenceState<InfoSequence>,
  icon: Sprite,
  content: Sprite[][]
) => {
  let updated = false;
  let finished = !entity[POPUP].active;
  const generation = entity[RENDERABLE].generation;
  let renderContent = false;
  const popupCenter = { x: 0, y: (frameHeight + 1) / -2 };
  const initial = !state.args.generation;

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
          offsetX: popupCenter.x + cornerDelta.x * ((frameWidth - 1) / 2),
          offsetY: popupCenter.y + cornerDelta.y * ((frameHeight - 1) / 2),
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
              popupCenter.x +
              iteration.normal.x * (i - (normalLength - 1) / 2) +
              (iteration.direction.x * (directionLength - 1)) / 2,
            offsetY:
              popupCenter.y +
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

    // add top decoration
    const upStartParticle = world.assertByIdAndComponents(
      state.particles[`popup-up-${(frameWidth - 3) / 2 - 3}`],
      [PARTICLE]
    );
    upStartParticle[SPRITE] = popupUpStart;
    const upEndParticle = world.assertByIdAndComponents(
      state.particles[`popup-up-${(frameWidth - 3) / 2 + 3}`],
      [PARTICLE]
    );
    upEndParticle[SPRITE] = popupUpEnd;
    const title = createText(
      padCenter(
        `${state.args.title[0].toUpperCase()}${state.args.title.substring(1)}`,
        5
      ),
      colors.lime,
      colors.black
    );
    title.forEach((char, index) => {
      const charParticle = world.assertByIdAndComponents(
        state.particles[`popup-up-${(frameWidth - 3) / 2 + index - 2}`],
        [PARTICLE]
      );
      charParticle[SPRITE] = char;
    });

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
            offsetX: popupCenter.x - (frameWidth - 3) / 2 + column,
            offsetY: popupCenter.y - (frameHeight - 3) / 2 + row,
            offsetZ: popupHeight,
          },
          [RENDERABLE]: { generation: 1 },
          [SPRITE]: popupBackground,
        });
        state.particles[`popup-content-${row}-${column}`] =
          world.getEntityId(charParticle);
      }
    }

    renderContent = true;
  }

  // rerender scroll handle
  const verticalIndex = entity[POPUP].verticalIndex;
  const scrollIndex =
    verticalIndex - scrolledVerticalIndex(world, entity, state, content);

  if (
    content.length > frameHeight - 2 &&
    (generation !== state.args.generation || renderContent)
  ) {
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
      lerp(2, (frameHeight - 5) * 2, verticalIndex / (content.length - 1))
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
  }

  // clear content on changes
  if (
    (generation !== state.args.generation ||
      scrollIndex !== state.args.scrollIndex) &&
    state.elapsed > popupTime
  ) {
    state.args.generation = generation;
    state.args.scrollIndex = scrollIndex;

    for (const particleName in state.particles) {
      if (!particleName.startsWith("popup-content-")) continue;

      const particleEntity = world.assertByIdAndComponents(
        state.particles[particleName],
        [PARTICLE, SPRITE]
      );

      particleEntity[SPRITE] = popupBackground;
    }

    renderContent = true;
  }

  // popup content
  if (
    renderContent ||
    (state.elapsed > popupTime &&
      state.args.contentIndex < (frameHeight - 2) * (frameWidth - 2))
  ) {
    const contentIndex = Math.floor((state.elapsed - popupTime) / contentDelay);
    const scrollContent = content.slice(scrollIndex).slice(0, frameHeight - 2);

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

        const char = scrollContent[row][column];
        const charParticle = world.assertByIdAndComponents(
          state.particles[`popup-content-${row}-${column}`],
          [PARTICLE, SPRITE]
        );
        charParticle[SPRITE] = char;
        rerenderEntity(world, charParticle);
      }
    }

    if (!renderContent) state.args.contentIndex = contentIndex;

    updated = true;
  }

  // interpolate frame on initial render
  if (initial) {
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

export const queueMessage = (
  world: World,
  entity: Entity,
  message: Message
) => {
  const messageState = getSequence(world, entity, "message") as
    | SequenceState<MessageSequence>
    | undefined;

  if (messageState) {
    messageState.args.messages.push({
      ...message,
      delay: messageState.elapsed + message.delay,
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
      }
    );
  }
};
