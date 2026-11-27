import type { TypedEntity } from "../entities";
import { World } from "../ecs";

export type Coverable = { type: "snow" };

export const COVERABLE = "COVERABLE";

export default function addCoverable(
  world: World,
  entity: TypedEntity,
  coverable: Coverable
) {
  world.addComponentToEntity(entity, COVERABLE, coverable);
}
