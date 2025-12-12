import { Entity } from "ecs";
import { World } from "../ecs";

export type Warpable = {};

export const WARPABLE = "WARPABLE";

export default function addWarpable(
  world: World,
  entity: Entity,
  warpable: Warpable
) {
  world.addComponentToEntity(entity, WARPABLE, warpable);
}
