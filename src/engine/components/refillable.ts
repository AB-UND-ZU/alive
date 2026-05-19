import { Entity } from "ecs";
import { World } from "../ecs";
import { Element } from "./item";

export type Refillable = {
  element: Element;
};

export const REFILLABLE = "REFILLABLE";

export default function addRefillable(
  world: World,
  entity: Entity,
  refillable: Refillable
) {
  world.addComponentToEntity(entity, REFILLABLE, refillable);
}
