import { Entity } from "ecs";
import { World } from "../ecs";
import { Accessory } from "./equippable";
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
import { emptyHarvestStats, HarvestStats } from "./harvestable";

export const elements = ["fire", "water", "earth", "air"] as const;
export const materials = ["wood", "iron", "gold", "diamond", "ruby"] as const;

export type Element = (typeof elements)[number];
export type Material = (typeof materials)[number];

export type Weapon = "sword" | "spear" | "wand";
export type Offhand = "shield";
export type Spell = "wave" | "beam" | "trap" | "dash" | "bolt" | "blast";

export const rechargables = ["slash", "zap", "block", "totem"] as const;
export const ranged = ["bow", "spear", "wand"] as const;

export type Ranged = (typeof ranged)[number];
export type Tool = "axe" | "pickaxe" | "hook";
export type Skill = Ranged | (typeof rechargables)[number];

export type Consumable = "key" | "potion";

export type Materialized = "door" | "port" | "entry" | "gate" | "mine" | "lock";

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
  | "salmon"
  | "tuna"
  | "pike"
  | "cod"
  | "algae"
  | "eel"
  | "seastar"
  | "pearl"
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
  HarvestStats &
  Pick<Castable, DamageType | EffectType>;

export type Item = {
  carrier: number;
  amount: number;
  material?: Material;
  element?: Element;
  accessory?: Accessory;
  weapon?: Weapon;
  offhand?: Offhand;
  spell?: Spell;
  skill?: Skill;
  tool?: Tool;
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
  ...emptyHarvestStats,
};

export const ITEM = "ITEM";

export default function addItem(world: World, entity: Entity, item: Item) {
  world.addComponentToEntity(entity, ITEM, item);
}
