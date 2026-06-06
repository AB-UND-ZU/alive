import { Layer, Sprite } from "../../engine/components/sprite";
import { brightColors, colors, orderedColors, recolor } from "./colors";
import {
  dialogStart,
  dialogEnd,
  shoutEnd,
  shoutStart,
  none,
  blocked,
  emptySlot,
  absorb,
  delay,
  drain,
  fire,
  freeze,
  healHit,
  magicHit,
  meleeHit,
  range,
  time,
} from "./sprites/particles";
import { clamp, lerp, normalize, padCenter, repeat } from "../math/std";
import {
  armor,
  build,
  damp,
  farming,
  fishing,
  haste,
  heart,
  heartUp,
  level,
  logging,
  mana,
  manaUp,
  mining,
  power,
  resist,
  spike,
  thaw,
  vision,
  wisdom,
  xp,
} from "./sprites/items";
import { ItemStats } from "../../engine/components/item";
import { Countable, UnitStats } from "../../engine/components/stats";
import { Orientation } from "../../engine/components/orientable";

export const createCounter: (amount: number) => Sprite = (amount) => ({
  name: "counter_generic",
  layers: [{ char: amount.toString(), color: colors.red }],
});

export const addBackground = (
  sprites: Sprite[],
  background: string = colors.white,
  char = "█"
) =>
  sprites.map((sprite) => ({
    name: sprite.name,
    layers: [{ char, color: background }, ...sprite.layers],
  }));

export const addForeground = (
  sprites: Sprite[],
  foreground: string,
  char: string
) =>
  sprites.map((sprite) => ({
    name: sprite.name,
    layers: [...sprite.layers, { char, color: foreground }],
  }));

export const strikethrough = (
  sprites: Sprite[],
  color: string = colors.silver
) =>
  sprites.map((sprite) => ({
    name: sprite.name,
    layers: [...sprite.layers, { char: "─", color }],
  }));

export const underline = (sprites: Sprite[], color: string = colors.silver) =>
  sprites.map((sprite) => ({
    name: sprite.name,
    layers: [{ char: "_", color }, ...sprite.layers],
  }));

export const dotted = (sprites: Sprite[], color: string = colors.silver) =>
  underline(addBackground(sprites, colors.black, "▓"), color);

export const shaded = (
  sprites: Sprite[],
  color: string = colors.silver,
  char = "░"
) =>
  sprites.map((sprite) => ({
    name: sprite.name,
    layers: [
      { char, color },
      { char: "▀", color: colors.black },
      ...sprite.layers,
    ],
  }));

export const createText: (
  text: string,
  color?: string,
  background?: string
) => Sprite[] = (text, color = colors.white, background) => {
  const sprites = text.split("").map((char) => ({
    name: "text_generic",
    layers: [{ char, color }],
  }));

  if (background) return addBackground(sprites, background);

  return sprites;
};

export const createDialog = (...content: (string | Sprite[])[]) => [
  dialogStart,
  ...content
    .map((textOrSprite) =>
      typeof textOrSprite === "string"
        ? createText(textOrSprite, colors.black, colors.white)
        : textOrSprite
    )
    .flat(),
  dialogEnd,
];

export const createAggro = (text: string) => createText(text, colors.red);

export const createShout = (text: string) => [
  shoutStart,
  ...createText(text, colors.black, colors.red),
  shoutEnd,
];

export const buttonPalettes: Record<
  string,
  { background: string; text: string; shadow: string; contrast?: string }
