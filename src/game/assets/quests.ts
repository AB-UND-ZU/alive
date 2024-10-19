import { Entity } from "ecs";
import { isTouch } from "../../components/Dimensions";
import { entities, World } from "../../engine";
import {
  ANIMATABLE,
  Animation,
  AnimationState,
} from "../../engine/components/animatable";
import { BEHAVIOUR } from "../../engine/components/behaviour";
import { COUNTABLE, emptyCountable } from "../../engine/components/countable";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { FOG } from "../../engine/components/fog";
import { ITEM } from "../../engine/components/item";
import { LEVEL } from "../../engine/components/level";
import { LIGHT } from "../../engine/components/light";
import { POSITION } from "../../engine/components/position";
import { RENDERABLE } from "../../engine/components/renderable";
import { SPAWNABLE } from "../../engine/components/spawnable";
import { SPRITE } from "../../engine/components/sprite";
import { TOOLTIP } from "../../engine/components/tooltip";
import { VIEWABLE } from "../../engine/components/viewable";
import {
  getAvailableQuest,
  isLocked,
  isUnlocked,
} from "../../engine/systems/action";
import { collectItem } from "../../engine/systems/collect";
import {
  disposeEntity,
  getCell,
  registerEntity,
} from "../../engine/systems/map";
import { rerenderEntity } from "../../engine/systems/renderer";
import { lockDoor } from "../../engine/systems/trigger";
import { add, getDistance, normalize } from "../math/std";
import { initialPosition, menuArea } from "./areas";
import {
  button,
  buttonColor,
  createDialog,
  createStat,
  fog,
  goldKey,
  goldSword,
  heart,
  quest,
} from "./sprites";
import { END_STEP, START_STEP } from "./utils";
import { isDead } from "../../engine/systems/damage";
import { findAdjacentWalkable } from "../../engine/systems/drop";
import { COLLIDABLE } from "../../engine/components/collidable";
import { ATTACKABLE } from "../../engine/components/attackable";
import { DROPPABLE } from "../../engine/components/droppable";
import { INVENTORY } from "../../engine/components/inventory";
import { ORIENTABLE } from "../../engine/components/orientable";

type QuestStage = {
  world: World;
  entity: Entity;
  state: AnimationState<"quest">;
  updated: boolean;
  finished: boolean;
};

const STEP_DEBUG = false;

