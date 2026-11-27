import { colors } from "../colors";
import { Sprite } from "../../../engine/components/sprite";

export const sign: Sprite = {
  id: "sign",
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
  id: "house_plate",
  name: "Sign",
  layers: [
    { char: "█", color: colors.grey },
    { char: "■", color: colors.maroon },
    { char: "\u0106", color: colors.silver },
    { char: "÷", color: colors.maroon },
  ],
};

export const houseDruid: Sprite = {
  id: "house_druid",
  name: "house_druid",
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "+", color: colors.black },
    ],
  },
  layers: [
    { char: "█", color: colors.grey },
    { char: "+", color: colors.silver },
  ],
};

export const houseMage: Sprite = {
  id: "house_mage",
  name: "house_mage",
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "\u0103", color: colors.black },
    ],
  },
  layers: [
    { char: "█", color: colors.grey },
    { char: "\u0103", color: colors.white },
    { char: "\u011c", color: colors.silver },
    { char: "-", color: colors.white },
  ],
};

export const houseSmith: Sprite = {
  id: "house_smith",
  name: "house_smith",
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "x", color: colors.black },
    ],
  },
  layers: [
    { char: "█", color: colors.grey },
    { char: "*", color: colors.silver },
    { char: "─", color: colors.grey },
    { char: "·", color: colors.silver },
  ],
};

export const houseTrader: Sprite = {
  id: "house_trader",
  name: "house_trader",
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "°", color: colors.black },
    ],
  },
  layers: [
    { char: "█", color: colors.grey },
    { char: "\u0108", color: colors.silver },
  ],
};

export const houseHunter: Sprite = {
  id: "house_hunter",
  name: "house_hunter",
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "»", color: colors.black },
    ],
  },
  layers: [
    { char: "█", color: colors.grey },
    { char: "\u0119", color: colors.silver },
    { char: "»", color: colors.white },
  ],
};

export const fence: Sprite = {
  id: "fence",
  name: "Fence",
  layers: [
    { char: "=", color: colors.maroon },
    { char: "|", color: colors.maroon },
  ],
  amounts: {
    single: [{ char: "|", color: colors.maroon }],
    double: [
      { char: "=", color: colors.maroon },
      { char: "═", color: colors.black },
      { char: "|", color: colors.maroon },
    ],
    multiple: [
      { char: "=", color: colors.maroon },
      { char: "|", color: colors.maroon },
    ],
  },
};

export const palisade: Sprite = {
  id: "palisade",
  name: "Wall",
  layers: [
    { char: "±", color: colors.grey },
    { char: "⌐", color: colors.black },
    { char: "+", color: colors.grey },
    { char: "-", color: colors.black },
    { char: "·", color: colors.grey },
    { char: "=", color: colors.grey },
    { char: ":", color: colors.grey },
    { char: ".", color: colors.grey },
  ],
  amounts: {
    single: [
      { char: "±", color: colors.grey },
      { char: "⌐", color: colors.black },
      { char: "+", color: colors.grey },
      { char: "-", color: colors.black },
      { char: "·", color: colors.grey },
      { char: ":", color: colors.grey },
      { char: ".", color: colors.grey },
    ],
    double: [
      { char: "±", color: colors.grey },
      { char: "⌐", color: colors.black },
      { char: "+", color: colors.grey },
      { char: "-", color: colors.black },
      { char: "=", color: colors.grey },
      { char: "═", color: colors.black },
      { char: "·", color: colors.grey },
      { char: ":", color: colors.grey },
      { char: ".", color: colors.grey },
    ],
    multiple: [
      { char: "±", color: colors.grey },
      { char: "⌐", color: colors.black },
      { char: "+", color: colors.grey },
      { char: "-", color: colors.black },
      { char: "·", color: colors.grey },
      { char: "=", color: colors.grey },
      { char: ":", color: colors.grey },
      { char: ".", color: colors.grey },
    ],
  },
};

