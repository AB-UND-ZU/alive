import type { TypedEntity } from "../entities";
import { World } from "../ecs";

export type Revivable = {
  available: boolean;
};

export const REVIVABLE = "REVIVABLE";

export default function addRevivable(
  world: World,
  entity: TypedEntity,
  revivable: Revivable
) {
  world.addComponentToEntity(entity, REVIVABLE, revivable);
}
