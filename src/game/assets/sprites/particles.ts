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

export const fireEdge: Sprite = {
  name: "fire_edge",
  layers: [{ char: "┼", color: colors.maroon }],
  facing: {
    up: [{ char: "─", color: colors.maroon }],
    right: [{ char: "│", color: colors.maroon }],
    down: [{ char: "─", color: colors.maroon }],
    left: [{ char: "│", color: colors.maroon }],
  },
};

export const waterEdge: Sprite = {
  name: "water_edge",
  layers: [{ char: "┼", color: colors.navy }],
  facing: {
    up: [{ char: "─", color: colors.navy }],
    right: [{ char: "│", color: colors.navy }],
    down: [{ char: "─", color: colors.navy }],
    left: [{ char: "│", color: colors.navy }],
  },
};

export const earthEdge: Sprite = {
  name: "earth_edge",
  layers: [{ char: "┼", color: colors.green }],
  facing: {
    up: [{ char: "─", color: colors.green }],
    right: [{ char: "│", color: colors.green }],
    down: [{ char: "─", color: colors.green }],
    left: [{ char: "│", color: colors.green }],
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

export const buttonColor = colors.black;
export const buttonBackground = colors.white;
export const buttonShadow = colors.grey;

export const button: Sprite = {
  name: "button_empty",
  layers: [{ char: "█", color: buttonBackground }],
};

export const buttonDisabled: Sprite = {
  name: "button_disabled",
  layers: [
    { char: "█", color: buttonShadow },
    { char: "░", color: colors.black },
  ],
};

export const buttonLeftUp: Sprite = {
  name: "button_left_up",
  layers: [
    { char: "▄", color: buttonBackground },
    { char: "░", color: colors.black },
    { char: "▌", color: colors.black },
    { char: "┌", color: buttonShadow },
  ],
};

export const buttonUp: Sprite = {
  name: "button_up",
  layers: [
    { char: "▄", color: buttonBackground },
    { char: "░", color: colors.black },
    { char: "─", color: buttonShadow },
  ],
};

export const buttonUpRight: Sprite = {
  name: "button_up_right",
  layers: [
    { char: "▄", color: buttonBackground },
    { char: "░", color: colors.black },
    { char: "▐", color: colors.black },
    { char: "┐", color: buttonShadow },
  ],
};

export const buttonRightDown: Sprite = {
  name: "button_right_down",
  layers: [
    { char: "▀", color: buttonBackground },
    { char: "░", color: colors.black },
    { char: "▐", color: colors.black },
    { char: "┘", color: buttonShadow },
  ],
};

export const buttonDown: Sprite = {
  name: "button_down",
  layers: [
    { char: "▀", color: buttonBackground },
    { char: "░", color: colors.black },
    { char: "─", color: buttonShadow },
  ],
};

export const buttonDownLeft: Sprite = {
  name: "button_down_left",
  layers: [
    { char: "▀", color: buttonBackground },
    { char: "░", color: colors.black },
    { char: "▌", color: colors.black },
    { char: "└", color: buttonShadow },
  ],
};

export const createButton: (
  sprites: Sprite[],
  width: number,
  disabled?: boolean,
  pressed?: boolean,
  highlight?: number
) => [Sprite[], Sprite[]] = (
  sprites,
  width,
  disabled = false,
  pressed = false,
  highlight
) => {
  const paddingLeft = Math.max(0, Math.floor((width - sprites.length - 1) / 2));
  const paddingRight = Math.max(0, Math.ceil((width - sprites.length - 1) / 2));
  const activeHighlight = !disabled && highlight;

  if (pressed) {
    return [
      [buttonLeftUp, ...repeat(buttonUp, width - 2), buttonUpRight],
      [buttonDownLeft, ...repeat(buttonDown, width - 2), buttonRightDown],
    ];
  }

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
      ...createText(activeHighlight === 6 ? " " : "┐", buttonShadow),
    ],
    createText(
      `└${"─".repeat(width - 2)}┘`
        .split("")
        .map((char, index) => (index === activeHighlight ? " " : char))
        .join(""),
      buttonShadow
    ),
  ];
};

const nonCountable = (sprite: Sprite) => ({
  name: sprite.name,
  layers: sprite.layers,
});

const statConfig: Record<
  keyof Stats,
  {
    color: string;
    sprite: Sprite;
    drop?: Sprite;
    max?: keyof Countable;
    resource?: Sprite;
  }
> = {
  hp: { color: colors.red, sprite: heart, max: "maxHp" },
  maxHp: { color: "#404040", sprite: heartUp, max: "maxHpCap" },
  maxHpCap: { color: "#404040", sprite: heartUp },
  mp: { color: colors.blue, sprite: mana, max: "maxMp" },
  maxMp: { color: "#404040", sprite: manaUp, max: "maxMpCap" },
  maxMpCap: { color: "#404040", sprite: manaUp },
  xp: { color: colors.lime, sprite: nonCountable(xp), drop: xp, resource: xp },
  coin: {
    color: colors.yellow,
    sprite: nonCountable(coin),
    drop: coin,
    resource: coin,
  },
  stick: { color: colors.maroon, sprite: stick },
  ore: { color: colors.silver, sprite: oreDrop, resource: ore },
  flower: {
    color: colors.teal,
    sprite: flower,
    drop: flowerDrop,
    resource: flower,
  },
  berry: {
    color: colors.purple,
    sprite: berry,
    drop: berryDrop,
    resource: berry,
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
        : counter
    ),
  ];
};

export const getMaxCounter = (stat: keyof Stats) =>
  (statConfig[stat] && statConfig[stat]?.max) || stat;

export const getStatSprite = (
  stat: keyof Stats,
  variant?: "max" | "drop" | "resource"
) =>
  (variant === "max" && statConfig[getMaxCounter(stat)]?.sprite) ||
  (variant === "drop" && statConfig[stat].drop) ||
  (variant === "resource" && statConfig[stat].resource) ||
  statConfig[stat].sprite;

export const quest = createText("!", colors.lime)[0];
export const pending = createText("!", colors.grey)[0];

export const shop = createText("$", colors.lime)[0];

export const rage = createAggro("\u0112")[0];

export const sleep1 = createText("z", colors.white)[0];
export const sleep2 = createText("Z", colors.white)[0];

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