export const barrier: Sprite = {
  id: "barrier",
  name: "Barrier",
  layers: [
    { char: "±", color: colors.grey },
    { char: "⌐", color: colors.black },
    { char: "+", color: colors.grey },
    { char: "-", color: colors.black },
    { char: "=", color: colors.red },
    { char: "∙", color: colors.grey },
    { char: ":", color: colors.grey },
    { char: ".", color: colors.grey },
  ],
  amounts: {
    single: [
      { char: "±", color: colors.grey },
      { char: "⌐", color: colors.black },
      { char: "+", color: colors.grey },
      { char: "-", color: colors.black },
      { char: "·", color: colors.red },
      { char: ":", color: colors.grey },
      { char: ".", color: colors.grey },
    ],
    double: [
      { char: "±", color: colors.grey },
      { char: "⌐", color: colors.black },
      { char: "+", color: colors.grey },
      { char: "-", color: colors.black },
      { char: "=", color: colors.red },
      { char: "═", color: colors.black },
      { char: "∙", color: colors.grey },
      { char: ":", color: colors.grey },
      { char: ".", color: colors.grey },
    ],
    multiple: [
      { char: "±", color: colors.grey },
      { char: "⌐", color: colors.black },
      { char: "+", color: colors.grey },
      { char: "-", color: colors.black },
      { char: "=", color: colors.red },
      { char: "∙", color: colors.grey },
      { char: ":", color: colors.grey },
      { char: ".", color: colors.grey },
    ],
  },
};

export const brokenPalisade1: Sprite = {
  id: "broken_palisade1",
  name: "palisade_broken_1",
  layers: [
    { char: "±", color: colors.grey },
    { char: "⌐", color: colors.black },
    { char: "\u011d", color: colors.black },
    { char: "\u011e", color: colors.black },
    { char: ".", color: colors.grey },
  ],
};

export const brokenPalisade2: Sprite = {
  id: "broken_palisade2",
  name: "palisade_broken_2",
  layers: [
    { char: "±", color: colors.grey },
    { char: "⌐", color: colors.black },
    { char: "\u011d", color: colors.black },
    { char: "\u011e", color: colors.black },
    { char: "÷", color: colors.grey },
    { char: "-", color: colors.black },
    { char: "=", color: colors.black },
    { char: ".", color: colors.grey },
  ],
};

export const fenceBurnt1: Sprite = {
  id: "fence_burnt1",
  name: "fence_burnt_one",
  layers: [
    { char: "|", color: colors.maroon },
    { char: "┴", color: colors.black },
    { char: "∙", color: colors.grey },
    { char: "·", color: colors.black },
  ],
};

export const fenceBurnt2: Sprite = {
  id: "fence_burnt2",
  name: "fence_burnt_two",
  layers: [
    { char: "|", color: colors.maroon },
    { char: "┴", color: colors.black },
    { char: "·", color: colors.grey },
  ],
};

export const fenceDoorBurnt: Sprite = {
  id: "fence_door_burnt",
  name: "fence_door_burnt",
  layers: [
    { char: "\u011f", color: colors.maroon },
    { char: "\u011e", color: colors.black },
    { char: "-", color: colors.grey },
    { char: "[", color: colors.black },
    { char: "|", color: colors.black },
  ],
};

export const palisadeDoorBroken: Sprite = {
  id: "palisade_door_broken",
  name: "palisade_door_broken",
  layers: [
    { char: "\u011f", color: colors.grey },
    { char: "\u011e", color: colors.black },
    { char: "-", color: colors.maroon },
    { char: "[", color: colors.black },
    { char: "|", color: colors.black },
  ],
};

export const stairs: Sprite = {
  id: "stairs",
  name: "Stairs",
  layers: [
    { char: "M", color: colors.grey },
    { char: "[", color: colors.black },
    { char: "]", color: colors.black },
    { char: "≡", color: colors.grey },
  ],
};

export const anvil: Sprite = {
  id: "anvil",
  name: "Anvil",
  terminal: { layers: [{ char: "▬", color: colors.silver }] },
  layers: [
    { char: "\u2261", color: colors.grey },
    { char: "-", color: colors.silver },
    { char: "\u011e", color: colors.grey },
  ],
};

