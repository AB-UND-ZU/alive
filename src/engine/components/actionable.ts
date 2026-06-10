import { Entity } from "ecs";
import { World } from "../ecs";

export const actions = [
  "warp",
  "spawn",
  "unlock",
  "plant",
  "popup",
  "trade",
  "use",
  "add",
  "spell",
  "skill",
  "tool",
  "mount",
] as const;

export type Actionable = {
  spellTriggered: boolean;
  skillTriggered: boolean;
  interactTriggered: boolean;
  toolEquipped: boolean;
} & Partial<Record<(typeof actions)[number], number | undefined>>;

export const ACTIONABLE = "ACTIONABLE";

export default function addActionable(
  world: World,
  entity: Entity,
  actionable: Actionable
) {
  world.addComponentToEntity(entity, ACTIONABLE, actionable);
}
