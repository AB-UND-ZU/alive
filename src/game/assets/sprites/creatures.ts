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

export const strongTriangle: Sprite = {
  name: "Prism",
  layers: [{ char: "\u010f", color: colors.lime }],
  facing: {
    up: [{ char: "\u011d", color: colors.lime }],
    right: [{ char: "\u010f", color: colors.lime }],
    down: [{ char: "\u011e", color: colors.lime }],
    left: [{ char: "\u0110", color: colors.lime }],
  },
};

export const waterTriangle: Sprite = {
  name: "Prism",
  layers: [{ char: "\u010f", color: colors.blue }],
  facing: {
    up: [{ char: "\u011d", color: colors.blue }],
    right: [{ char: "\u010f", color: colors.blue }],
    down: [{ char: "\u011e", color: colors.blue }],
    left: [{ char: "\u0110", color: colors.blue }],
  },
};

export const fireTriangle: Sprite = {
  name: "Prism",
  layers: [{ char: "\u010f", color: colors.red }],
  facing: {
    up: [{ char: "\u011d", color: colors.red }],
    right: [{ char: "\u010f", color: colors.red }],
    down: [{ char: "\u011e", color: colors.red }],
    left: [{ char: "\u0110", color: colors.red }],
  },
};

export const eye: Sprite = {
  name: "Eye",
  layers: [{ char: "0", color: colors.white }],
};

export const strongEye: Sprite = {
  name: "Eye",
  layers: [{ char: "0", color: colors.lime }],
};

export const fireEye: Sprite = {
  name: "Eye",
  layers: [{ char: "0", color: colors.red }],
};

export const waterRye: Sprite = {
  name: "Eye",
  layers: [{ char: "0", color: colors.blue }],
};

export const soul: Sprite = {
  name: "Soul",
  layers: [
    { char: "\u010b", color: colors.grey },
    { char: "~", color: colors.grey },
    { char: "°", color: colors.yellow },
  ],
};