export const kettle: Sprite = {
  id: "kettle",
  name: "Kettle",
  terminal: { layers: [{ char: "U", color: colors.silver }] },
  layers: [
    { char: "■", color: colors.blue },
    { char: "≡", color: colors.black },
    { char: "=", color: colors.black },
    { char: "-", color: colors.blue },
    { char: "w", color: colors.grey },
    { char: "\u0106", color: colors.blue },
  ],
};

export const bench: Sprite = {
  id: "bench",
  name: "Bench",
  layers: [
    { char: "\u011e", color: colors.silver },
    { char: ",", color: colors.black },
    { char: "π", color: colors.maroon },
  ],
};

export const iglooWall: Sprite = {
  id: "igloo_wall",
  name: "igloo_wall",
  layers: [
    { char: "█", color: colors.teal },
    { char: "√", color: colors.aqua },
    { char: "₧", color: colors.aqua },
    { char: "M", color: colors.aqua },
    { char: "\u0113", color: colors.aqua },
    { char: "▄", color: colors.aqua },
    { char: "┬", color: colors.teal },
    { char: "░", color: colors.teal },
    { char: "╥", color: colors.aqua },
    { char: "─", color: colors.teal },
  ],
};

export const iglooRoofLeftUp: Sprite = {
  id: "igloo_roof_left_up",
  name: "igloo_roof_left",
  layers: [
    { char: "▄", color: colors.aqua },
    { char: "░", color: colors.teal },
    { char: "┌", color: colors.teal },
    { char: "▌", color: colors.black },
    { char: "▀", color: colors.black },
  ],
};

export const iglooRoofUp: Sprite = {
  id: "igloo_roof_up",
  name: "igloo_roof_up",
  layers: [
    { char: "▄", color: colors.aqua },
    { char: "░", color: colors.teal },
    { char: "┬", color: colors.teal },
    { char: "╥", color: colors.aqua },
    { char: "▀", color: colors.black },
    { char: "─", color: colors.teal },
  ],
};

export const iglooRoofUpRight: Sprite = {
  id: "igloo_roof_up_right",
  name: "igloo_roof_right",
  layers: [
    { char: "▄", color: colors.aqua },
    { char: "░", color: colors.teal },
    { char: "┐", color: colors.teal },
    { char: "▐", color: colors.black },
    { char: "▀", color: colors.black },
  ],
};

export const iglooLeftInside: Sprite = {
  id: "igloo_left_inside",
  name: "igloo_left_inside",
  layers: [
    { char: "▌", color: colors.aqua },
    { char: "░", color: colors.black },
    { char: "▐", color: colors.black },
    { char: "│", color: colors.teal },
  ],
};

export const iglooLeftUpInside: Sprite = {
  id: "igloo_left_up_inside",
  name: "igloo_left_up_inside",
  layers: [
    { char: "▌", color: colors.aqua },
    { char: "▀", color: colors.aqua },
    { char: "░", color: colors.black },
    { char: "┌", color: colors.teal },
  ],
};

export const iglooUpInside: Sprite = {
  id: "igloo_up_inside",
  name: "igloo_up_inside",
  layers: [
    { char: "▀", color: colors.aqua },
    { char: "░", color: colors.black },
    { char: "▄", color: colors.black },
    { char: "─", color: colors.teal },
  ],
};

export const iglooUpRightInside: Sprite = {
  id: "igloo_up_right_inside",
  name: "igloo_up_right_inside",
  layers: [
    { char: "▐", color: colors.aqua },
    { char: "▀", color: colors.aqua },
    { char: "░", color: colors.black },
    { char: "┐", color: colors.teal },
  ],
};

export const iglooRightInside: Sprite = {
  id: "igloo_right_inside",
  name: "igloo_right_inside",
  layers: [
    { char: "▐", color: colors.aqua },
    { char: "░", color: colors.black },
    { char: "▌", color: colors.black },
    { char: "│", color: colors.teal },
  ],
};

export const iglooRightDownInside: Sprite = {
  id: "igloo_right_down_inside",
  name: "igloo_right_down_inside",
  layers: [
    { char: "▐", color: colors.aqua },
    { char: "▄", color: colors.aqua },
    { char: "░", color: colors.black },
    { char: "┘", color: colors.teal }
  ],
};

