import type { TypedEntity } from "../entities";
import { World } from "../ecs";

export type Rechargable = {
  hit: boolean;
};

export const RECHARGABLE = "RECHARGABLE";

export default function addRechargable(
  world: World,
  entity: TypedEntity,
  rechargable: Rechargable
) {
  world.addComponentToEntity(entity, RECHARGABLE, rechargable);
}
