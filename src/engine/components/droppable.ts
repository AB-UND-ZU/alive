import type { TypedEntity } from "../entities";
import { World } from "../ecs";
import { Sprite } from "./sprite";

export type Droppable = {
  decayed: boolean;
  evaporate?: { sprite: Sprite; fast: boolean };
};

export const DROPPABLE = "DROPPABLE";

export default function addDroppable(
  world: World,
  entity: TypedEntity,
  droppable: Droppable
) {
  world.addComponentToEntity(entity, DROPPABLE, droppable);
}