> = {
  white: {
    background: colors.white,
    text: colors.black,
    shadow: colors.grey,
  },
  silver: {
    background: colors.white,
    contrast: colors.silver,
    text: colors.black,
    shadow: colors.grey,
  },
  lime: { background: colors.lime, text: colors.black, shadow: colors.green },
  red: { background: colors.red, text: colors.black, shadow: colors.maroon },
  maroon: {
    background: colors.maroon,
    text: colors.black,
    shadow: colors.maroon,
  },
  yellow: {
    background: colors.yellow,
    text: colors.black,
    shadow: colors.olive,
  },
  blue: { background: colors.blue, text: colors.black, shadow: colors.navy },
  fuchsia: {
    background: colors.fuchsia,
    text: colors.black,
    shadow: colors.purple,
  },
  aqua: {
    background: colors.aqua,
    text: colors.black,
    shadow: colors.teal,
  },
} as const;

export type Palette = keyof typeof buttonPalettes;

export const getButton = (palette: Palette): Sprite => ({
  name: "button_empty",
  layers: [{ char: "█", color: buttonPalettes[palette].background }],
});

export const getButtonDisabled = (palette: Palette): Sprite => ({
  name: "button_disabled",
  layers: [
    {
      char: "█",
      color: buttonPalettes[palette].contrast || buttonPalettes[palette].shadow,
    },
    { char: "░", color: colors.black },
  ],
});

export const getButtonPressed = (palette: Palette): Sprite => ({
  name: "button_pressed",
  layers: [{ char: "█", color: buttonPalettes[palette].shadow }],
});

export const getButtonLeft = (
  palette: Palette,
  disabled: boolean,
  highlight: boolean,
  pressed: boolean
): Sprite => ({
  name: "button_left",
  layers: [
    {
      char: "▐",
      color: disabled
        ? buttonPalettes[palette].contrast || buttonPalettes[palette].shadow
        : pressed
        ? buttonPalettes[palette].shadow
        : buttonPalettes[palette].background,
    },
    {
      char: "│",
      color:
        highlight && !disabled
          ? buttonPalettes[palette].contrast ||
            buttonPalettes[palette].background
          : pressed
          ? buttonPalettes[palette].background
          : (disabled && buttonPalettes[palette].contrast) ||
            buttonPalettes[palette].shadow,
    },
    ...(disabled ? [{ char: "░", color: colors.black }] : []),
  ],
});

export const getButtonLeftUp = (palette: Palette): Sprite => ({
  name: "button_left_up",
  layers: [
    { char: "▄", color: buttonPalettes[palette].background },
    { char: "░", color: colors.black },
    { char: "▌", color: buttonPalettes[palette].text },
    { char: "┌", color: buttonPalettes[palette].shadow },
  ],
});

export const getButtonUp = (palette: Palette): Sprite => ({
  name: "button_up",
  layers: [
    { char: "▄", color: buttonPalettes[palette].background },
    { char: "░", color: colors.black },
    { char: "─", color: buttonPalettes[palette].shadow },
  ],
});

export const getButtonUpRight = (palette: Palette): Sprite => ({
  name: "button_up_right",
  layers: [
    { char: "▄", color: buttonPalettes[palette].background },
    { char: "░", color: colors.black },
    { char: "▐", color: buttonPalettes[palette].text },
    { char: "┐", color: buttonPalettes[palette].shadow },
  ],
});

export const getButtonRight = (
  palette: Palette,
  disabled: boolean,
  highlight: boolean,
  pressed: boolean
): Sprite => ({
  name: "button_right",
  layers: [
    {
      char: "▌",
      color: disabled
        ? buttonPalettes[palette].contrast || buttonPalettes[palette].shadow
        : pressed
        ? buttonPalettes[palette].shadow
        : buttonPalettes[palette].background,
    },
    {
      char: "│",
      color:
        highlight && !disabled
          ? buttonPalettes[palette].contrast ||
            buttonPalettes[palette].background
          : pressed
          ? buttonPalettes[palette].background
          : (disabled && buttonPalettes[palette].contrast) ||
            buttonPalettes[palette].shadow,
    },
    ...(disabled ? [{ char: "░", color: colors.black }] : []),
  ],
});

