import { colors } from "../colors";
import { Sprite } from "../../../engine/components/sprite";

export const mist: Sprite = {
  id: "mist",
  name: "mist",
  layers: [{ char: "≈", color: colors.white }],
};

export const fog: Sprite = {
  id: "fog",
  name: "fog_hidden",
  // colors.grey with shadow,
  layers: [{ char: "≈", color: "#2e2e2e" }],
};

export const fogOfWar: Sprite = {
  id: "fog_of_war",
  name: "fog_war",
  layers: [{ color: colors.black, char: "░" }],
};

export const snowFogOfWar: Sprite = {
  id: "snow_fog_of_war",
  name: "snow_fog_war",
  layers: [{ char: "░", color: colors.grey }],
  terminal: {
    layers: [
      { char: "█", color: colors.black },
      { char: "░", color: colors.grey },
    ],
  },
};

export const wall: Sprite = {
  id: "wall",
  name: "wall_solid",
  terminal: { layers: [{ char: "█", color: colors.silver }] },
  layers: [{ char: "█", color: colors.grey }],
  amounts: {
    single: [
      { char: "█", color: colors.grey },
      { char: "░", color: colors.black },
      { char: "-", color: colors.grey },
    ],
    double: [
      { char: "█", color: colors.grey },
      { char: "░", color: colors.black },
      { char: "■", color: colors.grey },
      { char: "∞", color: colors.grey },
    ],
    multiple: [
      { char: "█", color: colors.grey },
      { char: "░", color: colors.black },
      { char: "M", color: colors.grey },
      { char: "[", color: colors.grey },
      { char: "]", color: colors.grey },
    ],
  },
};

export const granite: Sprite = {
  id: "granite",
  name: "wall_granite",
  layers: [{ char: "█", color: colors.white }],
};

export const ironMine: Sprite = {
  id: "iron_mine",
  name: "Iron",
  layers: [
    { char: "█", color: colors.grey },
    { char: "÷", color: colors.silver },
    { char: "·", color: colors.grey },
  ],
  amounts: {
    single: [
      { char: "█", color: colors.grey },
      { char: "░", color: colors.black },
      { char: "+", color: colors.grey },
      { char: "÷", color: colors.silver },
      { char: "·", color: colors.grey },
    ],
    double: [
      { char: "█", color: colors.grey },
      { char: "░", color: colors.black },
      { char: "■", color: colors.grey },
      { char: "∞", color: colors.grey },
      { char: "÷", color: colors.silver },
      { char: "·", color: colors.grey },
    ],
    multiple: [
      { char: "█", color: colors.grey },
      { char: "░", color: colors.black },
      { char: "M", color: colors.grey },
      { char: "[", color: colors.grey },
      { char: "]", color: colors.grey },
      { char: "÷", color: colors.silver },
      { char: "·", color: colors.grey },
    ],
  },
};

const mineDisplay = (id: string, color: string): Sprite => ({
  id,
  name: "Mine",
  layers: [
    { char: "\u0106", color: colors.grey },
    { char: "\u0107", color: colors.grey },
    { char: "÷", color },
    { char: "·", color: colors.grey },
  ],
});

export const ironMineDisplay = mineDisplay("iron_mine_display", colors.silver);
export const goldMineDisplay = mineDisplay("gold_mine_display", colors.yellow);
export const diamondMineDisplay = mineDisplay(
  "diamond_mine_display",
  colors.aqua
);
export const rubyMineDisplay = mineDisplay("ruby_mine_display", colors.fuchsia);

