import { createDialog, createShout } from "../../game/assets/ui";
import { dialogEnd, shoutEnd } from "../../game/assets/sprites";
import { colors } from "../../game/assets/colors";
import { createTerminalFrame } from "./frame";

it.each([
  [createDialog("Hello"), colors.white],
  [createShout("Stop"), colors.red],
] as const)(
  "draws full-height black sides on the speech background",
  (sprites, color) => {
    const frame = createTerminalFrame(
      sprites.map((sprite, x) => ({
        x,
        y: 0,
        z: 0,
        sprite,
        layers: sprite.layers,
        terminalLayers: sprite.terminal?.layers,
      })),
      sprites.length,
      1
    )[0];
    expect(frame[0]).toEqual({
      char: "│",
      foreground: colors.black,
      background: color,
    });
    expect(frame[frame.length - 1]).toEqual({
      char: "│",
      foreground: colors.black,
      background: color,
    });
    for (const cell of frame.slice(1, -1)) expect(cell.background).toBe(color);
  }
);

it("keeps the detailed web end-cap layers", () => {
  for (const [sprite, color] of [
    [dialogEnd, colors.white],
    [shoutEnd, colors.red],
  ] as const) {
    expect(sprite.layers).toEqual([
      { char: "▌", color },
      { char: "│", color: colors.black },
      { char: "║", color },
    ]);
  }
});
