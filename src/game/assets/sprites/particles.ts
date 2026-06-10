import { colors } from "../colors";
import { Sprite } from "../../../engine/components/sprite";

export const none: Sprite = {
  name: "",
  layers: [],
};

export const blockDown: Sprite = {
  name: "block_down",
  layers: [{ char: "▄", color: colors.maroon }],
};

export const blockDownActive: Sprite = {
  name: "block_down",
  layers: [{ char: "▄", color: colors.red }],
};

export const blockUp: Sprite = {
  name: "block_up",
  layers: [{ char: "▀", color: colors.maroon }],
};

export const blockUpActive: Sprite = {
  name: "block_up",
  layers: [{ char: "▀", color: colors.red }],
};

export const keyHole: Sprite = {
  name: "key_hole",
  layers: [
    { char: "\u0106", color: colors.black },
    { char: ".", color: colors.black },
  ],
};

export const barrierSide: Sprite = {
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
  name: "water_frozen",
  layers: [{ char: "▓", color: colors.aqua }],
};

export const absorb: Sprite = {
  name: "Absorb",
  layers: [
    { char: "\u0100", color: colors.yellow },
    { char: "■", color: colors.black },
    { char: "┼", color: colors.black },
  ],
};

export const meleeHit: Sprite = {
  name: "Melee",
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
  name: "Magic",
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
  name: "Zap",
  layers: [],
  amounts: {
    single: [{ char: ":", color: colors.yellow }],
  },
};

export const zapSwordParticle: Sprite = {
  name: "Zap",
  layers: [],
  amounts: {
    single: [{ char: "%", color: colors.yellow }],
  },
};

export const lightningSide: Sprite = {
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
  name: "Stats",
  layers: [{ char: "₧", color: colors.green }],
};

export const aura: Sprite = {
  name: "Aura",
  layers: [
    { char: "±", color: colors.fuchsia },
    { char: "\u0115", color: colors.black },
    { char: "+", color: colors.purple },
  ],
};

export const range: Sprite = {
  name: "Range",
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
  name: "Delay",
  layers: [
    { char: "\u0100", color: colors.olive },
    { char: "■", color: colors.black },
    { char: "└", color: colors.yellow },
    { char: "·", color: colors.olive },
  ],
};

export const time: Sprite = {
  name: "Time",
  layers: [
    { char: "\u0101", color: colors.purple },
    { char: "\u0100", color: colors.black },
    { char: "■", color: colors.purple },
    { char: "└", color: colors.fuchsia },
  ],
};

export const trueHit: Sprite = {
  name: "True",
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
  name: "Heal",
  layers: [{ char: "+", color: colors.lime }],
};

export const repair: Sprite = {
  name: "Repair",
  layers: [
    { char: "\u0103", color: colors.silver },
    { char: "\u011c", color: colors.black },
    { char: "-", color: colors.silver },
  ],
};

export const drain: Sprite = {
  name: "Drain",
  layers: [
    { char: "\u0116", color: colors.purple },
    { char: "\u0111", color: colors.black },
    { char: "+", color: colors.purple },
    { char: "÷", color: colors.fuchsia },
  ],
};

export const bubble: Sprite = {
  name: "water_bubble",
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
  name: "rain_drop",
  layers: [{ char: "│", color: colors.blue }],
  amounts: {
    single: [{ char: "│", color: colors.blue }],
    double: [{ char: "│", color: colors.blue }],
    multiple: [{ char: "|", color: colors.blue }],
  },
};

export const fire: Sprite = {
  name: "Burn",
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
  name: "Snow",
  layers: [
    { char: "\u0107", color: colors.grey },
    { char: "\u0109", color: colors.grey },
    { char: "▓", color: colors.black },
  ],
};

export const snowCover: Sprite = {
  name: "Snow",
  layers: [{ char: "░", color: colors.white }],
};

export const freeze: Sprite = {
  name: "Freeze",
  layers: [{ char: "░", color: colors.aqua }],
  amounts: {
    single: [{ char: "░", color: colors.aqua }],
    double: [{ char: "▒", color: colors.aqua }],
    multiple: [{ char: "▓", color: colors.aqua }],
  },
};

