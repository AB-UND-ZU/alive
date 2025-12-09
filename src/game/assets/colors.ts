const black = "#000000";
const maroon = "#800000";
const green = "#008000";
const olive = "#808000";
const navy = "#000080";
const purple = "#800080";
const teal = "#008080";
const silver = "#c0c0c0";
const grey = "#808080";
const red = "#ff0000";
const lime = "#00ff00";
const yellow = "#ffff00";
const blue = "#0000ff";
const fuchsia = "#ff00ff";
const aqua = "#00ffff";
const white = "#ffffff";

export const orderedColors = [
  black, // \x00
  maroon, // \x01
  green, // \x02
  olive, // \x03
  navy, // \x04
  purple, // \x05
  teal, // \x06
  silver, // \x07
  grey, // \x08
  red, // \x09
  lime, // \x0a
  yellow, // \x0b
  blue, // \x0c
  fuchsia, // \x0d
  aqua, // \x0e
  white, // \x0f
];

export const recolor = (
  input: string,
  colorOrMap: string | Record<string, string>
) =>
  typeof colorOrMap !== "string"
    ? colorOrMap[input] || input
    : input === colors.black
    ? colors.black
    : colorOrMap;

const brightColors: Record<string, string> = {
  [maroon]: red,
  [green]: lime,
  [olive]: yellow,
  [navy]: blue,
  [purple]: fuchsia,
  [teal]: aqua,
  [silver]: white,
  [grey]: silver,
};
const darkColors = Object.fromEntries(
  Object.entries(brightColors).map(([input, output]) => [output, input])
);

export const brighten = (color: string) => recolor(color, brightColors);
export const darken = (color: string) => recolor(color, darkColors);

export const colors = {
  black,
  maroon,
  green,
  olive,
  navy,
  purple,
  teal,
  silver,
  grey,
  red,
  lime,
  yellow,
  blue,
  fuchsia,
  aqua,
  white,
};
