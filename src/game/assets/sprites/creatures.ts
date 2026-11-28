import { Sprite } from "../../../engine/components/sprite";
import { colors } from "../colors";

export const scout: Sprite = {
  id: "scout",
  name: "Scout",
  terminal: { layers: [{ char: "\u010b", color: colors.silver }] },
  layers: [{ char: "\u010b", color: colors.silver }],
};

export const rogue: Sprite = {
  id: "rogue",
  name: "Rogue",
  terminal: { layers: [{ char: "\u010b", color: colors.silver }] },
  layers: [
    { char: "`", color: colors.white },
    { char: "\u010b", color: colors.silver },
  ],
};

export const rogueBackdrop: Sprite = {
  id: "rogue_backdrop",
  name: "Rogue",
  layers: [
    { char: "┘", color: colors.white },
    { char: "|", color: colors.black },
    { char: "-", color: colors.black },
  ],
};

export const swimmingRogue: Sprite = {
  id: "swimming_rogue",
  name: "Rogue",
  terminal: { layers: [{ char: "\u010b", color: colors.silver }] },
  layers: [
    { char: "`", color: colors.white },
    { char: "\u010b", color: colors.silver },
  ],
};

export const swimmingRogueBackdrop: Sprite = {
  id: "swimming_rogue_backdrop",
  name: "Rogue",
  layers: [
    { char: "┘", color: colors.white },
    { char: "|", color: colors.navy },
    { char: "-", color: colors.navy },
  ],
};

export const mage: Sprite = {
  id: "mage",
  name: "Mage",
  terminal: { layers: [{ char: "\u010b", color: colors.silver }] },
  layers: [
    { char: "\u010b", color: colors.silver },
    { char: "~", color: colors.white },
  ],
};

export const knight: Sprite = {
  id: "knight",
  name: "Knight",
  terminal: { layers: [{ char: "\u010b", color: colors.silver }] },
  layers: [
    { char: "\u010b", color: colors.silver },
    { char: "^", color: colors.white },
  ],
};

export const bandit: Sprite = {
  id: "bandit",
  name: "Bandit",
  terminal: { layers: [{ char: "\u010b", color: colors.silver }] },
  layers: [
    { char: "\u010b", color: colors.silver },
    { char: "'", color: colors.white },
  ],
};

export const alien: Sprite = {
  id: "alien",
  name: "???",
  terminal: { layers: [{ char: "\u010b", color: colors.silver }] },
  layers: [{ char: "\u010b", color: colors.silver }],
};

export const alienBackdrop: Sprite = {
  id: "alien_backdrop",
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
  id: "swimming_alien_backdrop",
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
  id: "chief",
  name: "Chief",
};

export const zombie: Sprite = {
  id: "zombie",
  name: "Zombie",
  terminal: { layers: [{ char: "\u010b", color: colors.silver }] },
  layers: [
    { char: "[", color: colors.red },
    { char: "]", color: colors.black },
    { char: "\u010b", color: colors.maroon },
  ],
};

