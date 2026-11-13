import { SceneSprite } from "../interface/frame";
import { Layer, SPRITE } from "../../engine/components/sprite";
import { colors } from "../../game/assets/colors";
import { projectLayers, TerminalCell } from "./sprites";

export type TerminalSprite = {
  x: number;
  y: number;
  z: number;
  layers: Layer[];
  sprite: { name: string };
};
export type TerminalFrame = TerminalCell[][];

// Equipment and backdrops are layers of one actor, not replacement characters.
export const collectTerminalSprites = (
  scene: SceneSprite[]
): TerminalSprite[] => {
  const result: TerminalSprite[] = [];
  const bodies = new Map<string, TerminalSprite>();
  for (const entry of scene) {
    if (!/body\d+$/.test(entry.key)) {
      result.push(entry);
      continue;
    }
    const key = entry.key.replace(/body\d+$/, "body");
    const body = bodies.get(key);
    if (body) {
      body.layers.push(...entry.layers);
      body.z = Math.max(body.z, entry.z);
    } else {
      const sprite = {
        ...entry,
        layers: [...entry.layers],
        sprite: entry.entity[SPRITE] || entry.sprite,
      };
      bodies.set(key, sprite);
      result.push(sprite);
    }
  }
  return result;
};

export const createTerminalFrame = (
  sprites: TerminalSprite[],
  columns: number,
  rows: number
): TerminalFrame => {
  const frame = Array.from({ length: rows }, () =>
    Array.from(
      { length: columns },
      (): TerminalCell => ({
        char: " ",
        foreground: colors.white,
        background: colors.black,
      })
    )
  );
  for (const sprite of [...sprites].sort((a, b) => a.z - b.z)) {
    const x = Math.ceil(sprite.x),
      y = Math.ceil(sprite.y);
    if (x < 0 || x >= columns || y < 0 || y >= rows) continue;
    const projected = projectLayers(sprite.layers, sprite.sprite.name);
    if (projected.char === " " && projected.background === undefined) continue;
    frame[y][x] = {
      ...projected,
      background: projected.background ?? frame[y][x].background,
    };
  }
  return frame;
};

const ansiColor = (color: string, background = false) => {
  const value = Number.parseInt(color.slice(1), 16);
  return `\x1b[${background ? 48 : 38};2;${value >> 16};${(value >> 8) & 255};${
    value & 255
  }m`;
};

export const frameToAnsi = (frame: TerminalFrame) => {
  let output = "\x1b[H",
    foreground = "",
    background = "";
  frame.forEach((row, index) => {
    if (index) output += `\x1b[${index + 1};1H`;
    for (const cell of row) {
      if (cell.foreground !== foreground) {
        foreground = cell.foreground;
        output += ansiColor(foreground);
      }
      if ((cell.background || colors.black) !== background) {
        background = cell.background || colors.black;
        output += ansiColor(background, true);
      }
      // Sprite data is not allowed to write terminal control sequences.
      const code = cell.char.codePointAt(0) || 0;
      output += code < 32 || code === 127 ? " " : cell.char;
    }
  });
  return output + "\x1b[0m";
};

export const frameToText = (frame: TerminalFrame) =>
  frame.map((row) => row.map((cell) => cell.char).join("")).join("\n");
