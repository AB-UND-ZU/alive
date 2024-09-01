import { Entity } from "ecs";
import { World } from "../ecs";

export type Identifiable = {
  name: string;
};

export const IDENTIFIABLE = "IDENTIFIABLE";

export default function addIdentifiable(
  world: World,
  entity: Entity,
  identifiable: Identifiable
) {
  world.addComponentToEntity(entity, IDENTIFIABLE, identifiable);
}
