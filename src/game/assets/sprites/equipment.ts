import * as colors from "../colors";
import { Sprite } from "../../../engine/components/sprite";

export const goldKey: Sprite = {
  name: "Key",
  layers: [
    {
      char: '\u011c',
      color: colors.yellow,
    },
    {
      char: '─',
      color: colors.grey,
    },
  ],
};

export const ironKey: Sprite = {
  name: "Key",
  layers: [
    {
      char: '\u011c',
      color: colors.silver,
    },
    {
      char: '─',
      color: colors.grey,
    },
  ],
};

export const boat: Sprite = {
  name: "Boat",
  layers: [
    {
      char: "\u0115",
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

export const flask: Sprite = {
  name: "Flask",
  layers: [
    {
      char: "\u011d",
      color: colors.blue,
    },
    {
      char: "\u011f",
      color: colors.grey,
    },
    {
      char: "°",
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

export const woodStick: Sprite = {
  name: "Stick",
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

export const fireSword: Sprite = {
  name: "Sword",
  layers: [
    {
      char: "/",
      color: colors.red,
    },
  ],
  facing: {
    up: [
      {
        char: "|",
        color: colors.red,
      },
    ],
    right: [
      {
        char: "-",
        color: colors.red,
      },
    ],
    down: [
      {
        char: "|",
        color: colors.red,
      },
    ],
    left: [
      {
        char: "-",
        color: colors.red,
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

export const ironShield: Sprite = {
  name: "Armor",
  layers: [
    {
      char: "¬",
      color: colors.grey,
    },
  ],
};
