import { colors } from "../../game/assets/colors";
import {
  createTerminalFrame,
  frameToAnsi,
  frameToText,
  TerminalSprite,
} from "./frame";
import { createText } from "../../game/assets/ui";
import { createTerminalRoot, TerminalScreen } from "./react";
import React from "react";

const sprite = (char: string, x: number, y: number, z = 0): TerminalSprite => ({
  x,
  y,
  z,
  sprite: { name: "text_generic" },
  layers: [{ char, color: colors.white }],
});

describe("terminal frame", () => {
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
