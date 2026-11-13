import { Layer, Sprite } from "../../engine/components/sprite";
import { Orientation } from "../../engine/components/orientable";
import { colors } from "../../game/assets/colors";
import { codePage437 } from "../../game/assets/characters";
import { getFacingLayers } from "../../game/assets/ui";
import {
  characterMask,
  composeCharacterPixels,
} from "../../components/Row/characters";

export type TerminalCell = {
  char: string;
  foreground: string;
  background?: string;
};

// CP437's control pictures live at private code points in the game font.
const controls = Array.from("☺☻♥♦♣♠•◘○◙♂♀♪♫☼►◄↕‼¶§▬↨↑↓→←∟↔▲▼");
export const terminalCharacter = (char: string) => {
  const code = char.charCodeAt(0);
  if (code >= 256 && code <= 286) return controls[code - 256];
  if (code === 287) return "⌂";
  return char;
};

// Recognizable silhouettes take precedence over a literal mask match.
const symbols: Record<string, string> = {
  "?????": "?",
  Absorb: "O",
  Blocked: "X",
  warn_on: "!",
  warn_off: "·",
  Avocado: "o",
  Lemon: "o",
  Bread: "▬",
  Toast: "▬",
  Grain: "·",
  Wheat: "♠",
  Tea: "∩",
  Soup: "∩",
  Curry: "∩",
  Juice: "∩",
  Granola: "∩",
  Cask: "≡",
  Egg: "o",
  Pet: "@",
  Head: "☻",
  tree_one: "♣",
  tree_two: "♣",
  tree_birch: "♣",
  tree_leaves: "♣",
  hedge_one: "♣",
  hedge_two: "♣",
  hedge_one_dry: "♣",
  hedge_two_dry: "♣",
  bush_empty: "♣",
  palm_one: "♠",
  palm_two: "♠",
  grass_empty: "·",
  Scout: "@",
  Rogue: "@",
  Mage: "@",
  Knight: "@",
  "???": "@",
  Bandit: "b",
  Chief: "B",
  Zombie: "z",
  Blade: "/",
  Soul: "☻",
  Spider: "x",
  Snake: "s",
  Fly: "·",
  Fairy: "f",
  Tower: "T",
  Chick: "c",
  Salmon: "α",
  Pike: "α",
  Tuna: "α",
  Cod: "α",
  Eel: "~",
  Seastar: "*",
  Shark: "S",
  Ilex: "I",
  Rose: "♣",
  Violet: "♣",
  Clover: "♣",
  Lily: "♣",
  Tulip: "♣",
  Chest: "■",
  Crate: "■",
  Box: "■",
  Vase: "∩",
  Pot: "∩",
  Dummy: "t",
  Bonfire: "♠",
  Fountain: "≈",
  Lever: "/",
  Sign: "¶",
  Portal: "Ω",
  Anvil: "π",
  Kettle: "∩",
  Bench: "┬",
  Table: "┬",
  Chair: "h",
  Fence: "╬",
  Wall: "█",
  Barrier: "▒",
  Stairs: ">",
  Door: "+",
  Sword: "/",
  Shield: "♦",
  Wand: "/",
  Bow: ")",
  Arrow: "↑",
  Torch: "¡",
  Compass: "♦",
  Map: "≡",
  Boots: "b",
  Ring: "°",
  Amulet: "♀",
  Bomb: "•",
  Flask: "¡",
  Bottle: "¡",
  Potion: "¡",
  Elixir: "¡",
  Apple: "o",
  Banana: ")",
  Coconut: "o",
  Berry: "o",
  Fruit: "o",
  Shroom: "τ",
  Herb: "♣",
  Flower: "♣",
  Leaf: "♠",
  Sapling: "♠",
  Stick: "/",
  Wood: "=",
  Plank: "=",
  Ore: "♦",
  Iron: "♦",
  Gold: "♦",
  Diamond: "♦",
  Ruby: "♦",
  Mineral: "♦",
  Crystal: "♦",
  Thorn: "'",
  Spore: "·",
  Coin: "o",
  Nugget: "•",
  Ingot: "▬",
  Bait: "~",
  Wire: "~",
  HP: "♥",
  "Max HP": "♥",
  MP: "♦",
  "Max MP": "♦",
  XP: "x",
  Level: "#",
  Power: "+",
  Wisdom: "*",
  Armor: "■",
  Resist: "♦",
  Vision: "○",
  Haste: "»",
  Logging: "/",
  Farming: "♣",
  Mining: "T",
  Fishing: "J",
  Build: "T",
  Aura: "+",
  Kills: "☻",
  Stats: "P",
  Chat: "?",
  Pause: "║",
  Resume: "►",
};