export const goldMine: Sprite = {
  id: "gold_mine",
  name: "Gold",
  layers: [
    { char: "█", color: colors.grey },
    { char: "÷", color: colors.yellow },
    { char: "·", color: colors.grey },
  ],
  amounts: {
    single: [
      { char: "█", color: colors.grey },
      { char: "░", color: colors.black },
      { char: "+", color: colors.grey },
      { char: "÷", color: colors.yellow },
      { char: "·", color: colors.grey },
    ],
    double: [
      { char: "█", color: colors.grey },
      { char: "░", color: colors.black },
      { char: "■", color: colors.grey },
      { char: "∞", color: colors.grey },
      { char: "÷", color: colors.yellow },
      { char: "·", color: colors.grey },
    ],
    multiple: [
      { char: "█", color: colors.grey },
      { char: "░", color: colors.black },
      { char: "M", color: colors.grey },
      { char: "[", color: colors.grey },
      { char: "]", color: colors.grey },
      { char: "÷", color: colors.yellow },
      { char: "·", color: colors.grey },
    ],
  },
};

export const diamondMine: Sprite = {
  id: "diamond_mine",
  name: "Diamond",
  layers: [
    { char: "█", color: colors.grey },
    { char: "÷", color: colors.aqua },
    { char: "·", color: colors.grey },
  ],
  amounts: {
    single: [
      { char: "█", color: colors.grey },
      { char: "░", color: colors.black },
      { char: "+", color: colors.grey },
      { char: "÷", color: colors.aqua },
      { char: "·", color: colors.grey },
    ],
    double: [
      { char: "█", color: colors.grey },
      { char: "░", color: colors.black },
      { char: "■", color: colors.grey },
      { char: "∞", color: colors.grey },
      { char: "÷", color: colors.aqua },
      { char: "·", color: colors.grey },
    ],
    multiple: [
      { char: "█", color: colors.grey },
      { char: "░", color: colors.black },
      { char: "M", color: colors.grey },
      { char: "[", color: colors.grey },
      { char: "]", color: colors.grey },
      { char: "÷", color: colors.aqua },
      { char: "·", color: colors.grey },
    ],
  },
};

export const rubyMine: Sprite = {
  id: "ruby_mine",
  name: "Ruby",
  layers: [
    { char: "█", color: colors.grey },
    { char: "÷", color: colors.fuchsia },
    { char: "·", color: colors.grey },
  ],
  amounts: {
    single: [
      { char: "█", color: colors.grey },
      { char: "░", color: colors.black },
      { char: "+", color: colors.grey },
      { char: "÷", color: colors.fuchsia },
      { char: "·", color: colors.grey },
    ],
    double: [
      { char: "█", color: colors.grey },
      { char: "░", color: colors.black },
      { char: "■", color: colors.grey },
      { char: "∞", color: colors.grey },
      { char: "÷", color: colors.fuchsia },
      { char: "·", color: colors.grey },
    ],
    multiple: [
      { char: "█", color: colors.grey },
      { char: "░", color: colors.black },
      { char: "M", color: colors.grey },
      { char: "[", color: colors.grey },
      { char: "]", color: colors.grey },
      { char: "÷", color: colors.fuchsia },
      { char: "·", color: colors.grey },
    ],
  },
};

export const waterShallow: Sprite = {
  id: "water_shallow",
  name: "water_shallow",
  layers: [
    { char: "█", color: colors.navy },
    { char: "%", color: colors.blue },
    { char: "/", color: colors.navy },
    { char: "▒", color: colors.navy },
  ],
};

export const waterDeep: Sprite = {
  id: "water_deep",
  name: "water_deep",
  layers: [{ char: "█", color: colors.navy }],
};

export const ice: Sprite = {
  id: "ice",
  name: "water_ice",
  layers: [
    { char: "█", color: colors.teal },
    { char: "`", color: colors.aqua },
    { char: "\\", color: colors.aqua },
    { char: "▒", color: colors.teal },
  ],
};

export const sand: Sprite = {
  id: "sand",
  name: "Desert",
  terminal: {
    layers: [
      { char: "█", color: colors.olive },
      { char: "░", color: colors.black },
    ],
  },
  layers: [
    { char: "\u0107", color: colors.olive },
    { char: "\u0109", color: colors.olive },
    { char: "▓", color: colors.black },
  ],
};

