import { colors } from "../colors";
import { Sprite } from "../../../engine/components/sprite";

export const listBullet: Sprite = {
  id: "list_bullet",
  name: "List bullet",
  layers: [
    { char: "-", color: colors.grey },
    { char: "└", color: colors.black },
    { char: "·", color: colors.grey },
  ],
};

export const none: Sprite = {
  id: "none",
  name: "",
  layers: [],
};

export const blockDown: Sprite = {
  id: "block_down",
  name: "block_down",
  layers: [{ char: "▄", color: colors.maroon }],
};

export const blockDownActive: Sprite = {
  id: "block_down_active",
  name: "block_down",
  layers: [{ char: "▄", color: colors.red }],
};

export const blockUp: Sprite = {
  id: "block_up",
  name: "block_up",
  layers: [{ char: "▀", color: colors.maroon }],
};

export const blockUpActive: Sprite = {
  id: "block_up_active",
  name: "block_up",
  layers: [{ char: "▀", color: colors.red }],
};

export const keyHole: Sprite = {
  id: "key_hole",
  name: "key_hole",
  layers: [
    { char: "\u0106", color: colors.black },
    { char: ".", color: colors.black },
  ],
};

export const barrierSide: Sprite = {
  id: "barrier_side",
  name: "barrier_side",
  layers: [{ char: "╬", color: colors.red }],
  facing: {
    up: [{ char: "═", color: colors.red }],
    right: [{ char: "║", color: colors.red }],
    down: [{ char: "═", color: colors.red }],
    left: [{ char: "║", color: colors.red }],
  },
};

export const barrierCorner: Sprite = {
  id: "barrier_corner",
  name: "barrier_corner",
  layers: [{ char: "╬", color: colors.red }],
  facing: {
    up: [{ char: "╔", color: colors.red }],
    right: [{ char: "╗", color: colors.red }],
    down: [{ char: "╝", color: colors.red }],
    left: [{ char: "╚", color: colors.red }],
  },
};

export const frozen: Sprite = {
  id: "frozen",
  name: "water_frozen",
  layers: [{ char: "▓", color: colors.aqua }],
};

export const absorb: Sprite = {
  id: "absorb",
  name: "Absorb",
  layers: [
    { char: "\u0100", color: colors.yellow },
    { char: "■", color: colors.black },
    { char: "┼", color: colors.black },
  ],
};

export const meleeHit: Sprite = {
  id: "melee_hit",
  name: "Melee",
  terminal: {
    layers: [{ char: "o", color: colors.white }],
    amounts: {
      single: [{ char: "x", color: colors.red }],
      double: [{ char: "x", color: colors.red }],
      multiple: [{ char: "X", color: colors.red }],
    },
  },
  layers: [{ char: "O", color: colors.white }],
  amounts: {
    single: [
      { char: "*", color: colors.red },
      { char: "─", color: colors.black },
      { char: "·", color: colors.red },
    ],
    double: [{ char: "x", color: colors.red }],
    multiple: [{ char: "X", color: colors.red }],
  },
};

export const magicHit: Sprite = {
  id: "magic_hit",
  name: "Magic",
  terminal: {
    layers: [{ char: "o", color: colors.white }],
    amounts: {
      single: [{ char: "x", color: colors.fuchsia }],
      double: [{ char: "x", color: colors.fuchsia }],
      multiple: [{ char: "X", color: colors.fuchsia }],
    },
  },
  layers: [{ char: "O", color: colors.white }],
  amounts: {
    single: [
      { char: "*", color: colors.fuchsia },
      { char: "─", color: colors.black },
      { char: "·", color: colors.fuchsia },
    ],
    double: [{ char: "x", color: colors.fuchsia }],
    multiple: [{ char: "X", color: colors.fuchsia }],
  },
};

export const zapParticle: Sprite = {
  id: "zap_particle",
  name: "Zap",
  terminal: {
    layers: [],
    amounts: { single: [{ char: "÷", color: colors.yellow }] },
  },
  layers: [],
  amounts: {
    single: [{ char: ":", color: colors.yellow }],
  },
};

export const zapSwordParticle: Sprite = {
  id: "zap_sword_particle",
  name: "Zap",
  terminal: {
    layers: [],
    amounts: { single: [{ char: "÷", color: colors.yellow }] },
  },
  layers: [],
  amounts: {
    single: [{ char: "%", color: colors.yellow }],
  },
};

export const lightningSide: Sprite = {
  id: "lightning_side",
  name: "lightning_side",
  layers: [{ char: "┼", color: colors.yellow }],
  facing: {
    up: [{ char: "│", color: colors.yellow }],
    right: [{ char: "─", color: colors.yellow }],
    down: [{ char: "│", color: colors.yellow }],
    left: [{ char: "─", color: colors.yellow }],
  },
};

export const lightninCorner: Sprite = {
  id: "lightnin_corner",
  name: "lightning_corner",
  layers: [{ char: "┼", color: colors.yellow }],
  facing: {
    up: [{ char: "┌", color: colors.yellow }],
    right: [{ char: "┐", color: colors.yellow }],
    down: [{ char: "┘", color: colors.yellow }],
    left: [{ char: "└", color: colors.yellow }],
  },
};

export const stats: Sprite = {
  id: "stats",
  name: "Stats",
  layers: [{ char: "₧", color: colors.green }],
};

export const aura: Sprite = {
  id: "aura",
  name: "Aura",
  layers: [
    { char: "±", color: colors.fuchsia },
    { char: "\u0115", color: colors.black },
    { char: "+", color: colors.purple },
  ],
};

export const range: Sprite = {
  id: "range",
  name: "Range",
  terminal: { layers: [{ char: "\u0111", color: colors.yellow }] },
  layers: [
    { char: "\u0117", color: colors.yellow },
    { char: "\u0118", color: colors.yellow },
    { char: ":", color: colors.olive },
    { char: "+", color: colors.olive },
    { char: ".", color: colors.yellow },
    { char: "-", color: colors.black },
    { char: "·", color: colors.olive },
  ],
};

export const delay: Sprite = {
  id: "delay",
  name: "Delay",
  terminal: { layers: [{ char: "└", color: colors.yellow }] },
  layers: [
    { char: "\u0100", color: colors.olive },
    { char: "■", color: colors.black },
    { char: "└", color: colors.yellow },
    { char: "·", color: colors.olive },
  ],
};

export const time: Sprite = {
  id: "time",
  name: "Time",
  terminal: { layers: [{ char: "└", color: colors.fuchsia }] },
  layers: [
    { char: "\u0101", color: colors.purple },
    { char: "\u0100", color: colors.black },
    { char: "■", color: colors.purple },
    { char: "└", color: colors.fuchsia },
  ],
};

export const trueHit: Sprite = {
  id: "true_hit",
  name: "True",
  terminal: {
    layers: [{ char: "o", color: colors.white }],
    amounts: {
      single: [{ char: "x", color: colors.white }],
      double: [{ char: "x", color: colors.white }],
      multiple: [{ char: "X", color: colors.white }],
    },
  },
  layers: [{ char: "O", color: colors.white }],
  amounts: {
    single: [
      { char: "*", color: colors.white },
      { char: "─", color: colors.black },
      { char: "·", color: colors.white },
    ],
    double: [{ char: "x", color: colors.white }],
    multiple: [{ char: "X", color: colors.white }],
  },
};

export const healHit: Sprite = {
  id: "heal_hit",
  name: "Heal",
  layers: [{ char: "+", color: colors.lime }],
};

export const repair: Sprite = {
  id: "repair",
  name: "Repair",
  layers: [
    { char: "\u0103", color: colors.silver },
    { char: "\u011c", color: colors.black },
    { char: "-", color: colors.silver },
  ],
};

export const drain: Sprite = {
  id: "drain",
  name: "Drain",
  layers: [
    { char: "\u0116", color: colors.purple },
    { char: "\u0111", color: colors.black },
    { char: "+", color: colors.purple },
    { char: "÷", color: colors.fuchsia },
  ],
};

export const bubble: Sprite = {
  id: "bubble",
  name: "water_bubble",
  terminal: {
    layers: [{ char: "∙", color: colors.blue }],
    amounts: {
      single: [{ char: "\u0106", color: colors.blue }],
      double: [{ char: "\u0108", color: colors.blue }],
      multiple: [{ char: "o", color: colors.blue }],
    },
  },
  layers: [{ char: "∙", color: colors.blue }],
  amounts: {
    single: [
      { char: "\u0106", color: colors.blue },
      { char: "∙", color: colors.navy },
    ],
    double: [{ char: "\u0108", color: colors.blue }],
    multiple: [
      { char: "o", color: colors.blue },
      { char: "w", color: colors.blue },
      { char: "■", color: colors.blue },
      { char: "\u0108", color: colors.navy },
      { char: "\u0106", color: colors.navy },
    ],
  },
};

export const rain: Sprite = {
  id: "rain",
  name: "rain_drop",
  layers: [{ char: "│", color: colors.blue }],
  amounts: {
    single: [{ char: "│", color: colors.blue }],
    double: [{ char: "│", color: colors.blue }],
    multiple: [{ char: "|", color: colors.blue }],
  },
};

