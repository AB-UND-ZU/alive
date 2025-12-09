import { Entity } from "ecs";
import { World } from "../ecs";
import { Equipment } from "./equippable";
import { Attributes, emptyAttributes, UnitStats } from "./stats";
import { Castable, DamageType, EffectType, emptyCastable } from "./castable";

export const elements = ["fire", "water", "earth", "air"] as const;

export type Material = "wood" | "iron" | "gold" | "diamond" | "ruby";
export type Element = (typeof elements)[number];

export type Primary = "wave" | "beam";
export type Secondary = "slash" | "bow";

export type Consumable = "key" | "potion" | "map";

export type Materialized = "door" | "entry" | "gate" | "mine" | "lock";

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
  | "nugget"
  | "note"
  | "worm";
export type Resource = "resource";
export type Reloadable = "arrow" | "bomb" | "charge";
export type Stackable = Resource | Craftable | Reloadable;

export type ItemStats = Attributes & Pick<Castable, DamageType | EffectType>;

export type Item = {
  carrier: number;
  amount: number;
  material?: Material;
  element?: Element;
  equipment?: Equipment;
  primary?: Primary;
  secondary?: Secondary;
  stat?: keyof UnitStats;
  consume?: Consumable;
  stackable?: Stackable;
  bound: boolean;
};

export const emptyItemStats = {
  ...emptyAttributes,
  ...emptyCastable,
};
export const STACK_SIZE = 999;

export const ITEM = "ITEM";

export default function addItem(world: World, entity: Entity, item: Item) {
  world.addComponentToEntity(entity, ITEM, item);
}
