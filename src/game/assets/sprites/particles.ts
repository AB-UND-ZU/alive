import { colors, orderedColors } from "../colors";
import { Layer, SPRITE, Sprite } from "../../../engine/components/sprite";
import { Countable, UnitStats } from "../../../engine/components/stats";
import {
  armor,
  damp,
  haste,
  heart,
  heartUp,
  level,
  mana,
  manaUp,
  power,
  resist,
  spike,
  thaw,
  vision,
  wisdom,
  xp,
} from "./items";
import { lerp, normalize, padCenter, repeat } from "../../math/std";
import { Orientation } from "../../../engine/components/orientable";
import { getFacingLayers } from "../../../components/Entity/utils";
import { none } from "./terrain";
import { World } from "../../../engine";
import { isEnemy, isNeutral, isTribe } from "../../../engine/systems/damage";
import { Entity } from "ecs";
import { ItemStats } from "../../../engine/components/item";

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
  name: "Bubble",
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

export const raiseParticle: Sprite = {
  name: "Raise",
  layers: [],
  amounts: {
    single: [{ char: "%", color: colors.red }],
  },
};

export const woodBlockSide1: Sprite = {
  name: "Block",
  layers: [],
  facing: {
    up: [{ char: "·", color: colors.maroon }],
    right: [
      { char: ":", color: colors.maroon },
      { char: ".", color: colors.maroon },
    ],
    down: [{ char: "·", color: colors.maroon }],
    left: [
      { char: ":", color: colors.maroon },
      { char: ".", color: colors.maroon },
    ],
  },
};

export const woodBlockSide2: Sprite = {
  name: "Block",
  layers: [],
  facing: {
    up: [
      { char: "─", color: colors.maroon },
      { char: "+", color: colors.black },
    ],
    right: [
      { char: "│", color: colors.maroon },
      { char: "|", color: colors.black },
      { char: "∙", color: colors.maroon },
    ],
    down: [
      { char: "─", color: colors.maroon },
      { char: "+", color: colors.black },
    ],
    left: [
      { char: "│", color: colors.maroon },
      { char: "|", color: colors.black },
      { char: "∙", color: colors.maroon },
    ],
  },
};

export const woodBlockCorner1: Sprite = {
  name: "Block",
  layers: [],
  facing: {
    up: [
      { char: "┐", color: colors.maroon },
      { char: "·", color: colors.black },
      { char: ".", color: colors.black },
    ],
    right: [
      { char: "┘", color: colors.maroon },
      { char: "·", color: colors.black },
      { char: ":", color: colors.black },
    ],
    down: [
      { char: "└", color: colors.maroon },
      { char: "·", color: colors.black },
      { char: ":", color: colors.black },
    ],
    left: [
      { char: "┌", color: colors.maroon },
      { char: "·", color: colors.black },
      { char: ".", color: colors.black },
    ],
  },
};

export const woodBlockCorner2: Sprite = {
  name: "Block",
  layers: [],
  facing: {
    up: [
      { char: "∙", color: colors.maroon },
      { char: "·", color: colors.black },
      { char: ".", color: colors.maroon },
    ],
    right: [
      { char: "|", color: colors.maroon },
      { char: ":", color: colors.black },
      { char: ".", color: colors.black },
      { char: "+", color: colors.black },
      { char: "·", color: colors.maroon },
    ],
    down: [
      { char: "|", color: colors.maroon },
      { char: ":", color: colors.black },
      { char: ".", color: colors.black },
      { char: "+", color: colors.black },
      { char: "·", color: colors.maroon },
    ],
    left: [
      { char: "∙", color: colors.maroon },
      { char: "·", color: colors.black },
      { char: ".", color: colors.maroon },
    ],
  },
};

