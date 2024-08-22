import { Entity } from "ecs";
import { World } from "../ecs";

export type Attackable = {
  max: number;
  hp: number;
  enemy: boolean;
};

export const ATTACKABLE = "ATTACKABLE";

export default function addAttackable(
  world: World,
  entity: Entity,
  attackable: Attackable
) {
  world.addComponentToEntity(entity, ATTACKABLE, attackable);
}
