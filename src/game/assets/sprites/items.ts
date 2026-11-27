import { colors } from "../colors";
import { Sprite } from "../../../engine/components/sprite";

export const heart: Sprite = {
  id: "heart",
  name: "HP",
  layers: [{ char: "\u0102", color: colors.red }],
};

export const heartUp: Sprite = {
  id: "heart_up",
  name: "Max HP",
  terminal: { layers: [{ char: "\u0102", color: colors.lime }] },
  layers: [
    { char: "\u0102", color: colors.red },
    { char: "^", color: colors.lime },
  ],
};

export const mana: Sprite = {
  id: "mana",
  name: "MP",
  layers: [{ char: "\u0103", color: colors.blue }],
};

export const manaUp: Sprite = {
  id: "mana_up",
  name: "Max MP",
  terminal: { layers: [{ char: "\u0103", color: colors.lime }] },
  layers: [
    { char: "\u0103", color: colors.blue },
    { char: "^", color: colors.lime },
  ],
};

export const shroom: Sprite = {
  id: "shroom",
  name: "Shroom",
  terminal: { layers: [{ char: "∙", color: colors.maroon }] },
  layers: [
    { char: "\u0106", color: colors.maroon },
    { char: ":", color: colors.black },
    { char: ".", color: colors.silver },
  ],
};

export const appleDrop: Sprite = {
  id: "apple_drop",
  name: "Apple",
  layers: [
    { char: "∙", color: colors.red },
    { char: ":", color: colors.lime },
    { char: ".", color: colors.black },
    { char: "\u0106", color: colors.red },
  ],
};

export const apple: Sprite = {
  id: "apple",
  name: "Apple",
  terminal: {
    layers: [{ char: "•", color: colors.red }],
    amounts: {
      single: [
        { char: "█", color: colors.maroon },
        { char: "•", color: colors.red },
      ],
    },
  },
  layers: [
    { char: ":", color: colors.lime },
    { char: ".", color: colors.black },
    { char: "\u0106", color: colors.red },
  ],
  amounts: {
    single: [
      { char: "┐", color: colors.maroon },
      { char: "Θ", color: colors.green },
      { char: ":", color: colors.lime },
      { char: ".", color: colors.green },
      { char: "\u0106", color: colors.red },
    ],
  },
};

export const bananaDrop: Sprite = {
  id: "banana_drop",
  name: "Banana",
  layers: [
    { char: "«", color: colors.yellow },
    { char: "-", color: colors.black },
  ],
};

export const banana: Sprite = {
  id: "banana",
  name: "Banana",
  terminal: { layers: [{ char: "«", color: colors.yellow }] },
  layers: [
    { char: "«", color: colors.yellow },
    { char: "-", color: colors.black },
  ],
  amounts: {
    single: [
      { char: "┐", color: colors.olive },
      { char: "─", color: colors.black },
      { char: "W", color: colors.green },
      { char: "|", color: colors.green },
      { char: ".", color: colors.olive },
      { char: "«", color: colors.yellow },
      { char: "-", color: colors.green },
    ],
  },
};

export const coconutDrop: Sprite = {
  id: "coconut_drop",
  name: "Coconut",
  terminal: { layers: [{ char: "\u0108", color: colors.maroon }] },
  layers: [
    { char: "\u0108", color: colors.maroon },
    { char: "\u0106", color: colors.black },
    { char: "+", color: colors.maroon },
    { char: ":", color: colors.maroon },
  ],
};

export const coconut: Sprite = {
  id: "coconut",
  name: "Coconut",
  terminal: { layers: [{ char: "\u0108", color: colors.maroon }] },
  layers: [
    { char: "\u0108", color: colors.maroon },
    { char: "\u0106", color: colors.black },
    { char: "+", color: colors.maroon },
    { char: ":", color: colors.maroon },
  ],
  amounts: {
    single: [
      { char: "T", color: colors.green },
      { char: "\u0104", color: colors.green },
      { char: "▄", color: colors.black },
      { char: '"', color: colors.green },
      { char: "┐", color: colors.olive },
      { char: "+", color: colors.olive },
      { char: "─", color: colors.black },
      { char: "∙", color: colors.olive },
      { char: "\u0108", color: colors.maroon },
      { char: "\u0106", color: colors.black },
      { char: "+", color: colors.maroon },
      { char: ":", color: colors.maroon },
    ],
  },
};

