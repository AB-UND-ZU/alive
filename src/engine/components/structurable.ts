import { Entity } from "ecs";
import { World } from "../ecs";

export type Structurable = {
  rigid?: boolean;
};

export const STRUCTURABLE = "STRUCTURABLE";

export default function addStructurable(
  world: World,
  entity: Entity,
  structurable: Structurable
) {
  world.addComponentToEntity(entity, STRUCTURABLE, structurable);
}