export const fire: Sprite = {
  id: "fire",
  name: "Burn",
  terminal: {
    layers: [{ char: "\u010e", color: colors.red }],
    amounts: {
      single: [{ char: "+", color: colors.red }],
      double: [{ char: "*", color: colors.yellow }],
      multiple: [{ char: "\u010e", color: colors.red }],
    },
  },
  layers: [
    { char: "\u010e", color: colors.red },
    { char: "*", color: colors.yellow },
  ],
  amounts: {
    single: [
      { char: "+", color: colors.red },
      { char: "·", color: colors.yellow },
    ],
    double: [
      { char: "*", color: colors.red },
      { char: "+", color: colors.yellow },
    ],
    multiple: [
      { char: "\u010e", color: colors.red },
      { char: "*", color: colors.yellow },
      { char: "·", color: colors.red },
    ],
  },
};

export const crackle: Sprite = {
  id: "crackle",
  name: "fire_crackle",
  layers: [{ char: "·", color: colors.red }],
  amounts: {
    single: [{ char: "·", color: colors.red }],
    double: [{ char: "·", color: colors.yellow }],
    multiple: [
      { char: "∙", color: colors.red },
      { char: "·", color: colors.yellow },
    ],
  },
};

export const snowflake: Sprite = {
  id: "snowflake",
  name: "Snowflake",
  layers: [
    { char: "+", color: colors.silver },
    { char: "÷", color: colors.white },
    { char: "·", color: colors.black },
  ],
  amounts: {
    single: [
      { char: "+", color: colors.silver },
      { char: "÷", color: colors.white },
      { char: "·", color: colors.black },
    ],
    double: [
      { char: "*", color: colors.white },
      { char: ":", color: colors.white },
      { char: "+", color: colors.silver },
      { char: "÷", color: colors.black },
      { char: "·", color: colors.black },
    ],
    multiple: [
      { char: "\u010e", color: colors.white },
      { char: "+", color: colors.black },
      { char: ":", color: colors.silver },
      { char: "·", color: colors.white },
    ],
  },
};

export const snow: Sprite = {
  id: "snow",
  name: "Snow",
  layers: [
    { char: "\u0107", color: colors.grey },
    { char: "\u0109", color: colors.grey },
    { char: "▓", color: colors.black },
  ],
};

export const snowCover: Sprite = {
  id: "snow_cover",
  name: "Snow",
  layers: [{ char: "░", color: colors.white }],
};

export const freeze: Sprite = {
  id: "freeze",
  name: "Freeze",
  layers: [{ char: "░", color: colors.aqua }],
  amounts: {
    single: [{ char: "░", color: colors.aqua }],
    double: [{ char: "▒", color: colors.aqua }],
    multiple: [{ char: "▓", color: colors.aqua }],
  },
};

export const smokeThick: Sprite = {
  id: "smoke_thick",
  name: "smoke_thick",
  layers: [{ char: "~", color: colors.silver }],
  amounts: {
    single: [{ char: "~", color: colors.silver }],
    double: [{ char: "≈", color: colors.silver }],
    multiple: [
      { char: "≈", color: colors.silver },
      { char: "~", color: colors.silver },
    ],
  },
};

export const smokeLight: Sprite = {
  id: "smoke_light",
  name: "smoke_light",
  layers: [{ char: "~", color: colors.grey }],
  amounts: {
    single: [{ char: "~", color: colors.grey }],
    double: [{ char: "≈", color: colors.grey }],
    multiple: [
      { char: "≈", color: colors.grey },
      { char: "~", color: colors.grey },
    ],
  },
};

export const decay: Sprite = {
  id: "decay",
  name: "unit_decay",
  layers: [{ char: "▒", color: colors.black }],
};

export const vanishGrow0: Sprite = {
  id: "vanish_grow0",
  name: "vanish_grow_0",
  layers: [{ char: "·", color: colors.lime }],
};

export const vanishGrow1: Sprite = {
  id: "vanish_grow1",
  name: "vanish_grow_1",
  layers: [{ char: "∙", color: colors.lime }],
};

export const vanishGrow2: Sprite = {
  id: "vanish_grow2",
  name: "vanish_grow_2",
  layers: [{ char: "\u0106", color: colors.lime }],
};

export const vanishGrow3: Sprite = {
  id: "vanish_grow3",
  name: "vanish_grow_3",
  layers: [
    { char: "\u0106", color: colors.lime },
    { char: "\u0108", color: colors.lime },
  ],
};

export const vanishGrow4: Sprite = {
  id: "vanish_grow4",
  name: "vanish_grow_4",
  layers: [
    { char: "\u0100", color: colors.lime },
    { char: "\u0101", color: colors.lime },
  ],
};

export const vanishGrow5: Sprite = {
  id: "vanish_grow5",
  name: "vanish_grow_5",
  layers: [{ char: "█", color: colors.lime }],
};

export const vanishShrink0: Sprite = {
  id: "vanish_shrink0",
  name: "vanish_shrink_0",
  layers: [{ char: "▓", color: colors.lime }],
};

export const vanishShrink1: Sprite = {
  id: "vanish_shrink1",
  name: "vanish_shrink_1",
  layers: [{ char: "▒", color: colors.lime }],
};

export const vanishShrink2: Sprite = {
  id: "vanish_shrink2",
  name: "vanish_shrink_2",
  layers: [{ char: "░", color: colors.lime }],
};

export const vanishEvaporate: Sprite = {
  id: "vanish_evaporate",
  name: "vanish_evaporate",
  layers: [{ char: "║", color: colors.green }],
};

export const plantEvaporate: Sprite = {
  id: "plant_evaporate",
  name: "plant_evaporate",
  layers: [{ char: "│", color: colors.green }],
};

export const stoneEvaporate: Sprite = {
  id: "stone_evaporate",
  name: "stone_evaporate",
  layers: [{ char: "│", color: colors.grey }],
};

export const shotHit: Sprite = {
  id: "shot_hit",
  name: "shot_hit",
  layers: [
    { char: "'", color: colors.grey },
    { char: "`", color: colors.white },
  ],
};

export const woodShot2: Sprite = {
  id: "wood_shot2",
  name: "shot_wood_2",
  layers: [
    { char: "»", color: colors.grey },
    { char: "-", color: colors.maroon },
  ],
  facing: {
    up: [
      { char: "\u0117", color: colors.grey },
      { char: "+", color: colors.grey },
      { char: "|", color: colors.maroon },
    ],
    right: [
      { char: "»", color: colors.grey },
      { char: "-", color: colors.maroon },
    ],
    down: [
      { char: "\u0118", color: colors.grey },
      { char: "+", color: colors.grey },
      { char: "|", color: colors.maroon },
    ],
    left: [
      { char: "«", color: colors.grey },
      { char: "-", color: colors.maroon },
    ],
  },
};

export const auraEdge: Sprite = {
  id: "aura_edge",
  name: "spell_aura",
  layers: [],
  amounts: {
    single: [{ char: "·", color: colors.purple }],
    double: [{ char: "∙", color: colors.purple }],
    multiple: [{ char: "+", color: colors.purple }],
  },
};

export const menuDot: Sprite = {
  id: "menu_dot",
  name: "menu_dot",
  layers: [
    { char: ".", color: colors.grey },
    { char: ":", color: colors.black },
  ],
};

export const menuArrow: Sprite = {
  id: "menu_arrow",
  name: "menu_arrow",
  layers: [{ char: "\u0119", color: colors.white }],
};

export const tooltipFriendlyStart: Sprite = {
  id: "tooltip_friendly_start",
  name: "friendly_start",
  layers: [
    { char: "▐", color: colors.black },
    { char: "│", color: colors.green },
  ],
};

export const tooltipFriendlyEnd: Sprite = {
  id: "tooltip_friendly_end",
  name: "friendly_end",
  layers: [
    { char: "▌", color: colors.black },
    { char: "│", color: colors.green },
  ],
};

export const tooltipNeutralStart: Sprite = {
  id: "tooltip_neutral_start",
  name: "neutral_start",
  layers: [
    { char: "▐", color: colors.black },
    { char: "│", color: colors.silver },
  ],
};

export const tooltipNeutralEnd: Sprite = {
  id: "tooltip_neutral_end",
  name: "neutral_end",
  layers: [
    { char: "▌", color: colors.black },
    { char: "│", color: colors.silver },
  ],
};

export const tooltipHostileStart: Sprite = {
  id: "tooltip_hostile_start",
  name: "hostile_start",
  layers: [
    { char: "▐", color: colors.black },
    { char: "│", color: colors.maroon },
  ],
};

export const tooltipHostileEnd: Sprite = {
  id: "tooltip_hostile_end",
  name: "hostile_end",
  layers: [
    { char: "▌", color: colors.black },
    { char: "│", color: colors.maroon },
  ],
};

