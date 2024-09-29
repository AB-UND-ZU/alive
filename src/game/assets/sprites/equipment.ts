import * as colors from "../colors";
import { Sprite } from "../../../engine/components/sprite";

export const key: Sprite = {
  name: "Key",
  layers: [
    {
      char: "|",
      color: colors.maroon,
    },
    {
      char: '"',
      color: colors.grey,
    },
    {
      char: "╕",
      color: colors.grey,
    },
  ],
};

export const boat: Sprite = {
  name: "Boat",
  layers: [
    {
      char: "■",
      color: colors.maroon,
    },
  ],
};

export const bow: Sprite = {
  name: "Bow",
  layers: [
    {
      char: "}",
      color: colors.maroon,
    },
  ],
};

export const potion: Sprite = {
  name: "Potion",
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
  name: "Compass",
  layers: [
    {
      char: "\u0108",
      color: colors.maroon,
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

export const woodSword: Sprite = {
  name: "Sword",
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

export const ironSword: Sprite = {
  name: "Sword",
  layers: [
    {
      char: "/",
      color: colors.grey,
    },
  ],
  facing: {
    up: [
      {
        char: "|",
        color: colors.grey,
      },
    ],
    right: [
      {
        char: "-",
        color: colors.grey,
      },
    ],
    down: [
      {
        char: "|",
        color: colors.grey,
      },
    ],
    left: [
      {
        char: "-",
        color: colors.grey,
      },
    ],
  },
};

export const woodShield: Sprite = {
  name: "Armor",
  layers: [
    {
      char: "¬",
      color: colors.maroon,
    },
  ],
};
