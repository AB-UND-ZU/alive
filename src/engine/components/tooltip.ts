import { Entity } from "ecs";
import { World } from "../ecs";

export type Tooltip = {
  dialogs: string[];
  nextDialog: number;
  persistent: boolean;
  override?: boolean;
};

export const TOOLTIP = "TOOLTIP";

export default function addTooltip(
  world: World,
  entity: Entity,
  tooltip: Tooltip
) {
  world.addComponentToEntity(entity, TOOLTIP, tooltip);
}