const step = ({
  stage,
  name,
  forceEnter = () => false,
  onEnter = () => true,
  isCompleted = () => false,
  onLeave = () => END_STEP,
}: {
  stage: QuestStage;
  name: string;
  forceEnter?: () => boolean;
  onEnter?: () => boolean;
  isCompleted?: () => boolean;
  onLeave?: () => string;
}) => {
  const forced = forceEnter();
  const questName = STEP_DEBUG && stage.entity[ANIMATABLE].states.quest.name;

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

export const worldNpc: Animation<"quest"> = (world, entity, state) => {
  const stage: QuestStage = {
    world,
    entity,
    state,
    finished: false,
    updated: false,
  };

  const heroEntity = world.getIdentifier("hero");
  const focusEntity = world.getIdentifier("focus");
  const doorEntity = world.getIdentifier("door");
  const compassEntity = world.getIdentifier("compass");

  if (!heroEntity || !focusEntity || !doorEntity || !compassEntity) {
    return { finished: stage.finished, updated: stage.updated };
  }

  // finish if player reached exit
  step({
    stage,
    name: START_STEP,
    isCompleted: () =>
      heroEntity[POSITION].x === 0 && heroEntity[POSITION].y === 7,
    onLeave: () => {
      // set camera to player
      entity[VIEWABLE].active = false;
      heroEntity[VIEWABLE].active = true;

      // close door
      lockDoor(world, doorEntity);

      // set player light and spawn
      heroEntity[LIGHT].brightness = 5.55;
      heroEntity[LIGHT].visibility = 5.55;
      heroEntity[SPAWNABLE].position = { x: 0, y: 9 };

      // give player compass if not already done
      const compassCarrier = compassEntity[ITEM].carrier;
      if (compassCarrier !== world.getEntityId(heroEntity)) {
        const containerEntity = world.getEntityById(
          compassEntity[ITEM].carrier
        );
        collectItem(world, heroEntity, containerEntity);
      }

      // clear spawn area
      const menuRows = menuArea.split("\n");
      const menuColumns = menuRows[0].split("");
      const size = world.metadata.gameEntity[LEVEL].size;
      for (
        let columnIndex = 0;
        columnIndex <= menuColumns.length;
        columnIndex += 1
      ) {
        for (let rowIndex = 0; rowIndex <= menuRows.length; rowIndex += 1) {
          const x = normalize(columnIndex - (menuColumns.length - 1) / 2, size);
          const y = normalize(rowIndex - (menuRows.length - 1) / 2, size);
          const cell = getCell(world, { x, y });
          const shouldDiscard = (y < 6 || y > 153) && (x < 11 || x > 149);
          let hasAir = false;
          Object.values(cell).forEach((cellEntity) => {
            // don't remove player and focus
            if (
              cellEntity === heroEntity ||
              cellEntity === focusEntity ||
              cellEntity === entity
            )
              return;

            if (!hasAir && cellEntity[FOG].type === "air") hasAir = true;

            if (shouldDiscard && cellEntity[FOG].type !== "air") {
              disposeEntity(world, cellEntity);
              return;
            }

            cellEntity[FOG].visibility = "hidden";
            rerenderEntity(world, cellEntity);
          });

          // restore removed air particles
          if (!hasAir) {
            entities.createGround(world, {
              [FOG]: { visibility: "hidden", type: "air" },
              [POSITION]: { x, y },
              [RENDERABLE]: { generation: 0 },
              [SPRITE]: fog,
            });
          }
        }
      }

      return END_STEP;
    },
  });

  return { finished: stage.finished, updated: stage.updated };
};

export const guideNpc: Animation<"quest"> = (world, entity, state) => {
  const stage: QuestStage = {
    world,
    entity,
    state,
    finished: false,
    updated: false,
  };

  const focusEntity = world.getIdentifier("focus");
  const doorEntity = world.getIdentifier("door");
  const houseDoor = world.getIdentifier("house_door");
  const compassEntity = world.getIdentifier("compass");

  const heroEntity = world.getIdentifier("hero");
  const keyEntity = world.getIdentifier("key");
  const chestEntity = world.getIdentifier("compass_chest");

  if (!focusEntity || !doorEntity || !houseDoor || !compassEntity) {
    return { finished: stage.finished, updated: stage.updated };
  }

  step({
    stage,
    name: START_STEP,
    onEnter: () => {
      entity[TOOLTIP].override = "visible";
      entity[TOOLTIP].dialogs = [
        createDialog(
          isTouch ? "Swipe to move" : "\u011a \u0117 \u0118 \u0119 to move"
        ),
      ];
      return true;
    },
    isCompleted: () =>
      !!heroEntity &&
      (heroEntity[POSITION].x !== initialPosition.x ||
        heroEntity[POSITION].y !== initialPosition.y),
    onLeave: () => "quest",
  });

  step({
    stage,
    name: "quest",
    onEnter: () => {
      world.offerQuest(entity, "introQuest");
      entity[TOOLTIP].override = undefined;
      entity[TOOLTIP].changed = true;
      entity[TOOLTIP].dialogs = [
        createDialog("Hi stranger."),
        createDialog("How are you?"),
        isTouch
          ? [
              ...createDialog("Tap on "),
              ..."Quest".split("").map((char) => ({
                name: "text_generic",
                layers: [...button.layers, { char, color: buttonColor }],
              })),
            ]
          : createDialog("Press SPACE."),
        createDialog("A new quest!"),
        createDialog("Let's leave."),
      ];
      return true;
    },
    isCompleted: () => !getAvailableQuest(world, entity),
    onLeave: () => "chest",
  });

  // fall back if hero dies
  const guidePosition = { x: 0, y: 159 };
  step({
    stage,
    name: "abort",
    forceEnter: () =>
      stage.state.args.step !== START_STEP &&
      stage.state.args.step !== "quest" &&
      stage.state.args.step !== "enrage" &&
      (!heroEntity || isDead(world, heroEntity)),
    onEnter: () => {
      entity[TOOLTIP].override = undefined;
      entity[TOOLTIP].changed = true;
      entity[TOOLTIP].dialogs = [];
      entity[BEHAVIOUR].patterns = [
        {
          name: "move",
          memory: { targetPosition: guidePosition },
        },
      ];
      return true;
    },
    isCompleted: () =>
      entity[POSITION].x === guidePosition.x &&
      entity[POSITION].y === guidePosition.y,
    onLeave: () => "quest",
  });

  step({
    stage,
    name: "chest",
    onEnter: () => {
      entity[TOOLTIP].override = undefined;
      entity[TOOLTIP].changed = true;
      entity[TOOLTIP].dialogs = [createDialog("Grab this!")];

      if (!chestEntity) return true;

      entity[TOOLTIP].override = "visible";
      entity[BEHAVIOUR].patterns = [
        {
          name: "kill",
          memory: { target: world.getEntityId(chestEntity) },
        },
        {
          name: "dialog",
          memory: { override: undefined },
        },
        {
          name: "move",
          memory: { targetPosition: guidePosition },
        },
      ];

      return true;
    },
    isCompleted: () =>
      heroEntity &&
      heroEntity[EQUIPPABLE].melee &&
      heroEntity[EQUIPPABLE].compass,
    onLeave: () => "gold",
  });

  step({
    stage,
    name: "gold",
    onEnter: () => {
      entity[TOOLTIP].changed = undefined;
      entity[TOOLTIP].changed = true;
      entity[TOOLTIP].dialogs = [
        [...createDialog("Collect "), ...createStat({ gold: 5 }, "gold")],
      ];
      return true;
    },
    isCompleted: () => !!heroEntity && heroEntity[COUNTABLE].gold >= 5,
    onLeave: () => {
      entity[TOOLTIP].override = "visible";
      entity[TOOLTIP].changed = true;
      entity[TOOLTIP].dialogs = [[...createDialog("Use this "), goldKey]];
      const carrierEntity =
        keyEntity && world.getEntityById(keyEntity[ITEM].carrier);

      if (carrierEntity === entity) return "sell";

      return "door";
    },
  });

  const unlockPosition = add(houseDoor[POSITION], { x: 0, y: 1 });
  step({
    stage,
    name: "door",
    onEnter: () => {
      entity[BEHAVIOUR].patterns = [
        {
          name: "move",
          memory: { targetPosition: unlockPosition },
        },
      ];
      return true;
    },
    isCompleted: () =>
      entity[POSITION].x === unlockPosition.x &&
      entity[POSITION].y === unlockPosition.y,
    onLeave: () => {
      entity[TOOLTIP].override = undefined;
      entity[TOOLTIP].changed = true;
      entity[TOOLTIP].dialogs = [];
      return "collect";
    },
  });

  step({
    stage,
    name: "collect",
    onEnter: () => {
      entity[BEHAVIOUR].patterns = [
        {
          name: "unlock",
          memory: {
            target: world.getEntityId(houseDoor),
          },
        },
        {
          name: "collect",
          memory: {
            item: world.getEntityId(keyEntity),
          },
        },
        {
          name: "move",
          memory: {
            targetPosition: unlockPosition,
          },
        },
        {
          name: "lock",
          memory: {
            target: world.getEntityId(houseDoor),
          },
        },
      ];
      return true;
    },
    isCompleted: () =>
      keyEntity?.[ITEM].carrier === world.getEntityId(entity) &&
      entity[POSITION].x === unlockPosition.x &&
      entity[POSITION].y === unlockPosition.y &&
      isLocked(world, houseDoor),
    onLeave: () => "sell",
  });

  // warn player if door is opened by player
  step({
    stage,
    name: "warn",
    forceEnter: () =>
      !state.args.memory.warned &&
      stage.state.args.step !== "collect" &&
      isUnlocked(world, houseDoor),
    onEnter: () => {
      state.args.memory.warned = true;
      const previousDialog = { ...entity[TOOLTIP], changed: true };

      entity[TOOLTIP].override = "visible";
      entity[TOOLTIP].changed = true;
      entity[TOOLTIP].dialogs = [createDialog("Keep out!")];
      entity[BEHAVIOUR].patterns.unshift(
        {
          name: "wait",
          memory: { ticks: 4 },
        },
        {
          name: "dialog",
          memory: previousDialog,
        }
      );
      return false;
    },
  });

  const sellPosition = { x: 155, y: 159 };
  step({
    stage,
    name: "sell",
    onEnter: () => {
      entity[BEHAVIOUR].patterns = [
        {
          name: "sell",
          memory: {
            targetPosition: sellPosition,
            item: world.getEntityId(keyEntity),
            activation: [{ counter: "gold", amount: 5 }],
          },
        },
        {
          name: "move",
          memory: {
            targetPosition: guidePosition,
          },
        },
        {
          name: "dialog",
          memory: {
            override: undefined,
            changed: true,
            dialogs: [createDialog("Ready?")],
          },
        },
      ];
      return true;
    },
  });

  step({
    stage,
    name: "enrage",
    forceEnter: () =>
      stage.state.args.step !== "sell" &&
      !!keyEntity &&
      !!heroEntity &&
      !isDead(world, heroEntity) &&
      keyEntity[ITEM].carrier === world.getEntityId(heroEntity),
    onEnter: () => {
      entity[BEHAVIOUR].patterns = [
        {
          name: "enrage",
          memory: { shout: "Thief\u0112" },
        },
        {
          name: "kill",
          memory: {
            target: world.getEntityId(heroEntity),
          },
        },
        {
          name: "soothe",
          memory: {},
        },
        {
          name: "dialog",
          memory: {
            override: undefined,
            changed: true,
            dialogs: [],
          },
        },
        {
          name: "collect",
          memory: {
            item: world.getEntityId(keyEntity),
          },
        },
        {
          name: "move",
          memory: {
            targetPosition: unlockPosition,
          },
        },
        {
          name: "lock",
          memory: {
            target: world.getEntityId(houseDoor),
          },
        },
        {
          name: "move",
          memory: {
            targetPosition: guidePosition,
          },
        },
      ];
      return true;
    },
    isCompleted: () =>
      entity[POSITION].x === guidePosition.x &&
      entity[POSITION].y === guidePosition.y &&
      ((!keyEntity && heroEntity && !isDead(world, heroEntity)) ||
        (!!keyEntity && keyEntity[ITEM].carrier === world.getEntityId(entity))),
    onLeave: () => {
      state.args.memory.warned = false;
      return "quest";
    },
  });

  step({
    stage,
    name: "goodbye",
    forceEnter: () =>
      isUnlocked(world, doorEntity) && state.args.step !== "enrage",
    onEnter: () => {
      entity[TOOLTIP].override = "visible";
      entity[TOOLTIP].changed = true;
      entity[TOOLTIP].dialogs = [createDialog("Good luck!")];
      return true;
    },
  });

  return { finished: stage.finished, updated: stage.updated };
};

export const introQuest: Animation<"quest"> = (world, entity, state) => {
  const stage: QuestStage = {
    world,
    entity,
    state,
    finished: false,
    updated: false,
  };
  const guideEntity = world.getEntityById(state.args.giver);
  const doorEntity = world.getIdentifier("door");

  if (!doorEntity) {
    return { updated: stage.updated, finished: stage.finished };
  }

  step({
    stage,
    name: START_STEP,
    isCompleted: () => !!entity[EQUIPPABLE].compass,
    onLeave: () => "sword",
  });

  step({
    stage,
    name: "sword",
    onEnter: () => {
      world.setFocus(world.getIdentifier("wood_two"));
      return true;
    },
    isCompleted: () => !!entity[EQUIPPABLE].melee,
    onLeave: () => "pot",
  });

  const potEntity = world.getIdentifier("pot");
  step({
    stage,
    name: "pot",
    onEnter: () => {
      world.setFocus(potEntity);
      return true;
    },
    isCompleted: () => !potEntity,
    onLeave: () => "coin",
  });

  const coinEntity = world.getIdentifier("coin");
  step({
    stage,
    name: "coin",
    onEnter: () => {
      world.setFocus(coinEntity);
      return true;
    },
    isCompleted: () => !coinEntity,
    onLeave: () => "triangle",
  });

  const triangleEntity = world.getIdentifier("triangle");
  step({
    stage,
    name: "triangle",
    onEnter: () => {
      world.setFocus(triangleEntity);
      return true;
    },
    isCompleted: () => !triangleEntity,
    onLeave: () => "collect",
  });

  step({
    stage,
    name: "collect",
    onEnter: () => {
      world.setFocus(guideEntity);
      return true;
    },
    isCompleted: () => entity[COUNTABLE].gold >= 5,
    onLeave: () => "buy",
  });

  const keyEntity = world.getIdentifier("key");
  step({
    stage,
    name: "buy",
    onEnter: () => {
      world.setFocus();
      return true;
    },
    isCompleted: () =>
      !!keyEntity && keyEntity[ITEM].carrier === world.getEntityId(entity),
    onLeave: () => "door",
  });

  step({
    stage,
    name: "door",
    onEnter: () => {
      world.setFocus(doorEntity);
      return true;
    },
  });

  // end if guide dies or door is unlocked
  step({
    stage,
    name: "finish",
    forceEnter: () =>
      !guideEntity ||
      isDead(world, guideEntity) ||
      isUnlocked(world, doorEntity),
    onEnter: () => {
      world.setFocus();
      return true;
    },
    isCompleted: () => true,
  });

  return { updated: stage.updated, finished: stage.finished };
};

const townDistance = 2;
const townPosition = { x: 60, y: 60 };
export const signNpc: Animation<"quest"> = (world, entity, state) => {
  const stage: QuestStage = {
    world,
    entity,
    state,
    finished: false,
    updated: false,
  };

  const heroEntity = world.getIdentifier("hero");
  const townEntity = world.getIdentifier("town");
  const size = world.metadata.gameEntity[LEVEL].size;

  step({
    stage,
    name: START_STEP,
    forceEnter: () => !heroEntity || isDead(world, heroEntity),
    onEnter: () => {
      entity[TOOLTIP].dialogs = [createDialog("Find the town")];
      entity[TOOLTIP].changed = true;

      return true;
    },
    isCompleted: () =>
      !!heroEntity &&
      !isDead(world, heroEntity) &&
      !getAvailableQuest(world, entity),
    onLeave: () => "idle",
  });

  step({
    stage,
    name: "idle",
    onEnter: () => {
      entity[TOOLTIP].changed = true;
      entity[TOOLTIP].dialogs = [createDialog("See compass")];

      if (world.getIdentifier("town")) return true;

      const swordEntity = entities.createSword(world, {
        [ANIMATABLE]: { states: {} },
        [ITEM]: { slot: "melee", amount: 5, material: "gold" },
        [ORIENTABLE]: {},
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: goldSword,
      });
      const townEntity = entities.createChest(world, {
        [ANIMATABLE]: { states: {} },
        [ATTACKABLE]: { enemy: true },
        [COLLIDABLE]: {},
        [COUNTABLE]: { ...emptyCountable, hp: 99, maxHp: 99 },
        [DROPPABLE]: { decayed: false },
        [FOG]: { visibility: "hidden", type: "terrain" },
        [INVENTORY]: { items: [world.getEntityId(swordEntity)], size: 1 },
        [POSITION]: findAdjacentWalkable(world, townPosition, 20),
        [RENDERABLE]: { generation: 0 },
        [SPRITE]: heart,
        [TOOLTIP]: { dialogs: [], persistent: false, nextDialog: -1 },
      });
      swordEntity[ITEM].carrier = world.getEntityId(townEntity);
      registerEntity(world, townEntity);
      world.setIdentifier(townEntity, "town");
      return true;
    },
    isCompleted: () =>
      !!heroEntity &&
      !!townEntity &&
      getDistance(heroEntity[POSITION], townEntity[POSITION], size) <=
        townDistance,
    onLeave: () => {
      entity[TOOLTIP].changed = true;
      entity[TOOLTIP].dialogs = [];

      if (townEntity) {
        townEntity[TOOLTIP].idle = quest;
        townEntity[TOOLTIP].changed = true;
        townEntity[TOOLTIP].dialogs = [createDialog("Coming soon...")];
      }

      return END_STEP;
    },
  });

  return { updated: stage.updated, finished: stage.finished };
};

export const townQuest: Animation<"quest"> = (world, entity, state) => {
  const stage: QuestStage = {
    world,
    entity,
    state,
    finished: false,
    updated: false,
  };

  const townEntity = world.getIdentifier("town");
  const size = world.metadata.gameEntity[LEVEL].size;

  step({
    stage,
    name: START_STEP,
    isCompleted: () => !!townEntity,
    onLeave: () => "search",
  });

  step({
    stage,
    name: "search",
    onEnter: () => {
      world.setFocus(townEntity);
      return true;
    },
    isCompleted: () =>
      !!townEntity &&
      getDistance(entity[POSITION], townEntity[POSITION], size) <= townDistance,
    onLeave: () => {
      world.setFocus();
      return END_STEP;
    },
  });

  return { updated: stage.updated, finished: stage.finished };
};

const tombstoneDistance = 3;
export const tombstoneQuest: Animation<"quest"> = (world, entity, state) => {
  const stage: QuestStage = {
    world,
    entity,
    state,
    finished: false,
    updated: false,
  };

  const tombstoneEntity = world.getEntityById(state.args.giver);
  const size = world.metadata.gameEntity[LEVEL].size;

  step({
    stage,
    name: START_STEP,
    onEnter: () => {
      world.setFocus(tombstoneEntity);
      return true;
    },
    isCompleted: () =>
      !!tombstoneEntity &&
      getDistance(entity[POSITION], tombstoneEntity[POSITION], size) <=
        tombstoneDistance,
    onLeave: () => {
      world.setFocus();
      return END_STEP;
    },
  });

  return { updated: stage.updated, finished: stage.finished };
};
