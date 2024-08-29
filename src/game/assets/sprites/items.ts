import * as colors from "../colors";
import { Sprite } from "../../../engine/components/sprite";

export const key: Sprite = {
  name: "key_iron",
  layers: [
    {
      char: "|",
      color: colors.maroon,
    },
    {
      char: "\"",
      color: colors.grey,
    },
    {
      char: "╕",
      color: colors.grey,
    },
  ],
};

export const boat: Sprite = {
  name: "boat_wood",
  layers: [
    {
      char: "■",
      color: colors.maroon,
    },
  ],
};

export const arrow: Sprite = {
  name: "arrow_wood",
  layers: [
    {
      char: "}",
      color: colors.maroon,
    },
  ],
};

export const potion: Sprite = {
  name: "potion_health",
  layers: [
    {
      char: "º",
      color: colors.grey,
    },
    {
      char: "\u011d",
      color: colors.red,
    },
    {
      char: "\u011f",
      color: colors.grey,
    },
  ],
};

export const compass: Sprite = {
  name: "compass_pointer",
  layers: [
    {
      char: "\u0108",
      color: colors.maroon,
    },
    {
      char: "\u0117",
      color: colors.grey,
    },
  ],
  facing: {
    up: [
      {
        char: "\u0108",
        color: colors.maroon,
      },
      {
        char: "\u0117",
        color: colors.grey,
      },
    ],
    right: [
      {
        char: "\u0108",
        color: colors.maroon,
      },
      {
        char: "\u0119",
        color: colors.grey,
      },
    ],
    down: [
      {
        char: "\u0108",
        color: colors.maroon,
      },
      {
        char: "\u0118",
        color: colors.grey,
      },
    ],
    left: [
      {
        char: "\u0108",
        color: colors.maroon,
      },
      {
        char: "\u011a",
        color: colors.grey,
      },
    ],
  },
};

export const sword: Sprite = {
  name: "sword_wood",
  layers: [
    {
      char: "/",
      color: colors.maroon,
    },
  ],
  facing: {
    up: [
      {
        char: "|",
        color: colors.maroon,
      },
    ],
    right: [
      {
        char: "-",
        color: colors.maroon,
      },
    ],
    down: [
      {
        char: "|",
        color: colors.maroon,
      },
    ],
    left: [
      {
        char: "-",
        color: colors.maroon,
      },
    ],
  },
};
