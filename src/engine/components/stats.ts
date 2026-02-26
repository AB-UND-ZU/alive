import { Entity } from "ecs";
import { World } from "../ecs";

export type Countable = {
  hp: number;
  maxHp: number;
  maxHpCap: number;

  mp: number;
  maxMp: number;
  maxMpCap: number;

  xp: number;
  maxXp: number;
  maxXpCap: number;

  level: number;
};

export type Attributes = Pick<Countable, "maxHp" | "maxMp"> & {
  power: number;
  wisdom: number;
  armor: number;
  resist: number;
  haste: number;
  vision: number;
  damp: number;
  thaw: number;
  spike: number;
};

export type BarModifier = {
  scale?: number;
  offsetX?: number;
  offsetY?: number;
};

export type UnitStats = Countable & Attributes;
export type Stats = UnitStats & BarModifier;

export const emptyAttributes: Attributes = {
  maxHp: 0,
  maxMp: 0,

  power: 0,
  wisdom: 0,
  armor: 0,
  resist: 0,
  haste: 0,
  vision: 0,
  damp: 0,
  thaw: 0,
  spike: 0,
};
export const attributes = Object.keys(emptyAttributes) as (keyof Attributes)[];

export const emptyUnitStats: UnitStats = {
  ...emptyAttributes,

  hp: 0,
  maxHp: 0,
  maxHpCap: 0,

  mp: 0,
  maxMp: 0,
  maxMpCap: 0,

  xp: 0,
  maxXp: 0,
  maxXpCap: 0,

  level: 0,
};

export const MAX_STAT_VALUE = 99;

export const STATS = "STATS";

export default function addStats(world: World, entity: Entity, stats: Stats) {
  world.addComponentToEntity(entity, STATS, stats);
}
