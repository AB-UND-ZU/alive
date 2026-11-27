import type { TypedEntity } from "../entities";
import { World } from "../ecs";

export type Lootable = {
  disposable: boolean;
};

export const LOOTABLE = "LOOTABLE";

export default function addLootable(
  world: World,
  entity: TypedEntity,
  lootable: Lootable
) {
  world.addComponentToEntity(entity, LOOTABLE, lootable);
}
