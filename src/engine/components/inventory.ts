import type { TypedEntity } from "../entities";
import { World } from "../ecs";

export type Inventory = {
  items: number[];
};

export const INVENTORY = "INVENTORY";

export default function addInventory(
  world: World,
  entity: TypedEntity,
  inventory: Inventory
) {
  world.addComponentToEntity(entity, INVENTORY, inventory);
}