export const smokeThick: Sprite = {
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
  name: "unit_decay",
  layers: [{ char: "▒", color: colors.black }],
};

export const vanishGrow0: Sprite = {
  name: "vanish_grow_0",
  layers: [{ char: "·", color: colors.lime }],
};

export const vanishGrow1: Sprite = {
  name: "vanish_grow_1",
  layers: [{ char: "∙", color: colors.lime }],
};

export const vanishGrow2: Sprite = {
  name: "vanish_grow_2",
  layers: [{ char: "\u0106", color: colors.lime }],
};

export const vanishGrow3: Sprite = {
  name: "vanish_grow_3",
  layers: [
    { char: "\u0106", color: colors.lime },
    { char: "\u0108", color: colors.lime },
  ],
};

export const vanishGrow4: Sprite = {
  name: "vanish_grow_4",
  layers: [
    { char: "\u0100", color: colors.lime },
    { char: "\u0101", color: colors.lime },
  ],
};

export const vanishGrow5: Sprite = {
  name: "vanish_grow_5",
  layers: [{ char: "█", color: colors.lime }],
};

export const vanishShrink0: Sprite = {
  name: "vanish_shrink_0",
  layers: [{ char: "▓", color: colors.lime }],
};

export const vanishShrink1: Sprite = {
  name: "vanish_shrink_1",
  layers: [{ char: "▒", color: colors.lime }],
};

export const vanishShrink2: Sprite = {
  name: "vanish_shrink_2",
  layers: [{ char: "░", color: colors.lime }],
};

export const vanishEvaporate: Sprite = {
  name: "vanish_evaporate",
  layers: [{ char: "║", color: colors.green }],
};

export const plantEvaporate: Sprite = {
  name: "plant_evaporate",
  layers: [{ char: "│", color: colors.green }],
};

export const stoneEvaporate: Sprite = {
  name: "stone_evaporate",
  layers: [{ char: "│", color: colors.grey }],
};

export const shotHit: Sprite = {
  name: "shot_hit",
  layers: [
    { char: "'", color: colors.grey },
    { char: "`", color: colors.white },
  ],
};

export const woodShot2: Sprite = {
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
  name: "spell_aura",
  layers: [],
  amounts: {
    single: [{ char: "·", color: colors.purple }],
    double: [{ char: "∙", color: colors.purple }],
    multiple: [{ char: "+", color: colors.purple }],
  },
};

export const menuDot: Sprite = {
  name: "menu_dot",
  layers: [
    { char: ".", color: colors.grey },
    { char: ":", color: colors.black },
  ],
};

export const menuArrow: Sprite = {
  name: "menu_arrow",
  layers: [{ char: "\u0119", color: colors.white }],
};

export const tooltipFriendlyStart: Sprite = {
  name: "friendly_start",
  layers: [
    { char: "▐", color: colors.black },
    { char: "│", color: colors.green },
  ],
};

export const tooltipFriendlyEnd: Sprite = {
  name: "friendly_end",
  layers: [
    { char: "▌", color: colors.black },
    { char: "│", color: colors.green },
  ],
};

export const tooltipNeutralStart: Sprite = {
  name: "neutral_start",
  layers: [
    { char: "▐", color: colors.black },
    { char: "│", color: colors.silver },
  ],
};

export const tooltipNeutralEnd: Sprite = {
  name: "neutral_end",
  layers: [
    { char: "▌", color: colors.black },
    { char: "│", color: colors.silver },
  ],
};

export const tooltipHostileStart: Sprite = {
  name: "hostile_start",
  layers: [
    { char: "▐", color: colors.black },
    { char: "│", color: colors.maroon },
  ],
};

export const tooltipHostileEnd: Sprite = {
  name: "hostile_end",
  layers: [
    { char: "▌", color: colors.black },
    { char: "│", color: colors.maroon },
  ],
};

export const dialogStart: Sprite = {
  name: "dialog_start",
  layers: [
    { char: "▐", color: colors.white },
    { char: "│", color: colors.black },
    { char: "║", color: colors.white },
  ],
};

