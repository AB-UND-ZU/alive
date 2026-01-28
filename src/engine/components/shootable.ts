import { Entity } from "ecs";
import { World } from "../ecs";

export type Shootable = {
  shots: number;
};

export const SHOOTABLE = "SHOOTABLE";

export default function addShootable(
  world: World,
  entity: Entity,
  shootable: Shootable
) {
  world.addComponentToEntity(entity, SHOOTABLE, shootable);
}
