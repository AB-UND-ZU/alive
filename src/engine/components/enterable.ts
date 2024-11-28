import { Entity } from "ecs";
import { World } from "../ecs";
import { Sprite } from "./sprite";

export type Enterable = {
  sprite: Sprite;
  inside: boolean;
};

export const ENTERABLE = "ENTERABLE";

export default function addEnterable(
  world: World,
  entity: Entity,
  enterable: Enterable
) {
  world.addComponentToEntity(entity, ENTERABLE, enterable);
}
