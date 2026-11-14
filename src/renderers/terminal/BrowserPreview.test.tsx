import { act, fireEvent, render, screen } from "@testing-library/react";
import BrowserPreview from "./BrowserPreview";
import { createAreaWorld, assertHero } from "../../testing/harness";
import { ACTIONABLE } from "../../engine/components/actionable";
import { MOVABLE } from "../../engine/components/movable";

const dimensions = {
  columns: 46,
  rows: 30,
  cellWidth: 9,
  cellHeight: 16,
};
let update: FrameRequestCallback;
const setup = () => {
  const world = createAreaWorld(
    `
|       |
|   ♀   |
|       |
`,
    { size: 96 }
  );
  return {
    world,
    hero: world.assertComponents(assertHero(world), [ACTIONABLE, MOVABLE]),
  };
};

beforeEach(() => {
  jest.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    update = callback;
    return 1;
  });
  jest.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

it("renders the native chrome and restores the hero's DOS font character", () => {
  const { world } = setup();
  render(<BrowserPreview world={world} {...dimensions} paused />);
  expect(
    screen.getByRole("group", { name: "Terminal renderer" })
  ).toBeInTheDocument();
  expect(screen.getByText("\u010b")).toBeInTheDocument();
  const edge = screen.getAllByText("─")[0];
  fireEvent.focus(window);
  expect(edge).toHaveStyle({ color: "#00ff00" });
  fireEvent.blur(window);
  expect(edge).toHaveStyle({ color: "#c0c0c0" });
  expect(world.metadata.dimensions.renderedColumns).toBe(46);
  expect(world.metadata.dimensions.renderedRows).toBe(22);
});

it("uses native terminal keys even when the preview bridge prevents browser defaults", () => {
  const { world, hero } = setup();
  const { unmount } = render(
    <BrowserPreview world={world} {...dimensions} paused={false} />
  );
  const key = new KeyboardEvent("keydown", {
    key: "ArrowRight",
    cancelable: true,
  });
  key.preventDefault();
  fireEvent(window, key);
  expect(hero[MOVABLE].orientations).toEqual(["right"]);
  fireEvent.blur(window);
  expect(hero[MOVABLE].orientations).toEqual([]);
  fireEvent.keyDown(window, { key: " ", ctrlKey: false });
  expect(hero[ACTIONABLE].spellTriggered).toBe(true);
  unmount();
});

it("pauses simulation and native input, then resumes the same world", () => {
  const { world, hero } = setup();
  const { rerender } = render(
    <BrowserPreview world={world} {...dimensions} paused />
  );
  const elapsed = world.metadata.elapsed;
  fireEvent.keyDown(window, { key: "ArrowRight" });
  expect(hero[MOVABLE].orientations).toEqual([]);
  act(() => update(performance.now() + 100));
  expect(world.metadata.elapsed).toBe(elapsed);
  rerender(<BrowserPreview world={world} {...dimensions} paused={false} />);
  act(() => update(performance.now() + 200));
  expect(world.metadata.elapsed).toBeGreaterThan(elapsed);
  fireEvent.keyDown(window, { key: "ArrowRight" });
  expect(hero[MOVABLE].orientations).toEqual(["right"]);
  rerender(<BrowserPreview world={world} {...dimensions} paused />);
  expect(hero[MOVABLE].orientations).toEqual([]);
});