export const dialogEnd: Sprite = {
  name: "dialog_end",
  layers: [
    { char: "▌", color: colors.white },
    { char: "│", color: colors.black },
    { char: "║", color: colors.white },
  ],
};

export const shoutStart: Sprite = {
  name: "shout_start",
  layers: [
    { char: "▐", color: colors.red },
    { char: "│", color: colors.black },
    { char: "║", color: colors.red },
  ],
};

export const shoutEnd: Sprite = {
  name: "shout_end",
  layers: [
    { char: "▌", color: colors.red },
    { char: "│", color: colors.black },
    { char: "║", color: colors.red },
  ],
};

export const nextStart: Sprite = {
  name: "next_start",
  layers: [
    { char: "▐", color: colors.lime },
    { char: "│", color: colors.green },
  ],
};

export const nextEnd: Sprite = {
  name: "next_end",
  layers: [
    { char: "▌", color: colors.lime },
    { char: "│", color: colors.green },
  ],
};

export const tooltipLine: Sprite = {
  name: "tooltip_line",
  layers: [{ char: "─", color: colors.silver }],
  facing: {
    up: [{ char: "└", color: colors.silver }],
    down: [{ char: "┌", color: colors.silver }],
  },
};

export const enemyLine: Sprite = {
  name: "tooltip_line",
  layers: [{ char: "─", color: colors.maroon }],
  facing: {
    up: [{ char: "└", color: colors.maroon }],
    down: [{ char: "┌", color: colors.maroon }],
  },
};

export const allyLine: Sprite = {
  name: "tooltip_line",
  layers: [{ char: "─", color: colors.green }],
  facing: {
    up: [{ char: "└", color: colors.green }],
    down: [{ char: "┌", color: colors.green }],
  },
};

export const bubbleUp: Sprite = {
  name: "bubble_up",
  layers: [
    { char: "╙", color: colors.silver },
    { char: "-", color: colors.black },
    { char: "└", color: colors.white },
    { char: "·", color: colors.grey },
  ],
};

export const bubbleRight: Sprite = {
  name: "bubble_right",
  layers: [
    { char: "╜", color: colors.silver },
    { char: "-", color: colors.black },
    { char: "┘", color: colors.white },
    { char: "·", color: colors.grey },
  ],
};

export const bubbleDown: Sprite = {
  name: "bubble_down",
  layers: [
    { char: "╖", color: colors.silver },
    { char: "-", color: colors.black },
    { char: "┐", color: colors.white },
    { char: "·", color: colors.grey },
  ],
};

export const bubbleLeft: Sprite = {
  name: "bubble_left",
  layers: [
    { char: "╓", color: colors.silver },
    { char: "-", color: colors.black },
    { char: "┌", color: colors.white },
    { char: "·", color: colors.grey },
  ],
};

export const shoutUp: Sprite = {
  name: "shout_up",
  layers: [
    { char: "╙", color: colors.maroon },
    { char: "-", color: colors.black },
    { char: "└", color: colors.red },
    { char: "·", color: colors.maroon },
  ],
};

export const shoutRight: Sprite = {
  name: "shout_right",
  layers: [
    { char: "╜", color: colors.maroon },
    { char: "-", color: colors.black },
    { char: "┘", color: colors.red },
    { char: "·", color: colors.maroon },
  ],
};

export const shoutDown: Sprite = {
  name: "shout_down",
  layers: [
    { char: "╖", color: colors.maroon },
    { char: "-", color: colors.black },
    { char: "┐", color: colors.red },
    { char: "·", color: colors.maroon },
  ],
};

export const shoutLeft: Sprite = {
  name: "shout_left",
  layers: [
    { char: "╓", color: colors.maroon },
    { char: "-", color: colors.black },
    { char: "┌", color: colors.red },
    { char: "·", color: colors.maroon },
  ],
};

export const keyboardOverlay: Sprite = {
  name: "keyboard_overlay",
  layers: [{ char: "█", color: colors.black }],
};

