import { Entity } from "ecs";
import { World } from "../ecs";

export const actions = ['spawn', 'unlock', 'trade', 'quest', 'bow'] as const;

export type Actionable = {
  triggered: boolean;
} & Partial<Record<typeof actions[number], number | undefined>>;

export const ACTIONABLE = "ACTIONABLE";

export default function addActionable(
  world: World,
  entity: Entity,
  actionable: Actionable
) {
  world.addComponentToEntity(entity, ACTIONABLE, actionable);
}
