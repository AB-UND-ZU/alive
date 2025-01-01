import { EQUIPPABLE } from "../../engine/components/equippable";
import { ITEM } from "../../engine/components/item";
import { LEVEL } from "../../engine/components/level";
import { POSITION } from "../../engine/components/position";
import { QuestSequence, Sequence } from "../../engine/components/sequencable";
import { STATS } from "../../engine/components/stats";
import { isUnlocked } from "../../engine/systems/action";
import { getDistance } from "../math/std";
import { END_STEP, QuestStage, START_STEP, step } from "./utils";

export const introQuest: Sequence<QuestSequence> = (world, entity, state) => {
  const stage: QuestStage<QuestSequence> = {
    world,
    entity,
    state,
    finished: false,
    updated: false,
  };
  const guideEntity = world.getEntityById(state.args.giver);
  const doorEntity = world.getIdentifier("gate");

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
      world.setHighlight("quest", world.getIdentifier("wood_two"));
      return true;
    },
    isCompleted: () => !!entity[EQUIPPABLE].sword,
    onLeave: () => "pot",
  });

  const potEntity = world.getIdentifier("pot");
  step({
    stage,
    name: "pot",
    onEnter: () => {
      world.setHighlight("enemy", potEntity);
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
      world.setHighlight("quest", coinEntity);
      return true;
    },
    isCompleted: () => !coinEntity,
    onLeave: () => "prism",
  });

  const prismEntity = world.getIdentifier("prism");
  step({
    stage,
    name: "prism",
    onEnter: () => {
      world.setHighlight("enemy", prismEntity);
      return true;
    },
    isCompleted: () => !prismEntity,
    onLeave: () => "collect",
  });

  step({
    stage,
    name: "collect",
    onEnter: () => {
      world.setHighlight("quest", guideEntity);
      return true;
    },
    isCompleted: () => entity[STATS].coin >= 5,
    onLeave: () => "buy",
  });

  const keyEntity = world.getIdentifierAndComponents("key", [ITEM]);
  step({
    stage,
    name: "buy",
    onEnter: () => {
      world.setHighlight();
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
      world.setHighlight("quest", doorEntity);
      return true;
    },
  });

  // end if guide dies or door is unlocked
  step({
    stage,
    name: "finish",
    forceEnter: () => !guideEntity || isUnlocked(world, doorEntity),
    onEnter: () => {
      world.setHighlight();
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
    ? world.getIdentifierAndComponents(identifier, [POSITION])
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
      world.setHighlight(highlight || "quest", targetEntity);
      return true;
    },
    isCompleted: () =>
      !!targetEntity &&
      getDistance(entity[POSITION], targetEntity[POSITION], size) <= distance,
    onLeave: () => {
      world.setHighlight();
      return END_STEP;
    },
  });

  return { updated: stage.updated, finished: stage.finished };
};
