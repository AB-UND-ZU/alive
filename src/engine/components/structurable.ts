import { Entity } from "ecs";
import { World } from "../ecs";

export type Structurable = {
  scale?: number;
  offsetX?: number;
  offsetY?: number;
};

export const STRUCTURABLE = "STRUCTURABLE";

export default function addStructurable(
  world: World,
  entity: Entity,
  structurable: Structurable
) {
  world.addComponentToEntity(entity, STRUCTURABLE, structurable);
}