export const blade: Sprite = {
  id: "blade",
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

export const salmon: Sprite = {
  id: "salmon",
  name: "Salmon",
  layers: [
    { char: "\u011a", color: colors.purple },
    { char: "-", color: colors.black },
    { char: "\u0108", color: colors.purple },
    { char: "o", color: colors.black },
    { char: "\u03b1", color: colors.purple },
  ],
};

export const pike: Sprite = {
  id: "pike",
  name: "Pike",
  layers: [
    { char: "\u011a", color: colors.teal },
    { char: "-", color: colors.black },
    { char: "\u0108", color: colors.teal },
    { char: "o", color: colors.black },
    { char: "\u03b1", color: colors.teal },
  ],
};

export const tuna: Sprite = {
  id: "tuna",
  name: "Tuna",
  layers: [
    { char: "\u0106", color: colors.purple },
    { char: "\u0119", color: colors.purple },
    { char: "∞", color: colors.purple },
  ],
};

export const cod: Sprite = {
  id: "cod",
  name: "Cod",
  layers: [
    { char: "\u0106", color: colors.teal },
    { char: "\u0119", color: colors.teal },
    { char: "∞", color: colors.teal },
  ],
};

export const eel: Sprite = {
  id: "eel",
  name: "Eel",
  layers: [
    { char: "\u0103", color: colors.green },
    { char: "\u011c", color: colors.black },
    { char: "·", color: colors.green },
    { char: ".", color: colors.black },
    { char: "S", color: colors.green },
  ],
};

export const swimmingEel: Sprite = {
  id: "swimming_eel",
  name: "Eel",
  layers: [
    { char: "\u0103", color: colors.green },
    { char: "\u011c", color: colors.navy },
    { char: "·", color: colors.green },
    { char: ".", color: colors.navy },
    { char: "S", color: colors.green },
  ],
};

export const seastar: Sprite = {
  id: "seastar",
  name: "Seastar",
  layers: [
    { char: "x", color: colors.olive },
    { char: "+", color: colors.olive },
    { char: ":", color: colors.olive },
    { char: ".", color: colors.black },
  ],
};

export const shark: Sprite = {
  id: "shark",
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
  id: "ghost",
  name: "Soul",
  terminal: { layers: [{ char: "\u010b", color: colors.yellow }] },
  layers: [
    // 50% of silver
    { char: "\u010b", color: "#606060" },
    { char: "°", color: colors.yellow },
  ],
};

export const halo: Sprite = {
  id: "halo",
  name: "Soul",
  layers: [{ char: "°", color: colors.yellow }],
};

export const waveTowerCharged: Sprite = {
  id: "wave_tower_charged",
  name: "Tower",
  layers: [
    { char: "Y", color: colors.silver },
    { char: '"', color: colors.white },
  ],
};

export const spider: Sprite = {
  id: "spider",
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
  id: "snake",
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
  id: "fly",
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
  id: "fairy",
  name: "Fairy",
  layers: [{ char: "\u0100", color: colors.grey }],
};

export const ilex: Sprite = {
  id: "ilex",
  name: "Ilex",
  layers: [
    { char: "X", color: colors.green },
    { char: "┼", color: colors.green },
    { char: "\u0106", color: colors.red },
    { char: "∙", color: colors.maroon },
  ],
  facing: {
    up: [
      { char: "X", color: colors.green },
      { char: "┼", color: colors.green },
      { char: "\u0106", color: colors.lime },
      { char: "∙", color: colors.green },
    ],
    right: [
      { char: "X", color: colors.green },
      { char: "┼", color: colors.green },
      { char: "\u0106", color: colors.yellow },
      { char: "∙", color: colors.olive },
    ],
    down: [
      { char: "X", color: colors.green },
      { char: "┼", color: colors.green },
    ],
    left: [
      { char: "X", color: colors.green },
      { char: "┼", color: colors.green },
      { char: "\u0106", color: colors.silver },
      { char: "∙", color: colors.grey },
    ],
  },
};

export const oakBossUnit: Sprite = {
  id: "oak_boss_unit",
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
  id: "chest_boss",
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

const chickBody = (id: string, color: string): Sprite => ({
  id,
  name: "Chick",
  terminal: { layers: [{ char: "\u0103", color }] },
  layers: [
    { char: "v", color: colors.red },
    { char: "═", color: colors.black },
    { char: "u", color: colors.black },
    { char: "▄", color: colors.black },
    { char: "─", color: colors.red },
    { char: "-", color: colors.black },
    { char: "\u0116", color: colors.red },
    { char: "\u0111", color: colors.black },
    { char: "\u0108", color },
    { char: "¡", color: colors.red },
    { char: "|", color: colors.black },
    { char: "\u0106", color },
    { char: "+", color: colors.black },
    { char: "÷", color },
    { char: "∙", color },
    { char: ".", color: colors.black },
  ],
});
export const chick = chickBody("chick", colors.yellow);
export const chickFemale = chickBody("chick_female", colors.silver);

export const hen: Sprite = {
  id: "hen",
  name: "Hen",
  terminal: { layers: [{ char: "\u011e", color: colors.white }] },
  layers: [
    { char: "\u03a9", color: colors.olive },
    { char: "\u011e", color: colors.white },
    { char: "\u010b", color: colors.black },
    { char: "~", color: colors.red },
    { char: "|", color: colors.black },
    { char: "\u00bb", color: colors.white },
    { char: "*", color: colors.olive },
    { char: "\u00ab", color: colors.white },
    { char: "\u011b", color: colors.white },
    { char: "\u00ba", color: colors.white },
    { char: "\u0106", color: colors.white },
    { char: "=", color: colors.white },
  ],
};

export const rooster: Sprite = {
  id: "rooster",
  name: "Rooster",
  terminal: { layers: [{ char: "\u011e", color: colors.maroon }] },
  layers: [
    { char: "\u00b2", color: colors.red },
    { char: "\u03a9", color: colors.olive },
    { char: "\u011e", color: colors.maroon },
    { char: "\u010b", color: colors.black },
    { char: "~", color: colors.red },
    { char: "|", color: colors.black },
    { char: "\u00bb", color: colors.maroon },
    { char: "*", color: colors.olive },
    { char: "\u00ba", color: colors.maroon },
    { char: "=", color: colors.maroon },
    { char: "\u011b", color: colors.maroon },
    { char: "\u00ab", color: colors.maroon },
    { char: "\u0106", color: colors.maroon },
  ],
};

export const golemUnit: Sprite = {
  id: "golem_unit",
  name: "Golem",
  terminal: { layers: [{ char: "\u0101", color: colors.silver }] },
  layers: [
    { char: "|", color: colors.grey },
    { char: "m", color: colors.grey },
    { char: "\u010e", color: colors.grey },
    { char: "\u0106", color: colors.black },
    { char: "+", color: colors.black },
    { char: "÷", color: colors.grey },
    { char: "∙", color: colors.grey },
    { char: ":", color: colors.grey },
  ],
};

export const golem: Sprite = {
  id: "golem",
  name: "Golem",
  layers: [
    { char: "█", color: colors.grey },
    { char: "¿", color: colors.black },
    { char: "j", color: colors.black },
    { char: "▄", color: colors.grey },
    { char: "■", color: colors.grey },
  ],
  facing: {
    up: [
      { char: "█", color: colors.grey },
      { char: "¿", color: colors.black },
      { char: "j", color: colors.black },
      { char: "▄", color: colors.grey },
      { char: "■", color: colors.grey },
      { char: "\u0106", color: colors.yellow },
      { char: "\u0108", color: colors.olive },
    ],
    right: [
      { char: "█", color: colors.grey },
      { char: "¿", color: colors.black },
      { char: "j", color: colors.black },
      { char: "▄", color: colors.grey },
      { char: "■", color: colors.grey },
      { char: "\u0106", color: colors.yellow },
      { char: "\u0108", color: colors.olive },
    ],
    down: [
      { char: "█", color: colors.grey },
      { char: "¿", color: colors.black },
      { char: "j", color: colors.black },
      { char: "▄", color: colors.grey },
      { char: "■", color: colors.grey },
      { char: "\u0106", color: colors.yellow },
      { char: "\u0108", color: colors.olive },
    ],
    left: [
      { char: "█", color: colors.grey },
      { char: "¿", color: colors.black },
      { char: "j", color: colors.black },
      { char: "▄", color: colors.grey },
      { char: "■", color: colors.grey },
      { char: "\u0106", color: colors.yellow },
      { char: "\u0108", color: colors.olive },
    ],
  },
};

export const golemBody: Sprite = {
  id: "golem_body",
  name: "Golem",
  layers: [{ char: "█", color: colors.grey }],
  facing: {
    up: [{ char: "▄", color: colors.grey }],
    down: [
      { char: "▀", color: colors.grey },
      { char: "┴", color: colors.black },
      { char: "╨", color: colors.grey },
      { char: "─", color: colors.black },
    ],
  },
};

export const golemArm: Sprite = {
  id: "golem_arm",
  name: "Golem",
  layers: [
    { char: "╥", color: colors.grey },
    { char: "┬", color: colors.grey },
  ],
  facing: {
    up: [
      { char: "╚", color: colors.grey },
      { char: "└", color: colors.grey },
    ],
    right: [
      { char: "╗", color: colors.grey },
      { char: "┐", color: colors.grey },
    ],
    down: [
      { char: "╝", color: colors.grey },
      { char: "┘", color: colors.grey },
    ],
    left: [
      { char: "╔", color: colors.grey },
      { char: "┌", color: colors.grey },
    ],
  },
};

export const golemShoulderLeft: Sprite = {
  id: "golem_shoulder_left",
  name: "Golem",
  layers: [{ char: "╔", color: colors.grey }],
  facing: {
    up: [{ char: "╚", color: colors.grey }],
    left: [{ char: "═", color: colors.grey }],
  },
};

export const golemShoulderRight: Sprite = {
  id: "golem_shoulder_right",
  name: "Golem",
  layers: [{ char: "╗", color: colors.grey }],
  facing: {
    up: [{ char: "╝", color: colors.grey }],
    right: [{ char: "═", color: colors.grey }],
  },
};

export const golemLimb: Sprite = {
  id: "golem_limb",
  name: "Golem",
  layers: [{ char: "╬", color: colors.grey }],
  facing: {
    up: [{ char: "║", color: colors.grey }],
    right: [{ char: "═", color: colors.grey }],
    down: [{ char: "║", color: colors.grey }],
    left: [{ char: "═", color: colors.grey }],
  },
};

export const golemFist: Sprite = {
  id: "golem_fist",
  name: "Golem",
  layers: [
    { char: "═", color: colors.grey },
    { char: "■", color: colors.grey },
  ],
  facing: {
    up: [
      { char: "╥", color: colors.grey },
      { char: "─", color: colors.black },
      { char: "■", color: colors.grey },
    ],
    right: [
      { char: "╡", color: colors.grey },
      { char: "│", color: colors.black },
      { char: "■", color: colors.grey },
    ],
    down: [
      { char: "╨", color: colors.grey },
      { char: "─", color: colors.black },
      { char: "■", color: colors.grey },
    ],
    left: [
      { char: "╞", color: colors.grey },
      { char: "│", color: colors.black },
      { char: "■", color: colors.grey },
    ],
  },
};

export const golemStrikeUp: Sprite = {
  id: "golem_strike_up",
  name: "Golem",
  layers: [],
  facing: {
    up: [{ char: "═", color: colors.yellow }],
    right: [{ char: "═", color: colors.yellow }],
    left: [{ char: "═", color: colors.yellow }],
  },
};

export const golemStrikeUpRight: Sprite = {
  id: "golem_strike_up_right",
  name: "Golem",
  layers: [],
  facing: {
    up: [{ char: "╗", color: colors.yellow }],
    right: [{ char: "╗", color: colors.yellow }],
  },
};

export const golemStrikeRight: Sprite = {
  id: "golem_strike_right",
  name: "Golem",
  layers: [],
  facing: {
    up: [{ char: "║", color: colors.yellow }],
    right: [{ char: "║", color: colors.yellow }],
    down: [{ char: "║", color: colors.yellow }],
  },
};

export const golemStrikeRightDown: Sprite = {
  id: "golem_strike_right_down",
  name: "Golem",
  layers: [],
  facing: {
    right: [{ char: "╝", color: colors.yellow }],
    down: [{ char: "╝", color: colors.yellow }],
  },
};

export const golemStrikeDown: Sprite = {
  id: "golem_strike_down",
  name: "Golem",
  layers: [],
  facing: {
    right: [{ char: "═", color: colors.yellow }],
    down: [{ char: "═", color: colors.yellow }],
    left: [{ char: "═", color: colors.yellow }],
  },
};

export const golemStrikeDownLeft: Sprite = {
  id: "golem_strike_down_left",
  name: "Golem",
  layers: [],
  facing: {
    down: [{ char: "╚", color: colors.yellow }],
    left: [{ char: "╚", color: colors.yellow }],
  },
};

export const golemStrikeLeft: Sprite = {
  id: "golem_strike_left",
  name: "Golem",
  layers: [],
  facing: {
    up: [{ char: "║", color: colors.yellow }],
    down: [{ char: "║", color: colors.yellow }],
    left: [{ char: "║", color: colors.yellow }],
  },
};

export const golemStrikeLeftUp: Sprite = {
  id: "golem_strike_left_up",
  name: "Golem",
  layers: [],
  facing: {
    up: [{ char: "╔", color: colors.yellow }],
    left: [{ char: "╔", color: colors.yellow }],
  },
};

export const giantHead: Sprite = {
  id: "giant_head",
  name: "Giant",
  layers: [{ char: "▀", color: colors.silver }],
  facing: {
    left: [
      { char: "▄", color: colors.silver },
      { char: "▐", color: colors.silver },
    ],
    right: [
      { char: "▄", color: colors.silver },
      { char: "▌", color: colors.silver },
    ],
  },
};

export const giantBody: Sprite = {
  id: "giant_body",
  name: "Giant",
  layers: [{ char: "▄", color: colors.silver }],
  facing: {
    left: [
      { char: "█", color: colors.silver },
      { char: "\u0107", color: colors.black },
      { char: "M", color: colors.silver },
      { char: "\u0101", color: colors.silver },
      { char: "▌", color: colors.black },
      { char: "▀", color: colors.silver },
    ],
    right: [
      { char: "▌", color: colors.black },
      { char: "M", color: colors.silver },
      { char: "\u0101", color: colors.silver },
      { char: "\u0106", color: colors.silver },
      { char: "▐", color: colors.black },
      { char: "▀", color: colors.silver },
    ],
  },
};

export const giantFeet: Sprite = {
  id: "giant_feet",
  name: "Giant",
  layers: [
    { char: "▀", color: colors.silver },
    { char: "∞", color: colors.black },
    { char: "═", color: colors.black },
    { char: "*", color: colors.black },
    { char: "▄", color: colors.black },
    { char: "\u0106", color: colors.silver },
    { char: "\u0107", color: colors.silver },
  ],
  facing: {
    left: [
      { char: "▀", color: colors.silver },
      { char: "∞", color: colors.black },
      { char: "═", color: colors.black },
      { char: "*", color: colors.black },
    ],
    right: [
      { char: "▀", color: colors.silver },
      { char: "∞", color: colors.black },
      { char: "═", color: colors.black },
      { char: "*", color: colors.black },
    ],
  },
};

export const wormBoss: Sprite = {
  id: "worm_boss",
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
  id: "worm_side",
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
  id: "worm_corner",
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
  id: "worm_mouth",
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
  id: "worm_mouth_corner_left",
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
  id: "worm_mouth_corner_right",
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
  id: "worm_mouth_side_left",
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
  id: "worm_mouth_center",
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
  id: "worm_mouth_side_right",
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
  id: "worm_spike_clockwise",
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
  id: "worm_spike_counter_clockwise",
  name: "Worm",
  layers: [],
  facing: {
    up: [{ char: "┘", color: colors.red }],
    right: [{ char: "└", color: colors.red }],
    down: [{ char: "┌", color: colors.red }],
    left: [{ char: "┐", color: colors.red }],
  },
};
