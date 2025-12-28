import { Entity } from "ecs";
import { World } from "../ecs";

export type Coverable = { type: "snow" };

export const COVERABLE = "COVERABLE";

export default function addCoverable(
  world: World,
  entity: Entity,
  coverable: Coverable
) {
  world.addComponentToEntity(entity, COVERABLE, coverable);
}
