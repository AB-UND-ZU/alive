import type { TypedEntity } from "../entities";
import { World } from "../ecs";
import { Sprite } from "./sprite";

export type Tooltip = {
  idle?: Sprite;
  dialogs: Sprite[][];
  nextDialog: number;
  persistent: boolean;
  override?: "visible" | "hidden" | "idle";
  changed?: boolean;
  enemy?: boolean;
  lastTooltip?: number;
};

export const TOOLTIP = "TOOLTIP";

export default function addTooltip(
  world: World,
  entity: TypedEntity,
  tooltip: Tooltip
) {
  world.addComponentToEntity(entity, TOOLTIP, tooltip);
}
