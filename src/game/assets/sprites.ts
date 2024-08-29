import * as colors from "./colors";
import { Sprite } from "../../engine/components/sprite";

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

export const block: Sprite = {
  name: "block_solid",
  layers: [
    {
      char: "█",
      color: colors.maroon,
    },
  ],
};

export const block_down: Sprite = {
  name: "block_down",
  layers: [
    {
      char: "▄",
      color: colors.maroon,
    },
  ],
};

export const block_up: Sprite = {
  name: "block_up",
  layers: [
    {
      char: "▀",
      color: colors.maroon,
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

export const frozen: Sprite = {
  name: "water_frozen",
  layers: [
    {
      char: "▓",
      color: colors.aqua,
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

export const tree1: Sprite = {
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
};

export const tree2: Sprite = {
  name: "tree_two",
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
  name: "bush_empty",
  layers: [
    {
      char: "\u03c4",
      color: colors.olive,
    },
  ],
};

export const flower: Sprite = {
  name: "flower_empty",
  layers: [
    {
      char: ",",
      color: colors.olive,
    },
  ],
};

export const cactus1: Sprite = {
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
};

export const cactus2: Sprite = {
  name: "cactus_empty",
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
  name: "player_symbol",
  layers: [
    {
      char: "\u010b",
      color: colors.white,
    },
    {
      char: "~",
      color: colors.grey,
    },
  ],
};

// export const villager: Sprite = {
//   name: "villager_normal",
//   layers: [
//     {
//       char: "\u010b",
//       color: colors.white,
//     },
//     {
//       char: "'",
//       color: colors.grey,
//     },
//   ],
// };

export const chest: Sprite = {
  name: "chest_common",
  layers: [
    {
      char: "■",
      color: colors.grey,
    },
    {
      char: "\u00b1",
      color: colors.maroon,
    },
  ],
};

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

export const door: Sprite = {
  name: "door_wood",
  layers: [
    {
      char: "\u0109",
      color: colors.maroon,
    },
    {
      char: "\u0108",
      color: colors.grey,
    },
  ],
};

export const triangle: Sprite = {
  name: "triangle_right",
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
  },
};

// export const boat: Sprite = {
//   name: "boat_wood",
//   layers: [
//     {
//       char: "■",
//       color: colors.maroon,
//     },
//   ],
// };

// export const arrow: Sprite = {
//   name: "arrow_wood",
//   layers: [
//     {
//       char: "}",
//       color: colors.maroon,
//     },
//   ],
// };

// export const potion: Sprite = {
//   name: "potion_health",
//   layers: [
//     {
//       char: "º",
//       color: colors.grey,
//     },
//     {
//       char: "\u011d",
//       color: colors.red,
//     },
//     {
//       char: "\u011f",
//       color: colors.grey,
//     },
//   ],
// };

// export const compass: Sprite = {
//   name: "compass_pointer",
//   layers: [
//     {
//       char: "\u0108",
//       color: colors.maroon,
//     },
//     {
//       char: "\u0117",
//       color: colors.grey,
//     },
//   ],
//   facing: {
//     up: [
//       {
//         char: "\u0108",
//         color: colors.maroon,
//       },
//       {
//         char: "\u0117",
//         color: colors.grey,
//       },
//     ],
//     right: [
//       {
//         char: "\u0108",
//         color: colors.maroon,
//       },
//       {
//         char: "\u0119",
//         color: colors.grey,
//       },
//     ],
//     down: [
//       {
//         char: "\u0108",
//         color: colors.maroon,
//       },
//       {
//         char: "\u0118",
//         color: colors.grey,
//       },
//     ],
//     left: [
//       {
//         char: "\u0108",
//         color: colors.maroon,
//       },
//       {
//         char: "\u011a",
//         color: colors.grey,
//       },
//     ],
//   },
// };

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

export const hit: Sprite = {
  name: "hit_melee",
  layers: [
    {
      char: "x",
      color: colors.red,
    },
  ],
};

export const createCounter: (amount: number) => Sprite = (amount) => ({
  name: "counter_generic",
  layers: [
    {
      char: amount.toString(),
      color: colors.red,
    },
  ],
});

export const createText: (char: string) => Sprite = (char) => ({
  name: "text_generic",
  layers: [
    {
      char,
      color: colors.white,
    },
  ],
});
