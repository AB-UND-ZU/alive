import * as colors from "./colors";
import { Sprite } from "../../engine/components/sprite";

export const fog: Sprite = {
  name: 'fog_hidden',
  layers: [
    {
      char: "≈",
      color: colors.grey,
    },
  ],
};

export const wall: Sprite = {
  name: 'wall_solid',
  layers: [
    {
      char: "█",
      color: colors.grey,
    },
  ],
};

export const tree: Sprite = {
  name: 'tree_hash',
  layers: [
    {
      char: "┐",
      color: colors.maroon,
    },
    {
      char: "#",
      color: colors.green,
    },
  ],
};

export const bush: Sprite = {
  name: 'bush_empty',
  layers: [
    {
      char: "\u03c4",
      color: colors.olive,
    },
  ],
};

export const flower: Sprite = {
  name: 'flower_empty',
  layers: [
    {
      char: ",",
      color: colors.olive,
    },
  ],
};

export const player: Sprite = {
  name: 'player_symbol',
  layers: [
    {
      char: "\u010b",
      color: colors.white,
    },
  ],
};

export const triangle: Sprite = {
  name: 'triangle_right',
  layers: [
    {
      char: "\u010f",
      color: colors.white,
    },
  ],
};