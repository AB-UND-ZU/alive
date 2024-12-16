import * as colors from "../colors";
import { Sprite } from "../../../engine/components/sprite";

export const sign: Sprite = {
  name: "Sign",
  layers: [
    { char: "┐", color: colors.maroon },
    { char: "i", color: colors.maroon },
    { char: "-", color: colors.black },
    { char: "■", color: colors.silver },
    { char: "\u0106", color: colors.grey },
    { char: "÷", color: colors.silver },
  ],
};

export const housePlate: Sprite = {
  name: "Sign",
  layers: [
    { char: "█", color: colors.grey },
    { char: "■", color: colors.maroon },
    { char: "\u0106", color: colors.silver },
    { char: "÷", color: colors.maroon },
  ],
};

export const houseAid: Sprite = {
  name: "house_aid",
  layers: [
    { char: "█", color: colors.grey },
    { char: "■", color: colors.white },
    { char: "+", color: colors.red },
  ],
};

export const houseArmor: Sprite = {
  name: "house_armor",
  layers: [
    { char: "█", color: colors.grey },
    { char: "\u0106", color: colors.white },
    { char: "\u0108", color: colors.white },
    { char: "v", color: colors.white },
    { char: "+", color: colors.silver },
  ],
};

export const houseHunter: Sprite = {
  name: "house_hunter",
  layers: [
    { char: "█", color: colors.grey },
    { char: "\u0119", color: colors.silver },
    { char: "»", color: colors.white },
  ],
};

export const fence: Sprite = {
  name: "fence_wall",
  layers: [
    { char: "=", color: colors.maroon },
    { char: "|", color: colors.maroon },
  ],
};

export const fenceDoor: Sprite = {
  name: "fence_door",
  layers: [
    { char: "⌐", color: colors.maroon },
    { char: "¬", color: colors.maroon },
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

export const roof: Sprite = {
  name: "roof_center",
  layers: [
    { char: "█", color: colors.black },
    { char: "▒", color: colors.red },
  ],
};

export const roofLeft: Sprite = {
  name: "roof_left",
  layers: [
    { char: "▒", color: colors.red },
    { char: "▌", color: colors.black },
    { char: "│", color: colors.maroon },
  ],
};

export const roofRight: Sprite = {
  name: "roof_right",
  layers: [
    { char: "▒", color: colors.red },
    { char: "▐", color: colors.black },
    { char: "│", color: colors.maroon },
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

export const roofUpInside: Sprite = {
  name: "roof_up_inside",
  layers: [
    { char: "▀", color: colors.grey },
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

export const roofUpRightInside: Sprite = {
  name: "roof_up_right_inside",
  layers: [
    { char: "▐", color: colors.grey },
    { char: "▀", color: colors.grey },
    { char: "┐", color: colors.maroon },
  ],
};

export const roofDownLeft: Sprite = {
  name: "roof_down_left",
  layers: [
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

export const roofLeftUpInside: Sprite = {
  name: "roof_left_up_inside",
  layers: [
    { char: "▌", color: colors.grey },
    { char: "▀", color: colors.grey },
    { char: "┌", color: colors.maroon },
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

export const basementLeftInside: Sprite = {
  name: "basement_left_inside",
  layers: [
    { char: "▌", color: colors.grey },
    { char: "▄", color: colors.grey },
    { char: "└", color: colors.maroon },
  ],
};

export const houseRight: Sprite = {
  name: "house_right",
  layers: [
    { char: "▌", color: colors.grey },
    { char: "│", color: colors.maroon },
  ],
};

export const basementRightInside: Sprite = {
  name: "basement_right_inside",
  layers: [
    { char: "▐", color: colors.grey },
    { char: "▄", color: colors.grey },
    { char: "┘", color: colors.maroon },
  ],
};

export const wallInside: Sprite = {
  name: "wall_inside",
  layers: [
    { char: "▄", color: colors.grey },
    { char: "─", color: colors.maroon },
  ],
};

export const window: Sprite = {
  name: "window",
  layers: [
    { char: "▄", color: colors.grey },
    { char: "┴", color: colors.maroon },
  ],
};

export const windowInside: Sprite = {
  name: "window_inside",
  layers: [
    { char: "┬", color: colors.maroon },
  ],
};

export const bedLeft: Sprite = {
  name: "bed_left",
  layers: [
    { char: "╞", color: colors.silver },
    { char: "┌", color: colors.maroon },
    { char: "│", color: colors.black },
    { char: "|", color: colors.maroon },
  ],
};

export const bedRight: Sprite = {
  name: "bed_right",
  layers: [
    { char: "╕", color: colors.silver },
    { char: "┐", color: colors.maroon },
    { char: "│", color: colors.black },
    { char: "|", color: colors.maroon },
    { char: "°", color: colors.black },
    { char: "'", color: colors.black },
  ],
};

export const table: Sprite = {
  name: "table",
  layers: [
    { char: "╥", color: colors.maroon },
    { char: "─", color: colors.silver },
  ],
};

export const chairLeft: Sprite = {
  name: "chair_left",
  layers: [
    { char: "\u011f", color: colors.maroon },
    { char: "\u0110", color: colors.black },
  ],
};

export const chairRight: Sprite = {
  name: "chair_right",
  layers: [
    { char: "\u011f", color: colors.maroon },
    { char: "\u010f", color: colors.black },
  ],
};