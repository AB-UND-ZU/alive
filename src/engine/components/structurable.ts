import type { TypedEntity } from "../entities";
import { World } from "../ecs";

export type Structurable = {
  rigid?: boolean;
};

export const STRUCTURABLE = "STRUCTURABLE";

export default function addStructurable(
  world: World,
  entity: TypedEntity,
  structurable: Structurable
) {
  world.addComponentToEntity(entity, STRUCTURABLE, structurable);
}