export const iglooDownInside: Sprite = {
  id: "igloo_down_inside",
  name: "igloo_down_inside",
  layers: [
    { char: "▄", color: colors.aqua },
    { char: "░", color: colors.black },
    { char: "▀", color: colors.black },
    { char: "─", color: colors.teal },
  ],
};

export const iglooDownLeftInside: Sprite = {
  id: "igloo_down_left_inside",
  name: "igloo_down_left_inside",
  layers: [
    { char: "▌", color: colors.aqua },
    { char: "▄", color: colors.aqua },
    { char: "░", color: colors.black },
    { char: "└", color: colors.teal },
  ],
};


export const fortressRoof: Sprite = {
  id: "fortress_roof",
  name: "fortress_roof_center",
  terminal: { layers: [{ char: "█", color: colors.silver }] },
  layers: [{ char: "█", color: colors.olive }],
};

export const fortressRoofLeft: Sprite = {
  id: "fortress_roof_left",
  name: "fortress_roof_left",
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "║", color: colors.maroon },
    ],
  },
  layers: [
    { char: "▌", color: colors.grey },
    { char: "≡", color: colors.black },
    { char: "─", color: colors.black },
    { char: "_", color: colors.black },
    { char: "▐", color: colors.olive },
    { char: "╙", color: colors.silver },
    { char: "┌", color: colors.olive },
    { char: "│", color: colors.silver },
  ],
};

export const fortressRoofRight: Sprite = {
  id: "fortress_roof_right",
  name: "fortress_roof_right",
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "║", color: colors.maroon },
    ],
  },
  layers: [
    { char: "▐", color: colors.grey },
    { char: "≡", color: colors.black },
    { char: "─", color: colors.black },
    { char: "_", color: colors.black },
    { char: "▌", color: colors.olive },
    { char: "╜", color: colors.silver },
    { char: "┘", color: colors.olive },
    { char: "│", color: colors.silver },
  ],
};

export const fortressRoofUp: Sprite = {
  id: "fortress_roof_up",
  name: "fortress_roof_up",
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "═", color: colors.maroon },
    ],
  },
  layers: [
    { char: "▄", color: colors.olive },
    { char: "▀", color: colors.black },
    { char: "╨", color: colors.silver },
    { char: "┴", color: colors.silver },
  ],
};

export const fortressRoofUpInside: Sprite = {
  id: "fortress_roof_up_inside",
  name: "fortress_roof_up_inside",
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "═", color: colors.maroon },
    ],
  },
  layers: [
    { char: "▀", color: colors.grey },
    { char: "≡", color: colors.black },
    { char: "─", color: colors.black },
    { char: "_", color: colors.black },
    { char: "─", color: colors.silver },
  ],
};

export const fortressRoofUpRight: Sprite = {
  id: "fortress_roof_up_right",
  name: "fortress_roof_up_right",
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "╗", color: colors.maroon },
    ],
  },
  layers: [
    { char: "█", color: colors.olive },
    { char: "▐", color: colors.black },
    { char: "▀", color: colors.black },
    { char: "┤", color: colors.silver },
    { char: "╜", color: colors.silver },
  ],
};

export const fortressRoofUpRightInside: Sprite = {
  id: "fortress_roof_up_right_inside",
  name: "fortress_roof_up_right_inside",
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "╗", color: colors.maroon },
    ],
  },
  layers: [
    { char: "▐", color: colors.grey },
    { char: "▀", color: colors.grey },
    { char: "≡", color: colors.black },
    { char: "─", color: colors.black },
    { char: "_", color: colors.black },
    { char: "┐", color: colors.silver },
  ],
};

export const fortressRoofDownLeft: Sprite = {
  id: "fortress_roof_down_left",
  name: "fortress_roof_down_left",
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "╠", color: colors.maroon },
    ],
  },
  layers: [
    { char: "▐", color: colors.olive },
    { char: "▌", color: colors.grey },
    { char: "▄", color: colors.grey },
    { char: "≡", color: colors.black },
    { char: "─", color: colors.black },
    { char: "_", color: colors.black },
    { char: "╙", color: colors.silver },
    { char: "└", color: colors.silver },
  ],
};