export const mineral: Sprite = {
  id: "mineral",
  name: "Mineral",
  terminal: { layers: [{ char: "•", color: colors.lime }] },
  layers: [
    { char: "+", color: colors.green },
    { char: "÷", color: colors.black },
    { char: "·", color: colors.lime },
  ],
};

export const crystal: Sprite = {
  id: "crystal",
  name: "Crystal",
  terminal: { layers: [{ char: "•", color: colors.aqua }] },
  layers: [
    { char: "\u0106", color: colors.teal },
    { char: "÷", color: colors.black },
    { char: "∙", color: colors.blue },
  ],
};

export const thorn: Sprite = {
  id: "thorn",
  name: "Thorn",
  layers: [
    { char: "<", color: colors.white },
    { char: ">", color: colors.grey },
    { char: "\u0115", color: colors.black },
  ],
};

export const spore: Sprite = {
  id: "spore",
  name: "Spore",
  terminal: { layers: [{ char: ":", color: colors.white }] },
  layers: [
    { char: "*", color: colors.white },
    { char: "∞", color: colors.black },
    { char: "-", color: colors.black },
  ],
};

export const level: Sprite = {
  id: "level",
  name: "Level",
  layers: [{ char: "#", color: colors.lime }],
};

export const xp: Sprite = {
  id: "xp",
  name: "XP",
  terminal: {
    layers: [{ char: "x", color: colors.lime }],
    amounts: {
      single: [{ char: "x", color: colors.lime }],
      double: [{ char: "X", color: colors.lime }],
      multiple: [{ char: "X", color: colors.lime }],
    },
  },
  layers: [
    { char: "*", color: colors.lime },
    { char: "─", color: colors.black },
    { char: "·", color: colors.lime },
  ],
  amounts: {
    single: [
      { char: "*", color: colors.lime },
      { char: "─", color: colors.black },
      { char: "·", color: colors.lime },
    ],
    double: [{ char: "x", color: colors.lime }],
    multiple: [{ char: "X", color: colors.lime }],
  },
};

export const power: Sprite = {
  id: "power",
  name: "Power",
  layers: [
    { char: "=", color: colors.teal },
    { char: "|", color: colors.teal },
    { char: "▀", color: colors.black },
    { char: "+", color: colors.teal },
    { char: "-", color: colors.black },
    { char: "x", color: colors.aqua },
    { char: "∙", color: colors.teal },
    { char: "·", color: colors.aqua },
  ],
};

export const wisdom: Sprite = {
  id: "wisdom",
  name: "Wisdom",
  layers: [
    { char: "\u0103", color: colors.fuchsia },
    { char: "\u011c", color: colors.purple },
    { char: "-", color: colors.fuchsia },
  ],
};

export const armor: Sprite = {
  id: "armor",
  name: "Armor",
  layers: [
    { char: "\u0108", color: colors.teal },
    { char: "v", color: colors.teal },
    { char: "\u0106", color: colors.black },
    { char: "∙", color: colors.teal },
  ],
};

export const resist: Sprite = {
  id: "resist",
  name: "Resist",
  layers: [
    { char: "\u0106", color: colors.purple },
    { char: "v", color: colors.purple },
    { char: "÷", color: colors.black },
    { char: ":", color: colors.purple },
    { char: "°", color: colors.black },
    { char: "\u0108", color: colors.purple },
  ],
};

export const vision: Sprite = {
  id: "vision",
  name: "Vision",
  layers: [
    { char: "\u0108", color: colors.grey },
    { char: "\u0106", color: colors.black },
    { char: "·", color: colors.grey },
  ],
};

export const haste: Sprite = {
  id: "haste",
  name: "Haste",
  layers: [{ char: "»", color: colors.green }],
};

export const damp: Sprite = {
  id: "damp",
  name: "Damp",
  layers: [
    { char: "*", color: colors.olive },
    { char: "+", color: colors.yellow },
  ],
};

