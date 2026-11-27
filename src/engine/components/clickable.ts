import type { TypedEntity } from "../entities";
import { World } from "../ecs";

export type Clickable = {
  clicked: boolean;
  player: boolean;
};

export const CLICKABLE = "CLICKABLE";

export default function addClickable(
  world: World,
  entity: TypedEntity,
  clickable: Clickable
) {
  world.addComponentToEntity(entity, CLICKABLE, clickable);
}
