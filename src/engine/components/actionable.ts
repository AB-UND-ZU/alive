import { Entity } from "ecs";
import { World } from "../ecs";

export type Actionable = {
  quest?: number;
  unlock?: number;
  triggered: boolean;
};

export const ACTIONABLE = "ACTIONABLE";

export default function addActionable(
  world: World,
  entity: Entity,
  actionable: Actionable
) {
  world.addComponentToEntity(entity, ACTIONABLE, actionable);
}