export const thaw: Sprite = {
  id: "thaw",
  name: "Thaw",
  layers: [
    { char: "\u0101", color: colors.navy },
    { char: "\u0100", color: colors.blue },
    { char: "■", color: colors.navy },
    { char: "▒", color: colors.black },
  ],
};

export const spike: Sprite = {
  id: "spike",
  name: "Spike",
  layers: [
    { char: "<", color: colors.red },
    { char: ">", color: colors.maroon },
  ],
};

export const logging: Sprite = {
  id: "logging",
  name: "Logging",
  layers: [
    { char: "'", color: colors.lime },
    { char: "º", color: colors.lime },
    { char: "-", color: colors.black },
    { char: "\\", color: colors.green },
  ],
};

export const farming: Sprite = {
  id: "farming",
  name: "Farming",
  layers: [
    { char: "I", color: colors.green },
    { char: "i", color: colors.black },
    { char: "\u0118", color: colors.lime },
    { char: "|", color: colors.green },
    { char: ".", color: colors.lime },
  ],
};

export const mining: Sprite = {
  id: "mining",
  name: "Mining",
  layers: [
    { char: "\u0119", color: colors.lime },
    { char: "-", color: colors.green },
  ],
};

export const fishing: Sprite = {
  id: "fishing",
  name: "Fishing",
  terminal: { layers: [{ char: "⌠", color: colors.green }] },
  layers: [
    { char: "│", color: colors.green },
    { char: "┐", color: colors.black },
    { char: "'", color: colors.lime },
    { char: "|", color: colors.green },
    { char: "\u0106", color: colors.lime },
    { char: "∙", color: colors.green },
  ],
};

export const build: Sprite = {
  id: "build",
  name: "Build",
  layers: [
    { char: "|", color: colors.green },
    { char: '"', color: colors.lime },
    { char: "'", color: colors.lime },
    { char: "°", color: colors.lime },
  ],
};

export const coin: Sprite = {
  id: "coin",
  name: "Coin",
  terminal: {
    layers: [{ char: "°", color: colors.yellow }],
    amounts: {
      single: [{ char: "°", color: colors.yellow }],
      double: [{ char: "\u0108", color: colors.yellow }],
      multiple: [{ char: "o", color: colors.yellow }],
    },
  },
  layers: [
    { char: "\u0106", color: colors.yellow },
    { char: "∙", color: colors.black },
  ],
  amounts: {
    single: [
      { char: "\u0106", color: colors.yellow },
      { char: "∙", color: colors.black },
    ],
    double: [{ char: "\u0108", color: colors.yellow }],
    multiple: [{ char: "o", color: colors.yellow }],
  },
};

export const nugget: Sprite = {
  id: "nugget",
  name: "Nugget",
  terminal: { layers: [{ char: "•", color: colors.yellow }] },
  layers: [
    { char: "\u011d", color: colors.olive },
    { char: "-", color: colors.black },
    { char: "\u0115", color: colors.black },
    { char: "\u0106", color: colors.olive },
    { char: "∙", color: colors.yellow },
  ],
};

export const ingot: Sprite = {
  id: "ingot",
  name: "Ingot",
  terminal: { layers: [{ char: "▬", color: colors.yellow }] },
  layers: [
    { char: "■", color: colors.olive },
    { char: "+", color: colors.yellow },
    { char: "\u011c", color: colors.yellow },
    { char: "Ö", color: colors.black },
  ],
};

export const stick: Sprite = {
  id: "stick",
  name: "Stick",
  layers: [{ char: "-", color: colors.maroon }],
  amounts: {
    single: [{ char: "-", color: colors.maroon }],
    double: [{ char: "=", color: colors.maroon }],
    multiple: [{ char: "≡", color: colors.maroon }],
  },
};

export const wood: Sprite = {
  id: "wood",
  name: "Wood",
  terminal: { layers: [{ char: "•", color: colors.maroon }] },
  layers: [
    { char: "o", color: colors.maroon },
    { char: "w", color: colors.maroon },
    { char: "■", color: colors.maroon },
    { char: "\u0108", color: colors.olive },
    { char: "\u0106", color: colors.maroon },
    { char: "∙", color: colors.olive },
  ],
};

