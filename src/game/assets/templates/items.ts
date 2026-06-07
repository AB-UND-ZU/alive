import { createTemplate, TEMPLATE_COLORS } from ".";
import { Sprite } from "../../../engine/components/sprite";
import { colors } from "../colors";

// craftables

const spiritTemplate: Sprite = {
  name: "Spirit",
  layers: [{ char: "æ", color: TEMPLATE_COLORS.elementPrimary }],
};
export const spirit = createTemplate({
  sprite: spiritTemplate,
  materialElementSprite: spiritTemplate,
});

// consumables

const keyTemplate: Sprite = {
  name: "Key",
  layers: [
    { char: "\u0103", color: TEMPLATE_COLORS.materialPrimary },
    { char: "\u011c", color: TEMPLATE_COLORS.transparent },
    { char: "º", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
const keyElementTemplate: Sprite = {
  name: "Key",
  layers: [
    { char: "\u0103", color: TEMPLATE_COLORS.elementSecondary },
    { char: "\u011c", color: TEMPLATE_COLORS.transparent },
    { char: "º", color: TEMPLATE_COLORS.elementSecondary },
  ],
};
const fireKey: Sprite = {
  name: "Key",
  layers: [
    { char: "\u0103", color: colors.red },
    { char: "\u011c", color: colors.black },
    { char: "º", color: colors.red },
  ],
};
export const key = createTemplate({
  sprite: keyTemplate,
  elementSprite: keyElementTemplate,
});
key.default.fire = fireKey;

const flaskTemplate: Sprite = {
  name: "Flask",
  layers: [
    { char: "\u0108", color: TEMPLATE_COLORS.materialPrimary },
    { char: ":", color: TEMPLATE_COLORS.materialSecondary },
    { char: ".", color: TEMPLATE_COLORS.materialPrimary },
    { char: "\u0106", color: TEMPLATE_COLORS.materialPrimary },
    { char: "∙", color: TEMPLATE_COLORS.elementPrimary },
  ],
};
export const flask = createTemplate({ sprite: flaskTemplate });

const bottleTemplate: Sprite = {
  name: "Bottle",
  layers: [
    { char: "|", color: TEMPLATE_COLORS.materialSecondary },
    { char: ".", color: TEMPLATE_COLORS.transparent },
    { char: "\u011d", color: TEMPLATE_COLORS.elementPrimary },
    { char: "\u011f", color: TEMPLATE_COLORS.materialPrimary },
    { char: "°", color: TEMPLATE_COLORS.materialSecondary },
  ],
};
export const bottle = createTemplate({ sprite: bottleTemplate });

const potionTemplate: Sprite = {
  name: "Potion",
  layers: [
    { char: "¢", color: TEMPLATE_COLORS.materialSecondary },
    { char: "0", color: TEMPLATE_COLORS.materialPrimary },
    { char: '"', color: TEMPLATE_COLORS.materialSecondary },
    { char: "|", color: TEMPLATE_COLORS.materialSecondary },
    { char: ".", color: TEMPLATE_COLORS.materialPrimary },
    { char: "\u0102", color: TEMPLATE_COLORS.materialPrimary },
    { char: "\u0103", color: TEMPLATE_COLORS.materialPrimary },
    { char: "\u0106", color: TEMPLATE_COLORS.elementPrimary },
  ],
};
export const potion = createTemplate({ sprite: potionTemplate });

const elixirTemplate: Sprite = {
  name: "Elixir",
  layers: [
    { char: '"', color: TEMPLATE_COLORS.materialSecondary },
    { char: "T", color: TEMPLATE_COLORS.materialPrimary },
    { char: "\u0106", color: TEMPLATE_COLORS.elementPrimary },
    { char: "\u0108", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
export const elixir = createTemplate({ sprite: elixirTemplate });

const bucketTemplate: Sprite = {
  name: "Bucket",
  layers: [
    { char: "U", color: TEMPLATE_COLORS.materialPrimary },
    { char: "▀", color: TEMPLATE_COLORS.transparent },
  ],
};
const bucketElementTemplate: Sprite = {
  name: "Bucket",
  layers: [
    { char: "\u011d", color: TEMPLATE_COLORS.elementPrimary },
    { char: "-", color: TEMPLATE_COLORS.transparent },
    { char: "U", color: TEMPLATE_COLORS.materialPrimary },
    { char: "▀", color: TEMPLATE_COLORS.transparent },
  ],
};
const ironBucket: Sprite = {
  name: "Bucket",
  layers: [
    { char: "U", color: colors.silver },
    { char: "▀", color: colors.black },
  ],
};
const ironWaterBucket: Sprite = {
  name: "Water",
  layers: [
    { char: "\u011d", color: colors.blue },
    { char: "-", color: colors.black },
    { char: "U", color: colors.silver },
    { char: "▀", color: colors.black },
  ],
};
export const bucket = createTemplate({
  sprite: bucketTemplate,
  materialElementSprite: bucketElementTemplate,
});
bucket.wood.default.name = "Bowl";
bucket.iron.default = ironBucket;
bucket.iron.water = ironWaterBucket;
