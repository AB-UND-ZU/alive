import type { TypedEntity } from "../entities";
import { World } from "../ecs";

export type Fragment = {
  structure: number;
};

export const FRAGMENT = "FRAGMENT";

export default function addFragment(
  world: World,
  entity: TypedEntity,
  fragment: Fragment
) {
  world.addComponentToEntity(entity, FRAGMENT, fragment);
}