export const fortressRoofDown: Sprite = {
  id: "fortress_roof_down",
  name: "fortress_roof_down",
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "═", color: colors.maroon },
    ],
  },
  layers: [
    { char: "▄", color: colors.grey },
    { char: "≡", color: colors.black },
    { char: "─", color: colors.black },
    { char: "_", color: colors.black },
    { char: "▀", color: colors.olive },
    { char: "╨", color: colors.silver },
    { char: "┴", color: colors.silver },
  ],
};

export const fortressRoofRightDown: Sprite = {
  id: "fortress_roof_right_down",
  name: "fortress_roof_right_down",
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "╣", color: colors.maroon },
    ],
  },
  layers: [
    { char: "▄", color: colors.grey },
    { char: "≡", color: colors.black },
    { char: "▀", color: colors.olive },
    { char: "▐", color: colors.grey },
    { char: "─", color: colors.black },
    { char: "_", color: colors.black },
    { char: ":", color: colors.black },
    { char: "+", color: colors.grey },
    { char: "╜", color: colors.silver },
    { char: "┘", color: colors.silver },
  ],
};

export const fortressRoofLeftUp: Sprite = {
  id: "fortress_roof_left_up",
  name: "fortress_roof_left_up",
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "╔", color: colors.maroon },
    ],
  },
  layers: [
    { char: "█", color: colors.olive },
    { char: "▌", color: colors.black },
    { char: "▀", color: colors.black },
    { char: "╙", color: colors.silver },
    { char: "├", color: colors.silver },
  ],
};

export const fortressRoofLeftUpInside: Sprite = {
  id: "fortress_roof_left_up_inside",
  name: "fortress_roof_left_up_inside",
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "╔", color: colors.maroon },
    ],
  },
  layers: [
    { char: "▌", color: colors.grey },
    { char: "▀", color: colors.grey },
    { char: "≡", color: colors.black },
    { char: "─", color: colors.black },
    { char: "_", color: colors.black },
    { char: "┌", color: colors.silver },
  ],
};

export const fortressHouse: Sprite = {
  id: "fortress_house",
  name: "fortress_house",
  terminal: { layers: [{ char: "█", color: colors.silver }] },
  layers: [
    { char: "█", color: colors.grey },
    { char: "*", color: colors.black },
    { char: "■", color: colors.grey },
    { char: "≡", color: colors.black },
    { char: "_", color: colors.black },
  ],
};

export const fortressHouseLeft: Sprite = {
  id: "fortress_house_left",
  name: "fortress_house_left",
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "│", color: colors.maroon },
    ],
  },
  layers: [
    { char: "█", color: colors.grey },
    { char: "*", color: colors.black },
    { char: "■", color: colors.grey },
    { char: "≡", color: colors.black },
    { char: "_", color: colors.black },
  ],
};

export const fortressHouseLeftInside: Sprite = {
  id: "fortress_house_left_inside",
  name: "fortress_house_left_inside",
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "│", color: colors.maroon },
    ],
  },
  layers: [
    { char: "▌", color: colors.grey },
    { char: "≡", color: colors.black },
    { char: "─", color: colors.black },
    { char: "_", color: colors.black },
    { char: "│", color: colors.silver },
  ],
};

export const fortressBasementLeftInside: Sprite = {
  id: "fortress_basement_left_inside",
  name: "fortress_basement_left_inside",
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "└", color: colors.maroon },
    ],
  },
  layers: [
    { char: "▌", color: colors.grey },
    { char: "▄", color: colors.grey },
    { char: "≡", color: colors.black },
    { char: "─", color: colors.black },
    { char: "_", color: colors.black },
    { char: "└", color: colors.silver },
  ],
};

export const fortressHouseRight: Sprite = {
  id: "fortress_house_right",
  name: "fortress_house_right",
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "│", color: colors.maroon },
    ],
  },
  layers: [
    { char: "█", color: colors.grey },
    { char: "*", color: colors.black },
    { char: "■", color: colors.grey },
    { char: "≡", color: colors.black },
    { char: "_", color: colors.black },
  ],
};

