import { Entity } from "ecs";
import { World } from "../ecs";
import { Orientation } from "./orientable";

export type Layer = {
  char: string;
  color: string;
};
export type Sprite = {
  name: string;
  layers: Layer[];
  facing?: Record<Orientation, Layer[]>;
};

export const SPRITE = "SPRITE";

export default function addSprite(
  world: World,
  entity: Entity,
  sprite: Sprite
) {
  world.addComponentToEntity(entity, SPRITE, sprite);
}
