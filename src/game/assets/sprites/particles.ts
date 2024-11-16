import * as colors from "../colors";
import { Sprite } from "../../../engine/components/sprite";
import { Countable } from "../../../engine/components/countable";
import {
  berry,
  berryDrop,
  coin,
  flower,
  flowerDrop,
  heart,
  heartUp,
  mana,
  manaUp,
  oreDrop,
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
  layers: [{ char: "\u0108", color: colors.white }],
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

export const bolt: Sprite = {
  name: "spell_bolt",
  layers: [
    { char: "∙", color: colors.grey },
    { char: "·", color: colors.silver },
  ],
  amounts: {
    single: [
      { char: "∙", color: colors.grey },
      { char: "·", color: colors.silver },
    ],
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

export const trap: Sprite = {
  name: "spell_trap",
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

export const createCounter: (amount: number) => Sprite = (amount) => ({
  name: "counter_generic",
  layers: [{ char: amount.toString(), color: colors.red }],
});

export const addBackground = (
  sprites: Sprite[],
  background: string = colors.black
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

export const createDialog = (text: string) =>
  createText(text, colors.white, colors.black);
export const createShout = (text: string) =>
  createText(text, colors.red, colors.black);
export const createTooltip = (text: string) =>
  createText(text, "#404040", colors.black); // 50% of grey

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
    { char: "▌", color: colors.black },
    { char: "┌", color: buttonShadow },
  ],
};

export const buttonUp: Sprite = {
  name: "button_up",
  layers: [
    { char: "▄", color: buttonBackground },
    { char: "─", color: buttonShadow },
  ],
};

export const buttonUpRight: Sprite = {
  name: "button_up_right",
  layers: [
    { char: "▄", color: buttonBackground },
    { char: "▐", color: colors.black },
    { char: "┐", color: buttonShadow },
  ],
};

export const buttonRightDown: Sprite = {
  name: "button_right_down",
  layers: [
    { char: "▀", color: buttonBackground },
    { char: "▐", color: colors.black },
    { char: "┘", color: buttonShadow },
  ],
};

export const buttonDown: Sprite = {
  name: "button_down",
  layers: [
    { char: "▀", color: buttonBackground },
    { char: "─", color: buttonShadow },
  ],
};

export const buttonDownLeft: Sprite = {
  name: "button_down_left",
  layers: [
    { char: "▀", color: buttonBackground },
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

const statSprites: Record<
  keyof Countable,
  { color: string; sprite: Sprite; drop?: Sprite; max?: keyof Countable }
> = {
  hp: { color: colors.red, sprite: heart, max: "maxHp" },
  maxHp: { color: "#404040", sprite: heartUp },
  mp: { color: colors.blue, sprite: mana, max: "maxMp" },
  maxMp: { color: "#404040", sprite: manaUp },
  xp: { color: colors.lime, sprite: nonCountable(xp), drop: xp },
  gold: { color: colors.yellow, sprite: nonCountable(coin), drop: coin },
  wood: { color: colors.maroon, sprite: stick },
  ore: { color: colors.silver, sprite: oreDrop },
  flower: { color: colors.teal, sprite: flower, drop: flowerDrop },
  berry: { color: colors.purple, sprite: berry, drop: berryDrop },
};

export const createStat = (
  stats: Partial<Countable>,
  counter: keyof Countable,
  display: "text" | "countable" | "max" = "text"
) => {
  const value = stats[counter] || 0;
  const stat = value.toString();
  const color = statSprites[counter].color;

  if (display === "countable")
    return [
      ...createText(stat.padStart(2, " "), color),
      getCountableSprite(counter),
    ];

  if (display === "max") return createText(stat.padEnd(2, " "), color);

  return [...createText(stat, color), getCountableSprite(counter)];
};

export const getMaxCounter = (counter: keyof Countable) =>
  statSprites[counter].max || counter;

export const getCountableSprite = (
  counter: keyof Countable,
  variant?: "max" | "drop"
) =>
  (variant === "max" && statSprites[getMaxCounter(counter)].sprite) ||
  (variant === "drop" && statSprites[counter].drop) ||
  statSprites[counter].sprite;

export const quest = createText("!", colors.lime)[0];

export const shop = createText("$", colors.lime)[0];

export const rage = createShout("\u0112")[0];

export const sleep1 = createText("z", colors.white)[0];
export const sleep2 = createText("Z", colors.white)[0];

export const confused = createText("?", colors.white)[0];

export const pointer: Sprite = {
  name: "arrow_pointer",
  layers: [],
  facing: {
    up: [{ char: "\u0117", color: colors.lime }],
    right: [{ char: "\u0119", color: colors.lime }],
    down: [{ char: "\u0118", color: colors.lime }],
    left: [{ char: "\u011a", color: colors.lime }],
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
