import { Entity } from "ecs";
import { World } from "../ecs";

export type Swimmable = {
  swimming: boolean,
};

export const SWIMMABLE = "SWIMMABLE";

export default function addSwimmable(
  world: World,
  entity: Entity,
  swimmable: Swimmable
) {
  world.addComponentToEntity(entity, SWIMMABLE, swimmable);
}
