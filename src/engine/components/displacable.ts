import type { TypedEntity } from "../entities";
import { World } from "../ecs";

export type Displacable = { pushSound?: boolean };

export const DISPLACABLE = "DISPLACABLE";

export default function addDisplacable(
  world: World,
  entity: TypedEntity,
  displacable: Displacable
) {
  world.addComponentToEntity(entity, DISPLACABLE, displacable);
}
