import { Entity } from "ecs";
import { World } from "../ecs";

export type Countable = {
  hp: number;
  maxHp: number;

  mp: number;
  maxMp: number;

  xp: number;

  gold: number;
  wood: number;
  ore: number;
  flower: number;
  berry: number;
};

export const droppableCountables: (keyof Countable)[] = [
  "xp",
  "gold",
  "ore",
  "wood",
  "flower",
  "berry",
];

export type Stats = Countable & {
  attack: number;
  intellect: number;
  defense: number;
  speed: number;
};

export const emptyStats: Stats = {
  hp: 0,
  maxHp: 0,

  mp: 0,
  maxMp: 0,

  xp: 0,

  gold: 0,
  wood: 0,
  ore: 0,
  flower: 0,
  berry: 0,

  attack: 0,
  intellect: 0,
  defense: 0,
  speed: 0,
};

export const STATS = "STATS";

export default function addStats(world: World, entity: Entity, stats: Stats) {
  world.addComponentToEntity(entity, STATS, stats);
}
