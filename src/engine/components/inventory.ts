import { Entity } from "ecs";
import { World } from "../ecs";

export type Inventory = {
  items: number[];
};

export const INVENTORY = "INVENTORY";

export default function addInventory(
  world: World,
  entity: Entity,
  inventory: Inventory
) {
  world.addComponentToEntity(entity, INVENTORY, inventory);
}
