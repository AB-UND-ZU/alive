import { Entity } from "ecs";
import { World } from "../ecs";
import { Equippable } from "./equippable";
import { Countable } from "./countable";

export type Resource = "wood" | "iron" | "gold" | "diamond";
export type Element = "fire" | "water" | "earth";
export type Legendary = "ruby" | "aether" | "void" | "rainbow";
export type Material = Resource | Element | Legendary;

export type Consumable = "key";

export type Materialized = "door";

export type Item = {
  carrier: number;
  amount: number;
  material?: Material;
  slot?: keyof Equippable;
  counter?: keyof Countable;
  consume?: Consumable;
};

export const ITEM = "ITEM";

export default function addItem(world: World, entity: Entity, item: Item) {
  world.addComponentToEntity(entity, ITEM, item);
}
