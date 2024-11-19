import { Entity } from "ecs";
import { World } from "../ecs";
import { Equipment } from "./equippable";
import { Stats } from "./stats";

export type Resource = "wood" | "iron" | "gold" | "diamond";
export type Element = "fire" | "water" | "earth";
export type Legendary = "ruby" | "aether" | "void" | "rainbow";
export type Material = Resource | Element | Legendary;

export type Spell = "wave1" | "wave2" | "bolt1" | "bolt2" | "trap1" | "trap2";
export type Empowerment = "slash1" | "slash2" | "volley1" | "volley2" | "shield1" | "shield2";
export type Activatable = "cloak1" | "cloak2";
export type Active = Spell | Empowerment | Activatable;

export type Passive = "charm1" | "charm2" | "pet1" | "pet2";

export type Consumable = "key";

export type Materialized = "door";

export type Stackable = Resource | "arrow" | "bomb";
export const STACK_SIZE = 10;

export type Item = {
  carrier: number;
  amount: number;
  material?: Material;
  equipment?: Equipment;
  active?: Active;
  passive?: Passive;
  stat?: keyof Stats;
  consume?: Consumable;
  stackable?: Stackable;
};

export const ITEM = "ITEM";

export default function addItem(world: World, entity: Entity, item: Item) {
  world.addComponentToEntity(entity, ITEM, item);
}
