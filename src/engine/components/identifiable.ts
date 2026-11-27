import type { TypedEntity } from "../entities";
import { World } from "../ecs";

export type Identifiable = {
  name: string;
};

export const IDENTIFIABLE = "IDENTIFIABLE";

export default function addIdentifiable(
  world: World,
  entity: TypedEntity,
  identifiable: Identifiable
) {
  world.addComponentToEntity(entity, IDENTIFIABLE, identifiable);
}
