import * as colors from "../colors";
import { Sprite } from "../../../engine/components/sprite";

export const none: Sprite = {
  name: "none",
  layers: [],
};

export const fog: Sprite = {
  name: "fog_hidden",
  layers: [
    {
      char: "≈",
      color: colors.grey,
    },
  ],
};

export const wall: Sprite = {
  name: "wall_solid",
  layers: [
    {
      char: "█",
      color: colors.grey,
    },
  ],
};

export const water: Sprite = {
  name: "water_shallow",
  layers: [
    {
      char: "█",
      color: colors.navy,
    },
  ],
};

export const ice: Sprite = {
  name: "water_ice",
  layers: [
    {
      char: "█",
      color: colors.teal,
    },
  ],
};

export const sand: Sprite = {
  name: "sand_dry",
  layers: [
    {
      char: "▒",
      color: colors.olive,
    },
  ],
};

export const tree: Sprite = {
  name: "tree_one",
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
  facing: {
    right: [
      {
        char: "┐",
        color: colors.maroon,
      },
      {
        char: "Θ",
        color: colors.green,
      },
    ],
    left: [
      {
        char: "┐",
        color: colors.maroon,
      },
      {
        char: "Θ",
        color: colors.green,
      },
    ],
  },
};

export const bush: Sprite = {
  name: "bush_empty",
  layers: [
    {
      char: "\u03c4",
      color: colors.olive,
    },
  ],
  amounts: {
    single: [
      {
        char: "'",
        color: colors.teal,
      },
      {
        char: "\u03c4",
        color: colors.olive,
      },
    ],
    double: [
      {
        char: '"',
        color: colors.teal,
      },
      {
        char: "\u03c4",
        color: colors.olive,
      },
    ],
    multiple: [
      {
        char: "°",
        color: colors.teal,
      },
      {
        char: "\u03c4",
        color: colors.olive,
      },
    ],
  },
};

export const flower: Sprite = {
  name: "flower_empty",
  layers: [
    {
      char: ",",
      color: colors.olive,
    },
  ],
  amounts: {
    single: [
      {
        char: "·",
        color: colors.purple,
      },
      {
        char: ",",
        color: colors.olive,
      },
    ],
    double: [
      {
        char: "∙",
        color: colors.purple,
      },
      {
        char: ",",
        color: colors.olive,
      },
    ],
    multiple: [
      {
        char: "\u0106",
        color: colors.purple,
      },
      {
        char: ",",
        color: colors.olive,
      },
    ],
  },
};

export const cactus: Sprite = {
  name: "cactus_empty",
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
  facing: {
    right: [
      {
        char: "▒",
        color: colors.olive,
      },
      {
        char: "¥",
        color: colors.green,
      },
    ],
    left: [
      {
        char: "▒",
        color: colors.olive,
      },
      {
        char: "¥",
        color: colors.green,
      },
    ],
  },
};
