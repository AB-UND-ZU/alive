import { Sprite } from "../../../engine/components/sprite";
import { colors } from "../colors";

export const scout: Sprite = {
  name: "Scout",
  layers: [{ char: "\u010b", color: colors.silver }],
};

export const rogue: Sprite = {
  name: "Rogue",
  layers: [
    { char: "`", color: colors.white },
    { char: "\u010b", color: colors.silver },
  ],
};

export const rogueBackdrop: Sprite = {
  name: "Rogue",
  layers: [
    { char: "┘", color: colors.white },
    { char: "|", color: colors.black },
    { char: "-", color: colors.black },
  ],
};

export const swimmingRogue: Sprite = {
  name: "Rogue",
  layers: [
    { char: "`", color: colors.white },
    { char: "\u010b", color: colors.silver },
  ],
};

export const swimmingRogueBackdrop: Sprite = {
  name: "Rogue",
  layers: [
    { char: "┘", color: colors.white },
    { char: "|", color: colors.navy },
    { char: "-", color: colors.navy },
  ],
};

export const mage: Sprite = {
  name: "Mage",
  layers: [
    { char: "\u010b", color: colors.silver },
    { char: "~", color: colors.white },
  ],
};

export const knight: Sprite = {
  name: "Knight",
  layers: [
    { char: "\u010b", color: colors.silver },
    { char: "^", color: colors.white },
  ],
};

export const bandit: Sprite = {
  name: "Bandit",
  layers: [
    { char: "\u010b", color: colors.silver },
    { char: "'", color: colors.white },
  ],
};

export const alien: Sprite = {
  name: "???",
  layers: [{ char: "\u010b", color: colors.silver }],
};

export const alienBackdrop: Sprite = {
  name: "???",
  layers: [
    { char: "Ä", color: colors.white },
    { char: "A", color: colors.black },

    { char: "å", color: colors.white },
    { char: "á", color: colors.black },
    { char: "'", color: colors.black },
  ],
};

export const swimmingAlienBackdrop: Sprite = {
  name: "???",
  layers: [
    { char: "Ä", color: colors.white },
    { char: "A", color: colors.navy },

    { char: "å", color: colors.white },
    { char: "á", color: colors.navy },
    { char: "'", color: colors.navy },
  ],
};

export const chief: Sprite = {
  ...bandit,
  name: "Chief",
};

export const blade: Sprite = {
  name: "Blade",
  layers: [
    { char: "+", color: colors.grey },
    { char: "-", color: colors.black },
    { char: ">", color: colors.grey },
  ],
  facing: {
    up: [
      { char: "\u0105", color: colors.grey },
      { char: "\u0115", color: colors.black },
      { char: "+", color: colors.black },
    ],
    right: [
      { char: "+", color: colors.grey },
      { char: "-", color: colors.black },
      { char: ">", color: colors.grey },
    ],
    down: [
      { char: "v", color: colors.grey },
      { char: "+", color: colors.black },
    ],
    left: [
      { char: "+", color: colors.grey },
      { char: "-", color: colors.black },
      { char: "<", color: colors.grey },
    ],
  },
};

export const fish: Sprite = {
  name: "Fish",
  layers: [
    { char: "\u0106", color: colors.blue },
    { char: "\u0119", color: colors.blue },
    { char: "∞", color: colors.blue },
  ],
};

export const shark: Sprite = {
  name: "Shark",
  layers: [
    { char: "≥", color: colors.grey },
    { char: ">", color: colors.grey },
    { char: "+", color: colors.grey },
  ],
  facing: {
    up: [
      { char: '"', color: colors.grey },
      { char: "│", color: colors.grey },
      { char: "!", color: colors.navy },
    ],
    right: [
      { char: "≥", color: colors.grey },
      { char: ">", color: colors.grey },
      { char: "+", color: colors.grey },
    ],
    down: [
      { char: '"', color: colors.grey },
      { char: "|", color: colors.grey },
      { char: "+", color: colors.navy },
    ],
    left: [
      { char: "≤", color: colors.grey },
      { char: "<", color: colors.grey },
      { char: "+", color: colors.grey },
    ],
  },
};

export const ghost: Sprite = {
  name: "Soul",
  layers: [
    // 50% of silver
    { char: "\u010b", color: "#606060" },
    { char: "°", color: colors.yellow },
  ],
};

export const halo: Sprite = {
  name: "Soul",
  layers: [{ char: "°", color: colors.yellow }],
};

export const waveTowerCharged: Sprite = {
  name: "Tower",
  layers: [
    { char: "Y", color: colors.silver },
    { char: '"', color: colors.white },
  ],
};

