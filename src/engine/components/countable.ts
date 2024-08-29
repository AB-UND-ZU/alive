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

export const COUNTABLE = "COUNTABLE";

export default function addCountable(
  world: World,
  entity: Entity,
  countable: Countable
) {
  world.addComponentToEntity(entity, COUNTABLE, countable);
}