export const range: Sprite = {
  name: "Range",
  layers: [
    { char: "\u0117", color: colors.yellow },
    { char: "\u0118", color: colors.yellow },
    { char: "|", color: colors.olive },
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

export const heal: Sprite = {
  name: "Heal",
  layers: [{ char: "+", color: colors.lime }],
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

export const woodWave: Sprite = {
  name: "wood_wave",
  layers: [
    { char: "┼", color: colors.maroon },
    { char: "·", color: colors.black },
  ],
  facing: {
    up: [{ char: "─", color: colors.maroon }],
    right: [{ char: "│", color: colors.maroon }],
    down: [{ char: "─", color: colors.maroon }],
    left: [{ char: "│", color: colors.maroon }],
  },
};

export const woodAirWave: Sprite = {
  name: "wood_air_wave",
  layers: [
    { char: "┼", color: colors.maroon },
    { char: "·", color: colors.white },
  ],
  facing: {
    up: [
      { char: "┬", color: colors.white },
      { char: "─", color: colors.maroon },
    ],
    right: [
      { char: "┤", color: colors.white },
      { char: "│", color: colors.maroon },
    ],
    down: [
      { char: "┴", color: colors.white },
      { char: "─", color: colors.maroon },
    ],
    left: [
      { char: "├", color: colors.white },
      { char: "│", color: colors.maroon },
    ],
  },
};

export const woodFireWave: Sprite = {
  name: "wood_fire_wave",
  layers: [
    { char: "┼", color: colors.maroon },
    { char: "·", color: colors.red },
  ],
  facing: {
    up: [
      { char: "┬", color: colors.red },
      { char: "─", color: colors.maroon },
    ],
    right: [
      { char: "┤", color: colors.red },
      { char: "│", color: colors.maroon },
    ],
    down: [
      { char: "┴", color: colors.red },
      { char: "─", color: colors.maroon },
    ],
    left: [
      { char: "├", color: colors.red },
      { char: "│", color: colors.maroon },
    ],
  },
};

export const woodWaterWave: Sprite = {
  name: "wood_water_wave",
  layers: [
    { char: "┼", color: colors.maroon },
    { char: "·", color: colors.blue },
  ],
  facing: {
    up: [
      { char: "┬", color: colors.blue },
      { char: "─", color: colors.maroon },
    ],
    right: [
      { char: "┤", color: colors.blue },
      { char: "│", color: colors.maroon },
    ],
    down: [
      { char: "┴", color: colors.blue },
      { char: "─", color: colors.maroon },
    ],
    left: [
      { char: "├", color: colors.blue },
      { char: "│", color: colors.maroon },
    ],
  },
};

export const woodEarthWave: Sprite = {
  name: "wood_earth_wave",
  layers: [
    { char: "┼", color: colors.maroon },
    { char: "·", color: colors.lime },
  ],
  facing: {
    up: [
      { char: "┬", color: colors.lime },
      { char: "─", color: colors.maroon },
    ],
    right: [
      { char: "┤", color: colors.lime },
      { char: "│", color: colors.maroon },
    ],
    down: [
      { char: "┴", color: colors.lime },
      { char: "─", color: colors.maroon },
    ],
    left: [
      { char: "├", color: colors.lime },
      { char: "│", color: colors.maroon },
    ],
  },
};

export const ironWave: Sprite = {
  name: "iron_wave",
  layers: [
    { char: "┼", color: colors.silver },
    { char: "·", color: colors.black },
  ],
  facing: {
    up: [{ char: "─", color: colors.silver }],
    right: [{ char: "│", color: colors.silver }],
    down: [{ char: "─", color: colors.silver }],
    left: [{ char: "│", color: colors.silver }],
  },
};

export const woodWaveCorner: Sprite = {
  name: "wood_corner",
  layers: [],
  facing: {
    up: [
      { char: "┐", color: colors.maroon },
      { char: "·", color: colors.black },
    ],
    right: [
      { char: "┘", color: colors.maroon },
      { char: "·", color: colors.black },
    ],
    down: [
      { char: "└", color: colors.maroon },
      { char: "·", color: colors.black },
    ],
    left: [
      { char: "┌", color: colors.maroon },
      { char: "·", color: colors.black },
    ],
  },
};

export const woodAirWaveCorner: Sprite = {
  name: "wood_air_corner",
  layers: [],
  facing: {
    up: [
      { char: "┬", color: colors.white },
      { char: "┐", color: colors.maroon },
      { char: "·", color: colors.black },
    ],
    right: [
      { char: "┴", color: colors.white },
      { char: "┘", color: colors.maroon },
      { char: "·", color: colors.black },
    ],
    down: [
      { char: "┴", color: colors.white },
      { char: "└", color: colors.maroon },
      { char: "·", color: colors.black },
    ],
    left: [
      { char: "┬", color: colors.white },
      { char: "┌", color: colors.maroon },
      { char: "·", color: colors.black },
    ],
  },
};

export const woodFireWaveCorner: Sprite = {
  name: "wood_fire_corner",
  layers: [],
  facing: {
    up: [
      { char: "┬", color: colors.red },
      { char: "┐", color: colors.maroon },
      { char: "·", color: colors.black },
    ],
    right: [
      { char: "┴", color: colors.red },
      { char: "┘", color: colors.maroon },
      { char: "·", color: colors.black },
    ],
    down: [
      { char: "┴", color: colors.red },
      { char: "└", color: colors.maroon },
      { char: "·", color: colors.black },
    ],
    left: [
      { char: "┬", color: colors.red },
      { char: "┌", color: colors.maroon },
      { char: "·", color: colors.black },
    ],
  },
};

export const woodWaterWaveCorner: Sprite = {
  name: "wood_water_corner",
  layers: [],
  facing: {
    up: [
      { char: "┬", color: colors.blue },
      { char: "┐", color: colors.maroon },
      { char: "·", color: colors.black },
    ],
    right: [
      { char: "┴", color: colors.blue },
      { char: "┘", color: colors.maroon },
      { char: "·", color: colors.black },
    ],
    down: [
      { char: "┴", color: colors.blue },
      { char: "└", color: colors.maroon },
      { char: "·", color: colors.black },
    ],
    left: [
      { char: "┬", color: colors.blue },
      { char: "┌", color: colors.maroon },
      { char: "·", color: colors.black },
    ],
  },
};

export const woodEarthWaveCorner: Sprite = {
  name: "wood_earth_corner",
  layers: [],
  facing: {
    up: [
      { char: "┬", color: colors.lime },
      { char: "┐", color: colors.maroon },
      { char: "·", color: colors.black },
    ],
    right: [
      { char: "┴", color: colors.lime },
      { char: "┘", color: colors.maroon },
      { char: "·", color: colors.black },
    ],
    down: [
      { char: "┴", color: colors.lime },
      { char: "└", color: colors.maroon },
      { char: "·", color: colors.black },
    ],
    left: [
      { char: "┬", color: colors.lime },
      { char: "┌", color: colors.maroon },
      { char: "·", color: colors.black },
    ],
  },
};

export const ironWaveCorner: Sprite = {
  name: "iron_corner",
  layers: [],
  facing: {
    up: [
      { char: "┐", color: colors.silver },
      { char: "·", color: colors.black },
    ],
    right: [
      { char: "┘", color: colors.silver },
      { char: "·", color: colors.black },
    ],
    down: [
      { char: "└", color: colors.silver },
      { char: "·", color: colors.black },
    ],
    left: [
      { char: "┌", color: colors.silver },
      { char: "·", color: colors.black },
    ],
  },
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
      { char: "\u0101", color: colors.navy },
      { char: "\u0100", color: colors.blue },
      { char: "■", color: colors.navy },
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

export const shotHit: Sprite = {
  name: "shot_hit",
  layers: [
    { char: "'", color: colors.grey },
    { char: "`", color: colors.white },
  ],
};

export const woodShot: Sprite = {
  name: "shot_wood",
  layers: [
    { char: "\u011c", color: colors.grey },
    { char: "\u011a", color: colors.black },
    { char: "-", color: colors.maroon },
  ],
  facing: {
    up: [
      { char: "\u0117", color: colors.grey },
      { char: "|", color: colors.maroon },
    ],
    right: [
      { char: "\u011c", color: colors.grey },
      { char: "\u011a", color: colors.black },
      { char: "-", color: colors.maroon },
    ],
    down: [
      { char: "\u0118", color: colors.grey },
      { char: "|", color: colors.maroon },
    ],
    left: [
      { char: "\u011c", color: colors.grey },
      { char: "\u0119", color: colors.black },
      { char: "-", color: colors.maroon },
    ],
  },
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

export const woodSlashSide: Sprite = {
  name: "wood_slash_side",
  layers: [{ char: "┐", color: colors.maroon }],
  facing: {
    up: [{ char: "─", color: colors.maroon }],
    right: [{ char: "┘", color: colors.maroon }],
    down: [{ char: "─", color: colors.maroon }],
    left: [{ char: "│", color: colors.maroon }],
  },
};

export const ironSlashSide: Sprite = {
  name: "iron_slash_side",
  layers: [{ char: "┐", color: colors.grey }],
  facing: {
    up: [{ char: "─", color: colors.grey }],
    right: [{ char: "┘", color: colors.grey }],
    down: [{ char: "─", color: colors.grey }],
    left: [{ char: "│", color: colors.grey }],
  },
};

export const goldSlashSide: Sprite = {
  name: "gold_slash_side",
  layers: [{ char: "┐", color: colors.yellow }],
  facing: {
    up: [{ char: "─", color: colors.yellow }],
    right: [{ char: "┘", color: colors.yellow }],
    down: [{ char: "─", color: colors.yellow }],
    left: [{ char: "│", color: colors.yellow }],
  },
};

export const diamondSlashSide: Sprite = {
  name: "diamond_slash_side",
  layers: [{ char: "┐", color: colors.aqua }],
  facing: {
    up: [{ char: "─", color: colors.aqua }],
    right: [{ char: "┘", color: colors.aqua }],
    down: [{ char: "─", color: colors.aqua }],
    left: [{ char: "│", color: colors.aqua }],
  },
};

export const rubySlashSide: Sprite = {
  name: "ruby_slash_side",
  layers: [{ char: "┐", color: colors.fuchsia }],
  facing: {
    up: [{ char: "─", color: colors.fuchsia }],
    right: [{ char: "┘", color: colors.fuchsia }],
    down: [{ char: "─", color: colors.fuchsia }],
    left: [{ char: "│", color: colors.fuchsia }],
  },
};

export const woodSlashCorner: Sprite = {
  name: "wood_slash_corner",
  layers: [{ char: "┼", color: colors.maroon }],
  facing: {
    up: [{ char: "┌", color: colors.maroon }],
    right: [{ char: "┐", color: colors.maroon }],
    down: [{ char: "┘", color: colors.maroon }],
    left: [{ char: "└", color: colors.maroon }],
  },
};

export const ironSlashCorner: Sprite = {
  name: "iron_slash_corner",
  layers: [{ char: "┼", color: colors.grey }],
  facing: {
    up: [{ char: "┌", color: colors.grey }],
    right: [{ char: "┐", color: colors.grey }],
    down: [{ char: "┘", color: colors.grey }],
    left: [{ char: "└", color: colors.grey }],
  },
};

export const goldSlashCorner: Sprite = {
  name: "gold_slash_corner",
  layers: [{ char: "┼", color: colors.yellow }],
  facing: {
    up: [{ char: "┌", color: colors.yellow }],
    right: [{ char: "┐", color: colors.yellow }],
    down: [{ char: "┘", color: colors.yellow }],
    left: [{ char: "└", color: colors.yellow }],
  },
};

export const diamondSlashCorner: Sprite = {
  name: "diamond_slash_corner",
  layers: [{ char: "┼", color: colors.aqua }],
  facing: {
    up: [{ char: "┌", color: colors.aqua }],
    right: [{ char: "┐", color: colors.aqua }],
    down: [{ char: "┘", color: colors.aqua }],
    left: [{ char: "└", color: colors.aqua }],
  },
};

export const rubySlashCorner: Sprite = {
  name: "ruby_slash_corner",
  layers: [{ char: "┼", color: colors.fuchsia }],
  facing: {
    up: [{ char: "┌", color: colors.fuchsia }],
    right: [{ char: "┐", color: colors.fuchsia }],
    down: [{ char: "┘", color: colors.fuchsia }],
    left: [{ char: "└", color: colors.fuchsia }],
  },
};

export const woodBolt: Sprite = {
  name: "wood_bolt",
  layers: [{ char: "∙", color: colors.maroon }],
  amounts: {
    single: [{ char: "∙", color: colors.maroon }],
    double: [
      { char: "\u0106", color: colors.maroon },
      { char: "∙", color: colors.maroon },
    ],
    multiple: [
      { char: "\u0108", color: colors.maroon },
      { char: "\u0106", color: colors.maroon },
    ],
  },
};

export const ironBolt: Sprite = {
  name: "iron_bolt",
  layers: [{ char: "∙", color: colors.silver }],
  amounts: {
    single: [{ char: "∙", color: colors.silver }],
    double: [
      { char: "\u0106", color: colors.silver },
      { char: "∙", color: colors.grey },
    ],
    multiple: [
      { char: "\u0108", color: colors.silver },
      { char: "\u0106", color: colors.grey },
    ],
  },
};

export const goldBolt: Sprite = {
  name: "gold_bolt",
  layers: [{ char: "∙", color: colors.yellow }],
  amounts: {
    single: [{ char: "∙", color: colors.yellow }],
    double: [
      { char: "\u0106", color: colors.yellow },
      { char: "∙", color: colors.olive },
    ],
    multiple: [
      { char: "\u0108", color: colors.yellow },
      { char: "\u0106", color: colors.olive },
    ],
  },
};

export const diamondBolt: Sprite = {
  name: "diamond_bolt",
  layers: [{ char: "∙", color: colors.aqua }],
  amounts: {
    single: [{ char: "∙", color: colors.aqua }],
    double: [
      { char: "\u0106", color: colors.aqua },
      { char: "∙", color: colors.teal },
    ],
    multiple: [
      { char: "\u0108", color: colors.aqua },
      { char: "\u0106", color: colors.teal },
    ],
  },
};

export const rubyBolt: Sprite = {
  name: "ruby_bolt",
  layers: [{ char: "∙", color: colors.fuchsia }],
  amounts: {
    single: [{ char: "∙", color: colors.fuchsia }],
    double: [
      { char: "\u0106", color: colors.fuchsia },
      { char: "∙", color: colors.purple },
    ],
    multiple: [
      { char: "\u0108", color: colors.fuchsia },
      { char: "\u0106", color: colors.purple },
    ],
  },
};

export const woodAirBolt: Sprite = {
  name: "air_bolt",
  layers: [{ char: "∙", color: colors.white }],
  amounts: {
    single: [{ char: "∙", color: colors.white }],
    double: [
      { char: "\u0106", color: colors.maroon },
      { char: "∙", color: colors.white },
    ],
    multiple: [
      { char: "\u0108", color: colors.maroon },
      { char: "\u0106", color: colors.white },
    ],
  },
};

export const woodFireBolt: Sprite = {
  name: "fire_bolt",
  layers: [{ char: "∙", color: colors.red }],
  amounts: {
    single: [{ char: "∙", color: colors.red }],
    double: [
      { char: "\u0106", color: colors.maroon },
      { char: "∙", color: colors.red },
    ],
    multiple: [
      { char: "\u0108", color: colors.maroon },
      { char: "\u0106", color: colors.red },
    ],
  },
};

export const woodWaterBolt: Sprite = {
  name: "water_bolt",
  layers: [{ char: "∙", color: colors.blue }],
  amounts: {
    single: [{ char: "∙", color: colors.blue }],
    double: [
      { char: "\u0106", color: colors.maroon },
      { char: "∙", color: colors.blue },
    ],
    multiple: [
      { char: "\u0108", color: colors.maroon },
      { char: "\u0106", color: colors.blue },
    ],
  },
};

export const woodEarthBolt: Sprite = {
  name: "earth_bolt",
  layers: [{ char: "∙", color: colors.lime }],
  amounts: {
    single: [{ char: "∙", color: colors.lime }],
    double: [
      { char: "\u0106", color: colors.maroon },
      { char: "∙", color: colors.lime },
    ],
    multiple: [
      { char: "\u0108", color: colors.maroon },
      { char: "\u0106", color: colors.lime },
    ],
  },
};

export const woodEdge: Sprite = {
  name: "wood_edge",
  layers: [
    { char: "┼", color: colors.maroon },
    { char: "·", color: colors.black },
  ],
  facing: {
    up: [
      { char: "┴", color: colors.maroon },
      { char: "·", color: colors.black },
    ],
    right: [
      { char: "├", color: colors.maroon },
      { char: "·", color: colors.black },
    ],
    down: [
      { char: "┬", color: colors.maroon },
      { char: "·", color: colors.black },
    ],
    left: [
      { char: "┤", color: colors.maroon },
      { char: "·", color: colors.black },
    ],
  },
};

export const ironEdge: Sprite = {
  name: "iron_edge",
  layers: [
    { char: "┼", color: colors.grey },
    { char: "·", color: colors.black },
  ],
  facing: {
    up: [
      { char: "┴", color: colors.grey },
      { char: "·", color: colors.black },
    ],
    right: [
      { char: "├", color: colors.grey },
      { char: "·", color: colors.black },
    ],
    down: [
      { char: "┬", color: colors.grey },
      { char: "·", color: colors.black },
    ],
    left: [
      { char: "┤", color: colors.grey },
      { char: "·", color: colors.black },
    ],
  },
};

export const goldEdge: Sprite = {
  name: "gold_edge",
  layers: [
    { char: "┼", color: colors.yellow },
    { char: "·", color: colors.black },
  ],
  facing: {
    up: [
      { char: "┴", color: colors.yellow },
      { char: "·", color: colors.black },
    ],
    right: [
      { char: "├", color: colors.yellow },
      { char: "·", color: colors.black },
    ],
    down: [
      { char: "┬", color: colors.yellow },
      { char: "·", color: colors.black },
    ],
    left: [
      { char: "┤", color: colors.yellow },
      { char: "·", color: colors.black },
    ],
  },
};

export const diamondEdge: Sprite = {
  name: "diamond_edge",
  layers: [
    { char: "┼", color: colors.aqua },
    { char: "·", color: colors.black },
  ],
  facing: {
    up: [
      { char: "┴", color: colors.aqua },
      { char: "·", color: colors.black },
    ],
    right: [
      { char: "├", color: colors.aqua },
      { char: "·", color: colors.black },
    ],
    down: [
      { char: "┬", color: colors.aqua },
      { char: "·", color: colors.black },
    ],
    left: [
      { char: "┤", color: colors.aqua },
      { char: "·", color: colors.black },
    ],
  },
};

export const rubyEdge: Sprite = {
  name: "ruby_edge",
  layers: [
    { char: "┼", color: colors.fuchsia },
    { char: "·", color: colors.black },
  ],
  facing: {
    up: [
      { char: "┴", color: colors.fuchsia },
      { char: "·", color: colors.black },
    ],
    right: [
      { char: "├", color: colors.fuchsia },
      { char: "·", color: colors.black },
    ],
    down: [
      { char: "┬", color: colors.fuchsia },
      { char: "·", color: colors.black },
    ],
    left: [
      { char: "┤", color: colors.fuchsia },
      { char: "·", color: colors.black },
    ],
  },
};

export const trap: Sprite = {
  name: "spell_trap",
  layers: [
    { char: "\u011c", color: colors.silver },
    { char: "-", color: colors.black },
  ],
  amounts: {
    single: [
      { char: "\u011c", color: colors.silver },
      { char: "-", color: colors.black },
    ],
    double: [
      { char: "■", color: colors.silver },
      { char: "|", color: colors.black },
      { char: "-", color: colors.black },
    ],
    multiple: [
      { char: "#", color: colors.silver },
      { char: "\u0103", color: colors.black },
    ],
  },
};

export const fireTrap: Sprite = {
  name: "fire_trap",
  layers: [
    { char: "\u011c", color: colors.red },
    { char: "-", color: colors.black },
  ],
  amounts: {
    single: [
      { char: "\u011c", color: colors.red },
      { char: "-", color: colors.black },
    ],
    double: [
      { char: "■", color: colors.red },
      { char: "|", color: colors.black },
      { char: "-", color: colors.black },
    ],
    multiple: [
      { char: "#", color: colors.red },
      { char: "\u0103", color: colors.black },
    ],
  },
};

export const waterTrap: Sprite = {
  name: "water_trap",
  layers: [
    { char: "\u011c", color: colors.blue },
    { char: "-", color: colors.black },
  ],
  amounts: {
    single: [
      { char: "\u011c", color: colors.blue },
      { char: "-", color: colors.black },
    ],
    double: [
      { char: "■", color: colors.blue },
      { char: "|", color: colors.black },
      { char: "-", color: colors.black },
    ],
    multiple: [
      { char: "#", color: colors.blue },
      { char: "\u0103", color: colors.black },
    ],
  },
};

export const earthTrap: Sprite = {
  name: "earth_trap",
  layers: [
    { char: "\u011c", color: colors.lime },
    { char: "-", color: colors.black },
  ],
  amounts: {
    single: [
      { char: "\u011c", color: colors.lime },
      { char: "-", color: colors.black },
    ],
    double: [
      { char: "■", color: colors.lime },
      { char: "|", color: colors.black },
      { char: "-", color: colors.black },
    ],
    multiple: [
      { char: "#", color: colors.lime },
      { char: "\u0103", color: colors.black },
    ],
  },
};

export const createCounter: (amount: number) => Sprite = (amount) => ({
  name: "counter_generic",
  layers: [{ char: amount.toString(), color: colors.red }],
});

export const addBackground = (
  sprites: Sprite[],
  background: string = colors.white,
  char = "█"
) =>
  sprites.map((sprite) => ({
    name: sprite.name,
    layers: [{ char, color: background }, ...sprite.layers],
  }));

export const addForeground = (
  sprites: Sprite[],
  foreground: string,
  char: string
) =>
  sprites.map((sprite) => ({
    name: sprite.name,
    layers: [...sprite.layers, { char, color: foreground }],
  }));

export const strikethrough = (
  sprites: Sprite[],
  color: string = colors.silver
) =>
  sprites.map((sprite) => ({
    name: sprite.name,
    layers: [...sprite.layers, { char: "─", color }],
  }));

export const underline = (sprites: Sprite[], color: string = colors.silver) =>
  sprites.map((sprite) => ({
    name: sprite.name,
    layers: [{ char: "_", color }, ...sprite.layers],
  }));

export const dotted = (sprites: Sprite[], color: string = colors.silver) =>
  underline(addBackground(sprites, colors.black, "▓"), color);

export const shaded = (
  sprites: Sprite[],
  color: string = colors.silver,
  char = "░"
) =>
  sprites.map((sprite) => ({
    name: sprite.name,
    layers: [
      { char, color },
      { char: "▀", color: colors.black },
      ...sprite.layers,
    ],
  }));

export const createText: (
  text: string,
  color?: string,
  background?: string
) => Sprite[] = (text, color = colors.white, background) => {
  const sprites = text.split("").map((char) => ({
    name: "text_generic",
    layers: [{ char, color }],
  }));

  if (background) return addBackground(sprites, background);

  return sprites;
};

export const getOrientedSprite = (
  sprite: Sprite,
  orientation: Orientation
) => ({
  ...sprite,
  layers: getFacingLayers(sprite, orientation),
});

export const select = shaded([none], colors.lime, "▄")[0];
export const shade = shaded([none], colors.grey)[0];
export const dots = dotted([none], colors.red)[0];

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
    { char: "║", color: colors.silver },
    { char: "▌", color: colors.black },
    { char: "│", color: colors.grey },
  ],
};

export const dialogEnd: Sprite = {
  name: "dialog_end",
  layers: [
    { char: "▌", color: colors.silver },
    { char: "║", color: colors.grey },
    { char: "▐", color: colors.black },
  ],
};

export const shoutStart: Sprite = {
  name: "shout_start",
  layers: [
    { char: "▐", color: colors.red },
    { char: "│", color: colors.maroon },
  ],
};

export const shoutEnd: Sprite = {
  name: "shout_end",
  layers: [
    { char: "▌", color: colors.red },
    { char: "│", color: colors.maroon },
  ],
};

export const separatorOut: Sprite = {
  name: "separator_out",
  layers: [
    { char: "▌", color: colors.white },
    { char: "■", color: colors.black },
  ],
};

export const separatorIn: Sprite = {
  name: "separator_in",
  layers: [
    { char: "▐", color: colors.white },
    { char: "■", color: colors.black },
  ],
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

export const createDialog = (...content: (string | Sprite[])[]) => [
  dialogStart,
  ...content
    .map((textOrSprite) =>
      typeof textOrSprite === "string"
        ? createText(textOrSprite, colors.black, colors.white)
        : textOrSprite
    )
    .flat(),
  dialogEnd,
];
export const createAggro = (text: string) => createText(text, colors.red);
export const createShout = (text: string) => [
  shoutStart,
  ...createText(text, colors.black, colors.red),
  shoutEnd,
];
export const createTooltip = (world: World, entity: Entity) => {
  const text = entity[SPRITE].name;
  const enemy = isEnemy(world, entity) && !isNeutral(world, entity);
  const friendly = isTribe(world, entity);
  return [
    enemy
      ? tooltipHostileStart
      : friendly
      ? tooltipFriendlyStart
      : tooltipNeutralStart,
    ...createText(
      text,
      enemy ? colors.maroon : friendly ? colors.green : colors.silver,
      colors.black
    ),
    enemy
      ? tooltipHostileEnd
      : friendly
      ? tooltipFriendlyEnd
      : tooltipNeutralEnd,
  ];
};

export const buttonPalettes = {
  white: { background: colors.white, text: colors.black, shadow: colors.grey },
  silver: {
    background: colors.silver,
    text: colors.black,
    shadow: colors.grey,
  },
  lime: { background: colors.lime, text: colors.black, shadow: colors.green },
  red: { background: colors.red, text: colors.black, shadow: colors.maroon },
  yellow: {
    background: colors.yellow,
    text: colors.black,
    shadow: colors.olive,
  },
} as const;
export type Palette = keyof typeof buttonPalettes;

export const getButton = (palette: Palette): Sprite => ({
  name: "button_empty",
  layers: [{ char: "█", color: buttonPalettes[palette].background }],
});

export const getButtonDisabled = (palette: Palette): Sprite => ({
  name: "button_disabled",
  layers: [
    { char: "█", color: buttonPalettes[palette].shadow },
    { char: "░", color: buttonPalettes[palette].text },
  ],
});

export const getButtonLeftUp = (palette: Palette): Sprite => ({
  name: "button_left_up",
  layers: [
    { char: "▄", color: buttonPalettes[palette].background },
    { char: "░", color: buttonPalettes[palette].text },
    { char: "▌", color: buttonPalettes[palette].text },
    { char: "┌", color: buttonPalettes[palette].shadow },
  ],
});

export const getButtonUp = (palette: Palette): Sprite => ({
  name: "button_up",
  layers: [
    { char: "▄", color: buttonPalettes[palette].background },
    { char: "░", color: buttonPalettes[palette].text },
    { char: "─", color: buttonPalettes[palette].shadow },
  ],
});

export const getButtonUpRight = (palette: Palette): Sprite => ({
  name: "button_up_right",
  layers: [
    { char: "▄", color: buttonPalettes[palette].background },
    { char: "░", color: buttonPalettes[palette].text },
    { char: "▐", color: buttonPalettes[palette].text },
    { char: "┐", color: buttonPalettes[palette].shadow },
  ],
});

export const getButtonRightDown = (palette: Palette): Sprite => ({
  name: "button_right_down",
  layers: [
    { char: "▀", color: buttonPalettes[palette].background },
    { char: "░", color: buttonPalettes[palette].text },
    { char: "▐", color: buttonPalettes[palette].text },
    { char: "┘", color: buttonPalettes[palette].shadow },
  ],
});

export const getButtonDown = (palette: Palette): Sprite => ({
  name: "button_down",
  layers: [
    { char: "▀", color: buttonPalettes[palette].background },
    { char: "░", color: buttonPalettes[palette].text },
    { char: "─", color: buttonPalettes[palette].shadow },
  ],
});

export const getButtonDownLeft = (palette: Palette): Sprite => ({
  name: "button_down_left",
  layers: [
    { char: "▀", color: buttonPalettes[palette].background },
    { char: "░", color: buttonPalettes[palette].text },
    { char: "▌", color: buttonPalettes[palette].text },
    { char: "└", color: buttonPalettes[palette].shadow },
  ],
});

export const createButton: (
  text: string,
  width: number,
  disabled?: boolean,
  pressed?: boolean,
  highlight?: number,
  palette?: Palette
) => [Sprite[], Sprite[]] = (
  text,
  width,
  disabled = false,
  pressed = false,
  highlight,
  palette = "white"
) => {
  const { text: textColor } = buttonPalettes[palette];
  const sprites = createText(text, textColor);
  return createSpriteButton(
    sprites,
    width,
    disabled,
    pressed,
    highlight,
    palette
  );
};

export const createSpriteButton: (
  sprites: Sprite[],
  width: number,
  disabled?: boolean,
  pressed?: boolean,
  highlight?: number,
  palette?: Palette
) => [Sprite[], Sprite[]] = (
  sprites,
  width,
  disabled = false,
  pressed = false,
  highlight,
  palette = "white"
) => {
  const paddingLeft = Math.max(0, Math.floor((width - sprites.length - 1) / 2));
  const paddingRight = Math.max(0, Math.ceil((width - sprites.length - 1) / 2));
  const activeHighlight = !disabled && highlight;
  const { shadow } = buttonPalettes[palette];

  if (pressed) {
    return [
      [
        getButtonLeftUp(palette),
        ...repeat(getButtonUp(palette), width - 2),
        getButtonUpRight(palette),
      ],
      [
        getButtonDownLeft(palette),
        ...repeat(getButtonDown(palette), width - 2),
        getButtonRightDown(palette),
      ],
    ];
  }

  const button = getButton(palette);
  const buttonDisabled = getButtonDisabled(palette);

  return [
    [
      ...repeat(disabled ? buttonDisabled : button, paddingLeft),
      ...sprites.map((sprite) => ({
        name: "button_generic",
        layers: [
          ...(disabled ? buttonDisabled.layers : button.layers),
          ...sprite.layers,
        ],
      })),
      ...repeat(disabled ? buttonDisabled : button, paddingRight),
      ...createText(activeHighlight === width ? " " : "┐", shadow),
    ],
    createText(
      `└${"─".repeat(width - 2)}┘`
        .split("")
        .map((char, index) => (index === activeHighlight ? " " : char))
        .join(""),
      shadow
    ),
  ];
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

export const popupBlocked: Sprite = {
  name: "popup_blocked",
  layers: [
    { char: ">", color: colors.red },
    { char: "▒", color: colors.black },
  ],
};

export const missing: Sprite = {
  name: "???????",
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
    { char: "█", color: colors.silver },
    { char: "░", color: colors.black },
    { char: "│", color: colors.black },
    { char: "║", color: colors.silver },
  ],
  facing: {
    up: [
      { char: "▐", color: colors.silver },
      { char: "░", color: colors.black },
      { char: "│", color: colors.silver },
    ],
    right: [
      { char: "▄", color: colors.black },
      { char: "▐", color: colors.silver },
      { char: "░", color: colors.black },
      { char: "╡", color: colors.silver },
    ],
    down: [
      { char: "▌", color: colors.silver },
      { char: "░", color: colors.black },
      { char: "│", color: colors.silver },
    ],
    left: [
      { char: "▄", color: colors.black },
      { char: "▌", color: colors.silver },
      { char: "░", color: colors.black },
      { char: "╞", color: colors.silver },
    ],
  },
};

export const popupSeparatorSelected: Sprite = {
  name: "popup_separator_selected",
  layers: [
    { char: "▌", color: colors.silver },
    { char: "░", color: colors.black },
    { char: "▐", color: colors.black },
    { char: "│", color: colors.black },
    { char: "║", color: colors.silver },
  ],
  facing: {
    up: [
      { char: "▐", color: colors.black },
      { char: "│", color: colors.silver },
    ],
    right: [
      { char: "▄", color: colors.black },
      { char: "▐", color: colors.black },
      { char: "╡", color: colors.silver },
    ],
    down: [
      { char: "▌", color: colors.black },
      { char: "│", color: colors.silver },
    ],
    left: [
      { char: "▄", color: colors.black },
      { char: "▌", color: colors.black },
      { char: "╞", color: colors.silver },
    ],
  },
};

export const popupSeparatorInverted: Sprite = {
  name: "popup_separator_inverted",
  layers: [
    { char: "▐", color: colors.silver },
    { char: "░", color: colors.black },
    { char: "▌", color: colors.black },
    { char: "│", color: colors.black },
    { char: "║", color: colors.silver },
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

export const mergeSprites = (...sprite: Sprite[]) => ({
  name: "",
  layers: sprite.reduce(
    (merged, { layers }) => merged.concat(layers),
    [] as Layer[]
  ),
});

const nonCountable = (sprite: Sprite) => ({
  name: sprite.name,
  layers: sprite.layers,
});

export const minCountable = (sprite: Sprite) => ({
  name: sprite.name,
  layers: sprite.amounts?.single || sprite.layers,
});

export const maxCountable = (sprite: Sprite) => ({
  name: sprite.name,
  layers: sprite.amounts?.multiple || sprite.layers,
});

type Stats = UnitStats & ItemStats;

const statConfig: Record<
  keyof Stats,
  {
    color: string;
    background?: string;
    sprite: Sprite;
    drop?: Sprite;
    max?: keyof Countable;
    resource?: Sprite;
    display?: Sprite;
  }
> = {
  hp: {
    color: colors.red,
    background: colors.maroon,
    sprite: heart,
    max: "maxHp",
  },
  maxHp: { color: colors.maroon, sprite: heartUp, max: "maxHpCap" },
  maxHpCap: { color: colors.maroon, sprite: heartUp },
  mp: {
    color: colors.blue,
    background: colors.navy,
    sprite: mana,
    max: "maxMp",
  },
  maxMp: { color: colors.navy, sprite: manaUp, max: "maxMpCap" },
  maxMpCap: { color: colors.navy, sprite: manaUp },
  xp: {
    color: colors.lime,
    background: colors.green,
    sprite: nonCountable(xp),
    drop: xp,
    resource: xp,
    max: "maxXp",
  },
  maxXp: { color: colors.green, sprite: nonCountable(xp), max: "maxXpCap" },
  maxXpCap: { color: colors.green, sprite: nonCountable(xp) },
  level: {
    color: colors.silver,
    sprite: level,
  },
  power: {
    color: colors.green,
    sprite: power,
  },
  wisdom: {
    color: colors.green,
    sprite: wisdom,
  },
  armor: {
    color: colors.green,
    sprite: armor,
  },
  resist: {
    color: colors.green,
    sprite: resist,
  },
  haste: {
    color: colors.green,
    sprite: haste,
  },
  vision: {
    color: colors.green,
    sprite: vision,
  },
  damp: {
    color: colors.olive,
    sprite: damp,
  },
  thaw: {
    color: colors.teal,
    sprite: thaw,
  },
  spike: {
    color: colors.maroon,
    sprite: spike,
  },
  melee: {
    color: colors.red,
    sprite: minCountable(meleeHit),
  },
  magic: {
    color: colors.fuchsia,
    sprite: minCountable(magicHit),
  },
  true: {
    color: colors.fuchsia,
    sprite: minCountable(magicHit),
  },
  burn: {
    color: colors.yellow,
    sprite: maxCountable(fire),
  },
  freeze: {
    color: colors.aqua,
    sprite: maxCountable(freeze),
  },
  heal: {
    color: colors.lime,
    sprite: heal,
  },
  drain: {
    color: colors.purple,
    sprite: drain,
  },
};

export const createCountable = (
  stats: Partial<Stats>,
  stat: keyof Stats,
  display:
    | "text"
    | "countable"
    | "max"
    | "cap"
    | "display"
    | "progression" = "text"
) => {
  const displayedStat = display === "progression" ? getMaxCounter(stat) : stat;
  if (!displayedStat || !(displayedStat in stats)) return [];

  // const counter = stat as keyof Countable;
  const value = Math.ceil(stats[displayedStat] || 0);
  const stringified = value.toString();
  const color = statConfig[stat].color;

  const maxCounter = getMaxCounter(stat) || stat;
  const capCounter = getMaxCounter(maxCounter) || maxCounter;

  if (display === "cap") {
    return createText(stringified.padEnd(2, " "), color);
  } else if (display === "text") {
    return [...createText(stringified, color), getStatSprite(stat)];
  } else if (display === "display") {
    return [
      ...createText(stringified, color),
      getStatSprite(stat),
      ...createText(statConfig[stat].sprite.name, color),
    ];
  } else if (display === "progression") {
    return [
      ...createText((stats[maxCounter] || 0).toString(), color),
      getStatSprite(stat),
      ...createText(statConfig[stat].sprite.name, color),
    ];
  }

  return [
    ...createText(stringified.padStart(2, " "), color),
    getStatSprite(
      display === "max" &&
        maxCounter !== capCounter &&
        stats[maxCounter] === stats[capCounter]
        ? maxCounter
        : stat,
      display === "countable" ? "display" : undefined
    ),
  ];
};

export const getMaxCounter = (stat: keyof Stats) =>
  statConfig[stat] && statConfig[stat]?.max;

export const getStatColor = (stat: keyof Stats) => statConfig[stat].color;

export const getStatSprite = (
  stat: keyof Stats,
  variant?: "max" | "drop" | "resource" | "display"
) =>
  (variant === "max" && statConfig[getMaxCounter(stat) || stat]?.sprite) ||
  (variant === "drop" && statConfig[stat].drop) ||
  (variant === "resource" && statConfig[stat].resource) ||
  (variant === "display" && statConfig[stat].display) ||
  statConfig[stat].sprite;

const progressResolution = 2;
export const createProgress = (
  stats: Partial<Stats>,
  stat: keyof Stats,
  width: number,
  depletable = true
) => {
  const config = statConfig[stat];
  const background = config.background || colors.grey;
  const maximum = (config.max && stats[config.max]) ?? 99;
  const value = Math.min(stats[stat] ?? 0, maximum);
  const display =
    depletable || value === 0 || value >= 1 ? Math.floor(value) : 1;
  const progress = lerp(0, width, value / (maximum || 1));
  const full = Math.floor(progress);
  const partial = normalize(progress, 1);
  const segment = Math.floor(partial * progressResolution);

  const text = padCenter(
    ` ${display.toString().padStart(2, " ")}/${(stats[config.max!] ?? 99)
      .toString()
      .padEnd(2, " ")}`,
    width - 3
  );
  const sprites = [
    ...createText(text, config.color),
    ...repeat(none, width - text.length - stat.length - 1),
    config.sprite,
    ...createText(stat.toUpperCase(), config.color),
  ];

  return [
    ...createText("█".repeat(full), background),
    ...(full < width
      ? [
          {
            name: "progress",
            layers: [[], [{ char: "▌", color: background }]][
              full === 0 && partial > 0 && !depletable ? 1 : segment
            ],
          },
        ]
      : []),
    ...repeat(none, width - full - 1),
  ].map((sprite, index) => ({
    ...sprite,
    layers: [
      { char: "░", color: background },
      ...sprite.layers,
      { char: "▀", color: colors.black },
      ...sprites[index].layers,
    ],
  }));
};

export const colorToCode = (color: string) =>
  String.fromCharCode(orderedColors.indexOf(color));

export const parseSprite = (definition: string) => {
  let colorCode = orderedColors.indexOf(colors.white);
  return {
    name: "",
    layers: definition
      .split("")
      .map((layer) => {
        const charCode = layer.charCodeAt(0);
        if (charCode < 16) {
          colorCode = charCode;
          return null;
        }
        return {
          char: layer,
          color: orderedColors[colorCode],
        };
      })
      .filter((layer) => !!layer) as Sprite["layers"],
  };
};

export const stretch = (left: Sprite[], right: Sprite[], width: number) =>
  [
    ...left,
    ...repeat(none, width - left.length - right.length),
    ...right,
  ].slice(0, width);

export const discovery = createText("°", colors.lime)[0];
export const quest = createText("?", colors.lime)[0];
export const ongoing = createText("?", colors.silver)[0];
export const info = createText("i", colors.lime)[0];
export const shop = createText("$", colors.lime)[0];
export const craft = createText("¢", colors.lime)[0];
export const forge = createText("ƒ", colors.lime)[0];
export const class_ = createText("\u010b", colors.lime)[0];

export const rage = createAggro("\u0112")[0];

export const sleep1 = createText("z", colors.white)[0];
export const sleep2 = createText("Z", colors.white)[0];

export const whistle1 = createText("\u010c", colors.white)[0];
export const whistle2 = createText("\u010d", colors.white)[0];

export const confused = createText("?", colors.white)[0];

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
    { char: "■", color: colors.white },
    { char: "|", color: colors.black },
  ],
};

export const pauseInvert: Sprite = {
  name: "Pause",
  layers: [
    { char: "█", color: colors.silver },
    { char: "■", color: colors.black },
    { char: "|", color: colors.silver },
  ],
};

export const resume: Sprite = {
  name: "Resume",
  layers: [{ char: "»", color: colors.white }],
};

export const resumeInvert: Sprite = {
  name: "Resume",
  layers: [
    { char: "█", color: colors.lime },
    { char: "»", color: colors.black },
  ],
};

export const inspect: Sprite = {
  name: "Inspect",
  layers: [{ char: "?", color: colors.white }],
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

export const mapPlayer: Sprite = {
  name: "Map",
  layers: [{ char: "\u010b", color: colors.lime }],
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
  layers: [{ char: "x", color: colors.white }],
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

export const slotLeft: Sprite = {
  name: "slot_left",
  layers: [
    { char: "▐", color: colors.grey },
    { char: "│", color: colors.black },
  ],
};

export const slotRight: Sprite = {
  name: "slot_right",
  layers: [
    { char: "▌", color: colors.grey },
    { char: "│", color: colors.black },
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

export const swordSlot: Sprite = {
  name: "Sword",
  layers: [
    { char: "M", color: colors.grey },
    { char: "[", color: colors.grey },
    { char: "]", color: colors.grey },
    { char: "\u0114", color: colors.grey },
    { char: "\u0110", color: colors.grey },
    { char: "¼", color: colors.grey },
    { char: "_", color: colors.black },

    { char: "/", color: colors.black },
  ],
};

export const shieldSlot: Sprite = {
  name: "Shield",
  layers: [
    { char: "M", color: colors.grey },
    { char: "[", color: colors.grey },
    { char: "]", color: colors.grey },
    { char: "\u0114", color: colors.grey },
    { char: "\u0110", color: colors.grey },
    { char: "¼", color: colors.grey },
    { char: "_", color: colors.black },

    { char: "¬", color: colors.black },
  ],
};

export const bootsSlot: Sprite = {
  name: "Boots",
  layers: [
    { char: "M", color: colors.grey },
    { char: "[", color: colors.grey },
    { char: "]", color: colors.grey },
    { char: "\u0114", color: colors.grey },
    { char: "\u0110", color: colors.grey },
    { char: "¼", color: colors.grey },
    { char: "_", color: colors.black },

    { char: "\u0116", color: colors.black },
    { char: "\u0111", color: colors.grey },
    { char: "¡", color: colors.black },
    { char: "|", color: colors.grey },
  ],
};

export const primarySlot: Sprite = {
  name: "Spell",
  layers: [
    { char: "M", color: colors.grey },
    { char: "[", color: colors.grey },
    { char: "]", color: colors.grey },
    { char: "\u0114", color: colors.grey },
    { char: "\u0110", color: colors.grey },
    { char: "¼", color: colors.grey },
    { char: "_", color: colors.black },

    { char: "\u0103", color: colors.black },
  ],
};

export const waveSlot: Sprite = {
  name: "Spell",
  layers: [
    { char: "M", color: colors.grey },
    { char: "[", color: colors.grey },
    { char: "]", color: colors.grey },
    { char: "\u0114", color: colors.grey },
    { char: "\u0110", color: colors.grey },
    { char: "¼", color: colors.grey },
    { char: "_", color: colors.black },

    { char: "*", color: colors.black },
    { char: "■", color: colors.grey },
    { char: "-", color: colors.black },
    { char: "|", color: colors.black },
    { char: "·", color: colors.grey },
    { char: "~", color: colors.grey },
  ],
};

export const beamSlot: Sprite = {
  name: "Spell",
  layers: [
    { char: "M", color: colors.grey },
    { char: "[", color: colors.grey },
    { char: "]", color: colors.grey },
    { char: "\u0114", color: colors.grey },
    { char: "\u0110", color: colors.grey },
    { char: "¼", color: colors.grey },
    { char: "_", color: colors.black },

    { char: "±", color: colors.black },
    { char: "■", color: colors.black },
    { char: "\u0108", color: colors.grey },
    { char: "\u0106", color: colors.black },
    { char: "∙", color: colors.black },
  ],
};

export const secondarySlot: Sprite = {
  name: "Item",
  layers: [
    { char: "M", color: colors.grey },
    { char: "[", color: colors.grey },
    { char: "]", color: colors.grey },
    { char: "\u0114", color: colors.grey },
    { char: "\u0110", color: colors.grey },
    { char: "¼", color: colors.grey },
    { char: "_", color: colors.black },

    { char: "»", color: colors.black },
  ],
};

export const bowSlot: Sprite = {
  name: "Item",
  layers: [
    { char: "M", color: colors.grey },
    { char: "[", color: colors.grey },
    { char: "]", color: colors.grey },
    { char: "\u0114", color: colors.grey },
    { char: "\u0110", color: colors.grey },
    { char: "¼", color: colors.grey },
    { char: "_", color: colors.black },

    { char: "}", color: colors.black },
  ],
};

export const slashSlot: Sprite = {
  name: "Item",
  layers: [
    { char: "M", color: colors.grey },
    { char: "[", color: colors.grey },
    { char: "]", color: colors.grey },
    { char: "\u0114", color: colors.grey },
    { char: "\u0110", color: colors.grey },
    { char: "¼", color: colors.grey },
    { char: "_", color: colors.black },

    { char: "@", color: colors.black },
  ],
};

export const ringSlot: Sprite = {
  name: "Ring",
  layers: [
    { char: "M", color: colors.grey },
    { char: "[", color: colors.grey },
    { char: "]", color: colors.grey },
    { char: "\u0114", color: colors.grey },
    { char: "\u0110", color: colors.grey },
    { char: "¼", color: colors.grey },
    { char: "_", color: colors.black },

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
    { char: "M", color: colors.grey },
    { char: "[", color: colors.grey },
    { char: "]", color: colors.grey },
    { char: "\u0114", color: colors.grey },
    { char: "\u0110", color: colors.grey },
    { char: "¼", color: colors.grey },
    { char: "_", color: colors.black },

    { char: "t", color: colors.black },
    { char: "\u0112", color: colors.grey },
    { char: "U", color: colors.grey },
    { char: "\u0115", color: colors.grey },
    { char: "\u0119", color: colors.black },
    { char: "\u011a", color: colors.black },
  ],
};

export const compassSlot: Sprite = {
  name: "Compass",
  layers: [
    { char: "M", color: colors.grey },
    { char: "[", color: colors.grey },
    { char: "]", color: colors.grey },
    { char: "\u0114", color: colors.grey },
    { char: "\u0110", color: colors.grey },
    { char: "¼", color: colors.grey },
    { char: "_", color: colors.black },

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
    { char: "M", color: colors.grey },
    { char: "[", color: colors.grey },
    { char: "]", color: colors.grey },
    { char: "\u0114", color: colors.grey },
    { char: "\u0110", color: colors.grey },
    { char: "¼", color: colors.grey },
    { char: "_", color: colors.black },

    { char: "┐", color: colors.black },
    { char: "-", color: colors.grey },
    { char: "*", color: colors.black },
    { char: "∙", color: colors.grey },
  ],
};

export const mapSlot: Sprite = {
  name: "Map",
  layers: [
    { char: "M", color: colors.grey },
    { char: "[", color: colors.grey },
    { char: "]", color: colors.grey },
    { char: "\u0114", color: colors.grey },
    { char: "\u0110", color: colors.grey },
    { char: "¼", color: colors.grey },
    { char: "_", color: colors.black },

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
