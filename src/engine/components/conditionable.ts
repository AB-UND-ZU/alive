import { Entity } from "ecs";
import { World } from "../ecs";

export type ConditionType = "raise" | "block";

export type Conditionable = Partial<
  Record<
    ConditionType,
    {
      generation: number;
      duration: number;
    }
  >
>;

export const CONDITIONABLE = "CONDITIONABLE";

export default function addConditionable(
  world: World,
  entity: Entity,
  conditionable: Conditionable
) {
  world.addComponentToEntity(entity, CONDITIONABLE, conditionable);
}
