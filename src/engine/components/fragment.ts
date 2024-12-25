import { Entity } from "ecs";
import { World } from "../ecs";

export type Fragment = {
  structure: number;
};

export const FRAGMENT = "FRAGMENT";

export default function addFragment(
  world: World,
  entity: Entity,
  fragment: Fragment
) {
  world.addComponentToEntity(entity, FRAGMENT, fragment);
}
