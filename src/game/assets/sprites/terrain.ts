import * as colors from "../colors";
import { Sprite } from "../../../engine/components/sprite";

export const none: Sprite = {
  name: "",
  layers: [],
};

export const shadow: Sprite = {
  name: "",
  layers: [
    { char: "\u0100", color: colors.black },
    { char: "\u0101", color: colors.black },
  ],
};

export const fog: Sprite = {
  name: "fog_hidden",
  // colors.grey with shadow,
  layers: [{ char: "≈", color: "#2e2e2e" }],
};

export const wall: Sprite = {
  name: "wall_solid",
  layers: [{ char: "█", color: colors.grey }],
};

export const ironMine: Sprite = {
  name: "Iron",
  layers: [
    { char: "█", color: colors.grey },
    { char: "÷", color: colors.silver },
    { char: "·", color: colors.grey },
  ],
};

export const goldMine: Sprite = {
  name: "Gold",
  layers: [
    { char: "█", color: colors.grey },
    { char: "÷", color: colors.yellow },
    { char: "·", color: colors.grey },
  ],
};

export const diamondMine: Sprite = {
  name: "Diamond",
  layers: [
    { char: "█", color: colors.grey },
    { char: "÷", color: colors.aqua },
    { char: "·", color: colors.grey },
  ],
};

export const water: Sprite = {
  name: "water_shallow",
  layers: [{ char: "█", color: colors.navy }],
};

export const ice: Sprite = {
  name: "water_ice",
  layers: [{ char: "█", color: colors.teal }],
};

export const sand: Sprite = {
  name: "sand_dry",
  layers: [{ char: "░", color: colors.olive }],
};

export const path: Sprite = {
  name: "path_normal",
  layers: [
    { char: "░", color: colors.grey },
    { char: "▒", color: colors.black },
    { char: "≡", color: colors.black },
  ],
};

export const oak: Sprite = {
  name: "tree_oak",
  layers: [
    { char: "Y", color: colors.green },
    { char: "▄", color: colors.black },
    { char: "┐", color: colors.maroon },
    { char: "w", color: colors.green },
    { char: "─", color: colors.black },
    { char: "±", color: colors.green },
    { char: "∙", color: colors.maroon },
  ],
};

export const stem: Sprite = {
  name: "tree_stem",
  layers: [
    { char: "│", color: colors.maroon },
    { char: "┬", color: colors.black },
    { char: "l", color: colors.maroon },
  ],
};

export const leaves: Sprite = {
  name: "tree_leaves",
  layers: [
    { char: "\u0107", color: colors.green },
    { char: "\u0106", color: colors.green },
    { char: "▀", color: colors.black },
    { char: "░", color: colors.black },
  ],
};

export const palm1: Sprite = {
  name: "palm_one",
  layers: [
    { char: "T", color: colors.green },
    { char: "\u0104", color: colors.green },
    { char: "▄", color: colors.black },
    { char: '"', color: colors.green },
    { char: "┐", color: colors.olive },
    { char: "+", color: colors.olive },
    { char: "─", color: colors.black },
    { char: "∙", color: colors.olive },
  ],
};

export const palm2: Sprite = {
  name: "palm_two",
  layers: [
    { char: "┐", color: colors.olive },
    { char: "─", color: colors.black },
    { char: "W", color: colors.green },
    { char: "|", color: colors.green },
    { char: ".", color: colors.olive },
  ],
};

export const hedge1: Sprite = {
  name: "hedge_one",
  layers: [{ char: "\u0104", color: colors.green }],
};

export const hedge2: Sprite = {
  name: "hedge_two",
  layers: [
    { char: "ß", color: colors.green },
    { char: "!", color: colors.green },
  ],
};

