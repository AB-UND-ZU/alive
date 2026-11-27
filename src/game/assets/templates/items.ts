import { namedSprite } from "../spriteIds";
import { createTemplate, TEMPLATE_COLORS } from ".";
import { Sprite, SpriteArtwork } from "../../../engine/components/sprite";
import { colors } from "../colors";

// craftables

const spiritTemplate: SpriteArtwork = {
  name: "Spirit",
  layers: [{ char: "æ", color: TEMPLATE_COLORS.elementPrimary }],
};
export const spirit = createTemplate("spirit", {
  sprite: spiritTemplate,
  materialElementSprite: spiritTemplate,
});

// consumables

const keyTemplate: SpriteArtwork = {
  name: "Key",
  terminal: { layers: [{ char: "╒", color: TEMPLATE_COLORS.materialPrimary }] },
  layers: [
    { char: "\u0103", color: TEMPLATE_COLORS.materialPrimary },
    { char: "\u011c", color: TEMPLATE_COLORS.transparent },
    { char: "º", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
const keyElementTemplate: SpriteArtwork = {
  name: "Key",
  terminal: {
    layers: [{ char: "╒", color: TEMPLATE_COLORS.elementSecondary }],
  },
  layers: [
    { char: "\u0103", color: TEMPLATE_COLORS.elementSecondary },
    { char: "\u011c", color: TEMPLATE_COLORS.transparent },
    { char: "º", color: TEMPLATE_COLORS.elementSecondary },
  ],
};
const fireKey: Sprite = namedSprite("fire_key", {
  name: "Key",
  terminal: { layers: [{ char: "╒", color: colors.red }] },
  layers: [
    { char: "\u0103", color: colors.red },
    { char: "\u011c", color: colors.black },
    { char: "º", color: colors.red },
  ],
});
export const key = createTemplate("key", {
  sprite: keyTemplate,
  elementSprite: keyElementTemplate,
});
key.default.fire = fireKey;

const flaskTemplate: SpriteArtwork = {
  name: "Flask",
  terminal: { layers: [{ char: "σ", color: TEMPLATE_COLORS.elementPrimary }] },
  layers: [
    { char: "\u0108", color: TEMPLATE_COLORS.materialPrimary },
    { char: ":", color: TEMPLATE_COLORS.materialSecondary },
    { char: ".", color: TEMPLATE_COLORS.materialPrimary },
    { char: "\u0106", color: TEMPLATE_COLORS.materialPrimary },
    { char: "∙", color: TEMPLATE_COLORS.elementPrimary },
  ],
};
export const flask = createTemplate("flask", {
  sprite: {
    ...flaskTemplate,
    terminal: {
      layers: [{ char: "σ", color: colors.grey }],
    },
  },
  materialElementSprite: flaskTemplate,
});

const bottleTemplate: SpriteArtwork = {
  name: "Bottle",
  terminal: { layers: [{ char: "δ", color: TEMPLATE_COLORS.elementPrimary }] },
  layers: [
    { char: "|", color: TEMPLATE_COLORS.materialSecondary },
    { char: ".", color: TEMPLATE_COLORS.transparent },
    { char: "\u011d", color: TEMPLATE_COLORS.elementPrimary },
    { char: "\u011f", color: TEMPLATE_COLORS.materialPrimary },
    { char: "°", color: TEMPLATE_COLORS.materialSecondary },
  ],
};
export const bottle = createTemplate("bottle", {
  sprite: {
    ...bottleTemplate,
    terminal: {
      layers: [{ char: "δ", color: colors.grey }],
    },
  },
  materialElementSprite: bottleTemplate,
});

const potionTemplate: SpriteArtwork = {
  name: "Potion",
  terminal: {
    layers: [{ char: "\u010a", color: TEMPLATE_COLORS.elementPrimary }],
  },
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
export const potion = createTemplate("potion", {
  sprite: {
    ...potionTemplate,
    terminal: {
      layers: [{ char: "\u010a", color: colors.grey }],
    },
  },
  materialElementSprite: potionTemplate,
});

const elixirTemplate: SpriteArtwork = {
  name: "Elixir",
  layers: [
    { char: '"', color: TEMPLATE_COLORS.materialSecondary },
    { char: "T", color: TEMPLATE_COLORS.materialPrimary },
    { char: "\u0106", color: TEMPLATE_COLORS.elementPrimary },
    { char: "\u0108", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
export const elixir = createTemplate("elixir", { sprite: elixirTemplate });

const bucketTemplate: SpriteArtwork = {
  name: "Bucket",
  terminal: { layers: [{ char: "u", color: TEMPLATE_COLORS.materialPrimary }] },
  layers: [
    { char: "U", color: TEMPLATE_COLORS.materialPrimary },
    { char: "▀", color: TEMPLATE_COLORS.transparent },
  ],
};
const bucketElementTemplate: SpriteArtwork = {
  name: "Bucket",
  terminal: { layers: [{ char: "u", color: TEMPLATE_COLORS.elementPrimary }] },
  layers: [
    { char: "\u011d", color: TEMPLATE_COLORS.elementPrimary },
    { char: "-", color: TEMPLATE_COLORS.transparent },
    { char: "U", color: TEMPLATE_COLORS.materialPrimary },
    { char: "▀", color: TEMPLATE_COLORS.transparent },
  ],
};
const ironBucket: Sprite = namedSprite("iron_bucket", {
  name: "Bucket",
  terminal: { layers: [{ char: "u", color: colors.silver }] },
  layers: [
    { char: "U", color: colors.silver },
    { char: "▀", color: colors.black },
  ],
});
const ironWaterBucket: Sprite = namedSprite("iron_water_bucket", {
  name: "Water",
  terminal: { layers: [{ char: "u", color: colors.blue }] },
  layers: [
    { char: "\u011d", color: colors.blue },
    { char: "-", color: colors.black },
    { char: "U", color: colors.silver },
    { char: "▀", color: colors.black },
  ],
});
export const bucket = createTemplate("bucket", {
  sprite: bucketTemplate,
  materialElementSprite: bucketElementTemplate,
});
bucket.wood.default.name = "Bowl";
bucket.iron.default = ironBucket;
bucket.iron.water = ironWaterBucket;
