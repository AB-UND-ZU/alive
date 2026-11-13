import { Entity } from "ecs";
import { World } from "../ecs";
import type { SaveSummary } from "../../game/saves";

export type Restorable = {
  saves?: SaveSummary[];
  saveId?: string;
};

export const RESTORABLE = "RESTORABLE";

export default function addRestorable(
  world: World,
  entity: Entity,
  restorable: Restorable
) {
  world.addComponentToEntity(entity, RESTORABLE, restorable);
}
