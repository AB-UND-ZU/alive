import { Entity } from "ecs";
import { World } from "../ecs";
import { SpringConfig } from "@react-spring/three";
import { Position } from "./position";

export type Viewable = {
  active: boolean;
  priority: number; // 10 - hero, 30 - spawn, 50 - buildings, 90 - popups
  spring?: SpringConfig;
  fraction?: Position;
};

export const VIEWABLE = "VIEWABLE";

export default function addViewable(
  world: World,
  entity: Entity,
  viewable: Viewable
) {
  world.addComponentToEntity(entity, VIEWABLE, viewable);
}