export const getButtonRightDown = (palette: Palette): Sprite => ({
  name: "button_right_down",
  layers: [
    { char: "▀", color: buttonPalettes[palette].background },
    { char: "░", color: colors.black },
    { char: "▐", color: buttonPalettes[palette].text },
    { char: "┘", color: buttonPalettes[palette].shadow },
  ],
});

export const getButtonDown = (palette: Palette): Sprite => ({
  name: "button_down",
  layers: [
    { char: "▀", color: buttonPalettes[palette].background },
    { char: "░", color: colors.black },
    { char: "─", color: buttonPalettes[palette].shadow },
  ],
});

export const getButtonDownLeft = (palette: Palette): Sprite => ({
  name: "button_down_left",
  layers: [
    { char: "▀", color: buttonPalettes[palette].background },
    { char: "░", color: colors.black },
    { char: "▌", color: buttonPalettes[palette].text },
    { char: "└", color: buttonPalettes[palette].shadow },
  ],
});

export const getButtonSeparator = (
  paletteLeft: Palette = "white",
  disabledLeft: boolean,
  highlightLeft: boolean,
  pressedLeft: boolean,
  paletteRight: Palette = "white",
  disabledRight: boolean,
  highlightRight: boolean,
  pressedRight: boolean
): Sprite => ({
  name: "button_separator",
  layers:
    !disabledLeft && !disabledRight
      ? [
          {
            char: "▐",
            color:
              buttonPalettes[paletteRight][
                highlightRight || pressedRight ? "background" : "shadow"
              ],
          },
          {
            char: "▌",
            color:
              buttonPalettes[paletteLeft][
                highlightLeft || pressedLeft ? "background" : "shadow"
              ],
          },
          { char: "║", color: colors.black },
          { char: "│", color: colors.black },
        ]
      : disabledLeft && !disabledRight
      ? [
          {
            char: "▓",
            color:
              buttonPalettes[paletteLeft].contrast ||
              buttonPalettes[paletteLeft].shadow,
          },
          {
            char: "▐",
            color:
              buttonPalettes[paletteRight][
                highlightRight || pressedRight ? "background" : "shadow"
              ],
          },
          { char: "║", color: colors.black },
          { char: "│", color: colors.black },
        ]
      : !disabledLeft && disabledRight
      ? [
          {
            char: "▐",
            color:
              buttonPalettes[paletteRight].contrast ||
              buttonPalettes[paletteRight].shadow,
          },
          { char: "░", color: colors.black },
          {
            char: "▌",
            color:
              buttonPalettes[paletteLeft][
                highlightLeft || pressedLeft ? "background" : "shadow"
              ],
          },
          { char: "║", color: colors.black },
          { char: "│", color: colors.black },
        ]
      : [
          {
            char: "▐",
            color:
              buttonPalettes[paletteRight].contrast ||
              buttonPalettes[paletteRight].shadow,
          },
          {
            char: "▌",
            color:
              buttonPalettes[paletteLeft].contrast ||
              buttonPalettes[paletteLeft].shadow,
          },
          { char: "░", color: colors.black },
          { char: "║", color: colors.black },
          { char: "│", color: colors.black },
        ],
});

export const createButton: (
  text: string,
  width: number,
  disabled?: boolean,
  pressed?: boolean,
  highlight?: boolean,
  palette?: Palette
) => Sprite[] = (
  text,
  width,
  disabled = false,
  pressed = false,
  highlight,
  palette = "white"
) => {
  const { text: textColor } = buttonPalettes[palette];
  const sprites = createText(text, textColor);
  return createSpriteButton(
    sprites,
    width,
    disabled,
    pressed,
    highlight,
    palette
  );
};

