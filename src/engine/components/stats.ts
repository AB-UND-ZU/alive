import { Entity } from "ecs";
import { World } from "../ecs";

export type Countable = {
  hp: number;
  maxHp: number;

  mp: number;
  maxMp: number;

  xp: number;

  coin: number;
  stick: number;
  ore: number;
  flower: number;
  berry: number;
};

export const droppableCountables: (keyof Countable)[] = [
  "xp",
  "coin",
  "ore",
  "stick",
  "flower",
  "berry",
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

  mp: 0,
  maxMp: 0,

  xp: 0,

  coin: 0,
  stick: 0,
  ore: 0,
  flower: 0,
  berry: 0,

  power: 0,
  magic: 0,
  armor: 0,
  haste: 0,
};

export const STATS = "STATS";

export default function addStats(world: World, entity: Entity, stats: Stats) {
  world.addComponentToEntity(entity, STATS, stats);
}