const grounds: Record<string, string> = {
  water_shallow: colors.teal,
  water_deep: colors.navy,
  water_ice: colors.aqua,
  Desert: colors.olive,
  sand_beach: colors.olive,
  Path: colors.grey,
  gravel_one: colors.grey,
  gravel_two: colors.grey,
  Soil: colors.maroon,
  Dock: colors.olive,
  water_frozen: colors.aqua,
};

const candidates = codePage437.filter((char) => char !== "\u00a0");
const cache = new Map<string, TerminalCell>();

export const projectLayers = (layers: Layer[], name = ""): TerminalCell => {
  const key = JSON.stringify([name, layers]);
  const cached = cache.get(key);
  if (cached) return cached;
  const pixels = composeCharacterPixels(layers);
  const counts = new Map<string, number>();
  for (const color of pixels)
    if (color) counts.set(color, (counts.get(color) || 0) + 1);
  const ordered = [...counts].sort((a, b) => b[1] - a[1]);
  const foreground =
    ordered.find(([color]) => color !== colors.black)?.[0] || colors.black;
  let result: TerminalCell;
  const frameEdge = /^(quick|popup)_(side|corner|center|down|separator)/.test(
    name
  )
    ? [...layers]
        .reverse()
        .find(
          (layer) =>
            layer.color !== colors.black && /[\u2500-\u257f]/.test(layer.char)
        )
    : undefined;
  if (frameEdge) {
    result = {
      char: frameEdge.char,
      foreground: frameEdge.color,
      background: colors.black,
    };
  } else if (grounds[name]) {
    result = { char: " ", foreground, background: grounds[name] };
  } else if (layers.length === 1) {
    result = {
      char: terminalCharacter(layers[0].char),
      foreground: layers[0].color,
    };
    if (layers[0].char === "█")
      result = { char: " ", foreground, background: layers[0].color };
  } else {
    let bestError = Infinity;
    result = { char: " ", foreground, background: undefined };
    for (const char of candidates) {
      const mask = characterMask(char);
      const front = new Map<string, number>();
      const back = new Map<string | undefined, number>();
      for (let i = 0; i < pixels.length; i++) {
        const color = pixels[i];
        if (mask[i]) {
          if (color) front.set(color, (front.get(color) || 0) + 1);
        } else back.set(color, (back.get(color) || 0) + 1);
      }
      const fg = [...front].sort((a, b) => b[1] - a[1])[0];
      const bg = [...back].sort((a, b) => b[1] - a[1])[0];
      const error = pixels.length - (fg?.[1] || 0) - (bg?.[1] || 0);
      if (error < bestError) {
        bestError = error;
        result = {
          char: terminalCharacter(char),
          foreground: fg?.[0] || foreground,
          background: bg?.[0],
        };
      }
    }
    if (symbols[name]) {
      result.char = symbols[name];
      result.foreground = foreground;
      if (result.background === foreground) result.background = undefined;
    }
  }
  if (symbols[name] && layers.length === 1 && layers[0].char !== "█")
    result.char = symbols[name];
  cache.set(key, result);
  return result;
};

export const projectSprite = (
  sprite: Sprite,
  facing?: Orientation,
  amount?: number
) => projectLayers(getFacingLayers(sprite, facing, amount), sprite.name);