export const createSpriteButton: (
  sprites: Sprite[],
  width: number,
  disabled?: boolean,
  pressed?: boolean,
  highlight?: boolean,
  palette?: Palette
) => Sprite[] = (
  sprites,
  width,
  disabled = false,
  pressed = false,
  highlight = false,
  palette = "white"
) => {
  const paddingLeft = Math.max(0, Math.floor((width - sprites.length - 2) / 2));
  const paddingRight = Math.max(0, Math.ceil((width - sprites.length - 2) / 2));

  const button = disabled
    ? getButtonDisabled(palette)
    : pressed
    ? getButtonPressed(palette)
    : getButton(palette);

  return [
    getButtonLeft(palette, disabled, highlight, pressed),
    ...repeat(button, paddingLeft),
    ...sprites.map((sprite) => ({
      name: "button_generic",
      layers: [...button.layers, ...sprite.layers],
    })),
    ...repeat(button, paddingRight),
    getButtonRight(palette, disabled, highlight, pressed),
  ];
};

export const recolorLayers = (
  layers: Layer[],
  colorOrMap: string | Record<string, string>
): Layer[] =>
  layers.map((layer) => ({
    ...layer,
    color: recolor(layer.color, colorOrMap),
  }));

export const recolorSprite = (
  sprite: Sprite,
  colorOrMap: string | Record<string, string>
): Sprite => {
  const layers = recolorLayers(sprite.layers, colorOrMap);
  const recolored = { ...sprite, layers };

  if (sprite.facing) {
    recolored.facing = {};
    if (sprite.facing.up)
      recolored.facing.up = recolorLayers(sprite.facing.up, colorOrMap);
    if (sprite.facing.right)
      recolored.facing.right = recolorLayers(sprite.facing.right, colorOrMap);
    if (sprite.facing.down)
      recolored.facing.down = recolorLayers(sprite.facing.down, colorOrMap);
    if (sprite.facing.left)
      recolored.facing.left = recolorLayers(sprite.facing.left, colorOrMap);
  }

  if (sprite.amounts) {
    recolored.amounts = {};
    if (sprite.amounts.single)
      recolored.amounts.single = recolorLayers(
        sprite.amounts.single,
        colorOrMap
      );
    if (sprite.amounts.double)
      recolored.amounts.double = recolorLayers(
        sprite.amounts.double,
        colorOrMap
      );
    if (sprite.amounts.multiple)
      recolored.amounts.multiple = recolorLayers(
        sprite.amounts.multiple,
        colorOrMap
      );
  }

  return recolored;
};

export const colorizeSprite = (
  sprite: Sprite,
  background: string,
  foreground: string
) => {
  const constrastSprite = recolorSprite(sprite, {
    [colors.maroon]: background,
    [colors.green]: background,
    [colors.olive]: background,
    [colors.navy]: background,
    [colors.purple]: background,
    [colors.teal]: background,
    [colors.silver]: background,
    [colors.grey]: foreground,
    [colors.red]: foreground,
    [colors.lime]: foreground,
    [colors.yellow]: foreground,
    [colors.blue]: foreground,
    [colors.fuchsia]: foreground,
    [colors.aqua]: foreground,
    [colors.white]: foreground,
  });

  // if no foreground is visible, override colors again
  if (!constrastSprite.layers.some((layer) => layer.color === foreground)) {
    return recolorSprite(constrastSprite, foreground);
  }

  return constrastSprite;
};

export const blockedInactive = recolorSprite(blocked, colors.grey);

export const mergeSprites = (...sprites: Sprite[]): Sprite => ({
  name: sprites.filter((sprite) => sprite.name).slice(-1)[0]?.name || "",
  layers: sprites.reduce(
    (merged, { layers }) => merged.concat(layers),
    [] as Layer[]
  ),
});

export const nonCountable = (sprite: Sprite) => ({
  name: sprite.name,
  layers: sprite.layers,
});

export const minCountable = (sprite: Sprite) => ({
  name: sprite.name,
  layers: sprite.amounts?.single || sprite.layers,
});

export const maxCountable = (sprite: Sprite) => ({
  name: sprite.name,
  layers: sprite.amounts?.multiple || sprite.layers,
});

