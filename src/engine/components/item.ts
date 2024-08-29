import { Entity } from "ecs";
import { World } from "../ecs";
import { Inventory } from "./inventory";

export type Item = {
  amount: number;
  slot: keyof Inventory
};

export const ITEM = "ITEM";

export default function addItem(world: World, entity: Entity, item: Item) {
  world.addComponentToEntity(entity, ITEM, item);
}
