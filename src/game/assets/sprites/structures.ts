import * as colors from "../colors";
import { Sprite } from "../../../engine/components/sprite";

export const sign: Sprite = {
  name: "Sign",
  layers: [
    { char: "i", color: colors.maroon },
    { char: "▀", color: colors.grey },
  ],
};

export const anvil: Sprite = {
  name: "Anvil",
  layers: [
    { char: "\u2261", color: colors.grey },
    { char: "-", color: colors.silver },
    { char: "\u011e", color: colors.grey },
  ],
};

export const roofUp: Sprite = {
  name: "roof_up",
  layers: [
    { char: "▒", color: colors.red },
    { char: "▀", color: colors.black },
    { char: "─", color: colors.maroon },
  ],
};

export const roofUpRight: Sprite = {
  name: "roof_up_right",
  layers: [
    { char: "▒", color: colors.red },
    { char: "▐", color: colors.black },
    { char: "▀", color: colors.black },
    { char: "┐", color: colors.maroon },
    { char: "\\", color: colors.maroon },
  ],
};

export const roofDownLeft: Sprite = {
  name: "roof_down_left",
  layers: [
    { char: "▀", color: colors.black },
    { char: "▒", color: colors.red },
    { char: "▄", color: colors.grey },
    { char: "▌", color: colors.black },
    { char: "├", color: colors.maroon },
    { char: "/", color: colors.maroon },
  ],
};

export const roofDown: Sprite = {
  name: "roof_down",
  layers: [
    { char: "▀", color: colors.black },
    { char: "▒", color: colors.red },
    { char: "▄", color: colors.grey },
    { char: "─", color: colors.maroon },
  ],
};

export const roofRightDown: Sprite = {
  name: "roof_right_down",
  layers: [
    { char: "▀", color: colors.black },
    { char: "▒", color: colors.red },
    { char: "▄", color: colors.grey },
    { char: "▐", color: colors.black },
    { char: "┤", color: colors.maroon },
    { char: "\\", color: colors.maroon },
  ],
};

export const roofLeftUp: Sprite = {
  name: "roof_left_up",
  layers: [
    { char: "▒", color: colors.red },
    { char: "▌", color: colors.black },
    { char: "▀", color: colors.black },
    { char: "┌", color: colors.maroon },
    { char: "/", color: colors.maroon },
  ],
};

export const house: Sprite = {
  name: "house",
  layers: [{ char: "█", color: colors.grey }],
};

export const houseLeft: Sprite = {
  name: "house_left",
  layers: [
    { char: "▐", color: colors.grey },
    { char: "│", color: colors.maroon },
  ],
};

export const houseRight: Sprite = {
  name: "house_right",
  layers: [
    { char: "▌", color: colors.grey },
    { char: "│", color: colors.maroon },
  ],
};

export const window: Sprite = {
  name: "window",
  layers: [
    { char: "▄", color: colors.grey },
    { char: "┴", color: colors.maroon },
  ],
};