export const keyboardBorder: Sprite = {
  name: "keyboard_border",
  layers: [
    { char: "▄", color: colors.black },
    { char: "─", color: colors.silver },
  ],
};

export const upperKey: Sprite = {
  name: "upper_key",
  layers: [
    { char: "█", color: colors.lime },
    { char: "\u0117", color: colors.black },
    { char: "_", color: colors.black },
  ],
};

export const lowerKey: Sprite = {
  name: "lower_key",
  layers: [
    { char: "█", color: colors.lime },
    { char: "\u0118", color: colors.black },
  ],
};

export const deleteKey: Sprite = {
  name: "delete_key",
  layers: [
    { char: "█", color: colors.red },
    { char: "\u011a", color: colors.black },
  ],
};

export const lettersKey: Sprite = {
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
  name: "numbers_key",
  layers: [
    { char: "█", color: colors.lime },
    { char: "½", color: colors.black },
  ],
};

export const specialKey: Sprite = {
  name: "special_key",
  layers: [
    { char: "█", color: colors.lime },
    { char: "#", color: colors.black },
  ],
};

export const keyLeft: Sprite = {
  name: "key_left",
  layers: [
    { char: "▐", color: colors.white },
    { char: "│", color: colors.black },
    { char: "║", color: colors.grey },
    { char: "▌", color: colors.black },
  ],
};

export const keyGap: Sprite = {
  name: "key_gap",
  layers: [
    { char: "█", color: colors.white },
    { char: "│", color: colors.black },
    { char: "║", color: colors.grey },
  ],
};

export const keyRight: Sprite = {
  name: "key_right",
  layers: [
    { char: "▌", color: colors.white },
    { char: "│", color: colors.black },
    { char: "║", color: colors.grey },
    { char: "▐", color: colors.black },
  ],
};

export const keySocketLeft: Sprite = {
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
  name: "key_socket",
  layers: [
    { char: "█", color: colors.silver },
    { char: "▄", color: colors.black },
  ],
};

export const keySocketGap: Sprite = {
  name: "key_socket_gap",
  layers: [
    { char: "█", color: colors.silver },
    { char: "│", color: colors.black },
    { char: "║", color: colors.grey },
    { char: "▄", color: colors.black },
  ],
};

export const keySocketRight: Sprite = {
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
  name: "modifier_left",
  layers: [
    { char: "▐", color: colors.lime },
    { char: "│", color: colors.black },
    { char: "║", color: colors.grey },
    { char: "▌", color: colors.black },
  ],
};

export const modifierGapLeft: Sprite = {
  name: "modifier_gap_left",
  layers: [
    { char: "▌", color: colors.lime },
    { char: "▐", color: colors.white },
    { char: "│", color: colors.black },
    { char: "║", color: colors.grey },
  ],
};

export const modifierGapRight: Sprite = {
  name: "modifier_gap_right",
  layers: [
    { char: "▌", color: colors.white },
    { char: "▐", color: colors.lime },
    { char: "│", color: colors.black },
    { char: "║", color: colors.grey },
  ],
};

export const modifierRight: Sprite = {
  name: "modifier_right",
  layers: [
    { char: "▌", color: colors.lime },
    { char: "│", color: colors.black },
    { char: "║", color: colors.grey },
    { char: "▐", color: colors.black },
  ],
};

export const modifierSocketLeft: Sprite = {
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
  name: "modifier_socket",
  layers: [
    { char: "█", color: colors.green },
    { char: "▄", color: colors.black },
  ],
};

export const modifierSocketGapRight: Sprite = {
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
  name: "delete_left",
  layers: [
    { char: "▐", color: colors.red },
    { char: "│", color: colors.black },
    { char: "║", color: colors.grey },
    { char: "▌", color: colors.black },
  ],
};

export const deleteGapLeft: Sprite = {
  name: "delete_gap_left",
  layers: [
    { char: "▌", color: colors.red },
    { char: "▐", color: colors.white },
    { char: "│", color: colors.black },
    { char: "║", color: colors.grey },
  ],
};

export const deleteGapRight: Sprite = {
  name: "delete_gap_right",
  layers: [
    { char: "▌", color: colors.white },
    { char: "▐", color: colors.red },
    { char: "│", color: colors.black },
    { char: "║", color: colors.grey },
  ],
};

