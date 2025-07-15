import { isTouch } from "../../components/Dimensions";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { FOCUSABLE } from "../../engine/components/focusable";
import { Inventory, INVENTORY } from "../../engine/components/inventory";
import { ITEM } from "../../engine/components/item";
import { LEVEL } from "../../engine/components/level";
import {
  orientationPoints,
  orientations,
} from "../../engine/components/orientable";
import { POSITION } from "../../engine/components/position";
import {
  QuestSequence,
  SEQUENCABLE,
  Sequence,
} from "../../engine/components/sequencable";
import { SPAWNABLE } from "../../engine/components/spawnable";
import { STATS } from "../../engine/components/stats";
import { TOOLTIP } from "../../engine/components/tooltip";
import { TRACKABLE } from "../../engine/components/trackable";
import { isUnlocked } from "../../engine/systems/action";
import { getLootable } from "../../engine/systems/collect";
import { isWalkable } from "../../engine/systems/movement";
import {
  getIdentifier,
  getIdentifierAndComponents,
  setHighlight,
} from "../../engine/utils";
import { findPath } from "../math/path";
import { add, copy, getDistance } from "../math/std";
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
  const signEntity = getIdentifier(world, "spawn_sign");

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

  // point to exit if guide dies or door is unlocked
  step({
    stage,
    name: "exit",
    forceEnter: () =>
      state.args.step !== "sign" &&
      (!guideEntity || isUnlocked(world, doorEntity)),
    onEnter: () => {
      setHighlight(world, "quest", signEntity);
      return true;
    },
    isCompleted: () => true,
    onLeave: () => "sign",
  });

  // never end as it will be replaced with sign quest
  step({
    stage,
    name: "sign",
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

const tombstoneDistance = 1.3;

export const tombstoneQuest: Sequence<QuestSequence> = (
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
  const size = world.metadata.gameEntity[LEVEL].size;
  const tombstoneEntity = world.getEntityByIdAndComponents(state.args.giver, [
    POSITION,
  ]);

  step({
    stage,
    name: START_STEP,
    isCompleted: () => !!tombstoneQuest,
    onLeave: () => "search",
  });

  step({
    stage,
    name: "search",
    onEnter: () => {
      setHighlight(world, "tombstone", tombstoneEntity);
      return true;
    },
    isCompleted: () =>
      !!tombstoneEntity &&
      getDistance(entity[POSITION], tombstoneEntity[POSITION], size) <=
        tombstoneDistance,
    onLeave: () => {
      setHighlight(world);

      // restart existing quest
      const currentQuest = entity[SPAWNABLE].quest;
      if (currentQuest) {
        currentQuest.args.step = START_STEP;
        entity[SEQUENCABLE].states.quest = currentQuest;
        entity[SPAWNABLE].quest = undefined;
        return "continue";
      }

      return END_STEP;
    },
  });

  return { updated: stage.updated, finished: stage.finished };
};

export const nomadQuest: Sequence<QuestSequence> = (world, entity, state) => {
  const stage: QuestStage<QuestSequence> = {
    world,
    entity,
    state,
    finished: false,
    updated: false,
  };
  const signEntity = world.getEntityById(state.args.giver);
  const nomadEntity = getIdentifier(world, "nomad");
  const smithEntity = getIdentifier(world, "smith");
  const doorEntity = getIdentifier(world, "chief_door");
  const focusEntity = getIdentifierAndComponents(world, "focus", [
    FOCUSABLE,
    TRACKABLE,
  ]);
  const size = world.metadata.gameEntity[LEVEL].size;

  if (state.args.memory.oreStat === undefined) {
    state.args.memory.oreStat = entity[STATS].ore;
  }

  if (!focusEntity || !signEntity || !doorEntity) {
    return { updated: stage.updated, finished: stage.finished };
  }

  step({
    stage,
    name: START_STEP,
    isCompleted: () => true,
    onLeave: () => "ore:focus",
  });

  const hasIron = entity[INVENTORY].items.some((itemId: number) => {
    const item = world.assertByIdAndComponents(itemId, [ITEM])[ITEM];
    return item.stackable === "resource" && item.material === "iron";
  });

  const hasKey = entity[INVENTORY].items.some((itemId: number) => {
    const item = world.assertByIdAndComponents(itemId, [ITEM])[ITEM];
    return item.consume === "key" && item.material === "iron";
  });

  step({
    stage,
    name: "ore:focus",
    onEnter: () => {
      // find closest ore to collect which are walkable
      const ores = [
        ...world.metadata.gameEntity[LEVEL].cells.ore,
        ...world.metadata.gameEntity[LEVEL].cells.stone,
      ]
        .map((ore) => getLootable(world, ore))
        .filter(
          (ore): ore is NonNullable<typeof ore> =>
            !!ore &&
            orientations.some((orientation) =>
              isWalkable(
                world,
                add(ore[POSITION], orientationPoints[orientation])
              )
            )
        );

      if (ores.length === 0 || entity[STATS].ore >= 10 || hasIron || hasKey) {
        setHighlight(world);
        return true;
      }

      // pick 10 closest by simple distance
      const closestOres = ores
        .sort(
          (left, right) =>
            getDistance(entity[POSITION], left[POSITION], size) -
            getDistance(entity[POSITION], right[POSITION], size)
        )
        .slice(0, 10);

      // sort by walkable distance
      const orePaths = closestOres
        .map((ore) => ({
          ore,
          path: findPath(
            world.metadata.gameEntity[LEVEL].walkable,
            entity[POSITION],
            ore[POSITION],
            true,
            true
          ),
        }))
        .filter(({ path }) => path.length > 0);
      orePaths.sort((left, right) => left.path.length - right.path.length);

      const targetOre = orePaths[0]?.ore;
      setHighlight(world, "quest", targetOre);

      return true;
    },
    isCompleted: () => true,
    onLeave: () => (entity[STATS].ore >= 10 ? "iron" : "ore:collect"),
  });

  step({
    stage,
    name: "ore:collect",
    isCompleted: () =>
      hasKey || hasIron || entity[STATS].ore > state.args.memory.oreStat,
    onLeave: () => {
      state.args.memory.oreStat = entity[STATS].ore;

      if (entity[STATS].ore >= 10 || hasIron || hasKey) {
        setHighlight(world);
        return "iron";
      }

      return "ore:focus";
    },
  });

  step({
    stage,
    name: "iron",
    onEnter: () => {
      setHighlight(world, "quest", smithEntity);
      return true;
    },
    isCompleted: () => hasIron || hasKey,
    onLeave: () => "key",
  });

  step({
    stage,
    name: "key",
    onEnter: () => {
      setHighlight(world, "quest", nomadEntity);
      return true;
    },
    isCompleted: () => hasKey,
    onLeave: () => "door",
  });

  step({
    stage,
    name: "door",
    onEnter: () => {
      setHighlight(world, "quest", doorEntity);
      return true;
    },
    isCompleted: () => isUnlocked(world, doorEntity),
    onLeave: () => {
      setHighlight(world);
      return END_STEP;
    },
  });

  return { updated: stage.updated, finished: stage.finished };
};
