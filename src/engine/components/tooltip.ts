import { Entity } from "ecs";
import { World } from "../ecs";
import { Sprite } from "./sprite";

export type Tooltip = {
  idle?: Sprite;
  dialogs: Sprite[][];
  nextDialog: number;
  persistent: boolean;
  override?: "visible" | "hidden";
  changed?: boolean;
};

export const TOOLTIP = "TOOLTIP";

export default function addTooltip(
  world: World,
  entity: Entity,
  tooltip: Tooltip
) {
  world.addComponentToEntity(entity, TOOLTIP, tooltip);
}
