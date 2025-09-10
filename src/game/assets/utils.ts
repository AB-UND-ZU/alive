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
import { ORIENTABLE, Orientation } from "../../engine/components/orientable";
import { PARTICLE } from "../../engine/components/particle";
import { Sprite, SPRITE } from "../../engine/components/sprite";
import { getFacingLayers, popupHeight } from "../../components/Entity/utils";
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
  popupUpEnd,
  popupUpStart,
  scrollBar,
  scrollBarBottom,
  scrollBarTop,
  scrollHandle,
  aetherCharm2,
  aetherPet2,
  aetherShield,
  aetherSword,
  apple,
  appleDrop,
  arrow,
  banana,
  bananaDrop,
  beamSpell,
  berry,
  berryDrop,
  blockActive,
  bombActive,
  bowActive,
  charge,
  charm,
  coconut,
  coconutDrop,
  coin,
  compass,
  crystal,
  diamond,
  diamondCharm1,
  diamondCharm2,
  diamondPet1,
  diamondPet2,
  diamondShield,
  diamondSword,
  doorClosedFire,
  doorClosedGold,
  doorClosedIron,
  doorClosedWood,
  earthBeam1Spell,
  earthBeam2Spell,
  earthCharm1,
  earthCharm2,
  earthEssence,
  earthPet1,
  earthPet2,
  earthShield,
  earthSword,
  earthTrap,
  earthWave1Spell,
  earthWave2Spell,
  entryClosedIron,
  entryClosedWood,
  fenceDoor,
  fireBeam1Spell,
  fireBeam2Spell,
  fireCharm1,
  fireCharm2,
  fireEssence,
  firePet1,
  firePet2,
  fireShield,
  fireSword,
  fireTrap,
  fireWave1Spell,
  fireWave2Spell,
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
  hpFlask1,
  hpFlask2,
  ingot,
  iron,
  ironKey,
  ironShield,
  ironSword,
  leaf,
  map,
  minCountable,
  mpFlask1,
  mpFlask2,
  none,
  ore,
  oreDrop,
  pet,
  rainbowCharm2,
  rainbowPet2,
  rainbowShield,
  rainbowSword,
  ruby,
  rubyCharm2,
  rubyPet2,
  rubyShield,
  rubySword,
  seed,
  shroom,
  slashActive,
  stick,
  torch,
  trap,
  voidCharm2,
  voidPet2,
  voidShield,
  voidSword,
  waterBeam1Spell,
  waterBeam2Spell,
  waterCharm1,
  waterCharm2,
  waterEssence,
  waterPet1,
  waterPet2,
  waterShield,
  waterSword,
  waterTrap,
  waterWave1Spell,
  waterWave2Spell,
  waveSpell,
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
} from "./sprites";
import { rerenderEntity } from "../../engine/systems/renderer";
import { MOVABLE } from "../../engine/components/movable";
import { REFERENCE } from "../../engine/components/reference";
import {
  Consumable,
  Item,
  Material,
  Materialized,
  Passive,
  Primary,
  Secondary,
  Stackable,
} from "../../engine/components/item";
import { generateUnitData, UnitKey } from "../balancing/units";
import { Gear, Tools } from "../../engine/components/equippable";

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
  state: SequenceState<InfoSequence>,
  content: Sprite[][],
  details?: Sprite[][]
) => {
  const verticalIndex = entity[POPUP].verticalIndex;
  const innerHeight = details
    ? frameHeight - detailsHeight - 3
    : frameHeight - 2;
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
  icon: Sprite = info,
  content: Sprite[][],
  details?: Sprite[][]
) => {
  let updated = false;
  let finished = !entity[POPUP].active;
  const generation = entity[RENDERABLE].generation;
  const popupMiddle = { x: 0, y: (frameHeight + 1) / -2 };
  const initial = !state.args.generation;
  const verticalIndex = entity[POPUP].verticalIndex;
  const scrollIndex =
    verticalIndex -
    scrolledVerticalIndex(world, entity, state, content, details);
  const contentSize =
    ((details ? frameHeight - detailsHeight - 1 : frameHeight) - 2) *
    (frameWidth - 2);
  const foldSize = (verticalIndex - scrollIndex) * (frameWidth - 2);
  const settled =
    state.args.contentIndex >= foldSize && state.elapsed > popupTime;
  let renderContent = false;
  let renderDetails = settled;

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

    if (details) {
      // add center decoration
      const centerStartParticle = world.assertByIdAndComponents(
        state.particles[`popup-left-${detailsHeight}`],
        [PARTICLE]
      );
      centerStartParticle[SPRITE] = popupCenterStart;
      const centerEndParticle = world.assertByIdAndComponents(
        state.particles[`popup-right-${frameHeight - detailsHeight - 3}`],
        [PARTICLE]
      );
      centerEndParticle[SPRITE] = popupCenterEnd;

      for (let i = 0; i < frameWidth - 2; i += 1) {
        const centerParticle = world.assertByIdAndComponents(
          state.particles[
            `popup-content-${frameHeight - detailsHeight - 3}-${i}`
          ],
          [PARTICLE]
        );
        centerParticle[SPRITE] = popupCenter;
      }
    }

    renderContent = true;
  }

  // rerender scroll handle
  if (
    content.length >
      (details ? frameHeight - detailsHeight - 3 : frameHeight - 2) &&
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
  }

  // popup content
  if (
    renderContent ||
    (state.elapsed > popupTime && state.args.contentIndex < contentSize)
  ) {
    const contentIndex = Math.floor((state.elapsed - popupTime) / contentDelay);
    const scrollContent = content
      .slice(scrollIndex)
      .slice(0, details ? frameHeight - detailsHeight - 3 : frameHeight - 2);

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

  // popup details
  if (renderDetails && details) {
    for (let row = 0; row < Math.min(detailsHeight, details.length); row += 1) {
      for (let column = 0; column < details[row].length; column += 1) {
        const char = details[row][column];
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

const entitySprites: Record<
  | Gear
  | Tools
  | Primary
  | Secondary
  | Passive
  | Stackable
  | Consumable
  | Materialized,
  Partial<
    Record<
      Material | "default",
      {
        sprite: Sprite;
        resource?: Sprite;
        display?: Sprite;
        description?: Sprite[][];
        getDescription?: () => Sprite[][]; // lazily initialized to avoid circular references
      }
    >
  >
> = {
  // gear
  sword: {
    // T1-T3
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
          ...createText("Gives "),
          ...createText("+", colors.green),
          ...createCountable({ power: 2 }, "power"),
          ...createText("Power", colors.green),
          ...createText("."),
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
          ...createText("Gives "),
          ...createText("+", colors.green),
          ...createCountable({ power: 4 }, "power"),
          ...createText("Power", colors.green),
          ...createText("."),
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
          ...createText("Gives "),
          ...createText("+", colors.green),
          ...createCountable({ power: 6 }, "power"),
          ...createText("Power", colors.green),
          ...createText("."),
        ],
      ],
    },

    // T4
    diamond: { sprite: diamondSword },
    fire: { sprite: fireSword },
    water: { sprite: waterSword },
    earth: { sprite: earthSword },

    // T5
    ruby: { sprite: rubySword },
    aether: { sprite: aetherSword },
    void: { sprite: voidSword },
    rainbow: { sprite: rainbowSword },
  },
  shield: {
    // T1-T3
    wood: {
      sprite: woodShield,
      getDescription: () => [
        createText("A simple shield"),
        [
          ...createText("made of "),
          ...createItemName({ stackable: "resource", material: "wood" }),
          ...createText("."),
        ],
        [
          ...createText("Gives "),
          ...createText("+", colors.green),
          ...createCountable({ armor: 1 }, "armor"),
          ...createText("Armor", colors.green),
          ...createText("."),
        ],
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
        [
          ...createText("Gives "),
          ...createText("+", colors.green),
          ...createCountable({ armor: 2 }, "armor"),
          ...createText("Armor", colors.green),
          ...createText("."),
        ],
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
        [
          ...createText("Gives "),
          ...createText("+", colors.green),
          ...createCountable({ armor: 3 }, "armor"),
          ...createText("Armor", colors.green),
          ...createText("."),
        ],
      ],
    },

    // T4
    diamond: { sprite: diamondShield },
    fire: { sprite: fireShield },
    water: { sprite: waterShield },
    earth: { sprite: earthShield },

    // T5
    ruby: { sprite: rubyShield },
    aether: { sprite: aetherShield },
    void: { sprite: voidShield },
    rainbow: { sprite: rainbowShield },
  },

  // equipments
  slash: {
    default: {
      sprite: slashActive,

      getDescription: () => [
        [
          ...createText("Use a "),
          ...createItemName({ stackable: "charge" }),

          ...createText(" to"),
        ],
        [
          ...createText("spin your "),
          ...createItemName({ equipment: "sword", material: "wood" }),
        ],
        [
          ...createText("with "),
          ...createText("50%", colors.green),
          getStatSprite("power"),
          ...createText("Power", colors.green),
          ...createText("."),
        ],
      ],
    },
  },
  bow: {
    default: {
      sprite: bowActive,

      getDescription: () => [
        [...createText("Shoot an "), ...createItemName({ stackable: "arrow" })],
        [
          ...createText("with "),
          ...createText("50%", colors.green),
          getStatSprite("power"),
          ...createText("Power", colors.green),
          ...createText(" of"),
        ],
        [
          ...createText("your "),
          ...createItemName({ equipment: "sword", material: "wood" }),
          ...createText("."),
        ],
      ],
    },
  },
  block: {
    default: { sprite: blockActive },
  },

  // spells
  wave1: {
    default: {
      sprite: waveSpell,
      getDescription: () => [
        [
          ...createText("Use "),
          ...createCountable({ mp: 1 }, "mp"),
          ...createText("MP", colors.blue),
          ...createText(" to cast"),
        ],
        createText("a magic wave."),
        [
          ...createText("Gives "),
          ...createText("+", colors.green),
          ...createCountable({ magic: 2 }, "magic"),
          ...createText("Magic", colors.green),
          ...createText("."),
        ],
      ],
    },
    fire: {
      sprite: fireWave1Spell,
      getDescription: () => [
        [
          ...createText("Use "),
          ...createCountable({ mp: 1 }, "mp"),
          ...createText("MP", colors.blue),
          ...createText(" to cast"),
        ],
        [
          ...createText("a "),
          ...createText("BURNING", colors.yellow),
          ...createText(" wave."),
        ],
        [
          ...createText("Gives "),
          ...createText("+", colors.green),
          ...createCountable({ magic: 2 }, "magic"),
          ...createText("Magic", colors.green),
          ...createText("."),
        ],
      ],
    },
    water: {
      sprite: waterWave1Spell,
      getDescription: () => [
        [
          ...createText("Use "),
          ...createCountable({ mp: 1 }, "mp"),
          ...createText("MP", colors.blue),
          ...createText(" to cast"),
        ],
        [
          ...createText("a "),
          ...createText("FROZEN", colors.aqua),
          ...createText(" wave."),
        ],
        [
          ...createText("Gives "),
          ...createText("+", colors.green),
          ...createCountable({ magic: 2 }, "magic"),
          ...createText("Magic", colors.green),
          ...createText("."),
        ],
      ],
    },
    earth: {
      sprite: earthWave1Spell,
      getDescription: () => [
        [
          ...createText("Use "),
          ...createCountable({ mp: 1 }, "mp"),
          ...createText("MP", colors.blue),
          ...createText(" to cast"),
        ],
        [
          ...createText("a "),
          ...createText("HEALING", colors.lime),
          ...createText(" wave."),
        ],
        [
          ...createText("Gives "),
          ...createText("+", colors.green),
          ...createCountable({ magic: 2 }, "magic"),
          ...createText("Magic", colors.green),
          ...createText("."),
        ],
      ],
    },
  },
  wave2: {
    fire: { sprite: fireWave2Spell },
    water: { sprite: waterWave2Spell },
    earth: { sprite: earthWave2Spell },
  },
  beam1: {
    default: {
      sprite: beamSpell,
      getDescription: () => [
        [
          ...createText("Use "),
          ...createCountable({ mp: 1 }, "mp"),
          ...createText("MP", colors.blue),
          ...createText(" to cast"),
        ],
        createText("a magic beam."),
        [
          ...createText("Gives "),
          ...createText("+", colors.green),
          ...createCountable({ magic: 4 }, "magic"),
          ...createText("Magic", colors.green),
          ...createText("."),
        ],
      ],
    },
    fire: {
      sprite: fireBeam1Spell,
      getDescription: () => [
        [
          ...createText("Use "),
          ...createCountable({ mp: 1 }, "mp"),
          ...createText("MP", colors.blue),
          ...createText(" to cast"),
        ],
        [
          ...createText("a "),
          ...createText("BURNING", colors.yellow),
          ...createText(" beam."),
        ],
        [
          ...createText("Gives "),
          ...createText("+", colors.green),
          ...createCountable({ magic: 4 }, "magic"),
          ...createText("Magic", colors.green),
          ...createText("."),
        ],
      ],
    },
    water: {
      sprite: waterBeam1Spell,
      getDescription: () => [
        [
          ...createText("Use "),
          ...createCountable({ mp: 1 }, "mp"),
          ...createText("MP", colors.blue),
          ...createText(" to cast"),
        ],
        [
          ...createText("a "),
          ...createText("FROZEN", colors.aqua),
          ...createText(" beam."),
        ],
        [
          ...createText("Gives "),
          ...createText("+", colors.green),
          ...createCountable({ magic: 4 }, "magic"),
          ...createText("Magic", colors.green),
          ...createText("."),
        ],
      ],
    },
    earth: {
      sprite: earthBeam1Spell,
      getDescription: () => [
        [
          ...createText("Use "),
          ...createCountable({ mp: 1 }, "mp"),
          ...createText("MP", colors.blue),
          ...createText(" to cast"),
        ],
        [
          ...createText("a "),
          ...createText("HEALING", colors.lime),
          ...createText(" beam."),
        ],
        [
          ...createText("Gives "),
          ...createText("+", colors.green),
          ...createCountable({ magic: 3 }, "magic"),
          ...createText("Magic", colors.green),
          ...createText("."),
        ],
      ],
    },
  },
  beam2: {
    fire: { sprite: fireBeam2Spell },
    water: { sprite: waterBeam2Spell },
    earth: { sprite: earthBeam2Spell },
  },
  trap1: {
    default: { sprite: trap },
    fire: { sprite: fireTrap },
    water: { sprite: waterTrap },
    earth: { sprite: earthTrap },
  },
  trap2: {
    fire: { sprite: fireTrap },
    water: { sprite: waterTrap },
    earth: { sprite: earthTrap },
  },

  // passive
  charm1: {
    wood: { sprite: charm },
    diamond: { sprite: diamondCharm1 },
    fire: { sprite: fireCharm1 },
    water: { sprite: waterCharm1 },
    earth: { sprite: earthCharm1 },
  },
  charm2: {
    diamond: { sprite: diamondCharm2 },
    fire: { sprite: fireCharm2 },
    water: { sprite: waterCharm2 },
    earth: { sprite: earthCharm2 },
    ruby: { sprite: rubyCharm2 },
    aether: { sprite: aetherCharm2 },
    void: { sprite: voidCharm2 },
    rainbow: { sprite: rainbowCharm2 },
  },
  pet1: {
    wood: { sprite: pet },
    diamond: { sprite: diamondPet1 },
    fire: { sprite: firePet1 },
    water: { sprite: waterPet1 },
    earth: { sprite: earthPet1 },
  },
  pet2: {
    diamond: { sprite: diamondPet2 },
    fire: { sprite: firePet2 },
    water: { sprite: waterPet2 },
    earth: { sprite: earthPet2 },
    ruby: { sprite: rubyPet2 },
    aether: { sprite: aetherPet2 },
    void: { sprite: voidPet2 },
    rainbow: { sprite: rainbowPet2 },
  },

  // tools
  compass: {
    default: { sprite: compass },
  },
  torch: {
    default: {
      sprite: torch,
      getDescription: () => [
        createText("Glows bright and"),
        createText("keeps you warm."),
        [
          ...createText("Gives "),
          ...createText("+", colors.green),
          ...createCountable({ sight: 3 }, "sight"),
          ...createText("Sight", colors.green),
          ...createText("."),
        ],
      ],
    },
  },

  // consumable
  map: {
    default: {
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
          getItemSprite({ materialized: "entry", material: "iron" }, "display"),
          ...createItemName({ materialized: "door", material: "iron" }),
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
          getItemSprite({ materialized: "entry", material: "gold" }, "display"),
          ...createItemName({ materialized: "door", material: "gold" }),
          ...createText("."),
        ],
        createText("Disappears after"),
        createText("use."),
      ],
    },
  },
  potion1: {
    fire: {
      sprite: hpFlask1,
      getDescription: () => [
        createText("Automatically"),
        [
          ...createText("restores "),
          ...createCountable({ hp: 2 }, "hp"),
          ...createText("HP", colors.red),
          ...createText(" on"),
        ],
        createText("low health."),
      ],
    },
    water: {
      sprite: mpFlask1,
      getDescription: () => [
        createText("Automatically"),
        [
          ...createText("restores "),
          ...createCountable({ mp: 1 }, "mp"),
          ...createText("MP", colors.blue),
          ...createText(" on"),
        ],
        createText("low mana."),
      ],
    },
  },
  potion2: {
    fire: { sprite: hpFlask2 },
    water: { sprite: mpFlask2 },
  },

  // materialized
  door: {
    default: { sprite: doorClosedWood },
    wood: { sprite: doorClosedWood },
    iron: { sprite: doorClosedIron },
    gold: { sprite: doorClosedGold },
    fire: { sprite: doorClosedFire },
  },
  entry: {
    default: { sprite: entryClosedWood, display: entryClosedWoodDisplay },
    wood: { sprite: entryClosedWood, display: entryClosedWoodDisplay },
    iron: { sprite: entryClosedIron, display: entryClosedIronDisplay },
  },
  gate: {
    default: { sprite: fenceDoor },
  },
  mine: {
    iron: { sprite: ironMine, display: ironMineDisplay },
    gold: { sprite: goldMine, display: goldMineDisplay },
  },

  // stackable
  coin: {
    default: {
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
          createUnitName("bandit")[0],
          ...createText("Enemies", colors.maroon),
          ...createText("."),
        ],
      ],
    },
  },
  stick: {
    default: {
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
  },
  ore: {
    default: {
      sprite: oreDrop,
      resource: ore,
      display: minCountable(oreDrop),
      getDescription: () => [
        createText("Traces of metal"),
        [
          ...createText("found in a "),
          minCountable(ore),
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
  },
  berry: {
    default: {
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
  },
  flower: {
    default: {
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
  },
  leaf: {
    default: {
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
  },
  apple: {
    default: {
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
        [
          ...createText("Eat to heal "),
          ...createCountable({ hp: 2 }, "hp"),
          ...createText("HP", colors.red),
          ...createText("."),
        ],
      ],
    },
  },
  shroom: {
    default: {
      sprite: shroom,
      getDescription: () => [
        createText("A savoury shroom"),
        createText("from the forest."),
        [
          ...createText("Eat to gain "),
          ...createCountable({ mp: 1 }, "mp"),
          ...createText("MP", colors.blue),
          ...createText("."),
        ],
      ],
    },
  },
  banana: {
    default: {
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
        [
          ...createText("Eat to heal "),
          ...createCountable({ hp: 5 }, "hp"),
          ...createText("HP", colors.red),
          ...createText("."),
        ],
      ],
    },
  },
  coconut: {
    default: {
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
        [
          ...createText("Eat to gain "),
          ...createCountable({ mp: 2 }, "mp"),
          ...createText("MP", colors.blue),
          ...createText("."),
        ],
      ],
    },
  },
  gem: {
    default: {
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
  },
  crystal: {
    default: {
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
  },
  herb: {
    default: {
      sprite: herb,
      getDescription: () => [
        [
          ...createItemName({ stackable: "flower" }),
          ...createText(" extract."),
        ],
        [
          ...createText("Eat to gain "),
          ...createCountable({ mp: 2 }, "mp"),
          ...createText("MP", colors.blue),
          ...createText("."),
        ],
        [
          ...createText("Base for "),
          ...createItemName({ consume: "potion1", material: "water" }),
          ...createText("."),
        ],
      ],
    },
  },
  fruit: {
    default: {
      sprite: fruit,
      getDescription: () => [
        [
          ...createText("Made from "),
          ...createItemName({ stackable: "berry" }),
          ...createText("."),
        ],
        [
          ...createText("Eat to heal "),
          ...createCountable({ hp: 5 }, "hp"),
          ...createText("HP", colors.red),
          ...createText("."),
        ],
        [
          ...createText("Base for "),
          ...createItemName({ consume: "potion1", material: "fire" }),
          ...createText("."),
        ],
      ],
    },
  },
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
    fire: {
      sprite: fireEssence,
      getDescription: () => [
        createText("Elemental spirit."),
        createText("Craft into fire"),
        [
          fireWave1Spell,
          fireBeam1Spell,
          ...createText("Spells", colors.grey),
          ...createText("."),
        ],
      ],
    },
    water: {
      sprite: waterEssence,
      getDescription: () => [
        createText("Elemental spirit."),
        createText("Craft into water"),
        [
          waterWave1Spell,
          waterBeam1Spell,
          ...createText("Spells", colors.grey),
          ...createText("."),
        ],
      ],
    },
    earth: {
      sprite: earthEssence,
      getDescription: () => [
        createText("Elemental spirit."),
        createText("Craft into earth"),
        [
          earthWave1Spell,
          earthBeam1Spell,
          ...createText("Spells", colors.grey),
          ...createText("."),
        ],
      ],
    },
    diamond: { sprite: diamond },
    ruby: { sprite: ruby },
  },
  seed: {
    default: {
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
  },
  ingot: { default: { sprite: ingot } },
  worm: { default: { sprite: worm } },
  arrow: {
    default: {
      sprite: arrow,
      getDescription: () => [
        createText("To be used with a"),
        [
          ...createItemName({ equipment: "secondary", secondary: "bow" }),
          ...createText(" for a long-"),
        ],
        createText("range attack."),
      ],
    },
  },
  bomb: { default: { sprite: bombActive } },
  charge: {
    default: {
      sprite: charge,
      getDescription: () => [
        createText("Can be used with"),
        [
          ...createItemName({ equipment: "secondary", secondary: "slash" }),
          ...createText(" as short-"),
        ],
        createText("range attack."),
      ],
    },
  },
};

export const getItemConfig = (
  item: Omit<Item, "amount" | "carrier" | "bound"> & {
    materialized?: Materialized;
  }
) => {
  const material = item.material || "default";

  if (item.stackable) {
    return entitySprites[item.stackable][material];
  }

  const lookup = item.equipment || item.consume || item.materialized;

  if (!lookup) return;

  if (lookup === "primary")
    return item.primary && entitySprites[item.primary][material];
  if (lookup === "secondary")
    return item.secondary && entitySprites[item.secondary][material];
  if (lookup === "passive")
    return item.passive && entitySprites[item.passive][material];

  const config = entitySprites[lookup][material];

  // don't render claws
  if (!config || (lookup === "sword" && !item.material)) return;

  return config;
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

  if (!itemConfig) return none;

  const sprite = (variant && itemConfig[variant]) || itemConfig.sprite;

  if (!sprite || (item.equipment === "sword" && !item.material)) return none;

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

export const getItemDescription = (
  item: Omit<Item, "carrier" | "bound" | "amount">
) => {
  const itemConfig = getItemConfig(item);

  if (!itemConfig) return [[]];

  if (itemConfig.getDescription) {
    itemConfig.description = itemConfig.getDescription();
    itemConfig.getDescription = undefined;
  }

  if (itemConfig.description)
    return itemConfig.description.map((line) =>
      addBackground(line, colors.black)
    );

  return [createText(itemConfig.sprite.name, colors.white, colors.black)];
};
