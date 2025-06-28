import { Entity } from "ecs";
import { World } from "../ecs";
import { SpringConfig } from "@react-spring/three";
import { Position } from "./position";

export type Viewable = {
  active: boolean;
  priority: number; // 10 - buildings, 30 - spawn, 50 - hero, 60 - menu, 90 - dialogs
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
