import { SceneSprite, SceneState } from "../interface/frame";
import { Layer, SPRITE } from "../../engine/components/sprite";
import {
  brightColors,
  colors,
  darkColors,
  orderedColors,
} from "../../game/assets/colors";
import { projectLayers, TerminalCell } from "./sprites";
import { ENTERABLE } from "../../engine/components/enterable";
import { World } from "../../engine";
import { PLAYER } from "../../engine/components/player";
import { BUMPABLE } from "../../engine/components/bumpable";
import { orientationPoints } from "../../engine/components/orientable";
import { popupHeight, tooltipHeight } from "../interface/segments";
import { AFFECTABLE } from "../../engine/components/affectable";

export type TerminalSprite = {
  x: number;
  y: number;
  z: number;
  layers: Layer[];
  sprite: { name: string };
  fog?: boolean;
  overlay?: boolean;
  hero?: { hit: boolean; background?: string };
};
export type TerminalFrame = TerminalCell[][];

// Equipment and backdrops are layers of one actor, not replacement characters.
export const collectTerminalSprites = (
  scene: SceneSprite[]
): TerminalSprite[] => {
  const result: TerminalSprite[] = [];
  const bodies = new Map<string, TerminalSprite>();
  for (const entry of scene) {
    if (/^scratch(?:-|$)/.test(entry.particleName || "")) continue;
    const titleBlock = /^block_(up|down)$/.test(entry.sprite.name);
    if (!titleBlock && !/body\d+$/.test(entry.key)) {
      if (
        entry.entity[PLAYER] &&
        entry.z < popupHeight &&
        ["Melee", "Magic", "True"].includes(entry.sprite.name)
      ) {
        const body = bodies.get(entry.key.replace(/particle\d+$/, "body"));
        if (body?.hero) body.hero.hit = true;
      }
      result.push({ ...entry, overlay: !!entry.particle });
      continue;
    }
    const key = titleBlock
      ? `block:${entry.x}:${entry.y}:${entry.z}`
      : entry.key.replace(/body\d+$/, "body");
    const body = bodies.get(key);
    if (body) {
      body.layers.push(...entry.layers);
      body.z = Math.max(body.z, entry.z);
      body.fog = body.fog || entry.fog;
      if (entry.sprite === entry.entity[ENTERABLE]?.sprite)
        body.sprite = entry.sprite;
    } else {
      const effects = entry.entity[AFFECTABLE];
      const sprite: TerminalSprite = {
        ...entry,
        hero: entry.entity[PLAYER]
          ? {
              hit: false,
              background: effects?.freeze
                ? colors.aqua
                : effects?.burn
                ? colors.maroon
                : undefined,
            }
          : undefined,
        layers: [...entry.layers],
        sprite:
          entry.sprite === entry.entity[ENTERABLE]?.sprite
            ? entry.sprite
            : entry.entity[SPRITE] || entry.sprite,
      };
      bodies.set(key, sprite);
      result.push(sprite);
    }
  }
  for (const sprite of result) {
    if (sprite.hero) sprite.z = popupHeight - 0.001;
  }
  return result;
};

