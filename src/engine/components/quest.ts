import { Entity } from "ecs";
import { World } from "../ecs";

export type Quest = {
  name?: string;
};

export const QUEST = "QUEST";

export default function addQuest(
  world: World,
  entity: Entity,
  quest: Quest
) {
  world.addComponentToEntity(entity, QUEST, quest);
}
