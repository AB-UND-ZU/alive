import { Entity } from "ecs";
import { World } from "../ecs";
import { Equipment } from "./equippable";
import { Stats } from "./stats";

export const elements = ["fire", "water", "earth"] as const;

export type Resource = "wood" | "iron" | "gold" | "diamond";
export type Element = (typeof elements)[number];
export type Legendary = "ruby" | "aether" | "void" | "rainbow";
export type Material = Resource | Element | Legendary;

export type Primary = "wave1" | "wave2" | "beam1" | "beam2" | "trap1" | "trap2";
export type Secondary = "slash" | "block" | "bow";

export type Passive = "charm1" | "charm2" | "pet1" | "pet2";

export type Consumable = "key" | "potion1" | "potion2";

export type Materialized = "door";

export type Craftable =
  | "coin"
  | "stick"
  | "ore"
  | "berry"
  | "flower"
  | "leaf"
  | "apple"
  | "shroom"
  | "banana"
  | "coconut"
  | "gem"
  | "crystal"
  | "herb"
  | "fruit"
  | "leaf"
  | "seed"
  | "ingot"
  | "worm"
  | "resource";
export type Reloadable = "arrow" | "bomb" | "charge";
export type Stackable = Craftable | Reloadable;
export const STACK_SIZE = 999;

export type Item = {
  carrier: number;
  amount: number;
  material?: Material;
  equipment?: Equipment;
  primary?: Primary;
  secondary?: Secondary;
  passive?: Passive;
  stat?: keyof Stats;
  consume?: Consumable;
  stackable?: Stackable;
  bound: boolean;
};

export const ITEM = "ITEM";

export default function addItem(world: World, entity: Entity, item: Item) {
  world.addComponentToEntity(entity, ITEM, item);
}
