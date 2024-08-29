import { Entity } from "ecs";
import { World } from "../ecs";
import { Equippable } from "./equippable";

export type Item = {
  amount: number;
  slot: keyof Equippable;
};

export const ITEM = "ITEM";

export default function addItem(world: World, entity: Entity, item: Item) {
  world.addComponentToEntity(entity, ITEM, item);
}
