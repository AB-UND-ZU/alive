import { Entity } from "ecs";
import { World } from "../ecs";

export type Exertable = {
  castable: number;
};

export const EXERTABLE = "EXERTABLE";

export default function addExertable(
  world: World,
  entity: Entity,
  exertable: Exertable
) {
  world.addComponentToEntity(entity, EXERTABLE, exertable);
}
