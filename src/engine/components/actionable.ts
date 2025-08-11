import { Entity } from "ecs";
import { World } from "../ecs";

export const actions = [
  "spawn",
  "unlock",
  "popup",
  "trade",
  "use",
  "close",
  "claim",
  "quest",
  "primary",
  "secondary",
] as const;

export type Actionable = {
  primaryTriggered: boolean;
  secondaryTriggered: boolean;
} & Partial<Record<(typeof actions)[number], number | undefined>>;

export const ACTIONABLE = "ACTIONABLE";

export default function addActionable(
  world: World,
  entity: Entity,
  actionable: Actionable
) {
  world.addComponentToEntity(entity, ACTIONABLE, actionable);
}