export const plank: Sprite = {
  id: "plank",
  name: "Plank",
  terminal: { layers: [{ char: "■", color: colors.maroon }] },
  layers: [
    { char: "M", color: colors.maroon },
    { char: "!", color: colors.black },
    { char: "|", color: colors.maroon },
    { char: "{", color: colors.maroon },
    { char: "}", color: colors.maroon },
  ],
};

export const leaf: Sprite = {
  id: "leaf",
  name: "Leaf",
  terminal: {
    layers: [{ char: "-", color: colors.lime }],
    amounts: {
      single: [{ char: "-", color: colors.lime }],
      double: [{ char: "=", color: colors.lime }],
      multiple: [{ char: "≡", color: colors.lime }],
    },
  },
  layers: [
    { char: "+", color: colors.lime },
    { char: "\u011c", color: colors.lime },
    { char: "\u0119", color: colors.black },
    { char: "-", color: colors.green },
  ],
  amounts: {
    single: [
      { char: "+", color: colors.lime },
      { char: "\u011c", color: colors.lime },
      { char: "\u0119", color: colors.black },
      { char: "-", color: colors.green },
    ],
    double: [
      { char: "\u0103", color: colors.green },
      { char: "\u011c", color: colors.lime },
      { char: "─", color: colors.lime },
      { char: "-", color: colors.green },
    ],
    multiple: [
      { char: "\u0103", color: colors.lime },
      { char: "\u011c", color: colors.green },
      { char: "∞", color: colors.lime },
      { char: "-", color: colors.green },
    ],
  },
};

export const sapling: Sprite = {
  id: "sapling",
  name: "Sapling",
  layers: [
    { char: ",", color: colors.maroon },
    { char: "+", color: colors.green },
    { char: "·", color: colors.lime },
  ],
};

export const berryDrop: Sprite = {
  id: "berry_drop",
  name: "Berry",
  terminal: {
    layers: [{ char: "'", color: colors.fuchsia }],
    amounts: {
      single: [{ char: "'", color: colors.fuchsia }],
      double: [{ char: '"', color: colors.fuchsia }],
      multiple: [{ char: "°", color: colors.fuchsia }],
    },
  },
  layers: [{ char: "'", color: colors.purple }],
  amounts: {
    single: [{ char: "'", color: colors.purple }],
    double: [{ char: '"', color: colors.purple }],
    multiple: [{ char: "°", color: colors.purple }],
  },
};

export const berry: Sprite = {
  id: "berry",
  name: "Berry",
  terminal: {
    layers: [{ char: "'", color: colors.fuchsia }],
    amounts: {
      single: [{ char: "'", color: colors.fuchsia }],
      double: [{ char: '"', color: colors.fuchsia }],
      multiple: [{ char: "°", color: colors.fuchsia }],
    },
  },
  layers: [
    { char: "'", color: colors.purple },
    { char: "\u03c4", color: colors.olive },
  ],
  amounts: {
    single: [
      { char: "'", color: colors.purple },
      { char: "\u03c4", color: colors.olive },
    ],
    double: [
      { char: '"', color: colors.purple },
      { char: "\u03c4", color: colors.olive },
    ],
    multiple: [
      { char: "°", color: colors.purple },
      { char: "\u03c4", color: colors.olive },
    ],
  },
};

export const fruit: Sprite = {
  id: "fruit",
  name: "Fruit",
  layers: [{ char: "\u0105", color: colors.purple }],
};

export const flowerDrop: Sprite = {
  id: "flower_drop",
  name: "Flower",
  terminal: {
    layers: [{ char: "·", color: colors.teal }],
    amounts: {
      single: [{ char: "·", color: colors.teal }],
      double: [{ char: "∙", color: colors.teal }],
      multiple: [{ char: "\u0106", color: colors.teal }],
    },
  },
  layers: [{ char: "\u0106", color: colors.teal }],
  amounts: {
    single: [{ char: "\u0106", color: colors.teal }],
    double: [
      { char: "\u0106", color: colors.teal },
      { char: "+", color: colors.teal },
    ],
    multiple: [{ char: "*", color: colors.teal }],
  },
};

