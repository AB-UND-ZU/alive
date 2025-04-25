import { isTouch } from "../../components/Dimensions";
import { entities } from "../../engine";
import { BEHAVIOUR } from "../../engine/components/behaviour";
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
import { disposeEntity, getCell, moveEntity } from "../../engine/systems/map";
import { rerenderEntity } from "../../engine/systems/renderer";
import { lockDoor } from "../../engine/systems/trigger";
import { add, getDistance, normalize, signedDistance } from "../math/std";
import { initialPosition, menuArea } from "../levels/areas";
import { button, buttonColor, createDialog, fog } from "./sprites";
import { END_STEP, QuestStage, START_STEP, step } from "./utils";
import { isDead } from "../../engine/systems/damage";
import {
  NpcSequence,
  SEQUENCABLE,
  Sequence,
} from "../../engine/components/sequencable";
import { STATS } from "../../engine/components/stats";
import { CASTABLE } from "../../engine/components/castable";
import { defaultLight } from "../../engine/systems/consume";
import { QUEST } from "../../engine/components/quest";

export const worldNpc: Sequence<NpcSequence> = (world, entity, state) => {
  const stage: QuestStage<NpcSequence> = {
    world,
    entity,
    state,
    finished: false,
    updated: false,
  };
  const size = world.metadata.gameEntity[LEVEL].size;
  const { townPosition, townWidth, townHeight } = state.args.memory;

  const heroEntity = world.getIdentifierAndComponents("hero", [
    POSITION,
    VIEWABLE,
    LIGHT,
    SPAWNABLE,
  ]);
  const focusEntity = world.getIdentifier("focus");
  const doorEntity = world.getIdentifier("gate");
  const compassEntity = world.getIdentifierAndComponents("compass", [ITEM]);

  if (!heroEntity || !focusEntity || !doorEntity || !compassEntity) {
    return { finished: stage.finished, updated: stage.updated };
  }

  // clear area if player reached exit
  step({
    stage,
    name: START_STEP,
    isCompleted: () =>
      heroEntity[POSITION].x === 0 && heroEntity[POSITION].y === 6,
    onLeave: () => {
      // set camera to player
      entity[VIEWABLE].active = false;
      heroEntity[VIEWABLE].active = true;

      // close door
      lockDoor(world, doorEntity);

      // set player light and spawn
      heroEntity[LIGHT] = { ...defaultLight };
      heroEntity[SPAWNABLE].position = { x: 0, y: 9 };
      heroEntity[SPAWNABLE].light = { ...defaultLight };

      const spawnEntity = world.getIdentifier("spawn");
      if (spawnEntity) {
        moveEntity(world, spawnEntity, heroEntity[SPAWNABLE].position);
        world.setNeedle(spawnEntity);
      }

      // give player compass if not already done
      const compassCarrier = compassEntity[ITEM].carrier;
      if (compassCarrier !== world.getEntityId(heroEntity)) {
        const containerEntity = world.assertById(compassEntity[ITEM].carrier);
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
          const shouldDiscard = (y < 5 || y > 153) && (x < 11 || x > 149);
          let hasAir = false;
          Object.values(cell).forEach((cellEntity) => {
            // don't remove player and focus, and any unrelated entities
            if (
              cellEntity === heroEntity ||
              cellEntity === focusEntity ||
              cellEntity === entity ||
              cellEntity === spawnEntity ||
              !(RENDERABLE in cellEntity) ||
              CASTABLE in cellEntity
            )
              return;

            if (!hasAir && cellEntity[FOG]?.type === "air") hasAir = true;

            if (shouldDiscard && cellEntity[FOG]?.type !== "air") {
              disposeEntity(world, cellEntity);
              return;
            }

            if (cellEntity[FOG]) cellEntity[FOG].visibility = "hidden";
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

      // clear invisible walls
      for (let offset = 0; offset < 3; offset += 1) {
        const mountainEntity = world.getIdentifier(`mountain-${offset}`);
        disposeEntity(world, mountainEntity!);
      }

      return "town";
    },
  });

  step({
    stage,
    name: "town",
    isCompleted: () =>
      heroEntity &&
      Math.abs(signedDistance(heroEntity[POSITION].x, townPosition.x, size)) <
        townWidth / 2 &&
      Math.abs(signedDistance(heroEntity[POSITION].y, townPosition.y, size)) <
        townHeight / 2,
    onLeave: () => {
      heroEntity[SPAWNABLE].position = add(townPosition, {
        x: 0,
        y: 1,
      });
      const spawnEntity = world.getIdentifier("spawn");

      if (spawnEntity) {
        moveEntity(world, spawnEntity, heroEntity[SPAWNABLE].position);
        world.setNeedle(spawnEntity);
      }
      return END_STEP;
    },
  });

  return { finished: stage.finished, updated: stage.updated };
};

export const guideNpc: Sequence<NpcSequence> = (world, entity, state) => {
  const stage: QuestStage<NpcSequence> = {
    world,
    entity,
    state,
    finished: false,
    updated: false,
  };

  const focusEntity = world.getIdentifier("focus");
  const doorEntity = world.getIdentifier("gate");
  const houseDoor = world.getIdentifierAndComponents("guide_door", [POSITION]);
  const compassEntity = world.getIdentifier("compass");

  const heroEntity = world.getIdentifierAndComponents("hero", [
    POSITION,
    EQUIPPABLE,
    STATS,
  ]);
  const keyEntity = world.getIdentifierAndComponents("key", [ITEM]);
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
      world.offerQuest(entity, "introQuest", {});

      entity[TOOLTIP].override = undefined;
      entity[TOOLTIP].changed = true;
      entity[TOOLTIP].dialogs = [
        createDialog("Hi stranger"),
        createDialog("How are you?"),
        isTouch
          ? [
              ...createDialog("Tap on "),
              ..."Quest".split("").map((char) => ({
                name: "text_generic",
                layers: [...button.layers, { char, color: buttonColor }],
              })),
            ]
          : createDialog("Press SPACE"),
        createDialog("Let's leave"),
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
      !heroEntity,
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
      !!heroEntity &&
      !!heroEntity[EQUIPPABLE].sword &&
      !!heroEntity[EQUIPPABLE].compass,
    onLeave: () => "coin",
  });

  step({
    stage,
    name: "coin",
    onEnter: () => {
      entity[TOOLTIP].changed = undefined;
      entity[TOOLTIP].changed = true;
      entity[TOOLTIP].dialogs = [createDialog("Collect 5 coins")];
      return true;
    },
    isCompleted: () => !!heroEntity && heroEntity[STATS].coin >= 5,
    onLeave: () => {
      entity[TOOLTIP].override = "visible";
      entity[TOOLTIP].changed = true;
      entity[TOOLTIP].dialogs = [createDialog("Use this key")];
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
            item: world.getEntityId(world.assertIdentifier("key")),
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

  const sellPosition = { x: 156, y: 159 };
  step({
    stage,
    name: "sell",
    onEnter: () => {
      entity[BEHAVIOUR].patterns = [
        {
          name: "sell",
          memory: {
            targetPosition: sellPosition,
            item: world.getEntityId(world.assertIdentifier("key")),
            activation: [{ stat: "coin", amount: 5 }],
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
            target: world.getEntityId(world.assertIdentifier("hero")),
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
            item: world.getEntityId(world.assertIdentifier("key")),
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
      entity[TOOLTIP].idle = undefined;
      return true;
    },
  });

  return { finished: stage.finished, updated: stage.updated };
};

const welcomeDistance = 1.3;
export const signNpc: Sequence<NpcSequence> = (world, entity, state) => {
  const stage: QuestStage<NpcSequence> = {
    world,
    entity,
    state,
    finished: false,
    updated: false,
  };

  const heroEntity = world.getIdentifierAndComponents("hero", [
    POSITION,
    SPAWNABLE,
  ]);
  const size = world.metadata.gameEntity[LEVEL].size;
  const welcomeEntity = world.getIdentifierAndComponents("welcome", [POSITION]);

  step({
    stage,
    name: START_STEP,
    forceEnter: () => !heroEntity,
    onEnter: () => {
      entity[TOOLTIP].dialogs = [createDialog("Find the town")];
      entity[TOOLTIP].changed = true;

      return true;
    },
    isCompleted: () => !!heroEntity && !getAvailableQuest(world, entity),
    onLeave: () => "idle",
  });

  step({
    stage,
    name: "idle",
    onEnter: () => {
      entity[TOOLTIP].changed = true;
      entity[TOOLTIP].dialogs = [createDialog("Follow the arrow")];
      return true;
    },
  });

  // complete if player is now spawning in town
  step({
    stage,
    name: "finish",
    forceEnter: () =>
      !!welcomeEntity &&
      !!heroEntity &&
      getDistance(
        heroEntity[SPAWNABLE].position,
        welcomeEntity[POSITION],
        size
      ) <= welcomeDistance,
    isCompleted: () => true,
    onLeave: () => {
      entity[TOOLTIP].changed = true;
      entity[TOOLTIP].idle = undefined;
      entity[TOOLTIP].dialogs = [];
      entity[QUEST].available = false;
      return END_STEP;
    },
  });

  return { updated: stage.updated, finished: stage.finished };
};

export const tombstoneNpc: Sequence<NpcSequence> = (world, entity, state) => {
  const stage: QuestStage<NpcSequence> = {
    world,
    entity,
    state,
    finished: false,
    updated: false,
  };

  step({
    stage,
    name: START_STEP,
    isCompleted: () => !entity[SEQUENCABLE].states.vision,
    onLeave: () => "rip",
  });

  step({
    stage,
    name: "rip",
    onEnter: () => {
      entity[TOOLTIP].dialogs = [createDialog("RIP")];
      entity[TOOLTIP].override = "visible";
      entity[TOOLTIP].changed = true;

      return true;
    },
    isCompleted: () => !getAvailableQuest(world, entity),
    onLeave: () => {
      return "focus";
    },
  });

  step({
    stage,
    name: "focus",
    onEnter: () => {
      entity[TOOLTIP].dialogs = [createDialog("RIP")];
      entity[TOOLTIP].override = "visible";
      entity[TOOLTIP].changed = true;

      return true;
    },
    isCompleted: () => !getAvailableQuest(world, entity),
    onLeave: () => END_STEP,
  });

  return { updated: stage.updated, finished: stage.finished };
};