export const dialogStart: Sprite = {
  id: "dialog_start",
  name: "dialog_start",
  terminal: {
    layers: [
      { char: "█", color: colors.white },
      { char: "│", color: colors.black },
    ],
  },
  layers: [
    { char: "▐", color: colors.white },
    { char: "│", color: colors.black },
    { char: "║", color: colors.white },
  ],
};

export const dialogEnd: Sprite = {
  id: "dialog_end",
  name: "dialog_end",
  terminal: {
    layers: [
      { char: "█", color: colors.white },
      { char: "│", color: colors.black },
    ],
  },
  layers: [
    { char: "▌", color: colors.white },
    { char: "│", color: colors.black },
    { char: "║", color: colors.white },
  ],
};

export const shoutStart: Sprite = {
  id: "shout_start",
  name: "shout_start",
  terminal: {
    layers: [
      { char: "█", color: colors.red },
      { char: "│", color: colors.black },
    ],
  },
  layers: [
    { char: "▐", color: colors.red },
    { char: "│", color: colors.black },
    { char: "║", color: colors.red },
  ],
};

export const shoutEnd: Sprite = {
  id: "shout_end",
  name: "shout_end",
  terminal: {
    layers: [
      { char: "█", color: colors.red },
      { char: "│", color: colors.black },
    ],
  },
  layers: [
    { char: "▌", color: colors.red },
    { char: "│", color: colors.black },
    { char: "║", color: colors.red },
  ],
};

export const nextStart: Sprite = {
  id: "next_start",
  name: "next_start",
  layers: [
    { char: "▐", color: colors.lime },
    { char: "│", color: colors.green },
  ],
};

export const nextEnd: Sprite = {
  id: "next_end",
  name: "next_end",
  layers: [
    { char: "▌", color: colors.lime },
    { char: "│", color: colors.green },
  ],
};

export const tooltipLine: Sprite = {
  id: "tooltip_line",
  name: "tooltip_line",
  layers: [{ char: "─", color: colors.silver }],
  facing: {
    up: [{ char: "└", color: colors.silver }],
    down: [{ char: "┌", color: colors.silver }],
  },
};

export const enemyLine: Sprite = {
  id: "enemy_line",
  name: "tooltip_line",
  layers: [{ char: "─", color: colors.maroon }],
  facing: {
    up: [{ char: "└", color: colors.maroon }],
    down: [{ char: "┌", color: colors.maroon }],
  },
};

export const allyLine: Sprite = {
  id: "ally_line",
  name: "tooltip_line",
  layers: [{ char: "─", color: colors.green }],
  facing: {
    up: [{ char: "└", color: colors.green }],
    down: [{ char: "┌", color: colors.green }],
  },
};

export const bubbleUp: Sprite = {
  id: "bubble_up",
  name: "bubble_up",
  terminal: { layers: [{ char: "╙", color: colors.white }] },
  layers: [
    { char: "╙", color: colors.silver },
    { char: "-", color: colors.black },
    { char: "└", color: colors.white },
    { char: "·", color: colors.grey },
  ],
};

export const bubbleRight: Sprite = {
  id: "bubble_right",
  name: "bubble_right",
  terminal: { layers: [{ char: "╜", color: colors.white }] },
  layers: [
    { char: "╜", color: colors.silver },
    { char: "-", color: colors.black },
    { char: "┘", color: colors.white },
    { char: "·", color: colors.grey },
  ],
};

export const bubbleDown: Sprite = {
  id: "bubble_down",
  name: "bubble_down",
  terminal: { layers: [{ char: "╖", color: colors.white }] },
  layers: [
    { char: "╖", color: colors.silver },
    { char: "-", color: colors.black },
    { char: "┐", color: colors.white },
    { char: "·", color: colors.grey },
  ],
};

export const bubbleLeft: Sprite = {
  id: "bubble_left",
  name: "bubble_left",
  terminal: { layers: [{ char: "╓", color: colors.white }] },
  layers: [
    { char: "╓", color: colors.silver },
    { char: "-", color: colors.black },
    { char: "┌", color: colors.white },
    { char: "·", color: colors.grey },
  ],
};

export const shoutUp: Sprite = {
  id: "shout_up",
  name: "shout_up",
  terminal: { layers: [{ char: "╙", color: colors.red }] },
  layers: [
    { char: "╙", color: colors.maroon },
    { char: "-", color: colors.black },
    { char: "└", color: colors.red },
    { char: "·", color: colors.maroon },
  ],
};

export const shoutRight: Sprite = {
  id: "shout_right",
  name: "shout_right",
  terminal: { layers: [{ char: "╜", color: colors.red }] },
  layers: [
    { char: "╜", color: colors.maroon },
    { char: "-", color: colors.black },
    { char: "┘", color: colors.red },
    { char: "·", color: colors.maroon },
  ],
};

export const shoutDown: Sprite = {
  id: "shout_down",
  name: "shout_down",
  terminal: { layers: [{ char: "╖", color: colors.red }] },
  layers: [
    { char: "╖", color: colors.maroon },
    { char: "-", color: colors.black },
    { char: "┐", color: colors.red },
    { char: "·", color: colors.maroon },
  ],
};

export const shoutLeft: Sprite = {
  id: "shout_left",
  name: "shout_left",
  terminal: { layers: [{ char: "╓", color: colors.red }] },
  layers: [
    { char: "╓", color: colors.maroon },
    { char: "-", color: colors.black },
    { char: "┌", color: colors.red },
    { char: "·", color: colors.maroon },
  ],
};

export const keyboardOverlay: Sprite = {
  id: "keyboard_overlay",
  name: "keyboard_overlay",
  layers: [{ char: "█", color: colors.black }],
};

export const keyboardBorder: Sprite = {
  id: "keyboard_border",
  name: "keyboard_border",
  layers: [
    { char: "▄", color: colors.black },
    { char: "─", color: colors.silver },
  ],
};

export const upperKey: Sprite = {
  id: "upper_key",
  name: "upper_key",
  layers: [
    { char: "█", color: colors.lime },
    { char: "\u0117", color: colors.black },
    { char: "_", color: colors.black },
  ],
};

export const lowerKey: Sprite = {
  id: "lower_key",
  name: "lower_key",
  layers: [
    { char: "█", color: colors.lime },
    { char: "\u0118", color: colors.black },
  ],
};

export const deleteKey: Sprite = {
  id: "delete_key",
  name: "delete_key",
  layers: [
    { char: "█", color: colors.red },
    { char: "\u011a", color: colors.black },
  ],
};

export const lettersKey: Sprite = {
  id: "letters_key",
  name: "numbers_key",
  layers: [
    { char: "█", color: colors.lime },
    { char: "±", color: colors.black },
    { char: "■", color: colors.black },
    { char: "\u0108", color: colors.lime },
    { char: "\u0106", color: colors.lime },
    { char: "▀", color: colors.lime },
    { char: "-", color: colors.lime },
    { char: "=", color: colors.lime },
    { char: "ª", color: colors.black },
  ],
};

export const numbersKey: Sprite = {
  id: "numbers_key",
  name: "numbers_key",
  layers: [
    { char: "█", color: colors.lime },
    { char: "½", color: colors.black },
  ],
};

export const specialKey: Sprite = {
  id: "special_key",
  name: "special_key",
  layers: [
    { char: "█", color: colors.lime },
    { char: "#", color: colors.black },
  ],
};

export const keyLeft: Sprite = {
  id: "key_left",
  name: "key_left",
  layers: [
    { char: "▐", color: colors.white },
    { char: "│", color: colors.black },
    { char: "║", color: colors.grey },
    { char: "▌", color: colors.black },
  ],
};

export const keyGap: Sprite = {
  id: "key_gap",
  name: "key_gap",
  layers: [
    { char: "█", color: colors.white },
    { char: "│", color: colors.black },
    { char: "║", color: colors.grey },
  ],
};

export const keyRight: Sprite = {
  id: "key_right",
  name: "key_right",
  layers: [
    { char: "▌", color: colors.white },
    { char: "│", color: colors.black },
    { char: "║", color: colors.grey },
    { char: "▐", color: colors.black },
  ],
};

export const keySocketLeft: Sprite = {
  id: "key_socket_left",
  name: "key_socket_left",
  layers: [
    { char: "▐", color: colors.silver },
    { char: "│", color: colors.black },
    { char: "║", color: colors.grey },
    { char: "▌", color: colors.black },
    { char: "▄", color: colors.black },
  ],
};

export const keySocket: Sprite = {
  id: "key_socket",
  name: "key_socket",
  layers: [
    { char: "█", color: colors.silver },
    { char: "▄", color: colors.black },
  ],
};

export const keySocketGap: Sprite = {
  id: "key_socket_gap",
  name: "key_socket_gap",
  layers: [
    { char: "█", color: colors.silver },
    { char: "│", color: colors.black },
    { char: "║", color: colors.grey },
    { char: "▄", color: colors.black },
  ],
};

export const keySocketRight: Sprite = {
  id: "key_socket_right",
  name: "key_socket_right",
  layers: [
    { char: "▌", color: colors.silver },
    { char: "│", color: colors.black },
    { char: "║", color: colors.grey },
    { char: "▐", color: colors.black },
    { char: "▄", color: colors.black },
  ],
};