export const createCountable = (
  stats: Partial<Stats>,
  stat: keyof Stats,
  display:
    | "text"
    | "countable"
    | "max"
    | "cap"
    | "display"
    | "progression" = "text",
  percentage?: boolean
) => {
  const displayedStat = display === "progression" ? getMaxCounter(stat) : stat;
  if (!displayedStat || !(displayedStat in stats)) return [];

  // const counter = stat as keyof Countable;
  const value = Math.ceil(stats[displayedStat] || 0);
  const stringified = percentage ? `${value}%` : value.toString();
  const color = statConfig[stat].color;

  const maxCounter = getMaxCounter(stat) || stat;
  const capCounter = getMaxCounter(maxCounter) || maxCounter;

  if (display === "cap") {
    return createText(stringified.padEnd(2, " "), color);
  } else if (display === "text") {
    return [...createText(stringified, color), getStatSprite(stat)];
  } else if (display === "display") {
    return [
      ...createText(stringified, color),
      getStatSprite(stat),
      ...createText(statConfig[stat].sprite.name, color),
    ];
  } else if (display === "progression") {
    return [
      ...createText((stats[maxCounter] || 0).toString(), color),
      getStatSprite(stat),
      ...createText(statConfig[stat].sprite.name, color),
    ];
  }

  return [
    ...createText(stringified.padStart(2, " "), color),
    getStatSprite(
      display === "max" &&
        maxCounter !== capCounter &&
        stats[maxCounter] === stats[capCounter]
        ? maxCounter
        : stat,
      display === "countable" ? "display" : undefined
    ),
  ];
};

export const getMaxCounter = (stat: keyof Stats) =>
  statConfig[stat] && statConfig[stat]?.max;

export const getStatColor = (stat: keyof Stats) => statConfig[stat].color;

export const getStatSprite = (
  stat: keyof Stats,
  variant?: "max" | "drop" | "resource" | "display"
) =>
  (variant === "max" && statConfig[getMaxCounter(stat) || stat]?.sprite) ||
  (variant === "drop" && statConfig[stat].drop) ||
  (variant === "resource" && statConfig[stat].resource) ||
  (variant === "display" && statConfig[stat].display) ||
  statConfig[stat].sprite;

export const progressResolution = 2;

export const createProgress = (
  stats: Partial<Stats>,
  stat: keyof Stats,
  width: number,
  depletable = true,
  content?: Sprite[],
  maximum?: number,
  background?: string
) => {
  const config = statConfig[stat];
  const statBackground = config.background || background || colors.grey;
  const statMaximum = maximum ?? (config.max && stats[config.max]) ?? 99;
  const value = Math.min(stats[stat] ?? 0, statMaximum);
  const display =
    depletable || value === 0 || value >= 1 ? Math.floor(value) : 1;
  const progress = clamp(lerp(0, width, value / (statMaximum || 1)), 0, width);
  const full = Math.floor(progress);
  const partial = normalize(progress, 1);
  const segment = Math.floor(partial * progressResolution);

  const text = padCenter(
    isFinite(statMaximum)
      ? ` ${display.toString().padStart(2, " ")}/${statMaximum
          .toString()
          .padEnd(2, " ")}`
      : ` ${display}`,
    width - 3
  );
  const sprites = content || [
    ...createText(text, config.color),
    ...repeat(none, width - text.length - stat.length - 1),
    config.sprite,
    ...createText(stat.toUpperCase(), config.color),
  ];

  return [
    ...createText("█".repeat(full), statBackground),
    ...(full < width
      ? [
          {
            name: "progress",
            layers: [[], [{ char: "▌", color: statBackground }]][
              full === 0 && partial > 0 && !depletable ? 1 : segment
            ],
          },
        ]
      : []),
    ...repeat(none, width - full - 1),
  ].map((sprite, index) => ({
    ...sprite,
    layers: [
      { char: "░", color: statBackground },
      ...sprite.layers,
      { char: "▀", color: colors.black },
      ...(sprites[index]?.layers || []),
    ],
  }));
};

