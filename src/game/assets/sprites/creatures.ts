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
  layers: [{ char: "\u010f", color: colors.silver }],
  facing: {
    up: [{ char: "\u011d", color: colors.silver }],
    right: [{ char: "\u010f", color: colors.silver }],
    down: [{ char: "\u011e", color: colors.silver }],
    left: [{ char: "\u0110", color: colors.silver }],
  },
};

export const goldTriangle: Sprite = {
  name: "Prism",
  layers: [{ char: "\u010f", color: colors.yellow }],
  facing: {
    up: [{ char: "\u011d", color: colors.yellow }],
    right: [{ char: "\u010f", color: colors.yellow }],
    down: [{ char: "\u011e", color: colors.yellow }],
    left: [{ char: "\u0110", color: colors.yellow }],
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
  layers: [{ char: "0", color: colors.silver }],
};

export const goldEye: Sprite = {
  name: "Eye",
  layers: [{ char: "0", color: colors.yellow }],
};

export const fireEye: Sprite = {
  name: "Eye",
  layers: [{ char: "0", color: colors.red }],
};

export const waterRye: Sprite = {
  name: "Eye",
  layers: [{ char: "0", color: colors.blue }],
};

export const ghost: Sprite = {
  name: "Soul",
  layers: [
    { char: "\u010b", color: colors.grey },
    { char: "~", color: colors.grey },
    { char: "°", color: colors.yellow },
  ],
};

export const halo: Sprite = {
  name: "Soul",
  layers: [{ char: "°", color: colors.yellow }],
};