export const deleteRight: Sprite = {
  name: "delete_right",
  layers: [
    { char: "▌", color: colors.red },
    { char: "│", color: colors.black },
    { char: "║", color: colors.grey },
    { char: "▐", color: colors.black },
  ],
};

export const deleteSocketLeft: Sprite = {
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
  name: "delete_socket",
  layers: [
    { char: "█", color: colors.maroon },
    { char: "▄", color: colors.black },
  ],
};

export const deleteSocketGapRight: Sprite = {
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
  name: "delete_socket_right",
  layers: [
    { char: "▌", color: colors.maroon },
    { char: "│", color: colors.black },
    { char: "║", color: colors.grey },
    { char: "▐", color: colors.black },
    { char: "▄", color: colors.black },
  ],
};

export const popupBackground: Sprite = {
  name: "popup_background",
  layers: [{ char: "█", color: colors.black }],
};

export const popupSegment: Sprite = {
  name: "popup_segment",
  layers: [
    { char: "│", color: colors.silver },
    { char: "║", color: colors.black },
  ],
};

export const popupActive: Sprite = {
  name: "popup_active",
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
  name: "popup_selection",
  layers: [{ char: ">", color: colors.white }],
};

export const popupHint: Sprite = {
  name: "popup_hint",
  layers: [],
  amounts: {
    single: [{ char: "\u0118", color: colors.silver }],
  },
};

export const popupOverlay: Sprite = {
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
  name: "popup_blocked",
  layers: [
    { char: ">", color: colors.red },
    { char: "▒", color: colors.black },
  ],
};

export const missing: Sprite = {
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
  name: "Convert",
  layers: [
    { char: "\u0119", color: colors.white },
    { char: ">", color: colors.white },
  ],
};

export const blocked: Sprite = {
  name: "Blocked",
  layers: [
    { char: "\u0100", color: colors.red },
    { char: "■", color: colors.black },
    { char: "/", color: colors.red },
  ],
};

export const quickCorner: Sprite = {
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
  name: "quick_center_start",
  layers: [
    { char: "▐", color: colors.black },
    { char: "├", color: colors.olive },
  ],
};

export const quickCenterEnd: Sprite = {
  name: "quick_center_end",
  layers: [
    { char: "▌", color: colors.black },
    { char: "┤", color: colors.olive },
  ],
};

export const popupCorner: Sprite = {
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
  name: "popup_separator_inverted",
  layers: [
    { char: "▐", color: colors.grey },
    { char: "▀", color: colors.black },
    { char: "│", color: colors.black },
    { char: "▌", color: colors.white },
  ],
};

export const popupSeparatorDisabled: Sprite = {
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
  name: "popup_center_start",
  layers: [
    { char: "▐", color: colors.black },
    { char: "╟", color: colors.silver },
  ],
};

export const popupCenter: Sprite = {
  name: "popup_center",
  layers: [
    { char: "█", color: colors.black },
    { char: "─", color: colors.silver },
  ],
};

export const popupCenterCrop: Sprite = {
  name: "popup_center_crop",
  layers: [
    { char: "▄", color: colors.black },
    { char: "─", color: colors.silver },
  ],
};

export const popupCenterEnd: Sprite = {
  name: "popup_center_end",
  layers: [
    { char: "▌", color: colors.black },
    { char: "│", color: colors.black },
    { char: "╢", color: colors.silver },
  ],
};

export const popupDownStart: Sprite = {
  name: "popup_down_start",
  layers: [
    { char: "▀", color: colors.black },
    { char: "▐", color: colors.black },
    { char: "╡", color: colors.silver },
  ],
};

export const popupDownEnd: Sprite = {
  name: "popup_down_end",
  layers: [
    { char: "▀", color: colors.black },
    { char: "▌", color: colors.black },
    { char: "╞", color: colors.silver },
  ],
};

export const craftCenterTop: Sprite = {
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
  name: "craft_left",
  layers: [
    { char: "│", color: colors.grey },
    { char: "▒", color: colors.black },
    { char: "║", color: colors.black },
  ],
};