export const colorToCode = (color: string) =>
  String.fromCharCode(orderedColors.indexOf(color));

export const parseSprite = (definition: string) => {
  let colorCode = orderedColors.indexOf(colors.white);
  return {
    name: "",
    layers: definition
      .split("")
      .map((layer) => {
        const charCode = layer.charCodeAt(0);
        if (charCode < 16) {
          colorCode = charCode;
          return null;
        }
        return {
          char: layer,
          color: orderedColors[colorCode],
        };
      })
      .filter((layer) => !!layer) as Sprite["layers"],
  };
};

export const parseSprites = (line: string) =>
  line.split(" ").map((definition) => parseSprite(definition));

export const stretch = (left: Sprite[], right: Sprite[], width: number) =>
  [
    ...left,
    ...repeat(none, width - left.length - right.length),
    ...right,
  ].slice(0, width);

export const slotShadow: Sprite = recolorSprite(emptySlot, colors.black);
export const discovery = createText("°", colors.lime)[0];
export const quest = createText("?", colors.lime)[0];
export const ongoing = createText("?", colors.silver)[0];
export const info = createText("i", colors.lime)[0];
export const shop = createText("$", colors.lime)[0];
export const craft = createText("¢", colors.lime)[0];
export const forge = createText("ƒ", colors.lime)[0];
export const brew = createText("Σ", colors.lime)[0];
export const class_ = createText("\u010b")[0];
export const rage = createAggro("\u0112")[0];
export const rage2 = mergeSprites(
  recolorSprite(emptySlot, colors.red),
  parseSprite("\x00\u0112")
);
export const sleep1 = createText("z", colors.white)[0];
export const sleep2 = createText("Z", colors.white)[0];
export const whistle1 = createText("\u010c", colors.white)[0];
export const whistle2 = createText("\u010d", colors.white)[0];
export const confused = createText("?", colors.white)[0];

export const getBlockedSlot = (shadow: Sprite) =>
  mergeSprites(
    emptySlot,
    createText("\u0100", colors.red)[0],
    createText("■", colors.grey)[0],
    shadow,
    createText("/", colors.red)[0]
  );

export const addPower = recolorSprite(power, {
  [colors.lime]: colors.fuchsia,
  [colors.green]: colors.purple,
});

export const addWisdom = recolorSprite(wisdom, {
  [colors.lime]: colors.fuchsia,
  [colors.green]: colors.purple,
});

export const addArmor = recolorSprite(armor, {
  [colors.lime]: colors.fuchsia,
  [colors.green]: colors.purple,
});

export const addResist = recolorSprite(resist, {
  [colors.lime]: colors.fuchsia,
  [colors.green]: colors.purple,
});

export const addHaste = recolorSprite(haste, {
  [colors.lime]: colors.fuchsia,
  [colors.green]: colors.purple,
});

export const brightenSprites = (sprites: Sprite[]) =>
  sprites.map((sprite) => recolorSprite(sprite, brightColors));

export type Stats = UnitStats & ItemStats;

export const statConfig: Record<
  keyof Stats,
  {
    color: string;
    background?: string;
    sprite: Sprite;
    drop?: Sprite;
    max?: keyof Countable;
    resource?: Sprite;
    display?: Sprite;
  }
