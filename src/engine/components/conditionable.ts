import { Entity } from "ecs";
import { World } from "../ecs";
import { Orientation } from "./orientable";

export type ConditionType =
  | "zap"
  | "block"
  | "axe"
  | "pickaxe"
  | "shovel"
  | "hook"
  | "hammer"
  | "build";

export type Conditionable = Partial<
  Record<
    ConditionType,
    {
      item: number;
      generation: number;
      modifier: number;
      amount: number;
      orientation?: Orientation;
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
