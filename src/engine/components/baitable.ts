import type { TypedEntity } from "../entities";
import { World } from "../ecs";

export type Baitable = {
  caught?: number;
  caster: number;
  amount: number;
};

export const BAITABLE = "BAITABLE";

export default function addBaitable(
  world: World,
  entity: TypedEntity,
  baitable: Baitable
) {
  world.addComponentToEntity(entity, BAITABLE, baitable);
}
