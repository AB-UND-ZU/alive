import { Entity } from "ecs";
import { World } from "../ecs";
import { LevelName } from "./level";

export type Warpable = {
  name: LevelName;
};

export const WARPABLE = "WARPABLE";

export default function addWarpable(
  world: World,
  entity: Entity,
  warpable: Warpable
) {
  world.addComponentToEntity(entity, WARPABLE, warpable);
}
