import { isTouch } from "../../components/Dimensions";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { FOCUSABLE } from "../../engine/components/focusable";
import { Inventory, INVENTORY } from "../../engine/components/inventory";
import { ITEM } from "../../engine/components/item";
import { LEVEL } from "../../engine/components/level";
import { LOCKABLE } from "../../engine/components/lockable";
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
import { TOOLTIP } from "../../engine/components/tooltip";
import { TRACKABLE } from "../../engine/components/trackable";
import { getLockable, isUnlocked } from "../../engine/systems/action";
import { getLootable } from "../../engine/systems/collect";
import { getCell } from "../../engine/systems/map";
import { isWalkable } from "../../engine/systems/movement";
import { isInPopup } from "../../engine/systems/popup";
import { getSequence } from "../../engine/systems/sequence";
import { isSpikable } from "../../engine/systems/spike";
import {
  assertIdentifierAndComponents,
  getIdentifier,
  getIdentifierAndComponents,
  setHighlight,
} from "../../engine/utils";
import { up2Cactus } from "../levels/tutorial/areas";
import { findPath } from "../math/path";
import { add, copy, getDistance } from "../math/std";
import { createDialog } from "./sprites";
import { END_STEP, QuestStage, START_STEP, step } from "./utils";

const menuDelay = 5000;

export const menuQuest: Sequence<QuestSequence> = (world, entity, state) => {
  const stage: QuestStage<QuestSequence> = {
    world,
    entity,
    state,
    finished: false,
    updated: false,
  };

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
    onLeave: () => "wait",
  });

  step({
    stage,
    name: "wait",
    isCompleted: () => hasMoved || stage.state.elapsed > menuDelay,
    onLeave: () => (hasMoved ? END_STEP : "move"),
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
      return END_STEP;
    },
  });

  return { finished: stage.finished, updated: stage.updated };
};

