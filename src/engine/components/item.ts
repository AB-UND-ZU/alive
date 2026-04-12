import { Entity } from "ecs";
import { World } from "../ecs";
import { Equipment } from "./equippable";
import { Attributes, emptyAttributes, UnitStats } from "./stats";
import {
  AbilityStats,
  BuffStats,
  Castable,
  DamageType,
  EffectType,
  emptyAbilityStats,
  emptyBuffStats,
  emptyCastable,
  emptyProcStats,
  ProcStats,
} from "./castable";

export const elements = ["fire", "water", "earth", "air"] as const;
export const materials = ["wood", "iron", "gold", "diamond", "ruby"] as const;

export type Element = (typeof elements)[number];
export type Material = (typeof materials)[number];

export type Primary = "wave" | "beam" | "trap" | "bolt" | "blast";

export const rechargables = ["slash", "raise", "block", "totem"] as const;
export const tools = ["axe", "pickaxe"] as const;
export type Secondary =
  | "bow"
  | (typeof tools)[number]
  | (typeof rechargables)[number];

export type Consumable = "key" | "potion";

export type Materialized = "door" | "entry" | "gate" | "mine" | "lock";

export type Craftable =
  | "coin"
  | "stick"
  | "plank"
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
  | "worm"
  | "golemHead";
export type ResourceItem = "resource";
export type Reloadable = "arrow" | "bomb" | "charge";
export type Stackable = ResourceItem | Craftable | Reloadable;

export type ConditionableStats = { absorb: number };
export type ItemStats = Attributes &
  ProcStats &
  ConditionableStats &
  AbilityStats &
  BuffStats &
  Pick<Castable, DamageType | EffectType>;

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

export const emptyConditionableStats = { absorb: 0 };

export const emptyItemStats: ItemStats = {
  ...emptyAttributes,
  ...emptyProcStats,
  ...emptyConditionableStats,
  ...emptyAbilityStats,
  ...emptyBuffStats,
  ...emptyCastable,
};

export const ITEM = "ITEM";

export default function addItem(world: World, entity: Entity, item: Item) {
  world.addComponentToEntity(entity, ITEM, item);
}
