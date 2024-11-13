import * as colors from "../colors";
import { Sprite } from "../../../engine/components/sprite";

export const commonChest: Sprite = {
  name: "Chest",
  layers: [
    { char: "■", color: colors.grey },
    { char: "±", color: colors.maroon },
    { char: "∙", color: colors.silver },
    { char: "·", color: colors.maroon },
  ],
};

export const uncommonChest: Sprite = {
  name: "Chest",
  layers: [
    { char: "■", color: colors.grey },
    { char: "±", color: colors.lime },
    { char: "∙", color: colors.silver },
    { char: "·", color: colors.lime },
  ],
};

export const rareChest: Sprite = {
  name: "Chest",
  layers: [
    { char: "■", color: colors.grey },
    { char: "±", color: colors.yellow },
    { char: "∙", color: colors.silver },
    { char: "·", color: colors.yellow },
  ],
};

export const epicChest: Sprite = {
  name: "Chest",
  layers: [
    { char: "■", color: colors.grey },
    { char: "±", color: colors.aqua },
    { char: "∙", color: colors.silver },
    { char: "·", color: colors.aqua },
  ],
};

export const legendaryChest: Sprite = {
  name: "Chest",
  layers: [
    { char: "■", color: colors.white },
    { char: "±", color: colors.fuchsia },
    { char: "∙", color: colors.silver },
    { char: "·", color: colors.fuchsia },
  ],
};

export const dummy: Sprite = {
  name: "Dummy",
  layers: [
    { char: "│", color: colors.maroon },
    { char: "└", color: colors.black },
    { char: "|", color: colors.maroon },
    { char: "\u0108", color: colors.white },
    { char: "\u0106", color: colors.red },
    { char: "∙", color: colors.white },
  ],
};

export const campfire: Sprite = {
  name: "Fire",
  layers: [
    { char: "X", color: colors.maroon },
    { char: "|", color: colors.maroon },
  ],
};

export const torch: Sprite = {
  name: "Torch",
  layers: [
    { char: "┐", color: colors.maroon },
    { char: "─", color: colors.black },
  ],
};

export const pot: Sprite = {
  name: "Pot",
  layers: [
    { char: "I", color: colors.maroon },
    { char: "\u0106", color: colors.maroon },
    { char: "\u0108", color: colors.maroon },
    { char: "+", color: colors.grey },
    { char: "|", color: colors.maroon },
    { char: "∙", color: colors.grey },
    { char: "·", color: colors.maroon },
  ],
};

export const doorOpen: Sprite = {
  name: "Door",
  layers: [{ char: "▌", color: colors.maroon }],
};

export const doorClosedWood: Sprite = {
  name: "Door",
  layers: [
    { char: "\u0107", color: colors.maroon },
    { char: "∙", color: colors.maroon },
    { char: ".", color: colors.black },
  ],
};

export const doorClosedIron: Sprite = {
  name: "Door",
  layers: [
    { char: "\u0107", color: colors.maroon },
    { char: "\u0106", color: colors.silver },
    { char: "∙", color: colors.black },
    { char: ".", color: colors.silver },
  ],
};

export const doorClosedFire: Sprite = {
  name: "Door",
  layers: [
    { char: "\u0107", color: colors.maroon },
    { char: "\u0106", color: colors.red },
    { char: "∙", color: colors.black },
    { char: ".", color: colors.red },
  ],
};

export const doorClosedGold: Sprite = {
  name: "Door",
  layers: [
    { char: "\u0107", color: colors.maroon },
    { char: "\u0106", color: colors.yellow },
    { char: "∙", color: colors.black },
    { char: ".", color: colors.yellow },
  ],
};

export const leverOff: Sprite = {
  name: "Off",
  layers: [
    { char: "\\", color: colors.maroon },
    { char: "\u0115", color: colors.grey },
    { char: ".", color: colors.red },
  ],
};

export const lever: Sprite = {
  name: "Lever",
  layers: [
    { char: "|", color: colors.maroon },
    { char: "\u0115", color: colors.grey },
    { char: ".", color: colors.yellow },
  ],
};

export const leverOn: Sprite = {
  name: "On",
  layers: [
    { char: "/", color: colors.maroon },
    { char: "\u0115", color: colors.grey },
    { char: ".", color: colors.lime },
  ],
};
