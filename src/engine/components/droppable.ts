import { Entity } from "ecs";
import { World } from "../ecs";
import { Sprite } from "./sprite";

export type Droppable = {
  decayed: boolean;
  remains?: Sprite;
  evaporate?: { sprite: Sprite; fast: boolean };
};

export const DROPPABLE = "DROPPABLE";

export default function addDroppable(
  world: World,
  entity: Entity,
  droppable: Droppable
) {
  world.addComponentToEntity(entity, DROPPABLE, droppable);
}
