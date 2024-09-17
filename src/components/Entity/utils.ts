import { Orientation } from "../../engine/components/orientable";
import { Layer, Sprite } from "../../engine/components/sprite";
import { World } from "../../engine";

export const pixels = 16;
export const textSize = 18 / 25 + 0.001;

export const stack = 1000;
export const stackHeight = 1;

export const terrainHeight = 0 * stackHeight;
export const unitHeight = 1 * stackHeight;
export const effectHeight = 2 * stackHeight;
export const lightHeight = 3 * stackHeight;
export const wallHeight = 4 * stackHeight;
export const particleHeight = 5 * stackHeight;
export const shadowHeight = 7 * stackHeight;
export const fogHeight = 8 * stackHeight;
export const cameraHeight = 10 * stackHeight;

export const getFacingLayers = (
  world: World,
  sprite: Sprite,
  facing?: Orientation,
  amount?: number
) => {
  let layers;
  if (facing && sprite.facing?.[facing]) layers = sprite.facing[facing];

  if (amount && sprite.amounts) {
    if (amount === 1) layers = sprite.amounts.single;
    else if (amount === 2) layers = sprite.amounts.double;
    else layers = sprite.amounts.multiple;
  }

  return layers || sprite.layers;
};