export const modifierLeft: Sprite = {
  id: "modifier_left",
  name: "modifier_left",
  layers: [
    { char: "▐", color: colors.lime },
    { char: "│", color: colors.black },
    { char: "║", color: colors.grey },
    { char: "▌", color: colors.black },
  ],
};

export const modifierGapLeft: Sprite = {
  id: "modifier_gap_left",
  name: "modifier_gap_left",
  layers: [
    { char: "▌", color: colors.lime },
    { char: "▐", color: colors.white },
    { char: "│", color: colors.black },
    { char: "║", color: colors.grey },
  ],
};

export const modifierGapRight: Sprite = {
  id: "modifier_gap_right",
  name: "modifier_gap_right",
  layers: [
    { char: "▌", color: colors.white },
    { char: "▐", color: colors.lime },
    { char: "│", color: colors.black },
    { char: "║", color: colors.grey },
  ],
};

export const modifierRight: Sprite = {
  id: "modifier_right",
  name: "modifier_right",
  layers: [
    { char: "▌", color: colors.lime },
    { char: "│", color: colors.black },
    { char: "║", color: colors.grey },
    { char: "▐", color: colors.black },
  ],
};

export const modifierSocketLeft: Sprite = {
  id: "modifier_socket_left",
  name: "modifier_socket_left",
  layers: [
    { char: "▐", color: colors.green },
    { char: "│", color: colors.black },
    { char: "║", color: colors.grey },
    { char: "▌", color: colors.black },
    { char: "▄", color: colors.black },
  ],
};

export const modifierSocketGapLeft: Sprite = {
  id: "modifier_socket_gap_left",
  name: "modifier_socket_gap_left",
  layers: [
    { char: "▌", color: colors.green },
    { char: "▐", color: colors.silver },
    { char: "│", color: colors.black },
    { char: "║", color: colors.grey },
    { char: "▄", color: colors.black },
  ],
};

export const modifierSocket: Sprite = {
  id: "modifier_socket",
  name: "modifier_socket",
  layers: [
    { char: "█", color: colors.green },
    { char: "▄", color: colors.black },
  ],
};

export const modifierSocketGapRight: Sprite = {
  id: "modifier_socket_gap_right",
  name: "modifier_socket_gap_right",
  layers: [
    { char: "▌", color: colors.silver },
    { char: "▐", color: colors.green },
    { char: "│", color: colors.black },
    { char: "║", color: colors.grey },
    { char: "▄", color: colors.black },
  ],
};

export const modifierSocketRight: Sprite = {
  id: "modifier_socket_right",
  name: "modifier_socket_right",
  layers: [
    { char: "▌", color: colors.green },
    { char: "│", color: colors.black },
    { char: "║", color: colors.grey },
    { char: "▐", color: colors.black },
    { char: "▄", color: colors.black },
  ],
};

export const deleteLeft: Sprite = {
  id: "delete_left",
  name: "delete_left",
  layers: [
    { char: "▐", color: colors.red },
    { char: "│", color: colors.black },
    { char: "║", color: colors.grey },
    { char: "▌", color: colors.black },
  ],
};

export const deleteGapLeft: Sprite = {
  id: "delete_gap_left",
  name: "delete_gap_left",
  layers: [
    { char: "▌", color: colors.red },
    { char: "▐", color: colors.white },
    { char: "│", color: colors.black },
    { char: "║", color: colors.grey },
  ],
};

export const deleteGapRight: Sprite = {
  id: "delete_gap_right",
  name: "delete_gap_right",
  layers: [
    { char: "▌", color: colors.white },
    { char: "▐", color: colors.red },
    { char: "│", color: colors.black },
    { char: "║", color: colors.grey },
  ],
};

export const deleteRight: Sprite = {
  id: "delete_right",
  name: "delete_right",
  layers: [
    { char: "▌", color: colors.red },
    { char: "│", color: colors.black },
    { char: "║", color: colors.grey },
    { char: "▐", color: colors.black },
  ],
};

export const deleteSocketLeft: Sprite = {
  id: "delete_socket_left",
  name: "delete_socket_left",
  layers: [
    { char: "▐", color: colors.maroon },
    { char: "│", color: colors.black },
    { char: "║", color: colors.grey },
    { char: "▌", color: colors.black },
    { char: "▄", color: colors.black },
  ],
};

export const deleteSocketGapLeft: Sprite = {
  id: "delete_socket_gap_left",
  name: "delete_socket_gap_left",
  layers: [
    { char: "▌", color: colors.maroon },
    { char: "▐", color: colors.silver },
    { char: "│", color: colors.black },
    { char: "║", color: colors.grey },
    { char: "▄", color: colors.black },
  ],
};

export const deleteSocket: Sprite = {
  id: "delete_socket",
  name: "delete_socket",
  layers: [
    { char: "█", color: colors.maroon },
    { char: "▄", color: colors.black },
  ],
};

export const deleteSocketGapRight: Sprite = {
  id: "delete_socket_gap_right",
  name: "delete_socket_gap_right",
  layers: [
    { char: "▌", color: colors.silver },
    { char: "▐", color: colors.maroon },
    { char: "│", color: colors.black },
    { char: "║", color: colors.grey },
    { char: "▄", color: colors.black },
  ],
};

export const deleteSocketRight: Sprite = {
  id: "delete_socket_right",
  name: "delete_socket_right",
  layers: [
    { char: "▌", color: colors.maroon },
    { char: "│", color: colors.black },
    { char: "║", color: colors.grey },
    { char: "▐", color: colors.black },
    { char: "▄", color: colors.black },
  ],
};

export const keyPressed: Sprite = {
  id: "key_pressed",
  name: "key_pressed",
  layers: [
    { char: "█", color: colors.white },
    { char: "▀", color: colors.grey },
  ],
};

export const keySocketPressed: Sprite = {
  id: "key_socket_pressed",
  name: "key_socket_pressed",
  layers: [
    { char: "█", color: colors.white },
    { char: "▄", color: colors.black },
  ],
};

export const modifierPressed: Sprite = {
  id: "modifier_pressed",
  name: "modifier_pressed",
  layers: [
    { char: "█", color: colors.lime },
    { char: "▀", color: colors.grey },
  ],
};

export const modifierSocketPressed: Sprite = {
  id: "modifier_socket_pressed",
  name: "modifier_socket_pressed",
  layers: [
    { char: "█", color: colors.lime },
    { char: "▄", color: colors.black },
  ],
};

export const deletePressed: Sprite = {
  id: "delete_pressed",
  name: "delete_pressed",
  layers: [
    { char: "█", color: colors.red },
    { char: "▀", color: colors.grey },
  ],
};

export const deleteSocketPressed: Sprite = {
  id: "delete_socket_pressed",
  name: "delete_socket_pressed",
  layers: [
    { char: "█", color: colors.red },
    { char: "▄", color: colors.black },
  ],
};

export const popupBackground: Sprite = {
  id: "popup_background",
  name: "popup_background",
  layers: [{ char: "█", color: colors.black }],
};

export const popupSegment: Sprite = {
  id: "popup_segment",
  name: "popup_segment",
  layers: [
    { char: "│", color: colors.silver },
    { char: "║", color: colors.black },
  ],
};

export const popupActive: Sprite = {
  id: "popup_active",
  name: "popup_active",
  terminal: {
    layers: [
      { char: "█", color: colors.lime },
      { char: ">", color: colors.black },
    ],
  },
  layers: [
    { char: "\u0107", color: colors.lime },
    { char: "\u0109", color: colors.lime },
    { char: "▀", color: colors.black },
    { char: "M", color: colors.lime },
    { char: "[", color: colors.lime },
    { char: "]", color: colors.lime },
    { char: ">", color: colors.black },
  ],
};

export const popupSelection: Sprite = {
  id: "popup_selection",
  name: "popup_selection",
  layers: [{ char: ">", color: colors.white }],
};

export const popupHint: Sprite = {
  id: "popup_hint",
  name: "popup_hint",
  layers: [],
  amounts: {
    single: [{ char: "\u0118", color: colors.silver }],
  },
};

export const popupOverlay: Sprite = {
  id: "popup_overlay",
  name: "popup_overlay",
  layers: [],
  facing: {
    up: [
      { char: "▒", color: colors.black },
      { char: "▀", color: colors.black },
    ],
    down: [
      { char: "▒", color: colors.black },
      { char: "▄", color: colors.black },
    ],
  },
};

export const popupBlocked: Sprite = {
  id: "popup_blocked",
  name: "popup_blocked",
  layers: [
    { char: ">", color: colors.red },
    { char: "▒", color: colors.black },
  ],
};

export const missing: Sprite = {
  id: "missing",
  name: "?????",
  layers: [
    { char: "M", color: colors.grey },
    { char: "[", color: colors.grey },
    { char: "]", color: colors.grey },
    { char: "\u0114", color: colors.grey },
    { char: "\u0110", color: colors.grey },
    { char: "¼", color: colors.grey },
    { char: "_", color: colors.black },
    { char: "?", color: colors.black },
  ],
};

