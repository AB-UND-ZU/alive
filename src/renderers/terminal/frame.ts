import { SceneSprite, SceneState } from "../interface/frame";
import { Layer, SPRITE } from "../../engine/components/sprite";
import { colors, darkColors, orderedColors } from "../../game/assets/colors";
import { projectLayers, projectTerminalLayers, TerminalCell } from "./sprites";
import { ENTERABLE } from "../../engine/components/enterable";
import { World } from "../../engine";
import { PLAYER } from "../../engine/components/player";
import { BUMPABLE } from "../../engine/components/bumpable";
import { PARTICLE } from "../../engine/components/particle";
import { SEQUENCABLE } from "../../engine/components/sequencable";
import { Orientation, orientationPoints } from "../../engine/components/orientable";
import {
  popupHeight,
  fogHeight,
  objectHeight,
} from "../interface/segments";
import { FOG } from "../../engine/components/fog";
import { LIGHT } from "../../engine/components/light";
import { LOCKABLE } from "../../engine/components/lockable";
import { HARVESTABLE } from "../../engine/components/harvestable";
import { tombstone1, tombstone2 } from "../../game/assets/sprites";
import { AFFECTABLE } from "../../engine/components/affectable";

export type TerminalSprite = {
  x: number;
  y: number;
  z: number;
  layers: Layer[];
  terminalLayers?: Layer[];
  unit?: boolean;
  floating?: boolean;
  sprite: { name: string };
  fog?: boolean;
  overlay?: boolean;
  ui?: boolean;
  hero?: { hit: boolean; ghost?: boolean; background?: string };
};
export type TerminalFrame = TerminalCell[][];

// Ignore floating-point noise at a cell boundary before snapping mirrored edges.
const ceilOffset = (offset: number) =>
  Math.sign(offset) * Math.ceil(Math.abs(offset) - 1e-6);

// Equipment and backdrops are layers of one actor, not replacement characters.
export const collectTerminalSprites = (
  scene: SceneSprite[]
): TerminalSprite[] => {
  const result: TerminalSprite[] = [];
  const bodies = new Map<string, TerminalSprite>();
  for (const entry of scene) {
    if (/^scratch(?:-|$)/.test(entry.particleName || "")) continue;
    const bodyEntry = /body\d+$/.test(entry.key);
    if (
      bodyEntry &&
      ([tombstone1, tombstone2].includes(entry.entity[SPRITE]) ||
        entry.entity[LOCKABLE]?.locked === false)
    )
      continue;
    const titleBlock = /^block_(up|down)$/.test(entry.sprite.name);
    if (!titleBlock && !bodyEntry) {
      if (
        entry.entity[PLAYER] &&
        entry.z < popupHeight &&
        ["Melee", "Magic", "True"].includes(entry.sprite.name)
      ) {
        const body = bodies.get(entry.key.replace(/particle\d+$/, "body"));
        if (body?.hero) body.hero.hit = true;
      }
      const bodyKey = entry.key.replace(/particle\d+$/, "body");
      const anchor = bodies.get(bodyKey);
      const wave = entry.particleSequence === "castWave1";
      const centered = [
        "castWave1",
        "trapAura",
        "levelUp",
        "fountainSplash",
      ].includes(entry.particleSequence || "");
      const waveState = wave && entry.entity[SEQUENCABLE]?.states.spell;
      const waveStep =
        waveState &&
        waveState.args.progress > waveState.args.memory?.innerRadius
          ? orientationPoints[
              entry.particleName!.split("-").pop() as Orientation
            ]
          : { x: 0, y: 0 };
      const beam = entry.particleSequence === "castBeam1";
      const sprite = {
        ...entry,
        z:
          beam && ["start", "end"].includes(entry.particleName || "")
            ? entry.z + 0.0001
            : entry.particleSequence?.startsWith("cast")
            ? Math.max(entry.z, objectHeight + 0.01)
            : entry.z,
        x:
          wave && anchor
            ? Math.ceil(anchor.x) +
              entry.particle![PARTICLE].offsetX -
              waveStep.x
            : centered && anchor
            ? Math.ceil(anchor.x) + ceilOffset(entry.x - anchor.x)
            : beam
            ? Math.ceil(entry.x - 1e-6)
            : entry.x,
        y:
          wave && anchor
            ? Math.ceil(anchor.y) +
              entry.particle![PARTICLE].offsetY -
              waveStep.y
            : centered && anchor
            ? Math.ceil(anchor.y) + ceilOffset(entry.y - anchor.y)
            : beam
            ? Math.ceil(entry.y - 1e-6)
            : entry.y,
        overlay: !!entry.particle,
        ui: [
          "popupInteract",
          "dialogText",
          "discoveryIdle",
          "pointerArrow",
        ].includes(entry.particleSequence || ""),
      };
      result.push(sprite);
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
      if (
        entry.sprite === entry.entity[SPRITE] ||
        entry.sprite === entry.entity[ENTERABLE]?.sprite
      ) {
        body.sprite = entry.sprite;
        body.terminalLayers = entry.terminalLayers;
      }
    } else {
      const effects = entry.entity[AFFECTABLE];
      const sprite: TerminalSprite = {
        ...entry,
        hero: entry.entity[PLAYER]
          ? {
              hit: false,
              ghost: !!entry.entity[PLAYER].ghost,
              background: effects?.freeze
                ? colors.aqua
                : effects?.burn
                ? colors.maroon
                : undefined,
            }
          : undefined,
        layers: [...entry.layers],
        unit: entry.entity[FOG]?.type === "unit",
        floating:
          entry.entity[FOG]?.type === "float" ||
          (entry.entity[LIGHT]?.darkness || 0) > 0,
        terminalLayers:
          entry.sprite === entry.entity[SPRITE] ||
          entry.sprite === entry.entity[ENTERABLE]?.sprite
            ? entry.terminalLayers
            : undefined,
        sprite:
          entry.sprite === entry.entity[ENTERABLE]?.sprite
            ? entry.sprite
            : entry.entity[SPRITE] || entry.sprite,
      };
      const resource = entry.entity[HARVESTABLE]?.resource;
      if (
        [
          "stump",
          "husk",
          "desert_husk",
          "post",
          "root",
          "footing",
          "hinge",
          "rubble",
        ].includes(resource)
      )
        sprite.terminalLayers = [
          {
            char: ",",
            color: resource === "rubble" ? colors.grey : colors.maroon,
          },
        ];
      bodies.set(key, sprite);
      result.push(sprite);
    }
  }
  for (const sprite of result) {
    if (sprite.unit) sprite.z = popupHeight - 0.00175;
    if (sprite.hero) sprite.z = popupHeight - 0.0015;
    if (
      sprite.ui &&
      sprite.z < popupHeight &&
      !["Melee", "Magic", "True", "Heal"].includes(sprite.sprite.name)
    )
      sprite.z = popupHeight - 0.002;
    if (
      ["Melee", "Magic", "True"].includes(sprite.sprite.name) &&
      (sprite.terminalLayers || sprite.layers).some((layer) =>
        "oxX".includes(layer.char)
      )
    )
      sprite.z = popupHeight - 0.001;
  }
  return result;
};

