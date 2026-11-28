import type { TypedEntity } from "../entities";
import { World } from "../ecs";
import type { XpSequence } from "./sequencable";

export type Lootable = {
  disposable: boolean;
  crack?: number;
  droppedBy?: number;
  offering?: XpSequence["offering"];
};

export const LOOTABLE = "LOOTABLE";

export default function addLootable(
  world: World,
  entity: TypedEntity,
  lootable: Lootable
) {
  world.addComponentToEntity(entity, LOOTABLE, lootable);
}
