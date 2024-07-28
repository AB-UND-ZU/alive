import { Entity } from "ecs";
import { World } from "../ecs";

export type Sprite = {
  layers: string[]
};

export const SPRITE = "SPRITE";

export default function addSprite(world: World, entity: Entity, sprite: Sprite) {
  world.addComponentToEntity(entity, SPRITE, sprite);
}
