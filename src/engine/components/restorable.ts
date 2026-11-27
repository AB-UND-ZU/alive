import type { TypedEntity } from "../entities";
import { World } from "../ecs";
import type { SaveSummary } from "../../game/saves";

export type Restorable = {
  saves?: SaveSummary[];
  saveId?: string;
};

export const RESTORABLE = "RESTORABLE";

export default function addRestorable(
  world: World,
  entity: TypedEntity,
  restorable: Restorable
) {
  world.addComponentToEntity(entity, RESTORABLE, restorable);
}