export const beach: Sprite = {
  id: "beach",
  name: "sand_beach",
  layers: [{ char: "▒", color: colors.olive }],
};

export const path: Sprite = {
  id: "path",
  name: "Path",
  terminal: { layers: [{ char: "░", color: colors.silver }] },
  layers: [
    { char: "\u0107", color: colors.grey },
    { char: "\u0109", color: colors.grey },
    { char: "▓", color: colors.black },
    { char: "▒", color: colors.black },
    { char: "≡", color: colors.black },
  ],
};

export const gravel1: Sprite = {
  id: "gravel1",
  name: "gravel_one",
  terminal: { layers: [{ char: "%", color: colors.grey }] },
  layers: [
    { char: "\u0112", color: colors.grey },
    { char: "\u0105", color: colors.black },
    { char: "\u0117", color: colors.black },
    { char: "▓", color: colors.black },
  ],
};

export const gravel2: Sprite = {
  id: "gravel2",
  name: "gravel_two",
  terminal: { layers: [{ char: "%", color: colors.grey }] },
  layers: [
    { char: "-", color: colors.grey },
    { char: ":", color: colors.grey },
    { char: "º", color: colors.black },
    { char: "\u0106", color: colors.black },
    { char: "]", color: colors.black },
  ],
};

export const soil: Sprite = {
  id: "soil",
  name: "Soil",
  layers: [
    { char: "\u0107", color: colors.maroon },
    { char: "\u0109", color: colors.maroon },
    { char: "▓", color: colors.black },
  ],
};

export const soilWet: Sprite = {
  id: "soil_wet",
  name: "Soil",
  layers: [
    { char: "\u0107", color: colors.maroon },
    { char: "\u0109", color: colors.maroon },
    { char: "[", color: colors.blue },
    { char: "]", color: colors.blue },
    { char: "▓", color: colors.black },
  ],
};

export const jetty: Sprite = {
  id: "jetty",
  name: "Dock",
  layers: [
    { char: "█", color: colors.maroon },
    { char: "Φ", color: colors.black },
    { char: "■", color: colors.maroon },
    { char: "\u010e", color: colors.maroon },
    { char: ".", color: colors.black },
    { char: ":", color: colors.maroon },
  ],
  facing: {
    up: [
      { char: "█", color: colors.maroon },
      { char: "Φ", color: colors.navy },
      { char: "■", color: colors.maroon },
      { char: "\u010e", color: colors.maroon },
      { char: ".", color: colors.navy },
      { char: ":", color: colors.maroon },
    ],
    right: [
      { char: "█", color: colors.maroon },
      { char: "Γ", color: colors.navy },
      { char: "■", color: colors.maroon },
      { char: "\u0112", color: colors.maroon },
      { char: "|", color: colors.navy },
      { char: "║", color: colors.maroon },
    ],
    down: [
      { char: "█", color: colors.maroon },
      { char: "Φ", color: colors.navy },
      { char: "■", color: colors.maroon },
      { char: "\u010e", color: colors.maroon },
      { char: ".", color: colors.navy },
      { char: ":", color: colors.maroon },
    ],
    left: [
      { char: "█", color: colors.maroon },
      { char: "Γ", color: colors.navy },
      { char: "■", color: colors.maroon },
      { char: "\u0112", color: colors.maroon },
      { char: "|", color: colors.navy },
      { char: "║", color: colors.maroon },
    ],
  },
};

export const birch: Sprite = {
  id: "birch",
  name: "tree_birch",
  layers: [
    { char: "Y", color: colors.green },
    { char: "▄", color: colors.black },
    { char: "┐", color: colors.silver },
    { char: "w", color: colors.green },
    { char: "─", color: colors.black },
    { char: "±", color: colors.green },
    { char: "∙", color: colors.silver },
  ],
};

