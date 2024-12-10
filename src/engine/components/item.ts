import { Entity } from "ecs";
import { World } from "../ecs";
import { Equipment } from "./equippable";
import { Countable } from "./stats";

export const elements = ["fire", "water", "earth"] as const;

export type Resource = "wood" | "iron" | "gold" | "diamond";
export type Element = (typeof elements)[number];
export type Legendary = "ruby" | "aether" | "void" | "rainbow";
export type Material = Resource | Element | Legendary;

export type Spell = "wave1" | "wave2" | "beam1" | "beam2" | "trap1" | "trap2";
export type Empowerment = "slash" | "block" | "bow";
export type Activatable = "cloak1" | "cloak2";
export type Active = Spell | Empowerment | Activatable;

export type Passive = "charm1" | "charm2" | "pet1" | "pet2";

export type Consumable = "key" | "potion1" | "potion2";

export type Materialized = "door";

export type Craftable =
  | "apple"
  | "plum"
  | "banana"
  | "coconut"
  | "gem"
  | "crystal"
  | "flower"
  | "berry"
  | "spike"
  | "worm";
export type Reloadable = "arrow" | "bomb" | "charge";
export type Stackable = Resource | Craftable | Reloadable;
export const STACK_SIZE = 10;

export type Item = {
  carrier: number;
  amount: number;
  material?: Material;
  equipment?: Equipment;
  active?: Active;
  passive?: Passive;
  stat?: keyof Countable;
  consume?: Consumable;
  stackable?: Stackable;
  bound: boolean;
};

export const ITEM = "ITEM";

export default function addItem(world: World, entity: Entity, item: Item) {
  world.addComponentToEntity(entity, ITEM, item);
}