export const spider: Sprite = {
  name: "Spider",
  layers: [
    { char: '"', color: colors.silver },
    { char: "\u010e", color: colors.silver },
    { char: "I", color: colors.black },
    { char: "+", color: colors.silver },
    { char: ":", color: colors.silver },
    { char: ".", color: colors.black },
    { char: "·", color: colors.black },
  ],
};

export const snake: Sprite = {
  name: "Snake",
  layers: [{ char: "@", color: colors.silver }],
  facing: {
    up: [
      { char: "@", color: colors.silver },
      { char: "∙", color: colors.black },
    ],
    right: [
      { char: "@", color: colors.silver },
      { char: "∙", color: colors.black },
    ],
    down: [
      { char: "@", color: colors.silver },
      { char: "∙", color: colors.black },
    ],
    left: [
      { char: "@", color: colors.silver },
      { char: "∙", color: colors.black },
    ],
  },
};

export const fly: Sprite = {
  name: "Fly",
  layers: [
    { char: '"', color: colors.silver },
    { char: "+", color: colors.grey },
    { char: "÷", color: colors.black },
    { char: "∙", color: colors.black },
    { char: ":", color: colors.grey },
    { char: ",", color: colors.black },
  ],
};

export const fairy: Sprite = {
  name: "Fairy",
  layers: [{ char: "\u0100", color: colors.grey }],
};

export const ilex: Sprite = {
  name: "Ilex",
  layers: [
    { char: "X", color: colors.green },
    { char: "┼", color: colors.green },
  ],
  facing: {
    up: [
      { char: "X", color: colors.green },
      { char: "┼", color: colors.green },
      { char: "\u0106", color: colors.red },
      { char: "∙", color: colors.maroon },
    ],
  },
};

export const oakBoss: Sprite = {
  name: "Oak",
  layers: [
    { char: "\u0106", color: colors.green },
    { char: "\u0107", color: colors.green },
    { char: "▄", color: colors.black },
    { char: "░", color: colors.black },
    { char: "┐", color: colors.maroon },
    { char: "-", color: colors.green },
  ],
};

export const chestBoss: Sprite = {
  name: "",
  layers: [
    { char: "■", color: colors.grey },
    { char: "+", color: colors.red },
    { char: ":", color: colors.grey },
    { char: "±", color: colors.maroon },
    { char: "∙", color: colors.silver },
    { char: "·", color: colors.maroon },
  ],
};

export const chick: Sprite = {
  name: "Chick",
  layers: [
    { char: "v", color: colors.red },
    { char: "═", color: colors.black },
    { char: "u", color: colors.black },
    { char: "▄", color: colors.black },
    { char: "─", color: colors.red },
    { char: "-", color: colors.black },
    { char: "\u0116", color: colors.red },
    { char: "\u0111", color: colors.black },
    { char: "\u0108", color: colors.yellow },
    { char: "¡", color: colors.red },
    { char: "|", color: colors.black },
    { char: "\u0106", color: colors.yellow },
    { char: "+", color: colors.black },
    { char: "÷", color: colors.yellow },
    { char: "∙", color: colors.yellow },
    { char: ".", color: colors.black },
  ],
};

export const wormBoss: Sprite = {
  name: "Worm",
  layers: [
    { char: "│", color: colors.silver },
    { char: "■", color: colors.grey },
    { char: "\u0106", color: colors.red },
    { char: "+", color: colors.red },
    { char: "÷", color: colors.grey },
    { char: ":", color: colors.red },
    { char: "∙", color: colors.black },
    { char: ".", color: colors.grey },
    { char: "▀", color: colors.black },
  ],
};

