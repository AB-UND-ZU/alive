import type { TypedEntity } from "../entities";
import { World } from "../ecs";

export type Warpable = {};

export const WARPABLE = "WARPABLE";

export default function addWarpable(
  world: World,
  entity: TypedEntity,
  warpable: Warpable
) {
  world.addComponentToEntity(entity, WARPABLE, warpable);
}