export const convert: Sprite = {
  id: "convert",
  name: "Convert",
  layers: [
    { char: "\u0119", color: colors.white },
    { char: ">", color: colors.white },
  ],
};

export const blocked: Sprite = {
  id: "blocked",
  name: "Blocked",
  layers: [
    { char: "\u0100", color: colors.red },
    { char: "■", color: colors.black },
    { char: "/", color: colors.red },
  ],
};

export const quickCorner: Sprite = {
  id: "quick_corner",
  name: "quick_corner",
  layers: [{ char: "┼", color: colors.olive }],
  facing: {
    up: [{ char: "┌", color: colors.olive }],
    right: [{ char: "┐", color: colors.olive }],
    down: [{ char: "┘", color: colors.olive }],
    left: [{ char: "└", color: colors.olive }],
  },
};

export const quickSide: Sprite = {
  id: "quick_side",
  name: "quick_side",
  layers: [{ char: "┼", color: colors.olive }],
  facing: {
    up: [
      { char: "▄", color: colors.black },
      { char: "─", color: colors.olive },
    ],
    right: [
      { char: "▌", color: colors.black },
      { char: "│", color: colors.olive },
    ],
    down: [
      { char: "▀", color: colors.black },
      { char: "─", color: colors.olive },
    ],
    left: [
      { char: "▐", color: colors.black },
      { char: "│", color: colors.olive },
    ],
  },
};

export const quickSeparatorSelected: Sprite = {
  id: "quick_separator_selected",
  name: "quick_separator_selected",
  layers: [
    { char: "▌", color: colors.olive },
    { char: "│", color: colors.black },
    { char: "▀", color: colors.black },
    { char: "▐", color: colors.yellow },
  ],
  facing: {
    up: [{ char: "▐", color: colors.yellow }],
    right: [{ char: "▐", color: colors.yellow }],
    down: [
      { char: "▌", color: colors.yellow },
      { char: "│", color: colors.black },
      { char: "║", color: colors.black },
    ],
    left: [
      { char: "▄", color: colors.black },
      { char: "▌", color: colors.yellow },
      { char: "├", color: colors.olive },
      { char: "│", color: colors.yellow },
    ],
  },
};

export const quickCenterStart: Sprite = {
  id: "quick_center_start",
  name: "quick_center_start",
  layers: [
    { char: "▐", color: colors.black },
    { char: "├", color: colors.olive },
  ],
};

export const quickCenterEnd: Sprite = {
  id: "quick_center_end",
  name: "quick_center_end",
  layers: [
    { char: "▌", color: colors.black },
    { char: "┤", color: colors.olive },
  ],
};

export const popupCorner: Sprite = {
  id: "popup_corner",
  name: "popup_corner",
  layers: [{ char: "╬", color: colors.silver }],
  facing: {
    up: [
      { char: "┌", color: colors.black },
      { char: "╔", color: colors.silver },
    ],
    right: [
      { char: "┐", color: colors.black },
      { char: "╗", color: colors.silver },
    ],
    down: [
      { char: "┘", color: colors.black },
      { char: "╝", color: colors.silver },
    ],
    left: [
      { char: "└", color: colors.black },
      { char: "╚", color: colors.silver },
    ],
  },
};

export const popupSide: Sprite = {
  id: "popup_side",
  name: "popup_side",
  layers: [{ char: "╬", color: colors.silver }],
  facing: {
    up: [
      { char: "▄", color: colors.black },
      { char: "═", color: colors.silver },
    ],
    right: [
      { char: "▌", color: colors.black },
      { char: "│", color: colors.black },
      { char: "║", color: colors.silver },
    ],
    down: [
      { char: "▀", color: colors.black },
      { char: "═", color: colors.silver },
    ],
    left: [
      { char: "▐", color: colors.black },
      { char: "│", color: colors.black },
      { char: "║", color: colors.silver },
    ],
  },
};

export const popupSeparator: Sprite = {
  id: "popup_separator",
  name: "popup_separator",
  layers: [
    { char: "█", color: colors.grey },
    { char: "│", color: colors.black },
    { char: "║", color: colors.grey },
    { char: "▀", color: colors.black },
  ],
  facing: {
    up: [],
    right: [],
    down: [
      { char: "▌", color: colors.grey },
      { char: "▀", color: colors.black },
      { char: "│", color: colors.black },
      { char: "║", color: colors.black },
    ],
    left: [
      { char: "▄", color: colors.black },
      { char: "▌", color: colors.grey },
      { char: "▀", color: colors.black },
      { char: "╒", color: colors.silver },
      { char: "╛", color: colors.black },
      { char: "┐", color: colors.grey },
    ],
  },
};

export const popupSeparatorSelected: Sprite = {
  id: "popup_separator_selected",
  name: "popup_separator_selected",
  layers: [
    { char: "▌", color: colors.grey },
    { char: "│", color: colors.black },
    { char: "▀", color: colors.black },
    { char: "▐", color: colors.white },
  ],
  facing: {
    up: [{ char: "▐", color: colors.white }],
    right: [{ char: "▐", color: colors.white }],
    down: [
      { char: "▌", color: colors.white },
      { char: "│", color: colors.black },
      { char: "║", color: colors.black },
    ],
    left: [
      { char: "▄", color: colors.black },
      { char: "▌", color: colors.white },
      { char: "╞", color: colors.silver },
      { char: "│", color: colors.white },
    ],
  },
};

export const popupSeparatorInverted: Sprite = {
  id: "popup_separator_inverted",
  name: "popup_separator_inverted",
  layers: [
    { char: "▐", color: colors.grey },
    { char: "▀", color: colors.black },
    { char: "│", color: colors.black },
    { char: "▌", color: colors.white },
  ],
};

export const popupSeparatorDisabled: Sprite = {
  id: "popup_separator_disabled",
  name: "popup_separator_disabled",
  layers: [
    { char: "█", color: colors.grey },
    { char: "░", color: colors.black },
    { char: "│", color: colors.black },
    { char: "║", color: colors.grey },
    { char: "▀", color: colors.black },
  ],
  facing: {
    up: [
      { char: "▐", color: colors.grey },
      { char: "▀", color: colors.black },
      { char: "│", color: colors.black },
      { char: "░", color: colors.black },
    ],
    right: [
      { char: "▐", color: colors.grey },
      { char: "▀", color: colors.black },
      { char: "░", color: colors.black },
      { char: "│", color: colors.black },
    ],
    down: [
      { char: "▌", color: colors.grey },
      { char: "▀", color: colors.black },
      { char: "│", color: colors.black },
      { char: "║", color: colors.black },
      { char: "░", color: colors.black },
    ],
    left: [
      { char: "▄", color: colors.black },
      { char: "▌", color: colors.grey },
      { char: "▀", color: colors.black },
      { char: "╒", color: colors.silver },
      { char: "╛", color: colors.black },
      { char: "┐", color: colors.grey },
      { char: "░", color: colors.black },
    ],
  },
};

export const popupSeparatorSelectedDisabled: Sprite = {
  id: "popup_separator_selected_disabled",
  name: "popup_separator_selected_disabled",
  layers: [
    { char: "▌", color: colors.grey },
    { char: "░", color: colors.black },
    { char: "│", color: colors.black },
    { char: "▀", color: colors.black },
    { char: "▐", color: colors.white },
  ],
  facing: {
    up: [
      { char: "▐", color: colors.white },
      { char: "│", color: colors.black },
    ],
    right: [
      { char: "▐", color: colors.white },
      { char: "│", color: colors.black },
    ],
    down: [
      { char: "▌", color: colors.white },
      { char: "│", color: colors.black },
      { char: "║", color: colors.black },
    ],
    left: [
      { char: "▄", color: colors.black },
      { char: "▌", color: colors.white },
      { char: "╞", color: colors.silver },
      { char: "│", color: colors.white },
    ],
  },
};

export const popupSeparatorInvertedDisabled: Sprite = {
  id: "popup_separator_inverted_disabled",
  name: "popup_separator_inverted_disabled",
  layers: [
    { char: "▐", color: colors.grey },
    { char: "▀", color: colors.black },
    { char: "░", color: colors.black },
    { char: "│", color: colors.black },
    { char: "▌", color: colors.white },
  ],
};

export const popupCenterStart: Sprite = {
  id: "popup_center_start",
  name: "popup_center_start",
  layers: [
    { char: "▐", color: colors.black },
    { char: "╟", color: colors.silver },
  ],
};

export const popupCenter: Sprite = {
  id: "popup_center",
  name: "popup_center",
  layers: [
    { char: "█", color: colors.black },
    { char: "─", color: colors.silver },
  ],
};

export const popupCenterCrop: Sprite = {
  id: "popup_center_crop",
  name: "popup_center_crop",
  terminal: { layers: [] },
  layers: [
    { char: "▄", color: colors.black },
    { char: "─", color: colors.silver },
  ],
};