export const stem: Sprite = {
  id: "stem",
  name: "tree_stem",
  layers: [
    { char: "│", color: colors.maroon },
    { char: "┬", color: colors.black },
    { char: "l", color: colors.maroon },
  ],
};

export const leaves: Sprite = {
  id: "leaves",
  name: "tree_leaves",
  layers: [
    { char: "\u0106", color: colors.green },
    { char: "\u0107", color: colors.green },
    { char: "▀", color: colors.black },
    { char: "─", color: colors.black },
    { char: "░", color: colors.black },
  ],
};

export const stemRottenLeft: Sprite = {
  id: "stem_rotten_left",
  name: "tree_stem_rotten_left",
  terminal: { layers: [{ char: "╗", color: colors.maroon }] },
  layers: [
    { char: "[", color: colors.maroon },
    { char: ".", color: colors.black },
    { char: "|", color: colors.black },
    { char: "·", color: colors.red },
    { char: "Ω", color: colors.maroon },
    { char: "∩", color: colors.black },
    { char: "°", color: colors.black },
    { char: "'", color: colors.black },
  ],
};

export const stemRottenRight: Sprite = {
  id: "stem_rotten_right",
  name: "tree_stem_rotten_right",
  terminal: { layers: [{ char: "╔", color: colors.maroon }] },
  layers: [
    { char: "]", color: colors.maroon },
    { char: ".", color: colors.black },
    { char: "·", color: colors.red },
    { char: "Ω", color: colors.maroon },
    { char: "∩", color: colors.black },
    { char: "°", color: colors.black },
    { char: "'", color: colors.black },
  ],
};

export const branchRottenLeft: Sprite = {
  id: "branch_rotten_left",
  name: "tree_branch_rotten_left",
  layers: [
    { char: "+", color: colors.maroon },
    { char: "±", color: colors.black },
    { char: "∙", color: colors.maroon },
    { char: "]", color: colors.black },
    { char: "═", color: colors.maroon },
    { char: "─", color: colors.black },
    { char: "-", color: colors.maroon },
    { char: "·", color: colors.red },
  ],
};

export const branchRottenRight: Sprite = {
  id: "branch_rotten_right",
  name: "tree_branch_rotten_right",
  layers: [
    { char: "|", color: colors.maroon },
    { char: "[", color: colors.black },
    { char: "+", color: colors.black },
    { char: ".", color: colors.black },
    { char: "═", color: colors.maroon },
    { char: "·", color: colors.red },
    { char: ",", color: colors.black },
    { char: "⌐", color: colors.black },
  ],
};

export const leavesRottenLeft: Sprite = {
  id: "leaves_rotten_left",
  name: "tree_leaves_rotten_left",
  terminal: { layers: [{ char: "▐", color: colors.green }] },
  layers: [
    { char: "╞", color: colors.maroon },
    { char: "│", color: colors.black },
    { char: "H", color: colors.green },
    { char: "[", color: colors.green },
    { char: "]", color: colors.green },
    { char: "+", color: colors.red },
    { char: "÷", color: colors.green },
    { char: "░", color: colors.black },
  ],
};

export const leavesRottenRight: Sprite = {
  id: "leaves_rotten_right",
  name: "tree_leaves_rotten_right",
  terminal: { layers: [{ char: "▌", color: colors.green }] },
  layers: [
    { char: "H", color: colors.green },
    { char: "[", color: colors.green },
    { char: "]", color: colors.green },
    { char: "+", color: colors.red },
    { char: "÷", color: colors.green },
    { char: "░", color: colors.black },
  ],
};

