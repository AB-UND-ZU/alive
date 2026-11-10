import { act, render, screen, fireEvent } from "@testing-library/react";
import { Sounds } from "./Sounds";
import { soundPresets } from "../game/sound";
import { playedSounds } from "../testing/env";

// The browser sound-page test covers glyph rendering; keep this test about playback.
jest.mock("../components/Row", () => ({
  __esModule: true,
  default: () => null,
}));

test("every native sound preset has a play control and calls native playback", async () => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  render(<Sounds />);
  const buttons = screen.getAllByLabelText("Play", { selector: "button" });
  expect(new Set(soundPresets).size).toBe(soundPresets.length);
  expect(buttons).toHaveLength(soundPresets.length);
  expect(soundPresets).toEqual(
    expect.arrayContaining(["move", "pickup", "fish", "level"])
  );

  await act(async () => {
    for (const button of buttons) fireEvent.click(button);
  });
  expect(playedSounds).toEqual(soundPresets);
});