export const tree1: Sprite = {
  name: "tree_one",
  layers: [
    { char: "┐", color: colors.maroon },
    { char: "#", color: colors.green },
  ],
  amounts: {
    single: [{ char: "┐", color: colors.maroon }],
    double: [
      { char: "┐", color: colors.maroon },
      { char: "+", color: colors.green },
    ],
    multiple: [
      { char: "┐", color: colors.maroon },
      { char: "#", color: colors.green },
    ],
  },
};

export const tree2: Sprite = {
  name: "tree_two",
  layers: [
    { char: "┐", color: colors.maroon },
    { char: "Θ", color: colors.green },
  ],
  amounts: {
    single: [{ char: "┐", color: colors.maroon }],
    double: [
      { char: "┐", color: colors.maroon },
      { char: "\u0108", color: colors.green },
    ],
    multiple: [
      { char: "┐", color: colors.maroon },
      { char: "Θ", color: colors.green },
    ],
  },
};

export const sapling1: Sprite = {
  name: "Sapling",
  layers: [
    { char: "+", color: colors.green },
    { char: ",", color: colors.maroon },
  ],
};

export const sapling2: Sprite = {
  name: "Sapling",
  layers: [
    { char: ",", color: colors.maroon },
    { char: "\u0106", color: colors.green },
    { char: "∙", color: colors.black },
  ],
};

export const bush: Sprite = {
  name: "bush_empty",
  layers: [{ char: "\u03c4", color: colors.olive }],
};

export const grass: Sprite = {
  name: "grass_empty",
  layers: [{ char: ",", color: colors.olive }],
};

export const cactus1: Sprite = {
  name: "cactus_one",
  layers: [
    { char: "░", color: colors.olive },
    { char: "\u0100", color: colors.black },
    { char: "\u0101", color: colors.black },

    { char: "-", color: colors.green },
    { char: "┐", color: colors.black },
    { char: "\u011b", color: colors.green },
    { char: "|", color: colors.green },
  ],
};

export const cactus2: Sprite = {
  name: "cactus_two",
  layers: [
    { char: "░", color: colors.olive },
    { char: "\u0100", color: colors.black },
    { char: "\u0101", color: colors.black },

    { char: "¥", color: colors.green },
  ],
};

export const tombstone1: Sprite = {
  name: "",
  layers: [
    { char: "!", color: colors.black },
    { char: "\u0115", color: colors.grey },
    { char: "\u011c", color: colors.grey },
    { char: "\u0106", color: colors.grey },
    { char: "Ω", color: colors.grey },
  ],
};

export const tombstone2: Sprite = {
  name: "",
  layers: [
    { char: "'", color: colors.black },
    { char: "º", color: colors.grey },
    { char: "^", color: colors.grey },
    { char: "\u0115", color: colors.grey },
    { char: "\u011d", color: colors.grey },
    { char: "\u011f", color: colors.grey },
  ],
};

export const desertRock1: Sprite = {
  name: "",
  layers: [
    { char: "░", color: colors.olive },
    { char: "\u0100", color: colors.black },
    { char: "\u0101", color: colors.black },

    { char: "\u011f", color: colors.grey },
    { char: "\u0103", color: colors.grey },
  ],
};

export const desertRock2: Sprite = {
  name: "",
  layers: [
    { char: "░", color: colors.olive },
    { char: "\u0100", color: colors.black },
    { char: "\u0101", color: colors.black },

    { char: "\u0105", color: colors.grey },
    { char: "I", color: colors.black },
    { char: "+", color: colors.grey },
    { char: ":", color: colors.grey },
    { char: ",", color: colors.black },
  ],
};

export const rock1: Sprite = {
  name: "",
  layers: [
    { char: "\u011f", color: colors.grey },
    { char: "\u0103", color: colors.grey },
  ],
};

export const rock2: Sprite = {
  name: "",
  layers: [
    { char: "\u0105", color: colors.grey },
    { char: "I", color: colors.black },
    { char: "+", color: colors.grey },
    { char: ":", color: colors.grey },
    { char: ",", color: colors.black },
  ],
};
