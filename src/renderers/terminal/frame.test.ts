import {
  advance,
  assertHero,
  createAreaWorld,
  createTestWorld,
} from "../../testing/harness";
import { PLAYER } from "../../engine/components/player";
import { BUMPABLE } from "../../engine/components/bumpable";
import { colors, orderedColors } from "../../game/assets/colors";
import {
  createTerminalFrame,
  collectTerminalSprites,
  frameToAnsi,
  frameToText,
  TerminalSprite,
  shakeTerminalFrame,
  TerminalState,
} from "./frame";
import { addBackground, createButton, createText } from "../../game/assets/ui";
import { createTerminalRoot, TerminalScreen } from "./react";
import React from "react";
import { getSceneFrame } from "../interface/frame";

const sprite = (char: string, x: number, y: number, z = 0): TerminalSprite => ({
  x,
  y,
  z,
  sprite: { name: "text_generic" },
  layers: [{ char, color: colors.white }],
});

describe("terminal frame", () => {
  it("combines the menu title's upper and lower blocks without losing either half", () => {
    const world = createTestWorld({ level: "LEVEL_MENU" });
    advance(world, 10000);
    const scene = getSceneFrame(world, 33, 16, undefined, { instant: true });
    const lower = scene.find(
      (entry) =>
        entry.sprite.name === "block_down" &&
        scene.some(
          (other) =>
            other.sprite.name === "block_up" &&
            other.x === entry.x &&
            other.y === entry.y &&
            other.z === entry.z
        )
    )!;
    expect(lower).toBeDefined();
    const pair = scene.filter(
      (entry) =>
        /^block_(up|down)$/.test(entry.sprite.name) &&
        entry.x === lower.x &&
        entry.y === lower.y &&
        entry.z === lower.z
    );
    const combined = collectTerminalSprites(pair);
    expect(combined).toHaveLength(1);
    expect(combined[0].layers.map((layer) => layer.char).sort()).toEqual([
      "▀",
      "▄",
    ]);
    const frame = createTerminalFrame(combined, 33, 16);
    expect(frame[Math.ceil(lower.y)][Math.ceil(lower.x)]).toEqual({
      char: "▀",
      foreground: colors.maroon,
      background: colors.maroon,
    });
    expect(
      collectTerminalSprites([pair[0], { ...pair[1], z: pair[1].z + 1 }])
    ).toHaveLength(2);
  });

  it("snaps motion to the next cell and clips sprites outside the screen", () => {
    const frame = createTerminalFrame(
      [sprite("@", 0.1, 0.1), sprite("x", 2, 2)],
      2,
      2
    );
    expect(frameToText(frame)).toBe("  \n @");
  });

  it("keeps terrain background under a foreground sprite and ignores transparent space", () => {
    const frame = createTerminalFrame(
      [
        { x: 0, y: 0, z: 0, sprite: { name: "water_deep" }, layers: [] },
        sprite("@", 0, 0, 1),
        sprite(" ", 0, 0, 2),
      ],
      1,
      1
    );
    expect(frame[0][0]).toEqual({
      char: "@",
      foreground: colors.white,
      background: colors.navy,
    });
  });

  it("draws in height order and does not emit control characters as sprite text", () => {
    const frame = createTerminalFrame(
      [sprite("A", 0, 0, 5), sprite("B", 0, 0, 1)],
      1,
      1
    );
    expect(frameToText(frame)).toBe("A");
    frame[0][0].char = String.fromCharCode(27);
    expect(frameToAnsi(frame)).not.toContain(
      String.fromCharCode(27) + String.fromCharCode(27)
    );
    expect(frameToAnsi(frame).endsWith(" \x1b[0m")).toBe(true);
  });

  it("commits frame changes through React without a browser", () => {
    const write = jest.fn();
    const root = createTerminalRoot(write);
    const first = createTerminalFrame([sprite("A", 0, 0)], 1, 1);
    root.render(React.createElement(TerminalScreen, { frame: first }));
    expect(write).toHaveBeenLastCalledWith(frameToAnsi(first));
    const second = createTerminalFrame(
      createText("B").map((value, x) => ({
        ...sprite("B", x, 0),
        layers: value.layers,
      })),
      1,
      1
    );
    root.render(React.createElement(TerminalScreen, { frame: second }));
    expect(write).toHaveBeenLastCalledWith(frameToAnsi(second));
    root.unmount();
  });
});

