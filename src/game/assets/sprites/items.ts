import * as colors from "../colors";
import { Sprite } from "../../../engine/components/sprite";

export const heart: Sprite = {
  name: "heart_drop",
  layers: [
    {
      char: "\u0102",
      color: colors.red,
    },
  ],
};

export const apple1: Sprite = {
  name: "apple1_drop",
  layers: [
    {
      char: "∙",
      color: colors.red,
    },
  ],
  amounts: {
    single: [
      {
        char: "┐",
        color: colors.maroon,
      },
      {
        char: "#",
        color: colors.green,
      },
      {
        char: "∙",
        color: colors.red,
      },
    ],
  },
};

export const apple2: Sprite = {
  name: "apple2_drop",
  layers: [
    {
      char: "∙",
      color: colors.red,
    },
  ],
  amounts: {
    single: [
      {
        char: "┐",
        color: colors.maroon,
      },
      {
        char: "Θ",
        color: colors.green,
      },
      {
        char: "∙",
        color: colors.red,
      },
    ],
  },
};

export const mana: Sprite = {
  name: "mana_drop",
  layers: [
    {
      char: "\u0103",
      color: colors.blue,
    },
  ],
};

export const xp: Sprite = {
  name: "xp_drop",
  layers: [
    {
      char: "+",
      color: colors.lime,
    },
  ],
  amounts: {
    single: [
      {
        char: "+",
        color: colors.lime,
      },
    ],
    double: [
      {
        char: "-",
        color: colors.lime,
      },
      {
        char: "|",
        color: colors.lime,
      },
    ],
    multiple: [
      {
        char: "┼",
        color: colors.lime,
      },
    ],
  },
};

export const gold: Sprite = {
  name: "gold_drop",
  layers: [
    {
      char: "\u0108",
      color: colors.yellow,
    },
  ],
  amounts: {
    single: [
      {
        char: "\u0108",
        color: colors.yellow,
      },
    ],
    double: [
      {
        char: "o",
        color: colors.yellow,
      },
    ],
    multiple: [
      {
        char: "O",
        color: colors.yellow,
      },
    ],
  },
};

export const wood: Sprite = {
  name: "wood_drop",
  layers: [
    {
      char: "-",
      color: colors.maroon,
    },
  ],
  amounts: {
    single: [
      {
        char: "-",
        color: colors.maroon,
      },
    ],
    double: [
      {
        char: "=",
        color: colors.maroon,
      },
    ],
    multiple: [
      {
        char: "≡",
        color: colors.maroon,
      },
    ],
  },
};

export const seed: Sprite = {
  name: "seed_drop",
  layers: [
    {
      char: "'",
      color: colors.teal,
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

export const herb: Sprite = {
  name: "herb_drop",
  layers: [
    {
      char: "·",
      color: colors.purple,
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

export const iron: Sprite = {
  name: "iron_drop",
  layers: [
    {
      char: ".",
      color: colors.grey,
    },
  ],
  amounts: {
    single: [
      {
        char: ".",
        color: colors.grey,
      },
    ],
    double: [
      {
        char: ":",
        color: colors.grey,
      },
    ],
    multiple: [
      {
        char: "÷",
        color: colors.grey,
      },
    ],
  },
};

export const key: Sprite = {
  name: "key_iron",
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