export const fortressHouseRightInside: Sprite = {
  id: "fortress_house_right_inside",
  name: "fortress_house_right_inside",
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "│", color: colors.maroon },
    ],
  },
  layers: [
    { char: "▐", color: colors.grey },
    { char: "≡", color: colors.black },
    { char: "─", color: colors.black },
    { char: "_", color: colors.black },
    { char: "│", color: colors.silver },
  ],
};

export const fortressBasementRightInside: Sprite = {
  id: "fortress_basement_right_inside",
  name: "fortress_basement_right_inside",
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "┘", color: colors.maroon },
    ],
  },
  layers: [
    { char: "▐", color: colors.grey },
    { char: "▄", color: colors.grey },
    { char: "≡", color: colors.black },
    { char: "─", color: colors.black },
    { char: "_", color: colors.black },
    { char: "┘", color: colors.silver },
  ],
};

export const fortressWallInside: Sprite = {
  id: "fortress_wall_inside",
  name: "fortress_wall_inside",
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "─", color: colors.maroon },
    ],
  },
  layers: [
    { char: "▄", color: colors.grey },
    { char: "≡", color: colors.black },
    { char: "─", color: colors.black },
    { char: "_", color: colors.black },
    { char: "─", color: colors.silver },
  ],
};

export const fortressWindow: Sprite = {
  id: "fortress_window",
  name: "fortress_window",
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "┴", color: colors.maroon },
    ],
  },
  layers: [
    { char: "█", color: colors.grey },
    { char: "_", color: colors.black },
    { char: "±", color: colors.silver },
    { char: "■", color: colors.black },
  ],
};

export const fortressWindowInside: Sprite = {
  id: "fortress_window_inside",
  name: "fortress_window_inside",
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "┬", color: colors.maroon },
    ],
  },
  layers: [
    { char: "▄", color: colors.grey },
    { char: "_", color: colors.black },
    { char: "─", color: colors.silver },
    { char: "±", color: colors.silver },
    { char: "■", color: colors.black },
  ],
};

export const roof: Sprite = {
  id: "roof",
  name: "roof_center",
  terminal: {
    layers: [
      { char: "█", color: colors.maroon },
      { char: "░", color: colors.red },
    ],
  },
  layers: [
    { char: "█", color: colors.black },
    { char: "▒", color: colors.red },
  ],
};

export const roofLeft: Sprite = {
  id: "roof_left",
  name: "roof_left",
  terminal: {
    layers: [
      { char: "█", color: colors.maroon },
      { char: "│", color: colors.red },
    ],
  },
  layers: [
    { char: "▒", color: colors.red },
    { char: "▌", color: colors.black },
    { char: "│", color: colors.maroon },
  ],
};

export const roofRight: Sprite = {
  id: "roof_right",
  name: "roof_right",
  terminal: {
    layers: [
      { char: "█", color: colors.maroon },
      { char: "│", color: colors.red },
    ],
  },
  layers: [
    { char: "▒", color: colors.red },
    { char: "▐", color: colors.black },
    { char: "│", color: colors.maroon },
  ],
};

export const roofUp: Sprite = {
  id: "roof_up",
  name: "roof_up",
  terminal: {
    layers: [
      { char: "█", color: colors.maroon },
      { char: "─", color: colors.red },
    ],
  },
  layers: [
    { char: "▒", color: colors.red },
    { char: "▀", color: colors.black },
    { char: "─", color: colors.maroon },
  ],
};

export const roofUpInside: Sprite = {
  id: "roof_up_inside",
  name: "roof_up_inside",
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "─", color: colors.maroon },
    ],
  },
  layers: [
    { char: "▀", color: colors.grey },
    { char: "─", color: colors.maroon },
  ],
};

export const roofUpRight: Sprite = {
  id: "roof_up_right",
  name: "roof_up_right",
  terminal: {
    layers: [
      { char: "█", color: colors.maroon },
      { char: "┐", color: colors.red },
    ],
  },
  layers: [
    { char: "▒", color: colors.red },
    { char: "▐", color: colors.black },
    { char: "▀", color: colors.black },
    { char: "┐", color: colors.maroon },
    { char: "\\", color: colors.maroon },
  ],
};