export const flower: Sprite = {
  id: "flower",
  name: "Flower",
  terminal: {
    layers: [{ char: "·", color: colors.teal }],
    amounts: {
      single: [{ char: "·", color: colors.teal }],
      double: [{ char: "∙", color: colors.teal }],
      multiple: [{ char: "\u0106", color: colors.teal }],
    },
  },
  layers: [
    { char: ",", color: colors.olive },
    { char: "\u0106", color: colors.teal },
  ],
  amounts: {
    single: [
      { char: ",", color: colors.olive },
      { char: "\u0106", color: colors.teal },
    ],
    double: [
      { char: ",", color: colors.olive },
      { char: "\u0106", color: colors.teal },
      { char: "+", color: colors.teal },
    ],
    multiple: [
      { char: ",", color: colors.olive },
      { char: "*", color: colors.teal },
    ],
  },
};

export const herb: Sprite = {
  id: "herb",
  name: "Herb",
  layers: [
    { char: "\u010e", color: colors.teal },
    { char: "·", color: colors.teal },
  ],
};

export const oreDrop: Sprite = {
  id: "ore_drop",
  name: "Ore",
  terminal: {
    layers: [{ char: ".", color: colors.silver }],
    amounts: {
      single: [{ char: ".", color: colors.silver }],
      double: [{ char: ":", color: colors.silver }],
      multiple: [{ char: "÷", color: colors.silver }],
    },
  },
  layers: [{ char: "∙", color: colors.silver }],
  amounts: {
    single: [{ char: "∙", color: colors.silver }],
    double: [{ char: ":", color: colors.silver }],
    multiple: [
      { char: ":", color: colors.silver },
      { char: "∙", color: colors.silver },
      { char: "\u011b", color: colors.black },
      { char: ".", color: colors.silver },
    ],
  },
};

export const ore: Sprite = {
  id: "ore",
  name: "Ore",
  terminal: {
    layers: [{ char: ".", color: colors.silver }],
    amounts: {
      single: [{ char: ".", color: colors.silver }],
      double: [{ char: ":", color: colors.silver }],
      multiple: [{ char: "÷", color: colors.silver }],
    },
  },
  layers: [{ char: "∙", color: colors.silver }],
  amounts: {
    single: [
      { char: "█", color: colors.grey },
      { char: "∙", color: colors.silver },
    ],
    double: [
      { char: "█", color: colors.grey },
      { char: ":", color: colors.silver },
    ],
    multiple: [
      { char: "█", color: colors.grey },
      { char: ":", color: colors.silver },
      { char: "∙", color: colors.silver },
      { char: "\u011b", color: colors.grey },
      { char: ".", color: colors.silver },
    ],
  },
};

export const oreDisplay: Sprite = {
  id: "ore_display",
  name: "Ore",
  terminal: {
    layers: [{ char: ".", color: colors.silver }],
    amounts: {
      single: [{ char: ".", color: colors.silver }],
      double: [{ char: ":", color: colors.silver }],
      multiple: [{ char: "÷", color: colors.silver }],
    },
  },
  layers: [
    { char: "\u0107", color: colors.grey },
    { char: "\u0106", color: colors.grey },
    { char: "∙", color: colors.silver },
  ],
};

export const iron: Sprite = {
  id: "iron",
  name: "Iron",
  terminal: { layers: [{ char: "■", color: colors.grey }] },
  layers: [
    { char: "■", color: colors.grey },
    { char: "÷", color: colors.silver },
    { char: "·", color: colors.grey },
  ],
};

export const gold: Sprite = {
  id: "gold",
  name: "Gold",
  terminal: { layers: [{ char: "■", color: colors.yellow }] },
  layers: [
    { char: "■", color: colors.grey },
    { char: "÷", color: colors.yellow },
    { char: "·", color: colors.grey },
  ],
};

export const diamond: Sprite = {
  id: "diamond",
  name: "Diamond",
  terminal: { layers: [{ char: "■", color: colors.aqua }] },
  layers: [
    { char: "■", color: colors.grey },
    { char: "÷", color: colors.aqua },
    { char: "·", color: colors.grey },
  ],
};

