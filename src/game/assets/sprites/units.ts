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
    { char: "*", color: colors.red },
    { char: "+", color: colors.yellow },
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

export const box: Sprite = {
  name: "Box",
  layers: [
    { char: "■", color: colors.grey },
    { char: "±", color: colors.grey },
    { char: "\u0108", color: colors.maroon },
    { char: "\u0106", color: colors.maroon },
    { char: ":", color: colors.maroon },
    { char: ".", color: colors.maroon },
  ],
};

export const ironCask: Sprite = {
  name: "Cask",
  layers: [
    { char: "\u011d", color: colors.grey },
    { char: "\u011e", color: colors.grey },
    { char: "\u0103", color: colors.silver },
    { char: "≡", color: colors.grey },
  ],
};

export const fireCask: Sprite = {
  name: "Cask",
  layers: [
    { char: "\u011d", color: colors.maroon },
    { char: "\u011e", color: colors.maroon },
    { char: "\u0103", color: colors.red },
    { char: "≡", color: colors.maroon },
  ],
};

export const waterCask: Sprite = {
  name: "Cask",
  layers: [
    { char: "\u011d", color: colors.navy },
    { char: "\u011e", color: colors.navy },
    { char: "\u0103", color: colors.blue },
    { char: "≡", color: colors.navy },
  ],
};

export const earthCask: Sprite = {
  name: "Cask",
  layers: [
    { char: "\u011d", color: colors.green },
    { char: "\u011e", color: colors.green },
    { char: "\u0103", color: colors.lime },
    { char: "≡", color: colors.green },
  ],
};

export const tumbleweed: Sprite = {
  name: "Bush",
  layers: [
    { char: "\u0100", color: colors.black },
    { char: "\u0101", color: colors.black },
    { char: "\u0108", color: colors.olive },
    { char: "+", color: colors.black },
  ],
  facing: {
    up: [
      { char: "\u0100", color: colors.black },
      { char: "\u0101", color: colors.black },
      { char: "\u0108", color: colors.olive },
      { char: "|", color: colors.olive },
      { char: "~", color: colors.black },
    ],
    right: [
      { char: "\u0100", color: colors.black },
      { char: "\u0101", color: colors.black },
      { char: "\u0108", color: colors.olive },
      { char: "/", color: colors.olive },
    ],
    down: [
      { char: "\u0100", color: colors.black },
      { char: "\u0101", color: colors.black },
      { char: "\u0108", color: colors.olive },
      { char: "-", color: colors.olive },
    ],
    left: [
      { char: "\u0100", color: colors.black },
      { char: "\u0101", color: colors.black },
      { char: "\u0108", color: colors.olive },
      { char: "\\", color: colors.olive },
    ],
  },
};