export const craftLeftActive: Sprite = {
  name: "craft_left_active",
  layers: [
    { char: "│", color: colors.white },
    { char: "║", color: colors.black },
  ],
};

export const craftDownLeft: Sprite = {
  name: "craft_down_left",
  layers: [
    { char: "└", color: colors.grey },
    { char: "▒", color: colors.black },
    { char: "▌", color: colors.black },
  ],
};

export const craftDownLeftActive: Sprite = {
  name: "craft_down_left_active",
  layers: [
    { char: "└", color: colors.white },
    { char: "▌", color: colors.black },
  ],
};

export const craftDown: Sprite = {
  name: "craft_down",
  layers: [
    { char: "─", color: colors.grey },
    { char: "▒", color: colors.black },
  ],
};

export const craftDownActive: Sprite = {
  name: "craft_down_active",
  layers: [{ char: "─", color: colors.white }],
};

export const buildCenterTop: Sprite = {
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
  name: "build_left",
  layers: [
    { char: "│", color: colors.olive },
    { char: "▒", color: colors.black },
    { char: "║", color: colors.black },
  ],
};

export const buildLeftActive: Sprite = {
  name: "build_left_active",
  layers: [
    { char: "│", color: colors.yellow },
    { char: "║", color: colors.black },
  ],
};

export const buildDownLeft: Sprite = {
  name: "build_down_left",
  layers: [
    { char: "└", color: colors.olive },
    { char: "▒", color: colors.black },
    { char: "▌", color: colors.black },
  ],
};

export const buildDownLeftActive: Sprite = {
  name: "build_down_left_active",
  layers: [
    { char: "└", color: colors.yellow },
    { char: "▌", color: colors.black },
  ],
};

export const buildDown: Sprite = {
  name: "build_down",
  layers: [
    { char: "─", color: colors.olive },
    { char: "▒", color: colors.black },
  ],
};

export const buildDownActive: Sprite = {
  name: "build_down_active",
  layers: [{ char: "─", color: colors.yellow }],
};

export const scrollBarTop: Sprite = {
  name: "scroll_top",
  layers: [
    { char: "█", color: colors.silver },
    { char: "\u011d", color: colors.black },
  ],
};

export const scrollBar: Sprite = {
  name: "scroll_bar",
  layers: [
    { char: "█", color: colors.silver },
    { char: "░", color: colors.black },
  ],
};

export const scrollBarBottom: Sprite = {
  name: "scroll_bottom",
  layers: [
    { char: "█", color: colors.silver },
    { char: "\u011e", color: colors.black },
  ],
};

export const scrollHandle: Sprite = {
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
  name: "forge_hammer",
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
  name: "forge_handle",
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
  name: "forge_hit",
  layers: [{ char: "_", color: colors.lime }],
};

export const forgeMiss: Sprite = {
  name: "forge_miss",
  layers: [
    { char: "_", color: colors.red },
    { char: "▒", color: colors.black },
  ],
};

export const thickLine: Sprite = {
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
  name: "Slot",
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
  name: "interact_left",
  layers: [
    { char: "▌", color: colors.black },
    { char: "│", color: colors.green },
  ],
};
export const interactRight: Sprite = {
  name: "interact_left",
  layers: [
    { char: "▐", color: colors.black },
    { char: "│", color: colors.green },
  ],
};
export const interactBar: Sprite = {
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
  name: "brew_item",
  layers: [
    { char: "∙", color: colors.navy },
    { char: "·", color: colors.white },
  ],
};

export const questPointer: Sprite = {
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
  name: "xp_dot",
  layers: [{ char: "·", color: colors.lime }],
};

export const vortexDot: Sprite = {
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
  name: "fountain_drop",
  layers: [{ char: "|", color: colors.blue }],
  amounts: {
    single: [{ char: "∙", color: colors.blue }],
    double: [{ char: ".", color: colors.blue }],
    multiple: [{ char: ":", color: colors.blue }],
  },
};