export const wormSide: Sprite = {
  name: "Worm",
  layers: [
    { char: "M", color: colors.grey },
    { char: "[", color: colors.grey },
    { char: "]", color: colors.grey },
    { char: "\u0114", color: colors.grey },
    { char: "\u0110", color: colors.grey },
    { char: "¼", color: colors.grey },
    { char: "ç", color: colors.grey },
    { char: "Q", color: colors.grey },
    { char: "\u0101", color: colors.silver },
    { char: "\u0100", color: colors.grey },
    { char: "■", color: colors.silver },
    { char: "=", color: colors.red },
    { char: "|", color: colors.grey },
  ],
  facing: {
    up: [
      { char: "│", color: colors.grey },

      { char: "M", color: colors.grey },
      { char: "[", color: colors.grey },
      { char: "]", color: colors.grey },
      { char: "\u0114", color: colors.grey },
      { char: "\u0110", color: colors.grey },
      { char: "¼", color: colors.grey },
      { char: "ç", color: colors.grey },
      { char: "Q", color: colors.grey },
      { char: "\u0101", color: colors.silver },
      { char: "\u0100", color: colors.grey },
      { char: "■", color: colors.silver },
      { char: "|", color: colors.silver },
      { char: "=", color: colors.red },
    ],
    right: [
      { char: "∞", color: colors.grey },

      { char: "M", color: colors.grey },
      { char: "[", color: colors.grey },
      { char: "]", color: colors.grey },
      { char: "\u0114", color: colors.grey },
      { char: "\u0110", color: colors.grey },
      { char: "¼", color: colors.grey },
      { char: "ç", color: colors.grey },
      { char: "Q", color: colors.grey },
      { char: "\u0101", color: colors.silver },
      { char: "\u0100", color: colors.grey },
      { char: "■", color: colors.silver },
      { char: "[", color: colors.red },
      { char: "]", color: colors.red },
      { char: "|", color: colors.silver },
    ],
    down: [
      { char: "│", color: colors.grey },

      { char: "M", color: colors.grey },
      { char: "[", color: colors.grey },
      { char: "]", color: colors.grey },
      { char: "\u0114", color: colors.grey },
      { char: "\u0110", color: colors.grey },
      { char: "¼", color: colors.grey },
      { char: "ç", color: colors.grey },
      { char: "Q", color: colors.grey },
      { char: "\u0101", color: colors.silver },
      { char: "\u0100", color: colors.grey },
      { char: "■", color: colors.silver },
      { char: "|", color: colors.silver },
      { char: "=", color: colors.red },
    ],
    left: [
      { char: "∞", color: colors.grey },

      { char: "M", color: colors.grey },
      { char: "[", color: colors.grey },
      { char: "]", color: colors.grey },
      { char: "\u0114", color: colors.grey },
      { char: "\u0110", color: colors.grey },
      { char: "¼", color: colors.grey },
      { char: "ç", color: colors.grey },
      { char: "Q", color: colors.grey },
      { char: "\u0101", color: colors.silver },
      { char: "\u0100", color: colors.grey },
      { char: "■", color: colors.silver },
      { char: "[", color: colors.red },
      { char: "]", color: colors.red },
      { char: "|", color: colors.silver },
    ],
  },
};

export const wormCorner: Sprite = {
  name: "Worm",
  layers: [
    { char: "M", color: colors.grey },
    { char: "[", color: colors.grey },
    { char: "]", color: colors.grey },
    { char: "\u0114", color: colors.grey },
    { char: "\u0110", color: colors.grey },
    { char: "¼", color: colors.grey },
    { char: "ç", color: colors.grey },
    { char: "Q", color: colors.grey },
    { char: "\u0101", color: colors.silver },
    { char: "\u0100", color: colors.grey },
    { char: "■", color: colors.silver },
    { char: "=", color: colors.red },
    { char: "|", color: colors.red },
  ],
  facing: {
    up: [
      { char: "┌", color: colors.grey },
      { char: "∞", color: colors.grey },

      { char: "M", color: colors.grey },
      { char: "[", color: colors.grey },
      { char: "]", color: colors.grey },
      { char: "\u0114", color: colors.grey },
      { char: "\u0110", color: colors.grey },
      { char: "¼", color: colors.grey },
      { char: "ç", color: colors.grey },
      { char: "Q", color: colors.grey },
      { char: "\u0101", color: colors.silver },
      { char: "\u0100", color: colors.grey },
      { char: "■", color: colors.silver },
      { char: "|", color: colors.silver },
      { char: "=", color: colors.red },
    ],
    right: [
      { char: "┐", color: colors.grey },

      { char: "M", color: colors.grey },
      { char: "[", color: colors.grey },
      { char: "]", color: colors.grey },
      { char: "\u0114", color: colors.grey },
      { char: "\u0110", color: colors.grey },
      { char: "¼", color: colors.grey },
      { char: "ç", color: colors.grey },
      { char: "Q", color: colors.grey },
      { char: "\u0101", color: colors.silver },
      { char: "\u0100", color: colors.grey },
      { char: "■", color: colors.silver },
      { char: "[", color: colors.red },
      { char: "]", color: colors.red },
      { char: "|", color: colors.silver },
    ],
    down: [
      { char: "┘", color: colors.grey },

      { char: "M", color: colors.grey },
      { char: "[", color: colors.grey },
      { char: "]", color: colors.grey },
      { char: "\u0114", color: colors.grey },
      { char: "\u0110", color: colors.grey },
      { char: "¼", color: colors.grey },
      { char: "ç", color: colors.grey },
      { char: "Q", color: colors.grey },
      { char: "\u0101", color: colors.silver },
      { char: "\u0100", color: colors.grey },
      { char: "■", color: colors.silver },
      { char: "|", color: colors.silver },
      { char: "=", color: colors.red },
    ],
    left: [
      { char: "┘", color: colors.grey },
      { char: "∞", color: colors.grey },

      { char: "M", color: colors.grey },
      { char: "[", color: colors.grey },
      { char: "]", color: colors.grey },
      { char: "\u0114", color: colors.grey },
      { char: "\u0110", color: colors.grey },
      { char: "¼", color: colors.grey },
      { char: "ç", color: colors.grey },
      { char: "Q", color: colors.grey },
      { char: "\u0101", color: colors.silver },
      { char: "\u0100", color: colors.grey },
      { char: "■", color: colors.silver },
      { char: "[", color: colors.red },
      { char: "]", color: colors.red },
      { char: "|", color: colors.silver },
    ],
  },
};

