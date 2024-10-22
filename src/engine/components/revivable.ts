import { Entity } from "ecs";
import { World } from "../ecs";

export type Revivable = {
  available: boolean;
};

export const REVIVABLE = "REVIVABLE";

export default function addRevivable(
  world: World,
  entity: Entity,
  revivable: Revivable
) {
  world.addComponentToEntity(entity, REVIVABLE, revivable);
}
