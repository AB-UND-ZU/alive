import * as colors from "../colors";
import { Sprite } from "../../../engine/components/sprite";

export const chest: Sprite = {
  name: "Chest",
  layers: [
    { char: "■", color: colors.grey },
    { char: "\u00b1", color: colors.maroon },
  ],
};

export const campfire: Sprite = {
  name: "Fire",
  layers: [
    { char: "X", color: colors.maroon },
    { char: "|", color: colors.maroon },
  ],
};

export const torch: Sprite = {
  name: "Torch",
  layers: [
    { char: "┐", color: colors.maroon },
    { char: "─", color: colors.black },
  ],
};

export const pot: Sprite = {
  name: "Pot",
  layers: [
    { char: "I", color: colors.maroon },
    { char: "\u0106", color: colors.maroon },
    { char: "\u0108", color: colors.maroon },
    { char: "\u2219", color: colors.grey },
  ],
};

export const doorOpen: Sprite = {
  name: "Door",
  layers: [{ char: "▌", color: colors.maroon }],
};

export const doorClosedWood: Sprite = {
  name: "Door",
  layers: [
    { char: "\u0107", color: colors.maroon },
    { char: "\u0106", color: colors.maroon },
    { char: "\u011c", color: colors.black },
    { char: "-", color: colors.maroon },
  ],
};

export const doorClosedIron: Sprite = {
  name: "Door",
  layers: [
    { char: "\u0107", color: colors.maroon },
    { char: "\u0106", color: colors.maroon },
    { char: "\u011c", color: colors.silver },
    { char: "-", color: colors.maroon },
  ],
};

export const doorClosedFire: Sprite = {
  name: "Door",
  layers: [
    { char: "\u0107", color: colors.maroon },
    { char: "\u0106", color: colors.maroon },
    { char: "\u011c", color: colors.red },
    { char: "-", color: colors.maroon },
  ],
};

export const doorClosedGold: Sprite = {
  name: "Door",
  layers: [
    { char: "\u0107", color: colors.maroon },
    { char: "\u0106", color: colors.maroon },
    { char: "\u011c", color: colors.yellow },
    { char: "-", color: colors.maroon },
  ],
};
