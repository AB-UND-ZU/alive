import { isTouch } from "../../components/Dimensions";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { Inventory, INVENTORY } from "../../engine/components/inventory";
import { ITEM } from "../../engine/components/item";
import { LEVEL } from "../../engine/components/level";
import { POSITION } from "../../engine/components/position";
import { QuestSequence, Sequence } from "../../engine/components/sequencable";
import { TOOLTIP } from "../../engine/components/tooltip";
import { isUnlocked } from "../../engine/systems/action";
import {
  getIdentifier,
  getIdentifierAndComponents,
  setHighlight,
} from "../../engine/utils";
import { copy, getDistance } from "../math/std";
import { createDialog } from "./sprites";
import { END_STEP, QuestStage, START_STEP, step } from "./utils";

const monologueTime = 3000;
const houseDelay = 15000;

export const spawnQuest: Sequence<QuestSequence> = (world, entity, state) => {
  const stage: QuestStage<QuestSequence> = {
    world,
    entity,
    state,
    finished: false,
    updated: false,
  };

  const houseDoor = getIdentifierAndComponents(world, "guide_door", [POSITION]);

  if (!houseDoor) {
    return { finished: stage.finished, updated: stage.updated };
  }

  // remember initial hero position
  if (!state.args.memory.initialPosition) {
    state.args.memory.initialPosition = copy(entity[POSITION]);
  }

  const hasMoved =
    entity[POSITION].x !== state.args.memory.initialPosition.x ||
    entity[POSITION].y !== state.args.memory.initialPosition.y;

  step({
    stage,
    name: START_STEP,
    onEnter: () => true,
    isCompleted: () => state.elapsed > monologueTime || hasMoved,
    onLeave: () => "move",
  });

  step({
    stage,
    name: "move",
    onEnter: () => {
      entity[TOOLTIP].override = "visible";
      entity[TOOLTIP].dialogs = [
        createDialog(
          isTouch ? "Swipe to move" : "\u011a \u0117 \u0118 \u0119 to move"
        ),
      ];
      entity[TOOLTIP].changed = true;
      return true;
    },
    isCompleted: () => hasMoved,
    onLeave: () => {
      state.args.memory.moved = state.elapsed;

      entity[TOOLTIP].override = undefined;
      entity[TOOLTIP].dialogs = [];
      entity[TOOLTIP].changed = true;
      return "wait";
    },
  });

  step({
    stage,
    name: "wait",
    onEnter: () => true,
    isCompleted: () => state.elapsed > state.args.memory.moved + houseDelay,
    onLeave: () => "house",
  });

  step({
    stage,
    name: "house",
    onEnter: () => {
      entity[TOOLTIP].override = "visible";
      entity[TOOLTIP].dialogs = [createDialog("Where to go?")];
      entity[TOOLTIP].changed = true;
      return true;
    },
    isCompleted: () =>
      state.elapsed > state.args.memory.moved + houseDelay + monologueTime ||
      isUnlocked(world, houseDoor),
    onLeave: () => {
      entity[TOOLTIP].override = undefined;
      entity[TOOLTIP].dialogs = [];
      entity[TOOLTIP].changed = true;
      return END_STEP;
    },
  });

  return { finished: stage.finished, updated: stage.updated };
};

export const introQuest: Sequence<QuestSequence> = (world, entity, state) => {
  const stage: QuestStage<QuestSequence> = {
    world,
    entity,
    state,
    finished: false,
    updated: false,
  };
  const guideEntity = world.getEntityById(state.args.giver);
  const doorEntity = getIdentifier(world, "gate");

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
      setHighlight(world, "quest", getIdentifier(world, "wood_two"));
      return true;
    },
    isCompleted: () => !!entity[EQUIPPABLE].sword,
    onLeave: () => "prism",
  });

  const prismEntity = getIdentifier(world, "spawn_prism");
  const coinEntity = getIdentifierAndComponents(world, "spawn_prism:drop", [
    ITEM,
  ]);
  step({
    stage,
    name: "prism",
    onEnter: () => {
      setHighlight(world, "enemy", prismEntity);
      return true;
    },
    isCompleted: () => !prismEntity && !!coinEntity,
    onLeave: () => "coin",
  });

  step({
    stage,
    name: "coin",
    onEnter: () => {
      const carrierEntity = world.getEntityById(coinEntity?.[ITEM].carrier);
      setHighlight(world, "quest", carrierEntity);
      return true;
    },
    isCompleted: () => !coinEntity,
    onLeave: () => "buy",
  });

  step({
    stage,
    name: "buy",
    onEnter: () => {
      setHighlight(world);
      return true;
    },
    isCompleted: () =>
      (entity[INVENTORY] as Inventory).items.some(
        (item) =>
          world.assertByIdAndComponents(item, [ITEM])[ITEM].consume === "key"
      ),
    onLeave: () => "door",
  });

  step({
    stage,
    name: "door",
    onEnter: () => {
      setHighlight(world, "quest", doorEntity);
      return true;
    },
  });

  // end if guide dies or door is unlocked
  step({
    stage,
    name: "finish",
    forceEnter: () => !guideEntity || isUnlocked(world, doorEntity),
    onEnter: () => {
      setHighlight(world);
      return true;
    },
    isCompleted: () => true,
    onLeave: () => END_STEP,
  });

  return { updated: stage.updated, finished: stage.finished };
};

export const waypointQuest: Sequence<QuestSequence> = (
  world,
  entity,
  state
) => {
  const stage: QuestStage<QuestSequence> = {
    world,
    entity,
    state,
    finished: false,
    updated: false,
  };
  const { identifier, targetId, distance, highlight } = state.args.memory;

  const size = world.metadata.gameEntity[LEVEL].size;
  const targetEntity = identifier
    ? getIdentifierAndComponents(world, identifier, [POSITION])
    : world.getEntityByIdAndComponents(targetId || state.args.giver, [
        POSITION,
      ]);

  step({
    stage,
    name: START_STEP,
    isCompleted: () => !!targetEntity,
    onLeave: () => "search",
  });

  step({
    stage,
    name: "search",
    onEnter: () => {
      setHighlight(world, highlight || "quest", targetEntity);
      return true;
    },
    isCompleted: () =>
      !!targetEntity &&
      getDistance(entity[POSITION], targetEntity[POSITION], size) <= distance,
    onLeave: () => {
      setHighlight(world);
      return END_STEP;
    },
  });

  return { updated: stage.updated, finished: stage.finished };
};
