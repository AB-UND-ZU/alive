import * as colors from "../colors";
import { Sprite } from "../../../engine/components/sprite";

export const player: Sprite = {
  name: "player_symbol",
  layers: [
    { char: "\u010b", color: colors.white },
    { char: "~", color: colors.olive },
  ],
};

export const villager: Sprite = {
  name: "Nomad",
  layers: [
    { char: "\u010b", color: colors.white },
    { char: "'", color: colors.silver },
  ],
};

export const triangle: Sprite = {
  name: "Prism",
  layers: [{ char: "\u010f", color: colors.white }],
  facing: {
    up: [{ char: "\u011d", color: colors.white }],
    right: [{ char: "\u010f", color: colors.white }],
    down: [{ char: "\u011e", color: colors.white }],
    left: [{ char: "\u0110", color: colors.white }],
  },
};

export const soul: Sprite = {
  name: "Soul",
  layers: [
    { char: "\u010b", color: colors.grey },
    { char: "~", color: colors.grey },
    { char: "°", color: colors.yellow }
  ],
};