export const centerQuest: Sequence<QuestSequence> = (world, entity, state) => {
  const stage: QuestStage<QuestSequence> = {
    world,
    entity,
    state,
    finished: false,
    updated: false,
  };

  const centerUpDoor = assertIdentifierAndComponents(world, "center:door", [
    POSITION,
  ]);
  const spawnSign = getIdentifierAndComponents(world, "spawn_sign", [POSITION]);
  const spawnKey = getIdentifierAndComponents(world, "spawn_key", [POSITION]);

  // save hero position to update highlight
  if (!state.args.memory.savedPosition) {
    state.args.memory.savedPosition = copy(entity[POSITION]);
  }

  const hasMoved =
    entity[POSITION].x !== state.args.memory.savedPosition.x ||
    entity[POSITION].y !== state.args.memory.savedPosition.y;
  const inEntrance =
    getLockable(world, entity[POSITION])?.[LOCKABLE].type === "entry";

  step({
    stage,
    name: START_STEP,
    isCompleted: () => !inEntrance,
    onLeave: () => "move",
  });

  step({
    stage,
    name: "end",
    forceEnter: () =>
      isUnlocked(world, centerUpDoor) ||
      (state.args.step !== START_STEP && inEntrance) ||
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
    isCompleted: () => hasMoved,
    onLeave: () => "sign",
  });

  step({
    stage,
    name: "sign",
    onEnter: () => {
      setHighlight(world, "quest", spawnSign);
      return true;
    },
    isCompleted: () =>
      !!spawnSign &&
      !isInPopup(world, entity) &&
      !getSequence(world, spawnSign, "discovery"),
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

  const entityId = world.getEntityId(entity);

  const north1UpDoor = assertIdentifierAndComponents(world, "north1:door", [
    POSITION,
  ]);
  const guideEntity = getIdentifierAndComponents(world, "guide", [POSITION]);
  const guideSign = getIdentifierAndComponents(world, "guide_sign", [POSITION]);
  const woodThree = getIdentifierAndComponents(world, "wood_three", [POSITION]);
  const dummy = getIdentifierAndComponents(world, "dummy", [POSITION]);
  const coinDrop = getIdentifierAndComponents(world, "dummy:drop", [ITEM]);
  const inEntrance =
    getLockable(world, entity[POSITION])?.[LOCKABLE].type === "entry";

  step({
    stage,
    name: START_STEP,
    isCompleted: () => !inEntrance,
    onLeave: () => "sign",
  });

  step({
    stage,
    name: "end",
    forceEnter: () =>
      isUnlocked(world, north1UpDoor) ||
      (state.args.step !== START_STEP && inEntrance) ||
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
      !!guideSign &&
      !isInPopup(world, entity) &&
      !getSequence(world, guideSign, "discovery"),
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
    isCompleted: () => !dummy && !!coinDrop,
    onLeave: () => "coin",
  });

  step({
    stage,
    name: "coin",
    onEnter: () => {
      const carrierEntity = world.getEntityByIdAndComponents(
        coinDrop?.[ITEM].carrier,
        [POSITION]
      );
      setHighlight(world, "quest", carrierEntity);
      return true;
    },
    isCompleted: () => coinDrop?.[ITEM].carrier === entityId,
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
      }) && !isInPopup(world, entity),
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

export const north2Quest: Sequence<QuestSequence> = (world, entity, state) => {
  const stage: QuestStage<QuestSequence> = {
    world,
    entity,
    state,
    finished: false,
    updated: false,
  };

  const north2RightDoor = assertIdentifierAndComponents(
    world,
    "north2east1:door",
    [POSITION]
  );
  const fruitSign = getIdentifierAndComponents(world, "fruit_sign", [POSITION]);
  const fruitChest = getIdentifierAndComponents(world, "fruit_chest", [
    POSITION,
  ]);
  const inEntrance =
    getLockable(world, entity[POSITION])?.[LOCKABLE].type === "entry";

  step({
    stage,
    name: START_STEP,
    isCompleted: () => !inEntrance,
    onLeave: () => "cactus",
  });

  step({
    stage,
    name: "end",
    forceEnter: () =>
      isUnlocked(world, north2RightDoor) ||
      (state.args.step !== START_STEP && inEntrance) ||
      (!fruitSign && state.args.step === "sign"),
    onEnter: () => {
      setHighlight(world);
      return true;
    },
    isCompleted: () => true,
    onLeave: () => END_STEP,
  });

  const cactusEntities = [-1, 0, 1]
    .map((cactusOffset) =>
      Object.values(
        getCell(world, add(up2Cactus, { x: cactusOffset, y: 0 }))
      ).find((entity) => isSpikable(world, entity))
    )
    .filter(Boolean);
  step({
    stage,
    name: "cactus",
    onEnter: () => {
      setHighlight(world, "enemy", cactusEntities[1]);
      return true;
    },
    isCompleted: () => cactusEntities.length < 3,
    onLeave: () => "sign",
  });

  step({
    stage,
    name: "sign",
    onEnter: () => {
      setHighlight(world, "quest", fruitSign);
      return true;
    },
    isCompleted: () =>
      !!fruitSign &&
      !isInPopup(world, entity) &&
      !getSequence(world, fruitSign, "discovery"),
    onLeave: () => "chest",
  });

  step({
    stage,
    name: "chest",
    onEnter: () => {
      setHighlight(world, "enemy", fruitChest);
      return true;
    },
    isCompleted: () => !fruitChest,
    onLeave: () => "door",
  });

  step({
    stage,
    name: "door",
    onEnter: () => {
      setHighlight(world, "quest", north2RightDoor);
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
  const size = world.metadata.gameEntity[LEVEL].size;
  const spawnSign = getIdentifierAndComponents(world, "spawn_sign", [POSITION]);
  const earthChief = getIdentifierAndComponents(world, "earthChief", [
    POSITION,
  ]);

  const townDistance = earthChief
    ? getDistance(entity[POSITION], earthChief[POSITION], size)
    : Infinity;

  step({
    stage,
    name: START_STEP,
    onEnter: () => {
      setHighlight(world, "quest", spawnSign);
      return true;
    },
    isCompleted: () =>
      townDistance < 10 ||
      (isInPopup(world, entity) &&
        world.getEntityById(entity[PLAYER].popup) === spawnSign),
    onLeave: () => "town",
  });

  step({
    stage,
    name: "town",
    onEnter: () => {
      setHighlight(world, "quest", earthChief);
      return true;
    },
    isCompleted: () =>
      !earthChief ||
      (isInPopup(world, entity) &&
        entity[PLAYER].popup === world.getEntityId(earthChief)),
    onLeave: () => {
      setHighlight(world);
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
        ...world.metadata.gameEntity[LEVEL].cellPositions.ore,
        ...world.metadata.gameEntity[LEVEL].cellPositions.stone,
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
