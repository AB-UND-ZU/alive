import { Layer, Sprite } from "../../engine/components/sprite";
import { Orientation } from "../../engine/components/orientable";
import { colors } from "../../game/assets/colors";
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

// The font stores CP437 control pictures at private code points.
const controls = Array.from("☺☻♥♦♣♠•◘○◙♂♀♪♫☼►◄↕‼¶§▬↨↑↓→←∟↔▲▼");
export const terminalCharacter = (char: string) => {
  const code = char.charCodeAt(0);
  if (code >= 256 && code <= 286) return controls[code - 256];
  if (code === 287) return "⌂";
  return char;
};

const cache = new Map<string, TerminalCell>();

export const projectLayers = (layers: Layer[], name = ""): TerminalCell => {
  const key = JSON.stringify([name, layers]);
  const cached = cache.get(key);
  if (cached) return cached;
  const pixelArt =
    (name === "" || name === "text_generic" || name === "popup_background") &&
    layers.every((layer) => " █▀▄\u0106\u0107░".includes(layer.char)) &&
    layers.some((layer) => "▀▄\u0106\u0107".includes(layer.char));
  const pixelLayers = pixelArt
    ? layers
        .filter((layer) => layer.char !== " " && layer.char !== "░")
        .map((layer) => ({
          ...layer,
          char: "\u0106\u0107".includes(layer.char) ? "█" : layer.char,
        }))
    : layers;
  if (
    (pixelArt || layers.some((layer) => "▀▄".includes(layer.char))) &&
    pixelLayers.every((layer) => "█▀▄".includes(layer.char))
  ) {
    let upper: string = colors.black;
    let lower: string = colors.black;
    for (const layer of pixelLayers) {
      if (layer.char !== "▄") upper = layer.color;
      if (layer.char !== "▀") lower = layer.color;
    }
    const cell =
      upper === lower
        ? {
            char: upper === colors.black ? " " : "█",
            foreground: upper,
            background: lower,
          }
        : upper === colors.black
        ? { char: "▄", foreground: lower, background: upper }
        : { char: "▀", foreground: upper, background: lower };
    cache.set(key, cell);
    return cell;
  }
  const shadeIndex =
    layers[0]?.char === "█" && layers[0].color === colors.black ? 1 : 0;
  const shade = layers[shadeIndex];
  if (
    shade &&
    layers[shadeIndex + 1]?.char === "▀" &&
    layers[shadeIndex + 1].color === colors.black &&
    ("▄█".includes(shade.char) ||
      (shade.char === "░" &&
        [colors.silver, colors.grey].includes(shade.color))) &&
    name !== "progress" &&
    !name.startsWith("level_progress")
  ) {
    const cell = projectLayers(layers.slice(shadeIndex + 2), name);
    const dark = [
      colors.black,
      colors.maroon,
      colors.green,
      colors.olive,
      colors.navy,
      colors.blue,
      colors.purple,
      colors.teal,
    ];
    const selected = {
      ...cell,
      background: shade.color,
      foreground: dark.includes(shade.color) ? colors.white : colors.black,
    };
    cache.set(key, selected);
    return selected;
  }
  const pixels = composeCharacterPixels(layers);
  const counts = new Map<string, number>();
  for (const color of pixels)
    if (color) counts.set(color, (counts.get(color) || 0) + 1);
  const dominant =
    [...counts]
      .filter(([color]) => color !== colors.black)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || colors.black;
  const block =
    [...layers].reverse().find((layer) => layer.char === "█") ||
    [...layers]
      .reverse()
      .find(
        (layer) => "▀▄▌▐".includes(layer.char) && layer.color !== colors.black
      );
  const background = block?.color;
  let result: TerminalCell = { char: " ", foreground: dominant };
  const edge = /^(quick|popup)_(side|corner|center|down|separator)/.test(name)
    ? [...layers]
        .reverse()
        .find(
          (layer) =>
            layer.color !== colors.black && /[\u2500-\u257f]/.test(layer.char)
        )
    : undefined;
  const progress =
    layers[0]?.char === "░" &&
    layers.some((layer) => layer.char === "▀" && layer.color === colors.black);
  const letter =
    [...layers]
      .reverse()
      .find(
        (layer) =>
          layer.char !== " " &&
          !(layer.color === colors.black && "▀▄▌▐░▒▓".includes(layer.char))
      ) || layers[layers.length - 1];
  const xpLabel =
    layers[layers.length - 3]?.char === "*" &&
    layers[layers.length - 3]?.color === colors.lime &&
    layers[layers.length - 2]?.char === "─" &&
    letter?.char === "·" &&
    letter.color === colors.lime;

  if (
    layers.some(
      (layer) => layer.char === "■" && layer.color === colors.black
    ) &&
    layers.some((layer) => layer.char === "|") &&
    background &&
    background !== colors.black
  ) {
    result = { char: "║", foreground: colors.black, background };
  } else if (name === "warn_on" || name === "warn_off") {
    result = { char: name === "warn_on" ? "!" : "O", foreground: dominant };
  } else if (xpLabel) {
    result = {
      char: "x",
      foreground: colors.lime,
      ...(background ? { background } : {}),
    };
  } else if (
    (name === "text_generic" || name === "button_generic" || progress) &&
    letter &&
    (!progress || !"█▀▄▌▐░▒▓".includes(letter.char))
  ) {
    if (letter)
      result = {
        char: terminalCharacter(letter.char),
        foreground: letter.color,
        background:
          background ||
          (/[\u2500-\u257f]/.test(letter.char) ? colors.black : undefined),
      };
  } else if (edge) {
    result = {
      char: edge.char,
      foreground: edge.color,
      background: colors.black,
    };
  } else if (name === "edge" || name === "edge_element") {
    const edge = layers.find(
      (layer) => layer.color !== colors.black && "┼┴├┬┤".includes(layer.char)
    );
    result = { char: edge?.char || "┼", foreground: edge?.color || dominant };
  } else if (name === "bolt" || name === "bolt_element") {
    const center = [...layers]
      .reverse()
      .find((layer) => layer.color !== colors.black);
    result = { char: "•", foreground: center?.color || dominant };
  } else if (/^spell_trigger(?:_element)?$/.test(name)) {
    result = { char: "x", foreground: dominant };
  } else if (/^spell_trigger_(side|corner)$/.test(name)) {
    const line = layers.find(
      (layer) => layer.color !== colors.black && "|-/\\".includes(layer.char)
    );
    result = { char: line?.char || "|", foreground: line?.color || dominant };
  } else if (/^spell_dash(?:_element)?$/.test(name)) {
    const direction = layers.find(
      (layer) => layer.color !== colors.black && "><v".includes(layer.char)
    );
    result = {
      char:
        direction?.char ||
        (layers.some((layer) => layer.char === "▄")
          ? "v"
          : layers.some((layer) => layer.char === "X")
          ? "^"
          : "+"),
      foreground: dominant,
    };
  } else if (name === "Eye") {
    result = {
      char: layers.some((layer) => layer.char === "·") ? "o" : "ô",
      foreground: dominant,
    };
  } else if (name === "Key") {
    result = { char: "╒", foreground: dominant };
  } else if (name === "Fence") {
    result = { char: "±", foreground: dominant };
  } else if (name === "Box") {
    result = { char: "■", foreground: colors.maroon };
  } else if (name === "Chick") {
    result = { char: "♦", foreground: colors.yellow };
  } else if (name === "Fishing") {
    result = { char: "⌠", foreground: dominant };
  } else if (name === "Lever") {
    result = {
      char: layers.some((layer) => layer.char === "/") ? "≥" : "≤",
      foreground: layers.find((layer) => layer.char === ".")?.color || dominant,
    };
  } else if (
    name === "Worm" &&
    layers.every((layer) => [colors.red, colors.black].includes(layer.color))
  ) {
    result = { char: "~", foreground: colors.red };
  } else if (name === "XP" || name === "xp_dot") {
    result = {
      char: layers.some((layer) => "xX".includes(layer.char)) ? "X" : "x",
      foreground: colors.lime,
    };
  } else if (name === "Close") {
    result = { char: "X", foreground: colors.red };
  } else if (name === "Door" || name === "Locked") {
    const open = layers.length === 1 && layers[0].char === "▌";
    result = open
      ? { char: " ", foreground: colors.black }
      : {
          char: "╒",
          foreground:
            name === "Locked"
              ? layers.find((layer) => layer.char === "\u0106")?.color ||
                dominant
              : colors.black,
          background:
            layers.find((layer) => layer.char === "\u0107")?.color ||
            colors.maroon,
        };
  } else if (/^fountain_(side|corner)$/.test(name) || name === "Fountain") {
    result = { char: " ", foreground: colors.blue, background: colors.blue };
  } else if (/^tree_leaves/.test(name)) {
    result = { char: "▄", foreground: dominant };
  } else if (/^tree_(one|two|burnt_one|burnt_two)$/.test(name)) {
    const crown = [...layers]
      .reverse()
      .find((layer) => layer.color !== colors.black);
    result = {
      char: crown ? terminalCharacter(crown.char) : "#",
      foreground: crown?.color || colors.green,
      background: colors.maroon,
    };
  } else if (name === "Berry") {
    const fruit = layers.find((layer) => layer.color === colors.purple);
    result = { char: fruit?.char || "°", foreground: colors.fuchsia };
  } else if (name === "water_bubble") {
    result = {
      char: layers.some((layer) => layer.char === "w")
        ? "O"
        : layers.some((layer) => layer.char === "\u0108")
        ? "o"
        : "•",
      foreground: colors.blue,
    };
  } else if (name === "wall_solid" || name === "wall_granite") {
    result = {
      char: " ",
      foreground: colors.silver,
      background: colors.silver,
    };
  } else if (/^shot(?:_shadow|_wood_2)?$/.test(name)) {
    const arrow = layers.find(
      (layer) =>
        layer.color !== colors.black && "\u0117\u0118»«".includes(layer.char)
    );
    result = {
      char: arrow
        ? { "\u0117": "↑", "\u0118": "↓", "»": "→", "«": "←" }[arrow.char] ||
          "→"
        : layers.some(
            (layer) => layer.color === colors.black && layer.char === "\u0119"
          )
        ? "←"
        : "→",
      foreground:
        layers.find((layer) => layer.color !== colors.black)?.color || dominant,
    };
  } else if (["Desert", "sand_beach", "Soil", "Path"].includes(name)) {
    result = {
      char: name === "sand_beach" ? "▒" : "░",
      foreground: name === "Path" ? colors.silver : colors.black,
      background: name === "Path" ? undefined : dominant,
    };
  } else if (
    name === "water_shallow" ||
    name === "water_deep" ||
    name === "water_frozen"
  ) {
    result = {
      char: name === "water_shallow" ? "~" : " ",
      foreground: colors.blue,
      background: colors.navy,
    };
  } else if (name === "water_ice") {
    result = { char: "\\", foreground: colors.aqua, background: colors.teal };
  } else {
    const person = layers.find(
      (layer) => layer.char === "\u010b" && layer.color !== colors.black
    );
    const building =
      /^(?:fortress_)?(?:roof|house|basement|wall_inside|window)(?:_|$)/.test(
        name
      );
    const edge =
      building &&
      [...layers]
        .reverse()
        .find(
          (layer) =>
            layer.color !== colors.black && /[\u2500-\u257f]/.test(layer.char)
        );
    if (person) {
      result = { char: "♀", foreground: colors.silver };
    } else if (edge) {
      let char = edge.char;
      if (/roof/.test(name)) {
        if (/left_up/.test(name)) char = "╔";
        else if (/up_right/.test(name)) char = "╗";
        else if (/down_left/.test(name)) char = "╠";
        else if (/right_down/.test(name)) char = "╣";
        else if (/_(up|down)(_|$)/.test(name)) char = "═";
        else if (/_(left|right)(_|$)/.test(name)) char = "║";
      } else {
        char =
          { "║": "│", "═": "─", "╔": "┌", "╗": "┐", "╚": "└", "╝": "┘" }[
            char
          ] || char;
      }
      result = {
        char,
        foreground: colors.silver,
        background: colors.black,
      };
    } else if (building) {
      result = {
        char: " ",
        foreground: colors.silver,
        background: colors.silver,
      };
    } else if (layers.length === 1) {
      result = {
        char: terminalCharacter(layers[0].char),
        foreground: layers[0].color,
      };
      if (layers[0].char === "█")
        result = {
          char: " ",
          foreground: layers[0].color,
          background: layers[0].color,
        };
    } else {
      let error = Infinity;
      for (const layer of layers) {
        const mask = characterMask(layer.char);
        const backs = new Map<string | undefined, number>();
        let matches = 0;
        for (let index = 0; index < pixels.length; index++) {
          if (mask[index]) {
            if (pixels[index] === layer.color) matches++;
          } else backs.set(pixels[index], (backs.get(pixels[index]) || 0) + 1);
        }
        const back = [...backs].sort((a, b) => b[1] - a[1])[0];
        const bg = back?.[0];
        if (
          layer.color === colors.black &&
          (!background ||
            background === colors.black ||
            !bg ||
            bg === colors.black)
        )
          continue;
        const nextError = pixels.length - matches - (back?.[1] || 0);
        if (nextError < error) {
          error = nextError;
          result = {
            char: terminalCharacter(layer.char),
            foreground: layer.color,
            background: bg,
          };
        }
      }
      // A solid fill uses the background channel, leaving text and half-block art alone.
      if (result.char === "█")
        result = {
          char: " ",
          foreground: result.foreground,
          background: result.foreground,
        };
    }
  }
  if (pixels.every((pixel) => pixel === colors.black))
    result = { char: " ", foreground: colors.black, background: colors.black };
  if (
    /^button_(generic|disabled|left|right)$/.test(name) &&
    layers.some((layer) => layer.char === "░" && layer.color === colors.black)
  ) {
    result = {
      ...result,
      char: name === "button_disabled" ? " " : result.char,
      foreground: colors.black,
      background: colors.grey,
    };
  }
  cache.set(key, result);
  return result;
};

export const projectTerminalLayers = (layers: Layer[]): TerminalCell =>
  projectLayers(layers, "text_generic");

export const projectSprite = (
  sprite: Sprite,
  facing?: Orientation,
  amount?: number
) =>
  sprite.terminal
    ? projectTerminalLayers(getFacingLayers(sprite.terminal, facing, amount))
    : projectLayers(getFacingLayers(sprite, facing, amount), sprite.name);
