import type { TypedEntity } from "../entities";
import { World } from "../ecs";

export type Exertable = {
  castable: number;
};

export const EXERTABLE = "EXERTABLE";

export default function addExertable(
  world: World,
  entity: TypedEntity,
  exertable: Exertable
) {
  world.addComponentToEntity(entity, EXERTABLE, exertable);
}
