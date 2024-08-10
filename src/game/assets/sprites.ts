import * as colors from "./colors";
import { Sprite } from "../../engine/components/sprite";

export const wall: Sprite = {
  layers: [
    {
      char: "█",
      color: colors.grey,
    },
  ],
};

export const tree: Sprite = {
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
  layers: [
    {
      char: "\u010b",
      color: colors.white,
    },
  ],
};

export const triangle: Sprite = {
  layers: [
    {
      char: "\u010f",
      color: colors.white,
    },
  ],
};