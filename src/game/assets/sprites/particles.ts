import * as colors from "../colors";
import { Sprite } from "../../../engine/components/sprite";
import { Countable } from "../../../engine/components/countable";
import { coin, heart, herb, ironDisplay, mana, seed, wood, xp } from "./items";

export const block: Sprite = {
  name: "block_solid",
  layers: [
    {
      char: "█",
      color: colors.maroon,
    },
  ],
};

export const block_down: Sprite = {
  name: "block_down",
  layers: [
    {
      char: "▄",
      color: colors.maroon,
    },
  ],
};

export const block_up: Sprite = {
  name: "block_up",
  layers: [
    {
      char: "▀",
      color: colors.maroon,
    },
  ],
};

export const frozen: Sprite = {
  name: "water_frozen",
  layers: [
    {
      char: "▓",
      color: colors.aqua,
    },
  ],
};

export const hit: Sprite = {
  name: "hit_melee",
  layers: [
    {
      char: "x",
      color: colors.red,
    },
  ],
};

export const decay: Sprite = {
  name: "unit_decay",
  layers: [
    {
      char: "▒",
      color: colors.black,
    },
  ],
};

export const shot: Sprite = {
  name: "arrow_show",
  layers: [
    {
      char: "\u0108",
      color: colors.maroon,
    },
  ],
  facing: {
    up: [
      {
        char: "\u0117",
        color: colors.grey,
      },
      {
        char: "|",
        color: colors.maroon,
      },
    ],
    right: [
      {
        char: "\u0119",
        color: colors.grey,
      },
      {
        char: "-",
        color: colors.maroon,
      },
    ],
    down: [
      {
        char: "\u0118",
        color: colors.grey,
      },
      {
        char: "|",
        color: colors.maroon,
      },
    ],
    left: [
      {
        char: "\u011a",
        color: colors.grey,
      },
      {
        char: "-",
        color: colors.maroon,
      },
    ],
  },
};

export const createCounter: (amount: number) => Sprite = (amount) => ({
  name: "counter_generic",
  layers: [
    {
      char: amount.toString(),
      color: colors.red,
    },
  ],
});

export const createText: (text: string, color: string) => Sprite[] = (
  text,
  color
) =>
  text.split("").map((char) => ({
    name: "text_generic",
    layers: [{ char, color }],
  }));

export const createDialog = (text: string) => createText(text, colors.silver);
export const createTooltip = (text: string) => createText(text, "#2e2e2e");

export const buttonColor = colors.black;
export const buttonBackground = colors.white;
export const buttonShadow = colors.grey;

export const createButton: (
  sprites: Sprite[],
  width: number
) => [Sprite[], Sprite[]] = (sprites, width) => {
  const paddingLeft = Math.max(0, Math.floor((width - sprites.length - 1) / 2));
  const paddingRight = Math.max(0, Math.ceil((width - sprites.length - 1) / 2));

  return [
    [
      ...createText("█".repeat(paddingLeft), buttonBackground),
      ...sprites.map((sprite) => ({
        name: "button_generic",
        layers: [
          {
            char: "█",
            color: buttonBackground,
          },
          ...sprite.layers,
        ],
      })),
      ...createText("█".repeat(paddingRight), buttonBackground),
      ...createText("┐", buttonShadow),
    ],
    createText(`└${"─".repeat(width - 2)}┘`, buttonShadow),
  ];
};

const nonCountable = (sprite: Sprite) => ({
  name: sprite.name,
  layers: sprite.layers,
});

const stats: Record<keyof Countable, { color: string; sprite: Sprite }> = {
  hp: { color: colors.red, sprite: heart },
  mp: { color: colors.blue, sprite: mana },
  xp: { color: colors.lime, sprite: nonCountable(xp) },
  gold: { color: colors.yellow, sprite: nonCountable(coin) },
  wood: { color: colors.maroon, sprite: wood },
  iron: { color: colors.grey, sprite: ironDisplay },
  herb: { color: colors.teal, sprite: herb },
  seed: { color: colors.purple, sprite: seed },
};

export const createStat = (
  amount: number,
  countable: keyof Countable,
  padded: boolean = false
) => {
  const stat = (amount || 0).toString();
  const text = padded ? stat.padStart(2, " ") : stat;
  return [...createText(text, stats[countable].color), stats[countable].sprite];
};

export const quest = createText("!", colors.olive)[0];

export const shop = createText("$", colors.green)[0];