export const diamondGem: Sprite = {
  id: "diamond_gem",
  name: "Gem",
  terminal: { layers: [{ char: "■", color: colors.aqua }] },
  layers: [
    { char: "\u0103", color: colors.aqua },
    { char: "°", color: colors.black },
    { char: "═", color: colors.black },
    { char: "-", color: colors.aqua },
  ],
};

export const ruby: Sprite = {
  id: "ruby",
  name: "Ruby",
  terminal: { layers: [{ char: "■", color: colors.fuchsia }] },
  layers: [
    { char: "■", color: colors.grey },
    { char: "÷", color: colors.fuchsia },
    { char: "·", color: colors.grey },
  ],
};

export const rubyGem: Sprite = {
  id: "ruby_gem",
  name: "Ruby",
  terminal: { layers: [{ char: "■", color: colors.fuchsia }] },
  layers: [
    { char: "\u0103", color: colors.fuchsia },
    { char: "°", color: colors.black },
    { char: "═", color: colors.black },
    { char: "-", color: colors.fuchsia },
  ],
};

export const arrow: Sprite = {
  id: "arrow",
  name: "Arrow",
  terminal: { layers: [{ char: "»", color: colors.maroon }] },
  layers: [
    { char: "»", color: colors.grey },
    { char: "\u0119", color: colors.black },
    { char: "─", color: colors.grey },
    { char: "-", color: colors.maroon },
  ],
};

export const doubleArrow: Sprite = {
  id: "double_arrow",
  name: "Arrow",
  terminal: { layers: [{ char: "»", color: colors.maroon }] },
  layers: [
    { char: "»", color: colors.grey },
    { char: "─", color: colors.grey },
    { char: "-", color: colors.maroon },
  ],
};

export const charge: Sprite = {
  id: "charge",
  name: "Charge",
  layers: [
    { char: "^", color: colors.grey },
    { char: "\u011f", color: colors.white },
    { char: "\u0115", color: colors.black },
  ],
};

export const worm: Sprite = {
  id: "worm",
  name: "Worm",
  terminal: {
    layers: [{ char: "~", color: colors.red }],
    facing: {
      up: [{ char: "|", color: colors.red }],
      right: [{ char: "-", color: colors.red }],
      down: [{ char: "|", color: colors.red }],
      left: [{ char: "-", color: colors.red }],
    },
  },
  layers: [
    { char: "≈", color: colors.red },
    { char: "\u0115", color: colors.black },
  ],
  facing: {
    up: [
      { char: "|", color: colors.red },
      { char: "[", color: colors.black },
    ],
    right: [
      { char: "═", color: colors.red },
      { char: "─", color: colors.black },
    ],
    down: [
      { char: "|", color: colors.red },
      { char: "]", color: colors.black },
    ],
    left: [
      { char: "═", color: colors.red },
      { char: "─", color: colors.black },
    ],
  },
};

export const algae: Sprite = {
  id: "algae",
  name: "Seaweed",
  terminal: { layers: [{ char: "w", color: colors.green }] },
  layers: [
    { char: "+", color: colors.green },
    { char: "-", color: colors.black },
    { char: "·", color: colors.green },
    { char: ":", color: colors.green },
    { char: "v", color: colors.green },
  ],
};

export const pearl: Sprite = {
  id: "pearl",
  name: "Pearl",
  terminal: { layers: [{ char: "∙", color: colors.white }] },
  layers: [
    { char: "\u0106", color: colors.white },
    { char: "∙", color: colors.grey },
    { char: "·", color: colors.silver },
  ],
};

export const tea: Sprite = {
  id: "tea",
  name: "Tea",
  terminal: { layers: [{ char: "▬", color: colors.blue }] },
  layers: [
    { char: "∞", color: colors.maroon },
    { char: "\u011d", color: colors.aqua },
    { char: "U", color: colors.grey },
    { char: "▀", color: colors.black },
    { char: "º", color: colors.black },
  ],
};

export const curry: Sprite = {
  id: "curry",
  name: "Curry",
  terminal: { layers: [{ char: "■", color: colors.blue }] },
  layers: [
    { char: "∞", color: colors.maroon },
    { char: "\u011d", color: colors.yellow },
    { char: "U", color: colors.grey },
    { char: "▀", color: colors.black },
    { char: "º", color: colors.black },
  ],
};

