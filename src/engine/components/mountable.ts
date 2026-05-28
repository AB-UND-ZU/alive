import { Entity } from "ecs";
import { World } from "../ecs";
import { SpringConfig } from "@react-spring/three";

export type Mountable = {
  passenger?: number;
  medium: "water" | "rails";
  spring?: SpringConfig;
};

export const MOUNTABLE = "MOUNTABLE";

export default function addMountable(
  world: World,
  entity: Entity,
  mountable: Mountable
) {
  world.addComponentToEntity(entity, MOUNTABLE, mountable);
}
