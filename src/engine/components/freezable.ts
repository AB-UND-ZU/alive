import type { TypedEntity } from "../entities";
import { World } from "../ecs";

export type Freezable = {
  frozen: boolean;
};

export const FREEZABLE = "FREEZABLE";

export default function addFreezable(
  world: World,
  entity: TypedEntity,
  freezable: Freezable
) {
  world.addComponentToEntity(entity, FREEZABLE, freezable);
}