export const popupCenterEnd: Sprite = {
  id: "popup_center_end",
  name: "popup_center_end",
  layers: [
    { char: "▌", color: colors.black },
    { char: "│", color: colors.black },
    { char: "╢", color: colors.silver },
  ],
};

export const popupDownStart: Sprite = {
  id: "popup_down_start",
  name: "popup_down_start",
  layers: [
    { char: "▀", color: colors.black },
    { char: "▐", color: colors.black },
    { char: "╡", color: colors.silver },
  ],
};

export const popupDownEnd: Sprite = {
  id: "popup_down_end",
  name: "popup_down_end",
  layers: [
    { char: "▀", color: colors.black },
    { char: "▌", color: colors.black },
    { char: "╞", color: colors.silver },
  ],
};

export const craftCenterTop: Sprite = {
  id: "craft_center_top",
  name: "craft_center_top",
  layers: [{ char: "═", color: colors.silver }],
  facing: {
    down: [
      { char: "▄", color: colors.black },
      { char: "╤", color: colors.grey },
      { char: "▒", color: colors.black },
      { char: "╦", color: colors.black },
      { char: "═", color: colors.silver },
    ],
    right: [
      { char: "▄", color: colors.black },
      { char: "╤", color: colors.white },
      { char: "╦", color: colors.black },
      { char: "═", color: colors.silver },
    ],
  },
};

export const craftLeft: Sprite = {
  id: "craft_left",
  name: "craft_left",
  layers: [
    { char: "│", color: colors.grey },
    { char: "▒", color: colors.black },
    { char: "║", color: colors.black },
  ],
};

export const craftLeftActive: Sprite = {
  id: "craft_left_active",
  name: "craft_left_active",
  layers: [
    { char: "│", color: colors.white },
    { char: "║", color: colors.black },
  ],
};

export const craftDownLeft: Sprite = {
  id: "craft_down_left",
  name: "craft_down_left",
  layers: [
    { char: "└", color: colors.grey },
    { char: "▒", color: colors.black },
    { char: "▌", color: colors.black },
  ],
};

export const craftDownLeftActive: Sprite = {
  id: "craft_down_left_active",
  name: "craft_down_left_active",
  layers: [
    { char: "└", color: colors.white },
    { char: "▌", color: colors.black },
  ],
};

export const craftDown: Sprite = {
  id: "craft_down",
  name: "craft_down",
  layers: [
    { char: "─", color: colors.grey },
    { char: "▒", color: colors.black },
  ],
};

export const craftDownActive: Sprite = {
  id: "craft_down_active",
  name: "craft_down_active",
  layers: [{ char: "─", color: colors.white }],
};

export const buildCenterTop: Sprite = {
  id: "build_center_top",
  name: "build_center_top",
  layers: [{ char: "─", color: colors.olive }],
  facing: {
    down: [
      { char: "▄", color: colors.black },
      { char: "┬", color: colors.olive },
      { char: "▒", color: colors.black },
      { char: "╦", color: colors.black },
      { char: "─", color: colors.olive },
    ],
    right: [
      { char: "▄", color: colors.black },
      { char: "┬", color: colors.yellow },
      { char: "╦", color: colors.black },
      { char: "─", color: colors.olive },
    ],
  },
};

export const buildLeft: Sprite = {
  id: "build_left",
  name: "build_left",
  layers: [
    { char: "│", color: colors.olive },
    { char: "▒", color: colors.black },
    { char: "║", color: colors.black },
  ],
};

export const buildLeftActive: Sprite = {
  id: "build_left_active",
  name: "build_left_active",
  layers: [
    { char: "│", color: colors.yellow },
    { char: "║", color: colors.black },
  ],
};

export const buildDownLeft: Sprite = {
  id: "build_down_left",
  name: "build_down_left",
  layers: [
    { char: "└", color: colors.olive },
    { char: "▒", color: colors.black },
    { char: "▌", color: colors.black },
  ],
};

export const buildDownLeftActive: Sprite = {
  id: "build_down_left_active",
  name: "build_down_left_active",
  layers: [
    { char: "└", color: colors.yellow },
    { char: "▌", color: colors.black },
  ],
};

export const buildDown: Sprite = {
  id: "build_down",
  name: "build_down",
  layers: [
    { char: "─", color: colors.olive },
    { char: "▒", color: colors.black },
  ],
};

export const buildDownActive: Sprite = {
  id: "build_down_active",
  name: "build_down_active",
  layers: [{ char: "─", color: colors.yellow }],
};

export const scrollBarTop: Sprite = {
  id: "scroll_bar_top",
  name: "scroll_top",
  layers: [
    { char: "█", color: colors.silver },
    { char: "\u011d", color: colors.black },
  ],
};

export const scrollBar: Sprite = {
  id: "scroll_bar",
  name: "scroll_bar",
  layers: [
    { char: "█", color: colors.silver },
    { char: "░", color: colors.black },
  ],
};

export const scrollBarBottom: Sprite = {
  id: "scroll_bar_bottom",
  name: "scroll_bottom",
  layers: [
    { char: "█", color: colors.silver },
    { char: "\u011e", color: colors.black },
  ],
};

export const scrollHandle: Sprite = {
  id: "scroll_handle",
  name: "scroll_handle",
  layers: [{ char: "█", color: colors.white }],
  facing: {
    up: [
      { char: "█", color: colors.silver },
      { char: "░", color: colors.black },
      { char: "▀", color: colors.white },
    ],
    down: [
      { char: "█", color: colors.silver },
      { char: "░", color: colors.black },
      { char: "▄", color: colors.white },
    ],
  },
};

export const forgeHammer: Sprite = {
  id: "forge_hammer",
  name: "forge_hammer",
  terminal: { layers: [{ char: "█", color: colors.grey }] },
  layers: [
    { char: "∞", color: colors.maroon },
    { char: "\u0106", color: colors.maroon },
    { char: "∟", color: colors.black },
    { char: "¬", color: colors.maroon },
    { char: "\u0115", color: colors.black },
    { char: "\u0104", color: colors.maroon },
    { char: "I", color: colors.black },
    { char: "!", color: colors.black },
    { char: "+", color: colors.maroon },
    { char: ":", color: colors.black },
    { char: "═", color: colors.black },
    { char: "─", color: colors.maroon },
    { char: "▐", color: colors.grey },
    { char: "║", color: colors.grey },
  ],
};

export const forgeHandle: Sprite = {
  id: "forge_handle",
  name: "forge_handle",
  terminal: { layers: [{ char: "═", color: colors.maroon }] },
  layers: [
    { char: "∞", color: colors.maroon },
    { char: "\u0106", color: colors.maroon },
    { char: "∟", color: colors.black },
    { char: "¬", color: colors.maroon },
    { char: "\u0115", color: colors.black },
    { char: "\u0104", color: colors.maroon },
    { char: "I", color: colors.black },
    { char: "!", color: colors.black },
    { char: "+", color: colors.maroon },
    { char: ":", color: colors.black },
    { char: "═", color: colors.black },
    { char: "─", color: colors.maroon },
  ],
};

export const forgeHit: Sprite = {
  id: "forge_hit",
  name: "forge_hit",
  layers: [{ char: "_", color: colors.lime }],
};

export const forgeMiss: Sprite = {
  id: "forge_miss",
  name: "forge_miss",
  layers: [
    { char: "_", color: colors.red },
    { char: "▒", color: colors.black },
  ],
};

export const thickLine: Sprite = {
  id: "thick_line",
  name: "thick_line",
  layers: [
    { char: "∞", color: colors.red },
    { char: "\u0106", color: colors.red },
    { char: "∟", color: colors.grey },
    { char: "\u0115", color: colors.grey },
    { char: "\u0104", color: colors.red },
    { char: "I", color: colors.grey },
    { char: "!", color: colors.grey },
    { char: "+", color: colors.red },
    { char: ":", color: colors.grey },
    { char: "═", color: colors.grey },
    { char: "─", color: colors.red },
    { char: "▀", color: colors.black },
  ],
};

export const emptySlot: Sprite = {
  id: "empty_slot",
  name: "Slot",
  terminal: { layers: [{ char: "█", color: colors.grey }] },
  layers: [
    { char: "M", color: colors.grey },
    { char: "[", color: colors.grey },
    { char: "]", color: colors.grey },
    { char: "\u0114", color: colors.grey },
    { char: "\u0110", color: colors.grey },
    { char: "¼", color: colors.grey },
    { char: "_", color: colors.black },
  ],
};

export const interactLeft: Sprite = {
  id: "interact_left",
  name: "interact_left",
  terminal: {
    layers: [
      { char: "█", color: colors.lime },
      { char: "[", color: colors.black },
    ],
  },
  layers: [
    { char: "▌", color: colors.black },
    { char: "│", color: colors.green },
  ],
};
export const interactRight: Sprite = {
  id: "interact_right",
  name: "interact_left",
  terminal: {
    layers: [
      { char: "█", color: colors.lime },
      { char: "]", color: colors.black },
    ],
  },
  layers: [
    { char: "▐", color: colors.black },
    { char: "│", color: colors.green },
  ],
};
export const interactBar: Sprite = {
  id: "interact_bar",
  name: "interact_bar",
  layers: [{ char: "┼", color: colors.green }],
  facing: {
    up: [{ char: "│", color: colors.green }],
    right: [{ char: "─", color: colors.green }],
    down: [{ char: "│", color: colors.green }],
    left: [{ char: "─", color: colors.green }],
  },
};

