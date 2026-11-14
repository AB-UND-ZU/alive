import { Sprite } from "../../engine/components/sprite";
import { colors } from "./colors";
import {
  addBackground,
  dotted,
  mergeSprites,
  recolorSprite,
  strikethrough,
} from "./ui";
import { getItemSprite } from "./utils";
import { popupBackground, popupCenterCrop } from "./sprites";
import { projectSprite } from "../../renderers/terminal/sprites";

it("keeps an item's terminal symbol and color through popup backgrounds and crop masks", () => {
  const key = getItemSprite({ consume: "key", material: "gold" });
  const projected = projectSprite(
    mergeSprites(popupBackground, strikethrough([key])[0], popupCenterCrop)
  );
  expect(projected.char).toBe("╒");
  expect(projected.foreground).toBe(colors.yellow);
  expect(projected.background).toBe(colors.black);
});

it("recolors terminal facing and amount variants with their source sprite", () => {
  const sprite: Sprite = {
    name: "example",
    layers: [{ char: "a", color: colors.white }],
    terminal: {
      layers: [{ char: "b", color: colors.white }],
      facing: { up: [{ char: "^", color: colors.white }] },
      amounts: { multiple: [{ char: "B", color: colors.white }] },
    },
  };
  const recolored = recolorSprite(sprite, colors.yellow);
  expect(recolored.terminal?.layers[0].color).toBe(colors.yellow);
  expect(recolored.terminal?.facing?.up?.[0].color).toBe(colors.yellow);
  expect(recolored.terminal?.amounts?.multiple?.[0].color).toBe(colors.yellow);
  expect(sprite.layers[0].color).toBe(colors.white);
  expect(sprite.terminal?.layers[0].color).toBe(colors.white);
});

it("shows blocked selection text over red without drawing an underline", () => {
  const normal = [
    { name: "text_generic", layers: [{ char: "K", color: colors.grey }] },
  ];
  const item = addBackground(dotted(normal, colors.red), colors.black)[0];
  expect(projectSprite(item)).toMatchObject({
    char: "K",
    foreground: colors.black,
    background: colors.red,
  });
});

it("keeps a hidden terminal particle hidden through UI backgrounds and decoration", () => {
  const sprite: Sprite = {
    name: "hidden pulse",
    layers: [{ char: "∙", color: colors.white }],
    terminal: { layers: [] },
  };
  const background = addBackground([sprite], colors.black)[0];
  expect(background.terminal?.layers).toEqual([]);
  expect(dotted([background], colors.red)[0].terminal?.layers).toEqual([]);
});