> = {
  hp: {
    color: colors.red,
    background: colors.maroon,
    sprite: heart,
    max: "maxHp",
  },
  maxHp: { color: colors.red, sprite: heartUp, max: "maxHpCap" },
  maxHpCap: { color: colors.maroon, sprite: heartUp },
  mp: {
    color: colors.blue,
    background: colors.navy,
    sprite: mana,
    max: "maxMp",
  },
  maxMp: { color: colors.blue, sprite: manaUp, max: "maxMpCap" },
  maxMpCap: { color: colors.navy, sprite: manaUp },
  xp: {
    color: colors.lime,
    background: colors.green,
    sprite: xp,
    display: nonCountable(xp),
    drop: xp,
    resource: xp,
    max: "maxXp",
  },
  maxXp: { color: colors.green, sprite: nonCountable(xp), max: "maxXpCap" },
  maxXpCap: { color: colors.green, sprite: nonCountable(xp) },
  level: {
    color: colors.lime,
    sprite: level,
  },
  power: {
    color: colors.aqua,
    sprite: power,
  },
  addPower: {
    color: colors.purple,
    sprite: addPower,
  },
  wisdom: {
    color: colors.fuchsia,
    sprite: wisdom,
  },
  addWisdom: {
    color: colors.purple,
    sprite: addWisdom,
  },
  armor: {
    color: colors.teal,
    sprite: armor,
  },
  addArmor: {
    color: colors.purple,
    sprite: addArmor,
  },
  resist: {
    color: colors.purple,
    sprite: resist,
  },
  addResist: {
    color: colors.purple,
    sprite: addResist,
  },
  haste: {
    color: colors.green,
    sprite: haste,
  },
  addHaste: {
    color: colors.purple,
    sprite: addHaste,
  },
  vision: {
    color: colors.grey,
    sprite: vision,
  },
  damp: {
    color: colors.olive,
    sprite: damp,
  },
  thaw: {
    color: colors.navy,
    sprite: thaw,
  },
  spike: {
    color: colors.maroon,
    sprite: spike,
  },
  melee: {
    color: colors.red,
    sprite: minCountable(meleeHit),
  },
  magic: {
    color: colors.fuchsia,
    sprite: minCountable(magicHit),
  },
  true: {
    color: colors.fuchsia,
    sprite: minCountable(magicHit),
  },
  burn: {
    color: colors.yellow,
    sprite: maxCountable(fire),
  },
  freeze: {
    color: colors.aqua,
    sprite: maxCountable(freeze),
  },
  heal: {
    color: colors.lime,
    sprite: healHit,
  },
  drain: {
    color: colors.purple,
    sprite: drain,
  },
  absorb: {
    color: colors.olive,
    sprite: absorb,
  },
  duration: {
    color: colors.purple,
    sprite: time,
  },
  range: {
    color: colors.olive,
    sprite: range,
  },
  knock: {
    color: colors.black,
    sprite: none,
  },
  retrigger: {
    color: colors.olive,
    sprite: delay,
  },
  reproc: {
    color: colors.black,
    sprite: none,
  },
  fishing: {
    color: colors.green,
    sprite: fishing,
  },
  mining: {
    color: colors.green,
    sprite: mining,
  },
  logging: {
    color: colors.green,
    sprite: logging,
  },
  farming: {
    color: colors.green,
    sprite: farming,
  },
  build: {
    color: colors.green,
    sprite: build,
  },
};

export const getOrientedSprite = (
  sprite: Sprite,
  orientation: Orientation
) => ({
  ...sprite,
  layers: getFacingLayers(sprite, orientation),
});

export const getFacingLayers = (
  sprite: Sprite,
  facing?: Orientation,
  amount?: number
) => {
  let layers;
  if (facing && sprite.facing?.[facing]) layers = sprite.facing[facing];

  if (amount && sprite.amounts && amount > 0) {
    if (amount === 1) layers = sprite.amounts.single;
    else if (amount === 2) layers = sprite.amounts.double;
    else layers = sprite.amounts.multiple;
  }

  return layers || sprite.layers;
};

export const plot: Sprite = mergeSprites(slotShadow, {
  name: "Plot",
  layers: [
    { char: "\u0100", color: colors.grey },
    { char: "X", color: colors.maroon },
    { char: "\u0117", color: colors.black },
    { char: "\u0118", color: colors.black },
    { char: "=", color: colors.black },
    { char: "\u010e", color: colors.black },
  ],
});