export const roofUpRightInside: Sprite = {
  id: "roof_up_right_inside",
  name: "roof_up_right_inside",
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "┐", color: colors.maroon },
    ],
  },
  layers: [
    { char: "▐", color: colors.grey },
    { char: "▀", color: colors.grey },
    { char: "┐", color: colors.maroon },
  ],
};

export const roofDownLeft: Sprite = {
  id: "roof_down_left",
  name: "roof_down_left",
  terminal: {
    layers: [
      { char: "█", color: colors.maroon },
      { char: "├", color: colors.red },
    ],
  },
  layers: [
    { char: "▒", color: colors.red },
    { char: "▄", color: colors.grey },
    { char: "▌", color: colors.black },
    { char: "├", color: colors.maroon },
    { char: "/", color: colors.maroon },
  ],
};

export const roofDown: Sprite = {
  id: "roof_down",
  name: "roof_down",
  terminal: {
    layers: [
      { char: "█", color: colors.maroon },
      { char: "─", color: colors.red },
    ],
  },
  layers: [
    { char: "▀", color: colors.black },
    { char: "▒", color: colors.red },
    { char: "▄", color: colors.grey },
    { char: "─", color: colors.maroon },
  ],
};

export const roofRightDown: Sprite = {
  id: "roof_right_down",
  name: "roof_right_down",
  terminal: {
    layers: [
      { char: "█", color: colors.maroon },
      { char: "┤", color: colors.red },
    ],
  },
  layers: [
    { char: "▒", color: colors.red },
    { char: "▄", color: colors.grey },
    { char: "▐", color: colors.black },
    { char: "┤", color: colors.maroon },
    { char: "\\", color: colors.maroon },
  ],
};

export const roofLeftUp: Sprite = {
  id: "roof_left_up",
  name: "roof_left_up",
  terminal: {
    layers: [
      { char: "█", color: colors.maroon },
      { char: "┌", color: colors.red },
    ],
  },
  layers: [
    { char: "▒", color: colors.red },
    { char: "▌", color: colors.black },
    { char: "▀", color: colors.black },
    { char: "┌", color: colors.maroon },
    { char: "/", color: colors.maroon },
  ],
};

export const roofLeftUpInside: Sprite = {
  id: "roof_left_up_inside",
  name: "roof_left_up_inside",
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "┌", color: colors.maroon },
    ],
  },
  layers: [
    { char: "▌", color: colors.grey },
    { char: "▀", color: colors.grey },
    { char: "┌", color: colors.maroon },
  ],
};

export const house: Sprite = {
  id: "house",
  name: "house",
  terminal: { layers: [{ char: "█", color: colors.silver }] },
  layers: [{ char: "█", color: colors.grey }],
};

export const houseLeft: Sprite = {
  id: "house_left",
  name: "house_left",
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "▌", color: colors.maroon },
    ],
  },
  layers: [
    { char: "▐", color: colors.grey },
    { char: "│", color: colors.maroon },
  ],
};

export const basementLeftInside: Sprite = {
  id: "basement_left_inside",
  name: "basement_left_inside",
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "▌", color: colors.maroon },
    ],
  },
  layers: [
    { char: "▌", color: colors.grey },
    { char: "▄", color: colors.grey },
    { char: "└", color: colors.maroon },
  ],
};

export const houseRight: Sprite = {
  id: "house_right",
  name: "house_right",
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "▐", color: colors.maroon },
    ],
  },
  layers: [
    { char: "▌", color: colors.grey },
    { char: "│", color: colors.maroon },
  ],
};

export const basementRightInside: Sprite = {
  id: "basement_right_inside",
  name: "basement_right_inside",
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "▐", color: colors.maroon },
    ],
  },
  layers: [
    { char: "▐", color: colors.grey },
    { char: "▄", color: colors.grey },
    { char: "┘", color: colors.maroon },
  ],
};

export const wallInside: Sprite = {
  id: "wall_inside",
  name: "wall_inside",
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "─", color: colors.maroon },
    ],
  },
  layers: [
    { char: "▄", color: colors.grey },
    { char: "─", color: colors.maroon },
  ],
};

