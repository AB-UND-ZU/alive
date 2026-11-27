import type { TypedEntity } from "../entities";
import { World } from "../ecs";
import type { SpringConfig } from "@react-spring/three";

export type Mountable = {
  passenger?: number;
  medium: "water" | "rails";
  spring?: SpringConfig;
};

export const MOUNTABLE = "MOUNTABLE";

export default function addMountable(
  world: World,
  entity: TypedEntity,
  mountable: Mountable
) {
  world.addComponentToEntity(entity, MOUNTABLE, mountable);
}
