import { Entity } from "ecs";
import { World } from "../ecs";

export type Viewable = {
  active: boolean;
};

export const VIEWABLE = "VIEWABLE";

export default function addViewable(
  world: World,
  entity: Entity,
  viewable: Viewable
) {
  world.addComponentToEntity(entity, VIEWABLE, viewable);
}
