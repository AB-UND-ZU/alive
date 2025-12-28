import { Entity } from "ecs";
import { World } from "../ecs";

export type Freezable = {
  frozen: boolean;
};

export const FREEZABLE = "FREEZABLE";

export default function addFreezable(
  world: World,
  entity: Entity,
  freezable: Freezable
) {
  world.addComponentToEntity(entity, FREEZABLE, freezable);
}
