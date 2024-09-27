import * as colors from "../colors";
import { Sprite } from "../../../engine/components/sprite";

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

export const quest = createText("!", colors.olive)[0];

export const shop = createText("$", colors.green)[0];