export const fountainHeal: Sprite = {
  name: "fountain_heal",
  layers: [{ char: "|", color: colors.lime }],
  amounts: {
    single: [{ char: "∙", color: colors.lime }],
    double: [{ char: ".", color: colors.lime }],
    multiple: [{ char: ":", color: colors.lime }],
  },
};

export const levelProgress: Sprite = {
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
  name: "joystick",
  layers: [
    { char: "■", color: colors.white },
    { char: "+", color: colors.grey },
    { char: "÷", color: colors.white },
    { char: "·", color: colors.grey },
  ],
};

export const pause: Sprite = {
  name: "Pause",
  layers: [
    { char: "■", color: colors.red },
    { char: "|", color: colors.black },
  ],
};

export const pauseInvert: Sprite = {
  name: "Pause",
  layers: [
    { char: "█", color: colors.white },
    { char: "■", color: colors.black },
    { char: "|", color: colors.white },
  ],
};

export const pauseInvertPressed: Sprite = {
  name: "Pause",
  layers: [
    { char: "█", color: colors.grey },
    { char: "■", color: colors.black },
    { char: "|", color: colors.grey },
  ],
};

export const resume: Sprite = {
  name: "Resume",
  layers: [{ char: "»", color: colors.white }],
};

export const resumeInvert: Sprite = {
  name: "Resume",
  layers: [
    { char: "█", color: colors.white },
    { char: "»", color: colors.black },
  ],
};

export const resumeInvertPressed: Sprite = {
  name: "Resume",
  layers: [
    { char: "█", color: colors.grey },
    { char: "»", color: colors.black },
  ],
};

export const inspect: Sprite = {
  name: "Inspect",
  layers: [{ char: "?", color: colors.white }],
};

export const spawn: Sprite = {
  name: "Map",
  layers: [
    { char: "\u010b", color: colors.green },
    { char: "°", color: colors.lime },
  ],
};

export const chatDiscovery: Sprite = {
  name: "Chat",
  layers: [
    { char: "µ", color: colors.lime },
    { char: "o", color: colors.lime },
    { char: "+", color: colors.lime },
    { char: ".", color: colors.lime },
  ],
};

export const caret: Sprite = {
  name: "Caret",
  layers: [
    { char: "\u0107", color: colors.white },
    { char: "\u0100", color: colors.black },
    { char: "\u0101", color: colors.black },
    { char: "M", color: colors.black },
    { char: "▀", color: colors.black },
  ],
};

export const mapDiscovery: Sprite = {
  name: "Map",
  layers: [
    { char: "■", color: colors.green },
    { char: "≡", color: colors.lime },
    { char: "-", color: colors.black },
    { char: "+", color: colors.green },
    { char: "·", color: colors.lime },
  ],
};

export const mapHouse: Sprite = {
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
  name: "House",
  layers: [
    { char: "█", color: colors.black },
    { char: "*", color: colors.lime },
  ],
};

export const mapPlayer: Sprite = {
  name: "Map",
  layers: [{ char: "\u010b", color: colors.lime }],
};

export const mapNomad: Sprite = {
  name: "Map",
  layers: [
    { char: "█", color: colors.black },
    { char: "\u010b", color: colors.silver },
    { char: "'", color: colors.red },
  ],
};

export const mapZoom1: Sprite = {
  name: "Map",
  layers: [{ char: "∙", color: colors.grey }],
};

export const mapZoom2: Sprite = {
  name: "Map",
  layers: [
    { char: "≡", color: colors.grey },
    { char: "-", color: colors.black },
    { char: "║", color: colors.black },
    { char: "b", color: colors.black },
  ],
};

export const mapZoom3: Sprite = {
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
  name: "Close",
  layers: [
    { char: "█", color: colors.red },
    { char: "*", color: colors.black },
    { char: "─", color: colors.red },
    { char: "·", color: colors.black },
  ],
};

export const backdrop: Sprite = {
  name: "Backdrop",
  layers: [{ char: "▓", color: colors.black }],
};

export const swirl: Sprite = {
  name: "Swirl",
  layers: [
    { char: "≈", color: colors.grey },
    { char: "▀", color: colors.black },
  ],
};

