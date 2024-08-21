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

export const water: Sprite = {
  name: 'water_shallow',
  layers: [
    {
      char: "█",
      color: colors.navy,
    },
  ],
};

export const ice: Sprite = {
  name: 'water_ice',
  layers: [
    {
      char: "█",
      color: colors.teal,
    },
  ],
};

export const frozen: Sprite = {
  name: 'water_frozen',
  layers: [
    {
      char: "▓",
      color: colors.aqua,
    },
  ],
};

export const sand: Sprite = {
  name: 'sand_dry',
  layers: [
    {
      char: "▒",
      color: colors.olive,
    },
  ],
};

export const tree1: Sprite = {
  name: 'tree_one',
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

export const tree2: Sprite = {
  name: 'tree_two',
  layers: [
    {
      char: "┐",
      color: colors.maroon,
    },
    {
      char: "Θ",
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

export const cactus1: Sprite = {
  name: 'cactus_empty',
  layers: [
    {
      char: "▒",
      color: colors.olive,
    },
    {
      char: "╬",
      color: colors.green,
    },
  ],
};

export const cactus2: Sprite = {
  name: 'cactus_empty',
  layers: [
    {
      char: "▒",
      color: colors.olive,
    },
    {
      char: "¥",
      color: colors.green,
    },
  ],
};

export const player: Sprite = {
  name: 'player_symbol',
  layers: [
    {
      char: "¬",
      color: colors.maroon,
    },
    {
      char: "\u010b",
      color: colors.white,
    },
    {
      char: "/",
      color: colors.grey,
    },
    {
      char: "~",
      color: colors.olive,
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
  facing: {
    up: [
      {
        char: "\u011d",
        color: colors.white,
      },
    ],
    right: [
      {
        char: "\u010f",
        color: colors.white,
      },
    ],
    down: [
      {
        char: "\u011e",
        color: colors.white,
      },
    ],
    left: [
      {
        char: "\u0110",
        color: colors.white,
      },
    ],
  }
};