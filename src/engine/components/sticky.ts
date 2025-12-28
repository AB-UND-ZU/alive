import { Entity } from "ecs";
import { World } from "../ecs";

export type Sticky = {};

export const STICKY = "STICKY";

export default function addSticky(
  world: World,
  entity: Entity,
  sticky: Sticky
) {
  world.addComponentToEntity(entity, STICKY, sticky);
}