const fogColor = (color: string) => {
  if (color === colors.black) return colors.white;
  if (color === colors.white) return colors.black;
  return (
    darkColors[color] ||
    brightColors[color] ||
    `#${(Number.parseInt(color.slice(1), 16) ^ 0xffffff)
      .toString(16)
      .padStart(6, "0")}`
  );
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
  const fogCells = new Set<number>();
  let fogApplied = false;
  const applyFog = () => {
    for (const index of fogCells) {
      const cell = frame[Math.floor(index / columns)][index % columns];
      if (cell.background === colors.navy && cell.char === " ") {
        cell.char = "░";
        cell.foreground = colors.blue;
      } else if (
        [colors.olive, colors.yellow].includes(cell.background || "")
      ) {
        cell.foreground = colors.yellow;
      } else {
        if (
          cell.char === " " &&
          cell.background &&
          cell.background !== colors.black
        ) {
          cell.char = "█";
          cell.foreground = cell.background;
        }
        if (cell.foreground !== colors.yellow)
          cell.foreground = fogColor(cell.foreground);
        if (cell.foreground === colors.grey) cell.foreground = colors.silver;
      }
      cell.background = colors.grey;
    }
    fogApplied = true;
  };
  for (const sprite of [...sprites].sort((a, b) => a.z - b.z)) {
    if (!fogApplied && sprite.z >= tooltipHeight) applyFog();
    const x = Math.ceil(sprite.x),
      y = Math.ceil(sprite.y);
    if (x < 0 || x >= columns || y < 0 || y >= rows) continue;
    if (sprite.sprite.name === "fog_war") continue;
    if (sprite.fog && !fogApplied) fogCells.add(y * columns + x);
    let projected = projectLayers(sprite.layers, sprite.sprite.name);
    if (
      sprite.sprite.name === "button_left" ||
      sprite.sprite.name === "button_right"
    ) {
      const disabled = sprite.layers.some(
        (layer) => layer.char === "░" && layer.color === colors.black
      );
      const background = disabled
        ? colors.grey
        : [...sprite.layers]
            .reverse()
            .find((layer) => "▌▐".includes(layer.char))?.color ||
          sprite.layers[0]?.color ||
          colors.white;
      const foreground = [
        colors.green,
        colors.maroon,
        colors.navy,
        colors.purple,
        colors.teal,
        colors.black,
      ].includes(background)
        ? colors.white
        : colors.black;
      projected = {
        char: sprite.sprite.name === "button_left" ? "[" : "]",
        foreground,
        background,
      };
    }
    if (sprite.hero) {
      projected = {
        ...projected,
        foreground: sprite.hero.hit ? colors.red : colors.white,
        background: sprite.hero.background ?? projected.background,
      };
    }
    if (projected.char === " " && projected.background === undefined) continue;
    if (
      sprite.overlay &&
      sprite.z < popupHeight &&
      fogCells.has(y * columns + x)
    ) {
      projected = {
        ...projected,
        background: colors.grey,
        foreground: [colors.grey, colors.silver].includes(projected.foreground)
          ? colors.white
          : projected.foreground,
      };
    }
    frame[y][x] = {
      ...projected,
      background: projected.background ?? frame[y][x].background,
    };
  }
  if (!fogApplied) applyFog();
  return frame;
};

export type TerminalState = SceneState & {
  receivedDamage?: number;
  shake?: { until: number; x: number; y: number };
};

export const shakeTerminalFrame = (
  world: World,
  frame: TerminalFrame,
  state?: TerminalState
): TerminalFrame => {
  const hero = world.getEntities([PLAYER])[0];
  if (!state || !hero) return frame;
  const stats = hero[PLAYER].receivedStats;
  const received = stats.melee + stats.magic + stats.true;
  if (state.receivedDamage !== undefined && received > state.receivedDamage) {
    const direction = hero[BUMPABLE]?.orientation;
    state.shake = {
      until: world.metadata.elapsed + 100,
      ...(direction ? orientationPoints[direction] : { x: 1, y: 0 }),
    };
  }
  state.receivedDamage = received;
  if (!state.shake || world.metadata.elapsed >= state.shake.until) return frame;
  const { x, y } = state.shake;
  return frame.map((row, rowIndex) =>
    row.map(
      (_, columnIndex) =>
        frame[rowIndex - y]?.[columnIndex - x] || {
          char: " ",
          foreground: colors.white,
          background: colors.black,
        }
    )
  );
};

const paletteValues = orderedColors.map((color) =>
  Number.parseInt(color.slice(1), 16)
);
const ansiColor = (color: string, background = false) => {
  let index = orderedColors.indexOf(color);
  if (index === -1) {
    const rgb = Number.parseInt(color.slice(1), 16);
    let distance = Infinity;
    paletteValues.forEach((value, candidate) => {
      const difference = [16, 8, 0].reduce(
        (sum, shift) =>
          sum + (((rgb >> shift) & 255) - ((value >> shift) & 255)) ** 2,
        0
      );
      if (difference < distance) {
        distance = difference;
        index = candidate;
      }
    });
  }
  return `\x1b[${
    (background ? 40 : 30) + (index % 8) + (index >= 8 ? 60 : 0)
  }m`;
};

export const frameToAnsi = (frame: TerminalFrame) => {
  let output = "\x1b[0m\x1b[H",
    foreground = "",
    background = "";
  frame.forEach((row, index) => {
    if (index) output += `\x1b[0m\x1b[${index + 1};1H`;
    foreground = "";
    background = "";
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
