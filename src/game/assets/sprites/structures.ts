import { colors } from "../colors";
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

export const houseDruid: Sprite = {
  name: "house_druid",
  layers: [
    { char: "█", color: colors.grey },
    { char: "+", color: colors.silver },
  ],
};

export const houseMage: Sprite = {
  name: "house_mage",
  layers: [
    { char: "█", color: colors.grey },
    { char: "\u0103", color: colors.white },
    { char: "\u011c", color: colors.silver },
    { char: "-", color: colors.white },
  ],
};

export const houseSmith: Sprite = {
  name: "house_smith",
  layers: [
    { char: "█", color: colors.grey },
    { char: "*", color: colors.silver },
    { char: "─", color: colors.grey },
    { char: "·", color: colors.silver },
  ],
};

export const houseTrader: Sprite = {
  name: "house_trader",
  layers: [
    { char: "█", color: colors.grey },
    { char: "\u0108", color: colors.silver },
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

export const fenceBurnt1: Sprite = {
  name: "fence_burnt_one",
  layers: [
    { char: "|", color: colors.maroon },
    { char: "┴", color: colors.black },
    { char: "∙", color: colors.grey },
    { char: "·", color: colors.black },
  ],
};

export const fenceBurnt2: Sprite = {
  name: "fence_burnt_two",
  layers: [
    { char: "|", color: colors.maroon },
    { char: "┴", color: colors.black },
    { char: "·", color: colors.grey },
  ],
};

export const fenceDoorPath: Sprite = {
  name: "Gate",
  layers: [
    { char: "\u0107", color: colors.grey },
    { char: "\u0109", color: colors.grey },
    { char: "▓", color: colors.black },
    { char: "▒", color: colors.black },
    { char: "≡", color: colors.black },

    { char: "M", color: colors.maroon },
    { char: "[", color: colors.black },
    { char: "]", color: colors.black },
    { char: "=", color: colors.grey },
  ],
};

export const fenceDoor: Sprite = {
  name: "Gate",
  layers: [
    { char: "M", color: colors.maroon },
    { char: "[", color: colors.black },
    { char: "]", color: colors.black },
    { char: "=", color: colors.grey },
  ],
};

export const fenceDoorOpen: Sprite = {
  name: "fence_door",
  layers: [
    { char: "M", color: colors.maroon },
    { char: "=", color: colors.grey },
    { char: "[", color: colors.black },
    { char: "]", color: colors.black },
  ],
};

export const fenceDoorOpenPath: Sprite = {
  name: "fence_door",
  layers: [
    { char: "\u0107", color: colors.grey },
    { char: "\u0109", color: colors.grey },
    { char: "▓", color: colors.black },
    { char: "▒", color: colors.black },
    { char: "≡", color: colors.black },

    { char: "M", color: colors.maroon },
    { char: "=", color: colors.grey },
    { char: "[", color: colors.black },
    { char: "]", color: colors.black },
  ],
};

export const fenceDoorBurnt: Sprite = {
  name: "fence_door_burnt",
  layers: [
    { char: "\u011f", color: colors.maroon },
    { char: "\u011e", color: colors.black },
    { char: "-", color: colors.grey },
    { char: "[", color: colors.black },
    { char: "|", color: colors.black },
  ],
};

export const fenceDoorBurntPath: Sprite = {
  name: "fence_door_burnt",
  layers: [
    { char: "\u0107", color: colors.grey },
    { char: "\u0109", color: colors.grey },
    { char: "▓", color: colors.black },
    { char: "▒", color: colors.black },
    { char: "≡", color: colors.black },

    { char: "\u011f", color: colors.maroon },
    { char: "\u011e", color: colors.black },
    { char: "-", color: colors.grey },
    { char: "[", color: colors.black },
    { char: "|", color: colors.black },
  ],
};

export const stairs: Sprite = {
  name: "Stairs",
  layers: [
    { char: "M", color: colors.grey },
    { char: "[", color: colors.black },
    { char: "]", color: colors.black },
    { char: "≡", color: colors.grey },
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

export const kettle: Sprite = {
  name: "Kettle",
  layers: [
    { char: "■", color: colors.blue },
    { char: "≡", color: colors.black },
    { char: "=", color: colors.black },
    { char: "-", color: colors.blue },
    { char: "w", color: colors.grey },
    { char: ".", color: colors.grey },
    { char: "\u0106", color: colors.blue },
  ],
};

export const bucket: Sprite = {
  name: "Bucket",
  layers: [
    { char: "\u011d", color: colors.blue },
    { char: "-", color: colors.black },
    { char: "U", color: colors.maroon },
    { char: "▀", color: colors.black },
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
  layers: [{ char: "┬", color: colors.maroon }],
};

export const bedItem: Sprite = {
  name: "bed_item",
  layers: [
    { char: "Γ", color: colors.maroon },
    { char: "7", color: colors.black },
    { char: "=", color: colors.silver },
    { char: "¬", color: colors.maroon },
    { char: "⌐", color: colors.maroon },
    { char: "\u0115", color: colors.black },

  ],
};

export const bedHeadLeft: Sprite = {
  name: "bed_head_left",
  layers: [
    { char: "╞", color: colors.silver },
    { char: "┌", color: colors.maroon },
    { char: "│", color: colors.black },
    { char: "|", color: colors.maroon },
  ],
};

export const bedHeadRight: Sprite = {
  name: "bed_head_right",
  layers: [
    { char: "╡", color: colors.silver },
    { char: "┐", color: colors.maroon },
    { char: "│", color: colors.black },
    { char: "|", color: colors.maroon },
  ],
};

export const bedCenter: Sprite = {
  name: "bed_center",
  layers: [
    { char: "═", color: colors.silver },
    { char: "─", color: colors.maroon },
  ],
};

export const bedEndRight: Sprite = {
  name: "bed_end_right",
  layers: [
    { char: "╕", color: colors.silver },
    { char: "┐", color: colors.maroon },
    { char: "│", color: colors.black },
    { char: "|", color: colors.maroon },
    { char: "°", color: colors.black },
    { char: "'", color: colors.black },
  ],
};

export const bedEndLeft: Sprite = {
  name: "bed_end_right",
  layers: [
    { char: "╒", color: colors.silver },
    { char: "┌", color: colors.maroon },
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
