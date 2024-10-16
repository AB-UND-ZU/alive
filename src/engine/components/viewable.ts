import { Entity } from "ecs";
import { World } from "../ecs";
import { SpringConfig } from "@react-spring/three";

export type Viewable = {
  active: boolean;
  spring?: SpringConfig;
};

export const VIEWABLE = "VIEWABLE";

export default function addViewable(
  world: World,
  entity: Entity,
  viewable: Viewable
) {
  world.addComponentToEntity(entity, VIEWABLE, viewable);
}
