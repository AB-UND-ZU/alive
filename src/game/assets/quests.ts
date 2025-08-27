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
import { PLAYER } from "../../engine/components/player";
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
import { getCell } from "../../engine/systems/map";
import { isWalkable } from "../../engine/systems/movement";
import { isInPopup } from "../../engine/systems/popup";
import {
  assertIdentifierAndComponents,
  getIdentifier,
  getIdentifierAndComponents,
  setHighlight,
} from "../../engine/utils";
import { findPath } from "../math/path";
import { add, copy, getDistance } from "../math/std";
import { createDialog } from "./sprites";
import { END_STEP, QuestStage, START_STEP, step } from "./utils";

export const centerQuest: Sequence<QuestSequence> = (world, entity, state) => {
  const stage: QuestStage<QuestSequence> = {
    world,
    entity,
    state,
    finished: false,
    updated: false,
  };

  const centerUpDoor = assertIdentifierAndComponents(world, "center_up_door", [
    POSITION,
  ]);
  const spawnSign = getIdentifierAndComponents(world, "spawn_sign", [POSITION]);
  const spawnKey = getIdentifierAndComponents(world, "spawn_key", [POSITION]);

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
    isCompleted: () => true,
    onLeave: () => "move",
  });

  step({
    stage,
    name: "end",
    forceEnter: () =>
      isUnlocked(world, centerUpDoor) ||
      (!spawnSign && state.args.step === "sign"),
    onEnter: () => {
      setHighlight(world);
      return true;
    },
    isCompleted: () => true,
    onLeave: () => END_STEP,
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
      entity[TOOLTIP].override = undefined;
      entity[TOOLTIP].dialogs = [];
      entity[TOOLTIP].changed = true;
      return "sign";
    },
  });

  step({
    stage,
    name: "sign",
    onEnter: () => {
      setHighlight(world, "quest", spawnSign);
      return true;
    },
    isCompleted: () =>
      !!spawnSign && world.getEntityById(entity[PLAYER].popup) === spawnSign,
    onLeave: () => "key",
  });

  step({
    stage,
    name: "key",
    onEnter: () => {
      setHighlight(world, "quest", spawnKey);
      return true;
    },
    isCompleted: () => !spawnKey,
    onLeave: () => "door",
  });

  step({
    stage,
    name: "door",
    onEnter: () => {
      setHighlight(world, "quest", centerUpDoor);
      return true;
    },
  });

  return { finished: stage.finished, updated: stage.updated };
};

export const north1Quest: Sequence<QuestSequence> = (world, entity, state) => {
  const stage: QuestStage<QuestSequence> = {
    world,
    entity,
    state,
    finished: false,
    updated: false,
  };

  const north1UpDoor = assertIdentifierAndComponents(world, "north1_up_door", [
    POSITION,
  ]);
  const guideEntity = getIdentifierAndComponents(world, "guide", [POSITION]);
  const guideSign = getIdentifierAndComponents(world, "guide_sign", [POSITION]);
  const woodThree = getIdentifierAndComponents(world, "wood_three", [POSITION]);
  const dummy = Object.values(
    getCell(world, world.metadata.gameEntity[LEVEL].cells["dummy"][0])
  ).filter((entity) => !(FOCUSABLE in entity))[0];

  step({
    stage,
    name: START_STEP,
    isCompleted: () => true,
    onLeave: () => "sign",
  });

  step({
    stage,
    name: "end",
    forceEnter: () =>
      isUnlocked(world, north1UpDoor) ||
      (!guideSign && state.args.step === "sign"),
    onEnter: () => {
      setHighlight(world);
      return true;
    },
    isCompleted: () => true,
    onLeave: () => END_STEP,
  });

  step({
    stage,
    name: "sign",
    onEnter: () => {
      setHighlight(world, "quest", guideSign);
      return true;
    },
    isCompleted: () =>
      !!guideSign && world.getEntityById(entity[PLAYER].popup) === guideSign,
    onLeave: () => "stick",
  });

  step({
    stage,
    name: "stick",
    onEnter: () => {
      setHighlight(world, "quest", woodThree);
      return true;
    },
    isCompleted: () => !!entity[EQUIPPABLE].sword,
    onLeave: () => "dummy",
  });

  step({
    stage,
    name: "dummy",
    onEnter: () => {
      setHighlight(world, "enemy", dummy);
      return true;
    },
    isCompleted: () => !dummy || !(STATS in dummy),
    onLeave: () => "shop",
  });

  step({
    stage,
    name: "shop",
    onEnter: () => {
      setHighlight(world, "quest", guideEntity);
      return true;
    },
    isCompleted: () =>
      !!(entity[INVENTORY] as Inventory).items.find((item) => {
        const itemEntity = world.assertByIdAndComponents(item, [ITEM]);
        return (
          itemEntity[ITEM].consume === "key" &&
          itemEntity[ITEM].material === "iron"
        );
      }),
    onLeave: () => "door",
  });

  step({
    stage,
    name: "door",
    onEnter: () => {
      setHighlight(world, "quest", north1UpDoor);
      return true;
    },
  });

  return { finished: stage.finished, updated: stage.updated };
};

export const spawnQuest: Sequence<QuestSequence> = (world, entity, state) => {
  const stage: QuestStage<QuestSequence> = {
    world,
    entity,
    state,
    finished: false,
    updated: false,
  };
  const spawnSign = getIdentifier(world, "spawn_sign");
  const townSign = getIdentifier(world, "town_sign");

  step({
    stage,
    name: START_STEP,
    onEnter: () => {
      setHighlight(world, "quest", spawnSign);
      return true;
    },
    isCompleted: () => isInPopup(world, entity) || !spawnSign,
    onLeave: () => {
      setHighlight(world, "quest", townSign);
      return END_STEP;
    },
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
  const currentOre =
    (entity[INVENTORY] as Inventory).items
      .map((itemId) => world.assertByIdAndComponents(itemId, [ITEM]))
      .find((item) => item[ITEM].stackable === "ore")?.[ITEM].amount || 0;

  if (state.args.memory.currentOre === undefined) {
    state.args.memory.currentOre = currentOre;
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

      if (ores.length === 0 || currentOre >= 10 || hasIron || hasKey) {
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
    onLeave: () => (currentOre >= 10 ? "iron" : "ore:collect"),
  });

  step({
    stage,
    name: "ore:collect",
    isCompleted: () =>
      hasKey || hasIron || currentOre > state.args.memory.currentOre,
    onLeave: () => {
      state.args.memory.currentOre = currentOre;

      if (currentOre >= 10 || hasIron || hasKey) {
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
