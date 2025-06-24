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

  coin: number;
  stick: number;
  ore: number;

  flower: number;
  berry: number;
  leaf: number;
};

export const droppableCountables: (keyof Countable)[] = [
  "coin",
  "ore",
  "stick",

  "flower",
  "berry",
  "leaf",
];

export type Stats = Countable & {
  power: number;
  magic: number;
  armor: number;
  haste: number;
};

export const emptyStats: Stats = {
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

  coin: 0,
  stick: 0,
  ore: 0,
  flower: 0,
  berry: 0,
  leaf: 0,

  power: 0,
  magic: 0,
  armor: 0,
  haste: 0,
};

export const STATS = "STATS";

export default function addStats(world: World, entity: Entity, stats: Stats) {
  world.addComponentToEntity(entity, STATS, stats);
}
