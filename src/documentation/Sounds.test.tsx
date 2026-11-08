import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Sounds } from "./Sounds";
import { soundPresets } from "../game/sound";
import { playedSounds } from "../testing/env";

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
  fireEvent.click(buttons[0]);
  await waitFor(() => expect(playedSounds).toContain(soundPresets[0]));
}, 15000);
