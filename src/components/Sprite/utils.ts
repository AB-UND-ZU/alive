import { Orientation } from "../../engine/components/movable";
import { Sprite } from "../../engine/components/sprite";

export const pixels = 16;
export const textSize = 18 / 25;
export const stack = 1000;
export const stackHeight = 1;

export const getFacingLayers = (sprite: Sprite, facing?: Orientation) => facing && sprite.facing ? sprite.facing[facing] : sprite.layers;