export const soup: Sprite = {
  id: "soup",
  name: "Soup",
  terminal: { layers: [{ char: "▄", color: colors.blue }] },
  layers: [
    { char: "∞", color: colors.maroon },
    { char: "\u011d", color: colors.fuchsia },
    { char: "U", color: colors.grey },
    { char: "▀", color: colors.black },
    { char: "º", color: colors.black },
  ],
};

export const juice: Sprite = {
  id: "juice",
  name: "Juice",
  terminal: { layers: [{ char: "■", color: colors.red }] },
  layers: [
    { char: "■", color: colors.maroon },
    { char: "\u0106", color: colors.green },
    { char: "\u0108", color: colors.maroon },
    { char: "▀", color: colors.black },
  ],
};

export const granola: Sprite = {
  id: "granola",
  name: "Granola",
  terminal: { layers: [{ char: "▬", color: colors.red }] },
  layers: [
    { char: "■", color: colors.maroon },
    { char: "\u0106", color: colors.silver },
    { char: "\u0108", color: colors.maroon },
    { char: "▀", color: colors.black },
  ],
};

export const schema: Sprite = {
  id: "schema",
  name: "Schema",
  terminal: { layers: [{ char: "#", color: colors.white }] },
  layers: [
    { char: "±", color: colors.silver },
    { char: "■", color: colors.white },
    { char: "≈", color: colors.grey },
    { char: "=", color: colors.white },
    { char: "Γ", color: colors.black },
    { char: "°", color: colors.black },
  ],
};

export const letter: Sprite = {
  id: "letter",
  name: "Letter",
  terminal: { layers: [{ char: "#", color: colors.grey }] },
  layers: [
    { char: "\u0115", color: colors.grey },
    { char: "\u0103", color: colors.white },
    { char: "▀", color: colors.black },
  ],
};

export const letterRead: Sprite = {
  id: "letter_read",
  name: "Letter",
  terminal: { layers: [{ char: "#", color: colors.grey }] },
  layers: [
    { char: "\u0115", color: colors.grey },
    { char: "\u0103", color: colors.white },
    { char: "-", color: colors.grey },
  ],
};

export const aetherGem: Sprite = {
  id: "aether_gem",
  name: "Aether",
  layers: [
    { char: "\u0103", color: colors.white },
    { char: "°", color: colors.black },
    { char: "═", color: colors.black },
    { char: "-", color: colors.white },
  ],
};

export const voidShard: Sprite = {
  id: "void_shard",
  name: "Shard",
  layers: [
    { char: "+", color: colors.grey },
    { char: "\u011c", color: colors.silver },
  ],
};

export const voidGem: Sprite = {
  id: "void_gem",
  name: "Void",
  layers: [
    { char: "\u0103", color: colors.silver },
    { char: "°", color: colors.black },
    { char: "═", color: colors.black },
    { char: "-", color: colors.silver },
  ],
};

export const rainbowShard: Sprite = {
  id: "rainbow_shard",
  name: "Shard",
  layers: [
    { char: "+", color: colors.olive },
    { char: "\u011c", color: colors.yellow },
  ],
};

export const rainbowGem: Sprite = {
  id: "rainbow_gem",
  name: "Rainbow",
  layers: [
    { char: "\u0103", color: colors.yellow },
    { char: "°", color: colors.black },
    { char: "═", color: colors.black },
    { char: "-", color: colors.yellow },
  ],
};

export const vine: Sprite = {
  id: "vine",
  name: "Vine",
  layers: [
    { char: "\u0119", color: colors.olive },
    { char: "-", color: colors.black },
    { char: "·", color: colors.olive },
    { char: ":", color: colors.olive },
  ],
};

export const avocadoOpen: Sprite = {
  id: "avocado_open",
  name: "Avocado",
  layers: [
    { char: "!", color: colors.green },
    { char: "|", color: colors.grey },
    { char: ":", color: colors.green },
    { char: "+", color: colors.green },
    { char: ".", color: colors.black },
    { char: "=", color: colors.green },
    { char: "\u0106", color: colors.lime },
    { char: "\u0108", color: colors.green },
  ],
};

