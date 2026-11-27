import type { TypedEntity } from "../entities";
import { World } from "../ecs";
import { Element } from "./item";

export type Refillable = {
  element: Element;
};

export const REFILLABLE = "REFILLABLE";

export default function addRefillable(
  world: World,
  entity: TypedEntity,
  refillable: Refillable
) {
  world.addComponentToEntity(entity, REFILLABLE, refillable);
}
