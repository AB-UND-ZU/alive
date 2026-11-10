import { StrictMode } from "react";
import { render } from "@testing-library/react";
import Stats from ".";
import Controls from "../Controls";
import { renderHud } from "../Controls/testing";
import { createSpellWorld } from "../../features/spells/helpers";

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

it("runs one HUD animation interval and releases it across StrictMode remounts", () => {
  for (let cycle = 0; cycle < 20; cycle++) {
    const { unmount } = render(
      <StrictMode>
        <Stats />
      </StrictMode>
    );
    expect(jest.getTimerCount()).toBe(1);
    unmount();
    expect(jest.getTimerCount()).toBe(0);
  }
});

it("clears action highlights when equipped controls unmount", () => {
  const { world } = createSpellWorld(
    "| ♀ |",
    { spell: "wave", material: "wood" },
    { size: 64, mp: 99 }
  );
  const set = jest.spyOn(window, "setInterval"),
    clear = jest.spyOn(window, "clearInterval");
  const { tick, unmount } = renderHud(
    world,
    <StrictMode>
      <Controls />
    </StrictMode>
  );
  tick(3);
  expect(set).toHaveBeenCalled();
  unmount();
  const stopped = clear.mock.calls.map(([id]) => id);
  for (const call of set.mock.results) expect(stopped).toContain(call.value);
  set.mockRestore();
  clear.mockRestore();
});