export const brewItem: Sprite = {
  id: "brew_item",
  name: "brew_item",
  layers: [
    { char: "∙", color: colors.navy },
    { char: "·", color: colors.white },
  ],
};

export const questPointer: Sprite = {
  id: "quest_pointer",
  name: "quest_pointer",
  layers: [],
  facing: {
    up: [{ char: "\u0117", color: colors.lime }],
    right: [{ char: "\u0119", color: colors.lime }],
    down: [{ char: "\u0118", color: colors.lime }],
    left: [{ char: "\u011a", color: colors.lime }],
  },
};

export const tombstonePointer: Sprite = {
  id: "tombstone_pointer",
  name: "tombstone_pointer",
  layers: [],
  facing: {
    up: [{ char: "\u0117", color: colors.silver }],
    right: [{ char: "\u0119", color: colors.silver }],
    down: [{ char: "\u0118", color: colors.silver }],
    left: [{ char: "\u011a", color: colors.silver }],
  },
};

export const enemyPointer: Sprite = {
  id: "enemy_pointer",
  name: "enemy_pointer",
  layers: [],
  facing: {
    up: [{ char: "\u0117", color: colors.red }],
    right: [{ char: "\u0119", color: colors.red }],
    down: [{ char: "\u0118", color: colors.red }],
    left: [{ char: "\u011a", color: colors.red }],
  },
};

export const xpDot: Sprite = {
  id: "xp_dot",
  name: "xp_dot",
  terminal: { layers: [{ char: "·", color: colors.lime }] },
  layers: [{ char: "·", color: colors.lime }],
};

export const vortexDot: Sprite = {
  id: "vortex_dot",
  name: "vortex_dot",
  layers: [
    { char: "∙", color: colors.white },
    { char: "\u011c", color: colors.black },
  ],
  amounts: {
    single: [
      { char: "∙", color: colors.yellow },
      { char: "\u011c", color: colors.black },
    ],
    double: [
      { char: "∙", color: colors.lime },
      { char: "\u011c", color: colors.black },
    ],
    multiple: [
      { char: "∙", color: colors.red },
      { char: "\u011c", color: colors.black },
    ],
  },
};

export const fountainDrop: Sprite = {
  id: "fountain_drop",
  name: "fountain_drop",
  terminal: {
    layers: [{ char: "|", color: colors.blue }],
    facing: { up: [{ char: "┬", color: colors.blue }] },
    amounts: {
      single: [{ char: ":", color: colors.blue }],
      double: [{ char: ".", color: colors.blue }],
      multiple: [{ char: ",", color: colors.blue }],
    },
  },
  layers: [{ char: "|", color: colors.blue }],
  amounts: {
    single: [{ char: "∙", color: colors.blue }],
    double: [{ char: ".", color: colors.blue }],
    multiple: [{ char: ":", color: colors.blue }],
  },
};

export const fountainHeal: Sprite = {
  id: "fountain_heal",
  name: "fountain_heal",
  terminal: {
    layers: [{ char: "|", color: colors.lime }],
    facing: { up: [{ char: "┬", color: colors.lime }] },
    amounts: {
      single: [{ char: ":", color: colors.lime }],
      double: [{ char: ".", color: colors.lime }],
      multiple: [{ char: ",", color: colors.lime }],
    },
  },
  layers: [{ char: "|", color: colors.lime }],
  amounts: {
    single: [{ char: "∙", color: colors.lime }],
    double: [{ char: ".", color: colors.lime }],
    multiple: [{ char: ":", color: colors.lime }],
  },
};

export const levelProgress: Sprite = {
  id: "level_progress",
  name: "level_progress",
  layers: [],
  facing: {
    up: [{ char: "║", color: colors.lime }],
    right: [{ char: "═", color: colors.lime }],
    down: [{ char: "║", color: colors.lime }],
    left: [{ char: "═", color: colors.lime }],
  },
};

export const joystick: Sprite = {
  id: "joystick",
  name: "joystick",
  layers: [
    { char: "■", color: colors.white },
    { char: "+", color: colors.grey },
    { char: "÷", color: colors.white },
    { char: "·", color: colors.grey },
  ],
};

export const pause: Sprite = {
  id: "pause",
  name: "Pause",
  layers: [
    { char: "■", color: colors.red },
    { char: "|", color: colors.black },
  ],
};

export const pauseInvert: Sprite = {
  id: "pause_invert",
  name: "Pause",
  layers: [
    { char: "█", color: colors.white },
    { char: "■", color: colors.black },
    { char: "|", color: colors.white },
  ],
};

export const pauseInvertPressed: Sprite = {
  id: "pause_invert_pressed",
  name: "Pause",
  layers: [
    { char: "█", color: colors.grey },
    { char: "■", color: colors.black },
    { char: "|", color: colors.grey },
  ],
};

export const resume: Sprite = {
  id: "resume",
  name: "Resume",
  layers: [{ char: "»", color: colors.white }],
};

export const resumeInvert: Sprite = {
  id: "resume_invert",
  name: "Resume",
  layers: [
    { char: "█", color: colors.white },
    { char: "»", color: colors.black },
  ],
};

export const resumeInvertPressed: Sprite = {
  id: "resume_invert_pressed",
  name: "Resume",
  layers: [
    { char: "█", color: colors.grey },
    { char: "»", color: colors.black },
  ],
};

export const inspect: Sprite = {
  id: "inspect",
  name: "Inspect",
  layers: [{ char: "?", color: colors.white }],
};

export const spawn: Sprite = {
  id: "spawn",
  name: "Map",
  layers: [
    { char: "\u010b", color: colors.green },
    { char: "°", color: colors.lime },
  ],
};

export const chatDiscovery: Sprite = {
  id: "chat_discovery",
  name: "Chat",
  layers: [
    { char: "µ", color: colors.lime },
    { char: "o", color: colors.lime },
    { char: "+", color: colors.lime },
    { char: ".", color: colors.lime },
  ],
};

export const caret: Sprite = {
  id: "caret",
  name: "Caret",
  terminal: { layers: [{ char: "▬", color: colors.white }] },
  layers: [
    { char: "\u0107", color: colors.white },
    { char: "\u0100", color: colors.black },
    { char: "\u0101", color: colors.black },
    { char: "M", color: colors.black },
    { char: "▀", color: colors.black },
  ],
};

export const soundNotes: Sprite = {
  id: "sound_notes",
  name: "Sound",
  layers: [{ char: "\u010d", color: colors.green }],
};

export const mapDiscovery: Sprite = {
  id: "map_discovery",
  name: "Map",
  terminal: { layers: [{ char: "#", color: colors.lime }] },
  layers: [
    { char: "■", color: colors.green },
    { char: "≡", color: colors.lime },
    { char: "-", color: colors.black },
    { char: "+", color: colors.green },
    { char: "·", color: colors.lime },
  ],
};

export const mapHouse: Sprite = {
  id: "map_house",
  name: "House",
  layers: [
    { char: "█", color: colors.black },
    { char: "\u011d", color: colors.maroon },
    { char: "\u011f", color: colors.maroon },
    { char: "\u0115", color: colors.grey },
    { char: "-", color: colors.maroon },
    { char: ".", color: colors.maroon },
  ],
};

export const mapFortress: Sprite = {
  id: "map_fortress",
  name: "Fort",
  layers: [
    { char: "█", color: colors.black },
    { char: "\u011d", color: colors.silver },
    { char: "\u011f", color: colors.silver },
    { char: "\u0115", color: colors.grey },
    { char: "-", color: colors.silver },
    { char: ".", color: colors.silver },
  ],
};

export const mapSpawn: Sprite = {
  id: "map_spawn",
  name: "House",
  layers: [
    { char: "█", color: colors.black },
    { char: "*", color: colors.lime },
  ],
};

export const mapPlayer: Sprite = {
  id: "map_player",
  name: "Map",
  layers: [{ char: "\u010b", color: colors.lime }],
};

export const mapNomad: Sprite = {
  id: "map_nomad",
  name: "Map",
  layers: [
    { char: "█", color: colors.black },
    { char: "\u010b", color: colors.silver },
    { char: "'", color: colors.red },
  ],
};

export const mapZoom1: Sprite = {
  id: "map_zoom1",
  name: "Map",
  layers: [{ char: "∙", color: colors.grey }],
};

export const mapZoom2: Sprite = {
  id: "map_zoom2",
  name: "Map",
  layers: [
    { char: "≡", color: colors.grey },
    { char: "-", color: colors.black },
    { char: "║", color: colors.black },
    { char: "b", color: colors.black },
  ],
};

