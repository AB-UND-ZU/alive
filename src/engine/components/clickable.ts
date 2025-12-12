import { Entity } from "ecs";
import { World } from "../ecs";

export type Clickable = {
  clicked: boolean;
  player: boolean;
};

export const CLICKABLE = "CLICKABLE";

export default function addClickable(
  world: World,
  entity: Entity,
  clickable: Clickable
) {
  world.addComponentToEntity(entity, CLICKABLE, clickable);
}
