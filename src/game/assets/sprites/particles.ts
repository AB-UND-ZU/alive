import * as colors from "../colors";
import { Sprite } from "../../../engine/components/sprite";
import { Countable, Stats } from "../../../engine/components/stats";
import {
  armor,
  berry,
  berryDrop,
  coin,
  flower,
  flowerDrop,
  haste,
  heart,
  heartUp,
  leaf,
  level,
  magic,
  mana,
  manaUp,
  ore,
  oreDrop,
  power,
  stick,
  xp,
} from "./items";
import { repeat } from "../../math/std";

export const block: Sprite = {
  name: "block_solid",
  layers: [{ char: "█", color: colors.maroon }],
};

export const blockDown: Sprite = {
  name: "block_down",
  layers: [{ char: "▄", color: colors.maroon }],
};

export const blockUp: Sprite = {
  name: "block_up",
  layers: [{ char: "▀", color: colors.maroon }],
};

export const frozen: Sprite = {
  name: "water_frozen",
  layers: [{ char: "▓", color: colors.aqua }],
};

export const hit: Sprite = {
  name: "hit_melee",
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

export const heal = xp;

export const stream: Sprite = {
  name: "water_stream",
  layers: [{ char: "≈", color: colors.blue }],
};

export const wave: Sprite = {
  name: "spell_wave",
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

export const defaultWave: Sprite = {
  name: "default_wave",
  layers: [
    { char: "┼", color: colors.white },
    { char: "·", color: colors.black },
  ],
  facing: {
    up: [{ char: "─", color: colors.white }],
    right: [{ char: "│", color: colors.white }],
    down: [{ char: "─", color: colors.white }],
    left: [{ char: "│", color: colors.white }],
  },
};

export const fireWave: Sprite = {
  name: "fire_wave",
  layers: [
    { char: "┼", color: colors.red },
    { char: "·", color: colors.black },
  ],
  facing: {
    up: [{ char: "─", color: colors.red }],
    right: [{ char: "│", color: colors.red }],
    down: [{ char: "─", color: colors.red }],
    left: [{ char: "│", color: colors.red }],
  },
};

export const waterWave: Sprite = {
  name: "water_wave",
  layers: [
    { char: "┼", color: colors.blue },
    { char: "·", color: colors.black },
  ],
  facing: {
    up: [{ char: "─", color: colors.blue }],
    right: [{ char: "│", color: colors.blue }],
    down: [{ char: "─", color: colors.blue }],
    left: [{ char: "│", color: colors.blue }],
  },
};

export const earthWave: Sprite = {
  name: "earth_wave",
  layers: [
    { char: "┼", color: colors.lime },
    { char: "·", color: colors.black },
  ],
  facing: {
    up: [{ char: "─", color: colors.lime }],
    right: [{ char: "│", color: colors.lime }],
    down: [{ char: "─", color: colors.lime }],
    left: [{ char: "│", color: colors.lime }],
  },
};

export const waveCorner: Sprite = {
  name: "spell_corner",
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

export const defaultWaveCorner: Sprite = {
  name: "default_corner",
  layers: [],
  facing: {
    up: [
      { char: "┐", color: colors.white },
      { char: "·", color: colors.black },
    ],
    right: [
      { char: "┘", color: colors.white },
      { char: "·", color: colors.black },
    ],
    down: [
      { char: "└", color: colors.white },
      { char: "·", color: colors.black },
    ],
    left: [
      { char: "┌", color: colors.white },
      { char: "·", color: colors.black },
    ],
  },
};

export const fireWaveCorner: Sprite = {
  name: "fire_corner",
  layers: [],
  facing: {
    up: [
      { char: "┐", color: colors.red },
      { char: "·", color: colors.black },
    ],
    right: [
      { char: "┘", color: colors.red },
      { char: "·", color: colors.black },
    ],
    down: [
      { char: "└", color: colors.red },
      { char: "·", color: colors.black },
    ],
    left: [
      { char: "┌", color: colors.red },
      { char: "·", color: colors.black },
    ],
  },
};

export const waterWaveCorner: Sprite = {
  name: "water_corner",
  layers: [],
  facing: {
    up: [
      { char: "┐", color: colors.blue },
      { char: "·", color: colors.black },
    ],
    right: [
      { char: "┘", color: colors.blue },
      { char: "·", color: colors.black },
    ],
    down: [
      { char: "└", color: colors.blue },
      { char: "·", color: colors.black },
    ],
    left: [
      { char: "┌", color: colors.blue },
      { char: "·", color: colors.black },
    ],
  },
};

export const earthWaveCorner: Sprite = {
  name: "earth_corner",
  layers: [],
  facing: {
    up: [
      { char: "┐", color: colors.lime },
      { char: "·", color: colors.black },
    ],
    right: [
      { char: "┘", color: colors.lime },
      { char: "·", color: colors.black },
    ],
    down: [
      { char: "└", color: colors.lime },
      { char: "·", color: colors.black },
    ],
    left: [
      { char: "┌", color: colors.lime },
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

export const fire: Sprite = {
  name: "fire_burn",
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

export const freeze: Sprite = {
  name: "unit_freeze",
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
    { char: "'", color: colors.maroon },
    { char: "`", color: colors.grey },
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
  layers: [{ char: "┼", color: colors.maroon }],
  facing: {
    up: [{ char: "─", color: colors.maroon }],
    right: [{ char: "┘", color: colors.maroon }],
    down: [{ char: "─", color: colors.maroon }],
    left: [{ char: "│", color: colors.maroon }],
  },
};

export const ironSlashSide: Sprite = {
  name: "iron_slash_side",
  layers: [{ char: "┼", color: colors.grey }],
  facing: {
    up: [{ char: "─", color: colors.grey }],
    right: [{ char: "┘", color: colors.grey }],
    down: [{ char: "─", color: colors.grey }],
    left: [{ char: "│", color: colors.grey }],
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

export const beam: Sprite = {
  name: "spell_beam",
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

export const defaultBeam: Sprite = {
  name: "default_beam",
  layers: [{ char: "∙", color: colors.white }],
  amounts: {
    single: [{ char: "∙", color: colors.white }],
    double: [
      { char: "\u0106", color: colors.white },
      { char: "∙", color: colors.silver },
    ],
    multiple: [
      { char: "\u0108", color: colors.white },
      { char: "\u0106", color: colors.silver },
    ],
  },
};

export const fireBeam: Sprite = {
  name: "fire_beam",
  layers: [{ char: "∙", color: colors.red }],
  amounts: {
    single: [{ char: "∙", color: colors.red }],
    double: [
      { char: "\u0106", color: colors.red },
      { char: "∙", color: colors.maroon },
    ],
    multiple: [
      { char: "\u0108", color: colors.red },
      { char: "\u0106", color: colors.maroon },
    ],
  },
};

export const waterBeam: Sprite = {
  name: "water_beam",
  layers: [{ char: "∙", color: colors.blue }],
  amounts: {
    single: [{ char: "∙", color: colors.blue }],
    double: [
      { char: "\u0106", color: colors.blue },
      { char: "∙", color: colors.navy },
    ],
    multiple: [
      { char: "\u0108", color: colors.blue },
      { char: "\u0106", color: colors.navy },
    ],
  },
};

export const earthBeam: Sprite = {
  name: "earth_beam",
  layers: [{ char: "∙", color: colors.lime }],
  amounts: {
    single: [{ char: "∙", color: colors.lime }],
    double: [
      { char: "\u0106", color: colors.lime },
      { char: "∙", color: colors.green },
    ],
    multiple: [
      { char: "\u0108", color: colors.lime },
      { char: "\u0106", color: colors.green },
    ],
  },
};

export const edge: Sprite = {
  name: "beam_edge",
  layers: [
    { char: "┼", color: colors.silver },
    { char: "·", color: colors.black },
  ],
  facing: {
    up: [
      { char: "┴", color: colors.silver },
      { char: "·", color: colors.black },
    ],
    right: [
      { char: "├", color: colors.silver },
      { char: "·", color: colors.black },
    ],
    down: [
      { char: "┬", color: colors.silver },
      { char: "·", color: colors.black },
    ],
    left: [
      { char: "┤", color: colors.silver },
      { char: "·", color: colors.black },
    ],
  },
};

export const defaultEdge: Sprite = {
  name: "default_edge",
  layers: [
    { char: "┼", color: colors.white },
    { char: "·", color: colors.black },
  ],
  facing: {
    up: [
      { char: "┴", color: colors.white },
      { char: "·", color: colors.black },
    ],
    right: [
      { char: "├", color: colors.white },
      { char: "·", color: colors.black },
    ],
    down: [
      { char: "┬", color: colors.white },
      { char: "·", color: colors.black },
    ],
    left: [
      { char: "┤", color: colors.white },
      { char: "·", color: colors.black },
    ],
  },
};

export const fireEdge: Sprite = {
  name: "fire_edge",
  layers: [
    { char: "┼", color: colors.red },
    { char: "·", color: colors.black },
  ],
  facing: {
    up: [
      { char: "┴", color: colors.red },
      { char: "·", color: colors.black },
    ],
    right: [
      { char: "├", color: colors.red },
      { char: "·", color: colors.black },
    ],
    down: [
      { char: "┬", color: colors.red },
      { char: "·", color: colors.black },
    ],
    left: [
      { char: "┤", color: colors.red },
      { char: "·", color: colors.black },
    ],
  },
};

export const waterEdge: Sprite = {
  name: "water_edge",
  layers: [
    { char: "┼", color: colors.blue },
    { char: "·", color: colors.black },
  ],
  facing: {
    up: [
      { char: "┴", color: colors.blue },
      { char: "·", color: colors.black },
    ],
    right: [
      { char: "├", color: colors.blue },
      { char: "·", color: colors.black },
    ],
    down: [
      { char: "┬", color: colors.blue },
      { char: "·", color: colors.black },
    ],
    left: [
      { char: "┤", color: colors.blue },
      { char: "·", color: colors.black },
    ],
  },
};

export const earthEdge: Sprite = {
  name: "earth_edge",
  layers: [
    { char: "┼", color: colors.lime },
    { char: "·", color: colors.black },
  ],
  facing: {
    up: [
      { char: "┴", color: colors.lime },
      { char: "·", color: colors.black },
    ],
    right: [
      { char: "├", color: colors.lime },
      { char: "·", color: colors.black },
    ],
    down: [
      { char: "┬", color: colors.lime },
      { char: "·", color: colors.black },
    ],
    left: [
      { char: "┤", color: colors.lime },
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
  background: string = colors.white
) =>
  sprites.map((sprite) => ({
    name: sprite.name,
    layers: [{ char: "█", color: background }, ...sprite.layers],
  }));

export const createText: (
  text: string,
  color: string,
  background?: string
) => Sprite[] = (text, color, background) => {
  const sprites = text.split("").map((char) => ({
    name: "text_generic",
    layers: [{ char, color }],
  }));

  if (background) return addBackground(sprites, background);

  return sprites;
};

export const tooltipStart: Sprite = {
  name: "tooltip_start",
  layers: [
    { char: "▐", color: colors.black },
    { char: "│", color: colors.silver },
  ],
};

export const tooltipEnd: Sprite = {
  name: "tooltip_end",
  layers: [
    { char: "▌", color: colors.black },
    { char: "│", color: colors.silver },
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
export const createTooltip = (text: string) => [
  tooltipStart,
  ...createText(text, colors.silver, colors.black),
  tooltipEnd,
];

export const buttonPalettes = {
  white: { background: colors.white, text: colors.black, shadow: colors.grey },
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
  palette?: Palette,
  textColor?: string,
  disabledColor?: string
) => [Sprite[], Sprite[]] = (
  text,
  width,
  disabled = false,
  pressed = false,
  highlight,
  palette = "white"
) => {
  const paddingLeft = Math.max(0, Math.floor((width - text.length - 1) / 2));
  const paddingRight = Math.max(0, Math.ceil((width - text.length - 1) / 2));
  const activeHighlight = !disabled && highlight;
  const { text: textColor, shadow } = buttonPalettes[palette];

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

  const sprites = createText(text, textColor);
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
      ...createText(activeHighlight === 6 ? " " : "┐", shadow),
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

export const buySelection: Sprite = {
  name: "buy_selection",
  layers: [{ char: "\u0119", color: colors.lime }],
};

export const sellSelection: Sprite = {
  name: "sell_selection",
  layers: [{ char: "\u011a", color: colors.lime }],
};

export const popupCorner: Sprite = {
  name: "popup_corner",
  layers: [{ char: "╬", color: colors.white }],
  facing: {
    up: [{ char: "╔", color: colors.white }],
    right: [{ char: "╗", color: colors.white }],
    down: [{ char: "╝", color: colors.white }],
    left: [{ char: "╚", color: colors.white }],
  },
};

export const popupSide: Sprite = {
  name: "popup_side",
  layers: [{ char: "╬", color: colors.white }],
  facing: {
    up: [
      { char: "▄", color: colors.black },
      { char: "═", color: colors.white },
    ],
    right: [
      { char: "▌", color: colors.black },
      { char: "║", color: colors.white },
    ],
    down: [
      { char: "▀", color: colors.black },
      { char: "═", color: colors.white },
    ],
    left: [
      { char: "▐", color: colors.black },
      { char: "║", color: colors.white },
    ],
  },
};

export const popupUpStart: Sprite = {
  name: "popup_up_start",
  layers: [
    { char: "▄", color: colors.black },
    { char: "▐", color: colors.black },
    { char: "╡", color: colors.white },
  ],
};

export const popupUpEnd: Sprite = {
  name: "popup_up_end",
  layers: [
    { char: "▄", color: colors.black },
    { char: "▌", color: colors.black },
    { char: "╞", color: colors.white },
  ],
};

export const popupDownStart: Sprite = {
  name: "popup_down_start",
  layers: [
    { char: "▀", color: colors.black },
    { char: "▐", color: colors.black },
    { char: "╡", color: colors.white },
  ],
};

export const popupDownEnd: Sprite = {
  name: "popup_down_end",
  layers: [
    { char: "▀", color: colors.black },
    { char: "▌", color: colors.black },
    { char: "╞", color: colors.white },
  ],
};

const nonCountable = (sprite: Sprite) => ({
  name: sprite.name,
  layers: sprite.layers,
});

const maxCountable = (sprite: Sprite) => ({
  name: sprite.name,
  layers: sprite.amounts?.multiple || sprite.layers,
});

const statConfig: Record<
  keyof Stats,
  {
    color: string;
    sprite: Sprite;
    drop?: Sprite;
    max?: keyof Countable;
    resource?: Sprite;
    display?: Sprite;
  }
> = {
  hp: { color: colors.red, sprite: heart, max: "maxHp" },
  maxHp: { color: "#404040", sprite: heartUp, max: "maxHpCap" },
  maxHpCap: { color: "#404040", sprite: heartUp },
  mp: { color: colors.blue, sprite: mana, max: "maxMp" },
  maxMp: { color: "#404040", sprite: manaUp, max: "maxMpCap" },
  maxMpCap: { color: "#404040", sprite: manaUp },
  xp: {
    color: colors.lime,
    sprite: nonCountable(xp),
    drop: xp,
    resource: xp,
    max: "maxXp",
  },
  maxXp: { color: "#404040", sprite: nonCountable(xp), max: "maxXpCap" },
  maxXpCap: { color: "#404040", sprite: nonCountable(xp) },
  level: {
    color: colors.white,
    sprite: level,
  },
  coin: {
    color: colors.yellow,
    sprite: nonCountable(coin),
    drop: coin,
    resource: coin,
  },
  stick: { color: colors.maroon, sprite: stick, display: maxCountable(stick) },
  ore: {
    color: colors.silver,
    sprite: oreDrop,
    resource: ore,
    display: maxCountable(oreDrop),
  },
  flower: {
    color: colors.teal,
    sprite: flower,
    drop: flowerDrop,
    resource: flower,
    display: maxCountable(flower),
  },
  berry: {
    color: colors.purple,
    sprite: berry,
    drop: berryDrop,
    resource: berry,
    display: maxCountable(berry),
  },
  leaf: {
    color: colors.green,
    sprite: leaf,
    display: maxCountable(leaf),
  },
  power: {
    color: colors.lime,
    sprite: power,
  },
  magic: {
    color: colors.lime,
    sprite: magic,
  },
  armor: {
    color: colors.lime,
    sprite: armor,
  },
  haste: {
    color: colors.lime,
    sprite: haste,
  },
};

export const createCountable = (
  stats: Partial<Stats>,
  stat: keyof Stats,
  display: "text" | "countable" | "max" | "cap" = "text"
) => {
  if (!(stat in stats)) return [];

  const counter = stat as keyof Countable;
  const value = Math.ceil(stats[counter] || 0);
  const stringified = value.toString();
  const color = statConfig[counter].color;

  if (display === "cap") {
    return createText(stringified.padEnd(2, " "), color);
  } else if (display === "text") {
    return [...createText(stringified, color), getStatSprite(counter)];
  }

  const maxCounter = getMaxCounter(counter);
  const capCounter = getMaxCounter(maxCounter);

  return [
    ...createText(stringified.padStart(2, " "), color),
    getStatSprite(
      display === "max" &&
        maxCounter !== capCounter &&
        stats[maxCounter] === stats[capCounter]
        ? maxCounter
        : counter,
      display === "countable" ? "display" : undefined
    ),
  ];
};

export const getMaxCounter = (stat: keyof Stats) =>
  (statConfig[stat] && statConfig[stat]?.max) || stat;

export const getStatSprite = (
  stat: keyof Stats,
  variant?: "max" | "drop" | "resource" | "display"
) =>
  (variant === "max" && statConfig[getMaxCounter(stat)]?.sprite) ||
  (variant === "drop" && statConfig[stat].drop) ||
  (variant === "resource" && statConfig[stat].resource) ||
  (variant === "display" && statConfig[stat].display) ||
  statConfig[stat].sprite;

export const quest = createText("!", colors.lime)[0];

export const shop = createText("$", colors.lime)[0];
export const craft = createText("Σ", colors.lime)[0];

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

export const pause: Sprite = {
  name: "Pause",
  layers: [
    { char: "■", color: colors.white },
    { char: "|", color: colors.black },
  ],
};

export const resume: Sprite = {
  name: "Resume",
  layers: [{ char: "»", color: colors.white }],
};

export const overlay: Sprite = {
  name: "Overlay",
  layers: [{ char: "▓", color: colors.black }],
};
