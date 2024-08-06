import { Entity } from "ecs";
import { World } from "../ecs";

export type Layer = {
  char: string,
  color: string,
}
export type Sprite = {
  layers: Layer[]
};

export const SPRITE = "SPRITE";

export default function addSprite(world: World, entity: Entity, sprite: Sprite) {
  world.addComponentToEntity(entity, SPRITE, sprite);
}
