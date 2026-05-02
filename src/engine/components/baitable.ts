import { Entity } from "ecs";
import { World } from "../ecs";

export type Baitable = {
  caught?: number;
  caster: number;
};

export const BAITABLE = "BAITABLE";

export default function addBaitable(
  world: World,
  entity: Entity,
  baitable: Baitable
) {
  world.addComponentToEntity(entity, BAITABLE, baitable);
}
