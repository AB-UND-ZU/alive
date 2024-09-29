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
  const text = padded ? amount.toString().padStart(2, " ") : amount.toString();
  return [...createText(text, stats[countable].color), stats[countable].sprite];
};

export const quest = createText("!", colors.olive)[0];

export const shop = createText("$", colors.green)[0];
