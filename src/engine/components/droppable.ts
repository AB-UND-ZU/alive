import { Entity } from "ecs";
import { World } from "../ecs";

export type Droppable = {
  decayed: boolean;
};

export const DROPPABLE = "DROPPABLE";

export default function addDroppable(
  world: World,
  entity: Entity,
  droppable: Droppable
) {
  world.addComponentToEntity(entity, DROPPABLE, droppable);
}