export const mapZoom3: Sprite = {
  id: "map_zoom3",
  name: "Map",
  layers: [
    { char: "*", color: colors.grey },
    { char: "▀", color: colors.black },
    { char: "\u0115", color: colors.black },
    { char: "≡", color: colors.grey },
    { char: "_", color: colors.grey },
    { char: "▒", color: colors.black },
  ],
};

export const mapZoom4: Sprite = {
  id: "map_zoom4",
  name: "Map",
  layers: [
    { char: "\u0107", color: colors.grey },
    { char: "▀", color: colors.black },
    { char: "\u0100", color: colors.grey },
    { char: "\u0101", color: colors.grey },
    { char: "▓", color: colors.black },
  ],
};

export const close: Sprite = {
  id: "close",
  name: "Close",
  layers: [
    { char: "█", color: colors.red },
    { char: "*", color: colors.black },
    { char: "─", color: colors.red },
    { char: "·", color: colors.black },
  ],
};

export const backdrop: Sprite = {
  id: "backdrop",
  name: "Backdrop",
  layers: [{ char: "▓", color: colors.black }],
};

export const swirl: Sprite = {
  id: "swirl",
  name: "Swirl",
  layers: [
    { char: "≈", color: colors.grey },
    { char: "▀", color: colors.black },
  ],
};

export const times: Sprite = {
  id: "times",
  name: "Times",
  terminal: { layers: [{ char: "*", color: colors.white }] },
  layers: [
    { char: "*", color: colors.white },
    { char: "─", color: colors.black },
    { char: "·", color: colors.white },
  ],
};

export const star: Sprite = {
  id: "star",
  name: "Star",
  layers: [{ char: "*", color: colors.white }],
};

export const plusBox: Sprite = {
  id: "plus_box",
  name: "Plus",
  layers: [
    { char: "M", color: colors.white },
    { char: "[", color: colors.white },
    { char: "]", color: colors.white },
    { char: "+", color: colors.black },
  ],
};

export const ninePlus: Sprite = {
  id: "nine_plus",
  name: "9+",
  layers: [
    { char: "9", color: colors.grey },
    { char: "+", color: colors.silver },
  ],
};

export const ninePlusAmmo: Sprite = {
  id: "nine_plus_ammo",
  name: "9+",
  layers: [
    { char: "9", color: colors.silver },
    { char: "+", color: colors.white },
  ],
};

export const ninePlusMana: Sprite = {
  id: "nine_plus_mana",
  name: "9+",
  layers: [
    { char: "9", color: colors.blue },
    { char: "+", color: colors.teal },
  ],
};

export const scroll: Sprite = {
  id: "scroll",
  name: "scroll",
  layers: [
    { char: "\u0117", color: colors.silver },
    { char: "\u0118", color: colors.silver },
    { char: "+", color: colors.black },
    { char: "÷", color: colors.silver },
    { char: "-", color: colors.black },
    { char: "=", color: colors.black },
  ],
};

export const double: Sprite = {
  id: "double",
  name: "Double",
  layers: [
    { char: "<", color: colors.red },
    { char: ">", color: colors.red },
    { char: "▀", color: colors.black },
    { char: "±", color: colors.black },
    { char: "-", color: colors.black },
    { char: ".", color: colors.black },
    { char: "²", color: colors.silver },
  ],
};

export const weaponSlot: Sprite = {
  id: "weapon_slot",
  name: "Weapon",
  terminal: {
    layers: [
      { char: "█", color: colors.grey },
      { char: "/", color: colors.black },
    ],
  },
  layers: [
    { char: "*", color: colors.black },
    { char: "\u0100", color: colors.grey },
    { char: "-", color: colors.grey },
    { char: "∙", color: colors.black },
  ],
};

export const offhandSlot: Sprite = {
  id: "offhand_slot",
  name: "Offhand",
  terminal: {
    layers: [
      { char: "█", color: colors.grey },
      { char: "¬", color: colors.black },
    ],
  },
  layers: [{ char: "¬", color: colors.black }],
};

export const bootsSlot: Sprite = {
  id: "boots_slot",
  name: "Boots",
  terminal: {
    layers: [
      { char: "█", color: colors.grey },
      { char: '"', color: colors.black },
    ],
  },
  layers: [
    { char: "\u0116", color: colors.black },
    { char: "\u0111", color: colors.grey },
    { char: "¡", color: colors.black },
    { char: "|", color: colors.grey },
  ],
};

export const spellSlot: Sprite = {
  id: "spell_slot",
  name: "Spell",
  terminal: {
    layers: [
      { char: "█", color: colors.grey },
      { char: "+", color: colors.black },
    ],
  },
  layers: [{ char: "+", color: colors.black }],
};

export const skillSlot: Sprite = {
  id: "skill_slot",
  name: "Skill",
  terminal: {
    layers: [
      { char: "█", color: colors.grey },
      { char: "»", color: colors.black },
    ],
  },
  layers: [{ char: "»", color: colors.black }],
};

export const toolSlot: Sprite = {
  id: "tool_slot",
  name: "Tool",
  terminal: {
    layers: [
      { char: "█", color: colors.grey },
      { char: "↑", color: colors.black },
    ],
  },
  layers: [
    { char: "\u0106", color: colors.black },
    { char: "∙", color: colors.grey },
  ],
};

export const ringSlot: Sprite = {
  id: "ring_slot",
  name: "Ring",
  terminal: {
    layers: [
      { char: "█", color: colors.grey },
      { char: "ô", color: colors.black },
    ],
  },
  layers: [
    { char: "|", color: colors.black },
    { char: ".", color: colors.grey },
    { char: "~", color: colors.grey },
    { char: "\u0108", color: colors.black },
    { char: "\u0106", color: colors.grey },
  ],
};

export const amuletSlot: Sprite = {
  id: "amulet_slot",
  name: "Amulet",
  terminal: {
    layers: [
      { char: "█", color: colors.grey },
      { char: "♦", color: colors.black },
    ],
  },
  layers: [
    { char: "t", color: colors.black },
    { char: "\u0112", color: colors.grey },
    { char: "U", color: colors.grey },
    { char: "\u0115", color: colors.grey },
    { char: "\u0103", color: colors.black },
  ],
};

export const compassSlot: Sprite = {
  id: "compass_slot",
  name: "Compass",
  terminal: {
    layers: [
      { char: "█", color: colors.grey },
      { char: "↕", color: colors.black },
    ],
  },
  layers: [
    { char: "\u0108", color: colors.black },
    { char: "ª", color: colors.grey },
    { char: "≡", color: colors.grey },
    { char: "\u0117", color: colors.black },
    { char: "+", color: colors.black },
    { char: "\u0106", color: colors.grey },
    { char: "|", color: colors.black },
  ],
};

export const torchSlot: Sprite = {
  id: "torch_slot",
  name: "Torch",
  terminal: {
    layers: [
      { char: "█", color: colors.grey },
      { char: "î", color: colors.black },
    ],
  },
  layers: [
    { char: "┐", color: colors.black },
    { char: "-", color: colors.grey },
    { char: "*", color: colors.black },
    { char: "∙", color: colors.grey },
  ],
};

export const mapSlot: Sprite = {
  id: "map_slot",
  name: "Map",
  terminal: {
    layers: [
      { char: "█", color: colors.grey },
      { char: "#", color: colors.black },
    ],
  },
  layers: [
    { char: "■", color: colors.black },
    { char: "≡", color: colors.black },
    { char: "-", color: colors.grey },
    { char: "+", color: colors.black },
    { char: "·", color: colors.grey },
  ],
};

export const friendlyBar: Sprite = {
  id: "friendly_bar",
  name: "Friendly",
  layers: [{ char: "_", color: colors.lime }],
};

export const neutralBar: Sprite = {
  id: "neutral_bar",
  name: "Friendly",
  layers: [{ char: "_", color: colors.silver }],
};

export const hostileBar: Sprite = {
  id: "hostile_bar",
  name: "Hostile",
  layers: [{ char: "_", color: colors.red }],
};

export const warnOn: Sprite = {
  id: "warn_on",
  name: "warn_on",
  layers: [
    { char: "\u0101", color: colors.black },
    { char: "\u0100", color: colors.red },
    { char: "\u0106", color: colors.black },
    { char: "I", color: colors.black },
    { char: "!", color: colors.red },
  ],
};

export const warnOff: Sprite = {
  id: "warn_off",
  name: "warn_off",
  layers: [
    { char: "\u0101", color: colors.black },
    { char: "\u0100", color: colors.red },
    { char: "\u0106", color: colors.black },
    { char: "■", color: colors.black },
  ],
};
export const shadow: Sprite = {
  id: "shadow",
  name: "",
  layers: [
    { char: "\u0100", color: colors.black },
    { char: "\u0101", color: colors.black },
  ],
};

export const spawnerPulse: Sprite = {
  id: "spawner_pulse",
  name: "spawn_pulse",
  layers: [{ char: "∙", color: colors.maroon }],
  terminal: { layers: [] },
};
