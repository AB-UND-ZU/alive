import * as colors from "../colors";
import { Sprite } from "../../../engine/components/sprite";

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

export const villager: Sprite = {
  name: "villager_normal",
  layers: [
    {
      char: "\u010b",
      color: colors.white,
    },
    {
      char: "'",
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