const fogColor = (color: string) => {
  const dark = darkColors[color] || color;
  return dark === colors.grey ? colors.black : dark;
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
  const protectedCells = new Set<number>();
  let fogApplied = false;
  const applyFog = () => {
    for (const index of fogCells) {
      if (protectedCells.has(index)) continue;
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
        if (cell.char === "≈") cell.foreground = colors.black;
      }
      cell.background = colors.grey;
    }
    fogApplied = true;
  };
  for (const sprite of [...sprites].sort((a, b) => a.z - b.z)) {
    if (!fogApplied && sprite.z >= fogHeight) applyFog();
    const x = Math.ceil(sprite.x),
      y = Math.ceil(sprite.y);
    if (x < 0 || x >= columns || y < 0 || y >= rows) continue;
    if (sprite.sprite.name === "fog_war") continue;
    if (sprite.fog && !fogApplied) fogCells.add(y * columns + x);
    let projected = sprite.terminalLayers
      ? projectTerminalLayers(sprite.terminalLayers)
      : projectLayers(sprite.layers, sprite.sprite.name);
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
        foreground: sprite.hero.hit
          ? colors.red
          : sprite.hero.ghost
          ? projected.foreground
          : colors.white,
        background: sprite.hero.background ?? projected.background,
      };
    }
    if (projected.char === " " && projected.background === undefined) continue;
    if (sprite.floating) protectedCells.add(y * columns + x);
    if (
      sprite.overlay &&
      sprite.z < popupHeight &&
      projected.background === colors.black
    )
      projected = { ...projected, background: frame[y][x].background };
    const background = projected.background ?? frame[y][x].background;
    if (
      sprite.ui &&
      [colors.white, colors.silver].includes(projected.foreground) &&
      [colors.white, colors.silver].includes(background || "")
    )
      projected = { ...projected, foreground: colors.black };
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
