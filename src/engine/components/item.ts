import { Entity } from "ecs";
import { World } from "../ecs";
import { Equippable } from "./equippable";
import { Countable } from "./countable";

export type Item = {
  amount: number;
  slot?: keyof Equippable;
  counter?: keyof Countable;
};

export const ITEM = "ITEM";

export default function addItem(world: World, entity: Entity, item: Item) {
  world.addComponentToEntity(entity, ITEM, item);
}