export const window: Sprite = {
  id: "window",
  name: "window",
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "■", color: colors.black },
    ],
  },
  layers: [
    { char: "▄", color: colors.grey },
    { char: "┴", color: colors.maroon },
  ],
};

export const windowInside: Sprite = {
  id: "window_inside",
  name: "window_inside",
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "■", color: colors.black },
    ],
  },
  layers: [{ char: "┬", color: colors.maroon }],
};

export const bedItem: Sprite = {
  id: "bed_item",
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
  id: "bed_head_left",
  name: "bed_head_left",
  terminal: { layers: [{ char: "╞", color: colors.maroon }] },
  layers: [
    { char: "╞", color: colors.silver },
    { char: "┌", color: colors.maroon },
    { char: "│", color: colors.black },
    { char: "|", color: colors.maroon },
  ],
};

export const bedHeadRight: Sprite = {
  id: "bed_head_right",
  name: "bed_head_right",
  terminal: { layers: [{ char: "╡", color: colors.maroon }] },
  layers: [
    { char: "╡", color: colors.silver },
    { char: "┐", color: colors.maroon },
    { char: "│", color: colors.black },
    { char: "|", color: colors.maroon },
  ],
};

export const bedCenter: Sprite = {
  id: "bed_center",
  name: "bed_center",
  terminal: { layers: [{ char: "═", color: colors.silver }] },
  layers: [
    { char: "═", color: colors.silver },
    { char: "─", color: colors.maroon },
  ],
};

export const bedEndRight: Sprite = {
  id: "bed_end_right",
  name: "bed_end_right",
  terminal: { layers: [{ char: "╕", color: colors.maroon }] },
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
  id: "bed_end_left",
  name: "bed_end_right",
  terminal: { layers: [{ char: "╒", color: colors.maroon }] },
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
  id: "table",
  name: "Table",
  terminal: { layers: [{ char: "╥", color: colors.maroon }] },
  layers: [
    { char: "∩", color: colors.maroon },
    { char: "▀", color: colors.black },
    { char: "-", color: colors.grey },
  ],
};

export const chairLeft: Sprite = {
  id: "chair_left",
  name: "Chair",
  terminal: { layers: [{ char: "_", color: colors.maroon }] },
  layers: [
    { char: "\u011f", color: colors.maroon },
    { char: "\u0110", color: colors.black },
  ],
};

export const chairRight: Sprite = {
  id: "chair_right",
  name: "Chair",
  terminal: { layers: [{ char: "_", color: colors.maroon }] },
  layers: [
    { char: "\u011f", color: colors.maroon },
    { char: "\u010f", color: colors.black },
  ],
};

export const railSide: Sprite = {
  id: "rail_side",
  name: "rail_side",
  layers: [
    { char: "φ", color: colors.maroon },
    { char: "∩", color: colors.maroon },
    { char: "\\", color: colors.maroon },
    { char: "∞", color: colors.black },
    { char: "■", color: colors.black },
    { char: "≡", color: colors.black },
    { char: "\u0115", color: colors.black },
    { char: "%", color: colors.black },
    { char: "─", color: colors.maroon },
    { char: "║", color: colors.silver },
  ],
  facing: {
    right: [
      { char: "[", color: colors.maroon },
      { char: "]", color: colors.maroon },
      { char: "|", color: colors.black },
      { char: "i", color: colors.black },
      { char: "═", color: colors.silver },
    ],
    left: [
      { char: "[", color: colors.maroon },
      { char: "]", color: colors.maroon },
      { char: "|", color: colors.black },
      { char: "i", color: colors.black },
      { char: "═", color: colors.silver },
    ],
  },
};

export const railCorner: Sprite = {
  id: "rail_corner",
  name: "rail_corner",
  layers: [
    { char: "\\", color: colors.maroon },
    { char: "╔", color: colors.silver },
  ],
  facing: {
    right: [
      { char: "/", color: colors.maroon },
      { char: "╗", color: colors.silver },
    ],
    down: [
      { char: "\\", color: colors.maroon },
      { char: "╝", color: colors.silver },
    ],
    left: [
      { char: "/", color: colors.maroon },
      { char: "╚", color: colors.silver },
    ],
  },
};
