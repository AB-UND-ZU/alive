import type { TypedEntity } from "../entities";
import { World } from "../ecs";
import type { SpringConfig } from "@react-spring/three";
import { Position } from "./position";

export type Viewable = {
  active: boolean;
  quake?: number;
  priority: number; // 10 - hero, 30 - spawn, 50 - buildings, 90 - popups
  spring?: SpringConfig;
  fraction?: Position;
};

export const VIEWABLE = "VIEWABLE";

export default function addViewable(
  world: World,
  entity: TypedEntity,
  viewable: Viewable
) {
  world.addComponentToEntity(entity, VIEWABLE, viewable);
}