export const wormMouth: Sprite = {
  name: "Worm",
  layers: [],
  facing: {
    up: [
      { char: "X", color: colors.red },
      { char: "▄", color: colors.grey },
    ],
    right: [
      { char: "x", color: colors.red },
      { char: "^", color: colors.red },
      { char: "_", color: colors.red },
      { char: "▌", color: colors.grey },
    ],
    down: [
      { char: "X", color: colors.red },
      { char: "▀", color: colors.grey },
    ],
    left: [
      { char: "x", color: colors.red },
      { char: "^", color: colors.red },
      { char: "_", color: colors.red },
      { char: "▐", color: colors.grey },
    ],
  },
};

export const wormMouthCornerLeft: Sprite = {
  name: "Worm",
  layers: [
    { char: "█", color: colors.grey },
    { char: "X", color: colors.red },
  ],
  facing: {
    up: [
      { char: "/", color: colors.red },
      { char: "~", color: colors.red },
      { char: "▄", color: colors.grey },
      { char: "▌", color: colors.grey },
    ],
    right: [{ char: "▄", color: colors.grey }],
    down: [
      { char: "/", color: colors.red },
      { char: "_", color: colors.red },
      { char: "▀", color: colors.grey },
      { char: "▐", color: colors.grey },
    ],
    left: [
      { char: "▀", color: colors.grey },
      { char: "─", color: colors.grey },
    ],
  },
};

export const wormMouthCornerRight: Sprite = {
  name: "Worm",
  layers: [
    { char: "█", color: colors.grey },
    { char: "X", color: colors.red },
  ],
  facing: {
    up: [
      { char: "\\", color: colors.red },
      { char: "`", color: colors.red },
      { char: "▄", color: colors.grey },
      { char: "▐", color: colors.grey },
    ],
    right: [
      { char: "▀", color: colors.grey },
      { char: "─", color: colors.grey },
    ],
    down: [
      { char: "\\", color: colors.red },
      { char: "_", color: colors.red },
      { char: "▀", color: colors.grey },
      { char: "▌", color: colors.grey },
    ],
    left: [{ char: "▄", color: colors.grey }],
  },
};

export const wormMouthSideLeft: Sprite = {
  name: "Worm",
  layers: [],
  facing: {
    right: [{ char: "▄", color: colors.grey }],
    left: [
      { char: "▀", color: colors.grey },
      { char: "─", color: colors.grey },
    ],
  },
};

export const wormMouthCenter: Sprite = {
  name: "Worm",
  layers: [],
  facing: {
    right: [
      { char: "│", color: colors.red },
      { char: "|", color: colors.black },
    ],
    left: [
      { char: "│", color: colors.red },
      { char: "|", color: colors.black },
    ],
  },
};

export const wormMouthSideRight: Sprite = {
  name: "Worm",
  layers: [],
  facing: {
    right: [
      { char: "▀", color: colors.grey },
      { char: "─", color: colors.grey },
    ],
    left: [{ char: "▄", color: colors.grey }],
  },
};

export const wormSpikeClockwise: Sprite = {
  name: "Worm",
  layers: [],
  facing: {
    up: [{ char: "└", color: colors.red }],
    right: [{ char: "┌", color: colors.red }],
    down: [{ char: "┐", color: colors.red }],
    left: [{ char: "┘", color: colors.red }],
  },
};

export const wormSpikeCounterClockwise: Sprite = {
  name: "Worm",
  layers: [],
  facing: {
    up: [{ char: "┘", color: colors.red }],
    right: [{ char: "└", color: colors.red }],
    down: [{ char: "┌", color: colors.red }],
    left: [{ char: "┐", color: colors.red }],
  },
};
