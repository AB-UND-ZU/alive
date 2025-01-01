import { Entity } from "ecs";
import { World } from "../ecs";
import * as quests from '../../game/assets/quests'

export type Quest = {
  name: keyof typeof quests;
  memory: any;
  available: boolean;
  retry: boolean;
};

export const QUEST = "QUEST";

export default function addQuest(
  world: World,
  entity: Entity,
  quest: Quest
) {
  world.addComponentToEntity(entity, QUEST, quest);
}