export const times: Sprite = {
  name: "Times",
  layers: [
    { char: "*", color: colors.white },
    { char: "─", color: colors.black },
    { char: "·", color: colors.white },
  ],
};

export const star: Sprite = {
  name: "Star",
  layers: [{ char: "*", color: colors.white }],
};

export const plusBox: Sprite = {
  name: "Plus",
  layers: [
    { char: "M", color: colors.white },
    { char: "[", color: colors.white },
    { char: "]", color: colors.white },
    { char: "+", color: colors.black },
  ],
};

export const ninePlus: Sprite = {
  name: "9+",
  layers: [
    { char: "9", color: colors.grey },
    { char: "+", color: colors.silver },
  ],
};

export const ninePlusAmmo: Sprite = {
  name: "9+",
  layers: [
    { char: "9", color: colors.silver },
    { char: "+", color: colors.white },
  ],
};

export const ninePlusMana: Sprite = {
  name: "9+",
  layers: [
    { char: "9", color: colors.blue },
    { char: "+", color: colors.teal },
  ],
};

export const scroll: Sprite = {
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
  name: "Weapon",
  layers: [
    { char: "*", color: colors.black },
    { char: "\u0100", color: colors.grey },
    { char: "-", color: colors.grey },
    { char: "∙", color: colors.black },
  ],
};

export const offhandSlot: Sprite = {
  name: "Offhand",
  layers: [{ char: "¬", color: colors.black }],
};

export const bootsSlot: Sprite = {
  name: "Boots",
  layers: [
    { char: "\u0116", color: colors.black },
    { char: "\u0111", color: colors.grey },
    { char: "¡", color: colors.black },
    { char: "|", color: colors.grey },
  ],
};

export const spellSlot: Sprite = {
  name: "Spell",
  layers: [{ char: "+", color: colors.black }],
};

export const skillSlot: Sprite = {
  name: "Skill",
  layers: [{ char: "»", color: colors.black }],
};

export const toolSlot: Sprite = {
  name: "Tool",
  layers: [
    { char: "\u0106", color: colors.black },
    { char: "∙", color: colors.grey },
  ],
};

export const ringSlot: Sprite = {
  name: "Ring",
  layers: [
    { char: "|", color: colors.black },
    { char: ".", color: colors.grey },
    { char: "~", color: colors.grey },
    { char: "\u0108", color: colors.black },
    { char: "\u0106", color: colors.grey },
  ],
};

export const amuletSlot: Sprite = {
  name: "Amulet",
  layers: [
    { char: "t", color: colors.black },
    { char: "\u0112", color: colors.grey },
    { char: "U", color: colors.grey },
    { char: "\u0115", color: colors.grey },
    { char: "\u0103", color: colors.black },
  ],
};

export const compassSlot: Sprite = {
  name: "Compass",
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
  name: "Torch",
  layers: [
    { char: "┐", color: colors.black },
    { char: "-", color: colors.grey },
    { char: "*", color: colors.black },
    { char: "∙", color: colors.grey },
  ],
};

export const mapSlot: Sprite = {
  name: "Map",
  layers: [
    { char: "■", color: colors.black },
    { char: "≡", color: colors.black },
    { char: "-", color: colors.grey },
    { char: "+", color: colors.black },
    { char: "·", color: colors.grey },
  ],
};

export const friendlyBar: Sprite = {
  name: "Friendly",
  layers: [{ char: "_", color: colors.lime }],
};

export const neutralBar: Sprite = {
  name: "Friendly",
  layers: [{ char: "_", color: colors.silver }],
};

export const hostileBar: Sprite = {
  name: "Hostile",
  layers: [{ char: "_", color: colors.red }],
};

export const warnOn: Sprite = {
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
  name: "warn_off",
  layers: [
    { char: "\u0101", color: colors.black },
    { char: "\u0100", color: colors.red },
    { char: "\u0106", color: colors.black },
  ],
};
export const shadow: Sprite = {
  name: "",
  layers: [
    { char: "\u0100", color: colors.black },
    { char: "\u0101", color: colors.black },
  ],
};
