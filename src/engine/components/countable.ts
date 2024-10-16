import { Entity } from "ecs";
import { World } from "../ecs";

export type Countable = {
  hp: number;
  mp: number;
  xp: number;
  gold: number;
  wood: number;
  iron: number;
  herb: number;
  seed: number;
};

export const emptyCountable: Countable = {
  hp: 0,
  mp: 0,
  xp: 0,
  gold: 0,
  wood: 0,
  iron: 0,
  herb: 0,
  seed: 0,
};

export const COUNTABLE = "COUNTABLE";

export default function addCountable(
  world: World,
  entity: Entity,
  countable: Countable
) {
  world.addComponentToEntity(entity, COUNTABLE, countable);
}
