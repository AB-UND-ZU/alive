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

export const mainWeapons = ["sword"] as const;
export const skillWeapons = ["spear", "wand"] as const;
export const weapons = [...mainWeapons, ...skillWeapons];
export type Weapon = (typeof weapons)[number];

export const offhands = ["shield"] as const;
export type Offhand = (typeof offhands)[number];

export const spells = [
  "wave",
  "beam",
  "trap",
  "dash",
  "bolt",
  "blast",
] as const;
export type Spell = (typeof spells)[number];

export const rechargables = ["slash", "zap", "block", "totem"] as const;
export const ranged = ["bow", "spear", "wand"] as const;
export const skills = [...rechargables, ...ranged];
export type Ranged = (typeof ranged)[number];
export type Rechargables = (typeof rechargables)[number];
export type Skill = Ranged | Rechargables;

export const tools = ["axe", "pickaxe", "hook", "shovel", "hammer"] as const;
export type Tool = (typeof tools)[number];

export const consumables = ["key", "potion", "bucket"] as const;
export type Consumable = (typeof consumables)[number];

export const materialized = [
  "door",
  "port",
  "entry",
  "gate",
  "entrance",
  "mine",
  "lock",
] as const;
export type Materialized = (typeof materialized)[number];

export const craftables = [
  "coin",
  "stick",
  "plank",
  "ore",
  "berry",
  "flower",
  "leaf",
  "grain",
  "wheat",
  "bread",
  "apple",
  "shroom",
  "banana",
  "coconut",
  "crystal",
  "mineral",
  "herb",
  "fruit",
  "leaf",
  "sapling",
  "spore",
  "thorn",
  "ingot",
  "nugget",
  "worm",
  "salmon",
  "tuna",
  "pike",
  "cod",
  "algae",
  "eel",
  "seastar",
  "pearl",
  "sand",
  "gravel",
  "golem",
  "letter",
  "schema",
  "soup",
  "curry",
  "tea",
  "toast",
  "juice",
  "granola",
] as const;
export type Craftable = (typeof craftables)[number];

export const resourceItem = "resource";
export type ResourceItem = typeof resourceItem;

export const reloadables = ["arrow", "bomb", "charge"] as const;
export type Reloadable = (typeof reloadables)[number];

export const stackables = [
  ...craftables,
  resourceItem,
  ...reloadables,
] as const;
export type Stackable = (typeof stackables)[number];

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