export const palm1: Sprite = {
  id: "palm1",
  name: "palm_one",
  terminal: { layers: [{ char: "Y", color: colors.green }] },
  layers: [
    { char: "█", color: colors.black },
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
  id: "palm2",
  name: "palm_two",
  terminal: { layers: [{ char: "⌠", color: colors.green }] },
  layers: [
    { char: "█", color: colors.black },
    { char: "┐", color: colors.olive },
    { char: "─", color: colors.black },
    { char: "W", color: colors.green },
    { char: "|", color: colors.green },
    { char: ".", color: colors.olive },
  ],
};

export const palmBurnt1: Sprite = {
  id: "palm_burnt1",
  name: "palm_burnt_one",
  terminal: { layers: [{ char: ",", color: colors.maroon }] },
  layers: [
    { char: "┐", color: colors.olive },
    { char: "─", color: colors.black },
    { char: "+", color: colors.black },
    { char: ".", color: colors.maroon },
    { char: ":", color: colors.black },
  ],
};

export const palmBurnt2: Sprite = {
  id: "palm_burnt2",
  name: "palm_burnt_two",
  terminal: { layers: [{ char: ",", color: colors.maroon }] },
  layers: [
    { char: "┐", color: colors.olive },
    { char: "─", color: colors.black },
    { char: ":", color: colors.maroon },
    { char: "=", color: colors.black },
    { char: "≡", color: colors.black },
    { char: ".", color: colors.olive },
  ],
};

export const desertPalmBurnt1: Sprite = {
  id: "desert_palm_burnt1",
  name: "desert_palm_burnt_one",
  terminal: { layers: [{ char: ",", color: colors.maroon }] },
  layers: [
    { char: "\u0107", color: colors.olive },
    { char: "\u0109", color: colors.olive },
    { char: "▓", color: colors.black },
    { char: "▄", color: colors.black },
    { char: "■", color: colors.black },

    { char: "┐", color: colors.olive },
    { char: "─", color: colors.black },
    { char: "+", color: colors.black },
    { char: ".", color: colors.maroon },
    { char: ":", color: colors.black },
  ],
};

export const desertPalmBurnt2: Sprite = {
  id: "desert_palm_burnt2",
  name: "desert_palm_burnt_two",
  terminal: { layers: [{ char: ",", color: colors.maroon }] },
  layers: [
    { char: "\u0107", color: colors.olive },
    { char: "\u0109", color: colors.olive },
    { char: "▓", color: colors.black },
    { char: "▄", color: colors.black },
    { char: "■", color: colors.black },

    { char: "┐", color: colors.olive },
    { char: "─", color: colors.black },
    { char: ":", color: colors.maroon },
    { char: "=", color: colors.black },
    { char: "≡", color: colors.black },
    { char: ".", color: colors.olive },
  ],
};

export const hedge1: Sprite = {
  id: "hedge1",
  name: "hedge_one",
  layers: [{ char: "\u0104", color: colors.green }],
};

export const hedge2: Sprite = {
  id: "hedge2",
  name: "hedge_two",
  layers: [
    { char: "ß", color: colors.green },
    { char: "!", color: colors.green },
  ],
};

export const hedgeDry1: Sprite = {
  id: "hedge_dry1",
  name: "hedge_one_dry",
  layers: [
    { char: "\u0100", color: colors.black },
    { char: "\u0101", color: colors.black },
    { char: "\u0104", color: colors.green },
  ],
};

export const hedgeDry2: Sprite = {
  id: "hedge_dry2",
  name: "hedge_two_dry",
  layers: [
    { char: "\u0100", color: colors.black },
    { char: "\u0101", color: colors.black },
    { char: "ß", color: colors.green },
    { char: "!", color: colors.green },
  ],
};

export const flowerStem: Sprite = {
  id: "flower_stem",
  name: "flower_stem",
  layers: [
    { char: "\u0100", color: colors.black },
    { char: "\u0101", color: colors.black },
    { char: "┐", color: colors.green },
    { char: "╖", color: colors.black },
    { char: "∙", color: colors.maroon },
  ],
};

export const tree1: Sprite = {
  id: "tree1",
  name: "tree_one",
  terminal: {
    layers: [
      { char: "█", color: colors.maroon },
      { char: "#", color: colors.green },
    ],
    amounts: {
      single: [
        { char: "█", color: colors.maroon },
        { char: "┐", color: colors.green },
      ],
      double: [
        { char: "█", color: colors.maroon },
        { char: "+", color: colors.green },
      ],
      multiple: [
        { char: "█", color: colors.maroon },
        { char: "#", color: colors.green },
      ],
    },
  },
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
  id: "tree2",
  name: "tree_two",
  terminal: {
    layers: [
      { char: "█", color: colors.maroon },
      { char: "Θ", color: colors.green },
    ],
    amounts: {
      single: [
        { char: "█", color: colors.maroon },
        { char: "┐", color: colors.green },
      ],
      double: [
        { char: "█", color: colors.maroon },
        { char: "\u0108", color: colors.green },
      ],
      multiple: [
        { char: "█", color: colors.maroon },
        { char: "Θ", color: colors.green },
      ],
    },
  },
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

export const treeBurnt1: Sprite = {
  id: "tree_burnt1",
  name: "tree_burnt_one",
  terminal: { layers: [{ char: ",", color: colors.maroon }] },
  layers: [
    { char: "│", color: colors.maroon },
    { char: "┘", color: colors.black },
    { char: "+", color: colors.black },
    { char: ".", color: colors.grey },
    { char: ":", color: colors.black },
  ],
};

export const treeBurnt2: Sprite = {
  id: "tree_burnt2",
  name: "tree_burnt_two",
  terminal: { layers: [{ char: ",", color: colors.maroon }] },
  layers: [
    { char: "│", color: colors.maroon },
    { char: ":", color: colors.grey },
    { char: "+", color: colors.black },
    { char: "┘", color: colors.black },
  ],
};

export const oakBurnt: Sprite = {
  id: "oak_burnt",
  name: "oak_burnt",
  terminal: { layers: [{ char: ",", color: colors.maroon }] },
  layers: [
    { char: "l", color: colors.maroon },
    { char: "▀", color: colors.black },
    { char: "∙", color: colors.grey },
    { char: "·", color: colors.black },
  ],
};

export const avodadoStem: Sprite = {
  id: "avodado_stem",
  name: "avocado_stem",
  layers: [{ char: "│", color: colors.maroon }],
};

export const avodadoLeaves: Sprite = {
  id: "avodado_leaves",
  name: "avocado_leaves",
  layers: [
    { char: "█", color: colors.green },
    { char: "▓", color: colors.black },
    { char: "┼", color: colors.green },
    { char: "_", color: colors.green },
  ],
  facing: {
    down: [
      { char: "█", color: colors.green },
      { char: "▓", color: colors.black },
      { char: "┼", color: colors.green },
      { char: "_", color: colors.green },
      { char: "▀", color: colors.black },
    ],
  },
};

export const mahagonyStemLeft: Sprite = {
  id: "mahagony_stem_left",
  name: "mahagony_stem_left",
  layers: [
    { char: "\u0106", color: colors.maroon },
    { char: "\u0107", color: colors.maroon },
    { char: "▌", color: colors.black },
    { char: "│", color: colors.black },
  ],
};

export const mahagonyStemRight: Sprite = {
  id: "mahagony_stem_right",
  name: "mahagony_stem_right",
  layers: [
    { char: "▌", color: colors.maroon },
    { char: "│", color: colors.black },
  ],
};

export const mahagonyLeaves: Sprite = {
  id: "mahagony_leaves",
  name: "mahagony_leaves",
  layers: [
    { char: "█", color: colors.green },
    { char: "▒", color: colors.black },
  ],
  facing: {
    down: [
      { char: "▄", color: colors.green },
      { char: "▒", color: colors.black },
    ],
  },
};

export const bush: Sprite = {
  id: "bush",
  name: "bush_empty",
  layers: [{ char: "\u03c4", color: colors.olive }],
};

export const grass: Sprite = {
  id: "grass",
  name: "grass_empty",
  layers: [{ char: ",", color: colors.olive }],
};

export const sapling1: Sprite = {
  id: "sapling1",
  name: "sapling_one",
  layers: [{ char: ".", color: colors.green }],
};

export const sapling2: Sprite = {
  id: "sapling2",
  name: "sapling_two",
  layers: [{ char: ",", color: colors.green }],
};

export const sapling3: Sprite = {
  id: "sapling3",
  name: "sapling_three",
  layers: [
    { char: ",", color: colors.green },
    { char: "∙", color: colors.green },
  ],
};

export const sapling4: Sprite = {
  id: "sapling4",
  name: "sapling_four",
  layers: [
    { char: "+", color: colors.green },
    { char: "÷", color: colors.black },
    { char: "∙", color: colors.green },
    { char: ",", color: colors.green },
    { char: ":", color: colors.green },
  ],
};

export const sapling5: Sprite = {
  id: "sapling5",
  name: "sapling_five",
  layers: [
    { char: ",", color: colors.green },
    { char: "|", color: colors.green },
  ],
};

export const cactus1: Sprite = {
  id: "cactus1",
  name: "cactus_one",
  terminal: { layers: [{ char: "√", color: colors.green }] },
  layers: [
    { char: "-", color: colors.green },
    { char: "«", color: colors.black },
    { char: "[", color: colors.black },
    { char: "\u011b", color: colors.green },
    { char: "|", color: colors.green },
  ],
};

export const cactus2: Sprite = {
  id: "cactus2",
  name: "cactus_two",
  terminal: { layers: [{ char: "¥", color: colors.green }] },
  layers: [{ char: "¥", color: colors.green }],
};

export const desertCactus2: Sprite = {
  id: "desert_cactus2",
  name: "desert_cactus_two",
  terminal: { layers: [{ char: "¥", color: colors.green }] },
  layers: [
    { char: "\u0107", color: colors.olive },
    { char: "\u0109", color: colors.olive },
    { char: "▓", color: colors.black },
    { char: "\u0100", color: colors.black },
    { char: "\u0101", color: colors.black },

    { char: "¥", color: colors.green },
  ],
};

export const tombstone1: Sprite = {
  id: "tombstone1",
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
  id: "tombstone2",
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

// ghost without halo and with a hit marker, for defeated units
export const kills: Sprite = {
  id: "kills",
  name: "Kills",
  layers: [
    // 50% of silver
    { char: "\u010b", color: "#606060" },
    { char: "*", color: colors.red },
    { char: "─", color: colors.black },
    { char: "·", color: colors.red },
  ],
};

export const rock1: Sprite = {
  id: "rock1",
  name: "",
  terminal: { layers: [{ char: "▬", color: colors.silver }] },
  layers: [
    { char: "\u011f", color: colors.grey },
    { char: "\u0103", color: colors.grey },
  ],
};

export const rock2: Sprite = {
  id: "rock2",
  name: "",
  terminal: { layers: [{ char: "•", color: colors.silver }] },
  layers: [
    { char: "\u0105", color: colors.grey },
    { char: "I", color: colors.black },
    { char: "+", color: colors.grey },
    { char: ":", color: colors.grey },
    { char: ",", color: colors.black },
  ],
};

export const enemySpawner: Sprite = {
  id: "enemy_spawner",
  name: "Spawn",
  terminal: { layers: [{ char: ".", color: colors.red }] },
  layers: [
    { char: "-", color: colors.red },
    { char: ":", color: colors.red },
    { char: "º", color: colors.black },
    { char: "\u0106", color: colors.black },
    { char: "]", color: colors.black },
  ],
};

export const friendlySpawner: Sprite = {
  id: "friendly_spawner",
  name: "Spawn",
  terminal: { layers: [{ char: ".", color: colors.lime }] },
  layers: [
    { char: "-", color: colors.lime },
    { char: ":", color: colors.lime },
    { char: "º", color: colors.black },
    { char: "\u0106", color: colors.black },
    { char: "]", color: colors.black },
  ],
};