export const avocadoSeed: Sprite = {
  id: "avocado_seed",
  name: "Avocado",
  layers: [
    { char: "!", color: colors.green },
    { char: ".", color: colors.black },
    { char: "=", color: colors.green },
    { char: "\u0106", color: colors.lime },
    { char: "\u0108", color: colors.green },
    { char: "∙", color: colors.maroon },
  ],
};

export const avocadoClosed: Sprite = {
  id: "avocado_closed",
  name: "Avocado",
  layers: [
    { char: "!", color: colors.maroon },
    { char: "|", color: colors.grey },
    { char: ":", color: colors.maroon },
    { char: ".", color: colors.black },
    { char: "=", color: colors.maroon },
    { char: "\u0106", color: colors.maroon },
    { char: "\u0108", color: colors.maroon },
  ],
};

export const avocadoHanging: Sprite = {
  id: "avocado_hanging",
  name: "Avocado",
  layers: [
    { char: "┘", color: colors.grey },
    { char: "┐", color: colors.black },
    { char: "!", color: colors.maroon },
    { char: "|", color: colors.grey },
    { char: ":", color: colors.maroon },
    { char: ".", color: colors.black },
    { char: "=", color: colors.maroon },
    { char: "\u0106", color: colors.maroon },
    { char: "\u0108", color: colors.maroon },
  ],
};

export const lemon: Sprite = {
  id: "lemon",
  name: "Lemon",
  layers: [
    { char: "`", color: colors.maroon },
    { char: "'", color: colors.green },
    { char: ":", color: colors.yellow },
    { char: "\u0106", color: colors.yellow },
    { char: "\u0108", color: colors.yellow },
    { char: ".", color: colors.yellow },
  ],
};

export const grain: Sprite = {
  id: "grain",
  name: "Grain",
  terminal: { layers: [{ char: "∙", color: colors.yellow }] },
  layers: [
    { char: "∙", color: colors.olive },
    { char: "·", color: colors.yellow },
  ],
};

export const wheat: Sprite = {
  id: "wheat",
  name: "Wheat",
  terminal: { layers: [{ char: "¥", color: colors.yellow }] },
  layers: [
    { char: "\u00a5", color: colors.yellow },
    { char: "∞", color: colors.black },
    { char: "x", color: colors.yellow },
    { char: "▄", color: colors.black },
    { char: "\u0106", color: colors.yellow },
    { char: "\u0115", color: colors.black },
    { char: "|", color: colors.olive },
  ],
};

export const bread: Sprite = {
  id: "bread",
  name: "Bread",
  layers: [
    { char: "»", color: colors.yellow },
    { char: "«", color: colors.yellow },
    { char: "\u0115", color: colors.olive },
  ],
};

export const toast: Sprite = {
  id: "toast",
  name: "Toast",
  terminal: { layers: [{ char: "▄", color: colors.red }] },
  layers: [
    { char: "\u0108", color: colors.olive },
    { char: "=", color: colors.olive },
    { char: "\u0106", color: colors.olive },
    { char: "+", color: colors.lime },
    { char: "÷", color: colors.olive },
    { char: "·", color: colors.fuchsia },
  ],
};

export const golemHead: Sprite = {
  id: "golem_head",
  name: "Head",
  terminal: { layers: [{ char: "\u0101", color: colors.grey }] },
  layers: [
    { char: "■", color: colors.grey },
    { char: "≡", color: colors.black },
    { char: "÷", color: colors.grey },
    { char: "\u0100", color: colors.black },
    { char: "∙", color: colors.grey },
    { char: ".", color: colors.grey },
  ],
};

export const sandBlock: Sprite = {
  id: "sand_block",
  name: "Sand",
  terminal: { layers: [{ char: "%", color: colors.yellow }] },
  layers: [
    { char: "■", color: colors.yellow },
    { char: "▓", color: colors.black },
  ],
};

export const gravelBlock: Sprite = {
  id: "gravel_block",
  name: "Gravel",
  terminal: { layers: [{ char: "%", color: colors.silver }] },
  layers: [
    { char: "■", color: colors.silver },
    { char: "▒", color: colors.black },
  ],
};
