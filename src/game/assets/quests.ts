import { EQUIPPABLE } from "../../engine/components/equippable";
import { ITEM } from "../../engine/components/item";
import { LEVEL } from "../../engine/components/level";
import { POSITION } from "../../engine/components/position";
import { QuestSequence, Sequence } from "../../engine/components/sequencable";
import { SPAWNABLE } from "../../engine/components/spawnable";
import { STATS } from "../../engine/components/stats";
import { isUnlocked } from "../../engine/systems/action";
import { add, getDistance } from "../math/std";
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
      world.setFocus(world.getIdentifier("wood_two"));
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
    onLeave: () => "prism",
  });

  const prismEntity = world.getIdentifier("prism");
  step({
    stage,
    name: "prism",
    onEnter: () => {
      world.setFocus(prismEntity);
      return true;
    },
    isCompleted: () => !prismEntity,
    onLeave: () => "collect",
  });

  step({
    stage,
    name: "collect",
    onEnter: () => {
      world.setFocus(guideEntity);
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
    forceEnter: () => !guideEntity || isUnlocked(world, doorEntity),
    onEnter: () => {
      world.setFocus();
      return true;
    },
    isCompleted: () => true,
  });

  return { updated: stage.updated, finished: stage.finished };
};

const welcomeDistance = 1.3;
export const townQuest: Sequence<QuestSequence> = (world, entity, state) => {
  const stage: QuestStage<QuestSequence> = {
    world,
    entity,
    state,
    finished: false,
    updated: false,
  };

  const size = world.metadata.gameEntity[LEVEL].size;
  const welcomeEntity = world.getIdentifierAndComponents("welcome", [POSITION]);

  step({
    stage,
    name: START_STEP,
    isCompleted: () => !!welcomeEntity,
    onLeave: () => "search",
  });

  step({
    stage,
    name: "search",
    onEnter: () => {
      world.setFocus(welcomeEntity);
      return true;
    },
    isCompleted: () =>
      !!welcomeEntity &&
      getDistance(entity[POSITION], welcomeEntity[POSITION], size) <=
        welcomeDistance,
    onLeave: () => {
      world.setFocus();
      if (welcomeEntity) {
        entity[SPAWNABLE].position = add(welcomeEntity[POSITION], {
          x: -2,
          y: 0,
        });
      }
      return END_STEP;
    },
  });

  return { updated: stage.updated, finished: stage.finished };
};

const tombstoneDistance = 3;
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

  const tombstoneEntity = world.getEntityByIdAndComponents(state.args.giver, [
    POSITION,
  ]);
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
