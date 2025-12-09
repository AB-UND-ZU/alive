import { Entity } from "ecs";
import { World } from "../ecs";
import { Sprite } from "./sprite";

export type Swimmable = {
  swimming: boolean,
  sprite?: Sprite
};

export const SWIMMABLE = "SWIMMABLE";

export default function addSwimmable(
  world: World,
  entity: Entity,
  swimmable: Swimmable
) {
  world.addComponentToEntity(entity, SWIMMABLE, swimmable);
}