it("inverts fog intensity, including empty terrain, without recoloring dialogs", () => {
  const red = sprite(".", 0, 0);
  red.layers[0].color = colors.red;
  const frame = createTerminalFrame(
    [
      { ...red, fog: true },
      { ...sprite(" ", 1, 0), fog: true },
      { ...sprite(".", 2, 0), fog: true },
      {
        ...sprite("C", 2, 0, 10),
        layers: createText("C", colors.white, colors.black)[0].layers,
      },
    ],
    3,
    1
  );
  expect(frame[0][0]).toMatchObject({
    char: ".",
    foreground: colors.maroon,
    background: colors.white,
  });
  expect(frame[0][1]).toMatchObject({ char: " ", background: colors.white });
  expect(frame[0][2]).toMatchObject({
    char: "C",
    foreground: colors.white,
    background: colors.black,
  });
});

it("frames native buttons with brackets and retains their palette", () => {
  const frame = createTerminalFrame(
    createButton("GO", 4, false, false, false, "lime").map((item, x) => ({
      x,
      y: 0,
      z: 10,
      sprite: item,
      layers: item.layers,
    })),
    4,
    1
  );
  expect(frameToText(frame)).toBe("[GO]");
  expect(frame[0].every((cell) => cell.background === colors.lime)).toBe(true);
});

it("resets ANSI colors for each row and after colored cells", () => {
  const expected = [
    [
      { char: "A", foreground: colors.red, background: colors.white },
      { char: "B", foreground: colors.lime, background: colors.black },
    ],
    [
      { char: "C", foreground: colors.yellow, background: colors.black },
      { char: " ", foreground: colors.white, background: colors.black },
    ],
  ];
  const output = frameToAnsi(expected);
  const actual: typeof expected = [[], []];
  let x = 0,
    y = 0,
    foreground = colors.purple,
    background = colors.blue;
  // ANSI escape sequences are the protocol under test.
  // eslint-disable-next-line no-control-regex
  for (const token of output.match(/\x1b\[[\d;]*[mH]|[^\x1b]/gu) || []) {
    if (token.startsWith("\x1b[")) {
      const values = token.slice(2, -1).split(";").map(Number);
      if (token.endsWith("H")) {
        y = (values[0] || 1) - 1;
        x = (values[1] || 1) - 1;
      } else
        for (const code of values) {
          if (code === 0) {
            foreground = colors.silver;
            background = colors.black;
          } else if (code >= 30 && code <= 37)
            foreground = orderedColors[code - 30];
          else if (code >= 90 && code <= 97)
            foreground = orderedColors[code - 90 + 8];
          else if (code >= 40 && code <= 47)
            background = orderedColors[code - 40];
          else if (code >= 100 && code <= 107)
            background = orderedColors[code - 100 + 8];
        }
    } else actual[y][x++] = { char: token, foreground, background };
  }
  expect(actual).toEqual(expected);
  expect(output).toContain("\x1b[0m\x1b[2;1H");
});

it("shifts the whole screen once for a new hit and restores it without actor bumps", () => {
  const world = createAreaWorld("| ♀ |");
  const hero = assertHero(world);
  const state: TerminalState = { stickyCastables: {} };
  const frame = createTerminalFrame(
    [sprite("A", 0, 0), sprite("B", 1, 0)],
    3,
    1
  );
  hero[PLAYER].receivedStats.melee = 5;
  expect(shakeTerminalFrame(world, frame, state)).toBe(frame);
  hero[BUMPABLE]!.orientation = "right";
  expect(shakeTerminalFrame(world, frame, state)).toBe(frame);
  hero[PLAYER].receivedStats.melee += 1;
  expect(frameToText(shakeTerminalFrame(world, frame, state))).toBe(" AB");
  world.metadata.elapsed += 100;
  expect(shakeTerminalFrame(world, frame, state)).toBe(frame);
});

it("keeps bracket colors when a dialog backdrop is added to a button", () => {
  const frame = createTerminalFrame(
    addBackground(
      createButton("GO", 4, false, true, false, "lime"),
      colors.black
    ).map((item, x) => ({ x, y: 0, z: 10, sprite: item, layers: item.layers })),
    4,
    1
  );
  expect(frameToText(frame)).toBe("[GO]");
  expect(frame[0].every((cell) => cell.background === colors.green)).toBe(true);
  expect(frame[0][0].foreground).toBe(colors.white);
});
