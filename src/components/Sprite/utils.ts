import { Entity } from "ecs";
import { Orientable, ORIENTABLE } from "../../engine/components/orientable";
import { Sprite, SPRITE } from "../../engine/components/sprite";

export const pixels = 16;
export const textSize = 18 / 25;
export const stack = 1000;
export const stackHeight = 1;

export const getFacingLayers = (entity: Entity) => {
  const sprite = entity[SPRITE] as Sprite;
  const facing = (entity[ORIENTABLE] as Orientable)?.facing;

  if (facing && sprite.facing) return sprite.facing[facing];

  return sprite.layers;
};
