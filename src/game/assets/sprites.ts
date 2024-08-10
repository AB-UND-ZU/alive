import * as colors from "./colors";
import { Sprite } from "../../engine/components/sprite";

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