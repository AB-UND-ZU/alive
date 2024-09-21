import * as colors from "../colors";
import { Sprite } from "../../../engine/components/sprite";

export const chest: Sprite = {
  name: "Chest",
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
  facing: {
    down: [
      // empty layers to appear above player
      {
        char: "",
        color: colors.black,
      },
      {
        char: "",
        color: colors.black,
      },
      {
        char: "",
        color: colors.black,
      },
      {
        char: "\u0109",
        color: colors.maroon,
      },
    ],
  },
};
