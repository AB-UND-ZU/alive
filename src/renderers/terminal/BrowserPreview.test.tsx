import { useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import BrowserPreview from "./BrowserPreview";
import { createAreaWorld, assertHero } from "../../testing/harness";
import { ACTIONABLE } from "../../engine/components/actionable";
import { POPUP } from "../../engine/components/popup";
import { openChat, getMenu } from "../../features/chat/helpers";
import { credits } from "../../game/assets/credits";
import { MOVABLE } from "../../engine/components/movable";
import { WorldProvider } from "../interface/hooks";
import { createWorldContext } from "../../testing/context";
import { colors } from "../../game/assets/colors";
import * as terminalScreen from "./screen";

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
  const edge = screen.getAllByText(/^─+$/)[0];
  fireEvent.focus(window);
  expect(edge).toHaveStyle({ color: "#00ff00" });
  fireEvent.blur(window);
  expect(edge).toHaveStyle({ color: "#c0c0c0" });
  expect(world.metadata.dimensions.renderedColumns).toBe(33);
  expect(world.metadata.dimensions.renderedRows).toBe(13);
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

it("opens a selected credit link in a browser tab", () => {
  const { world } = setup();
  openChat(world);
  const popup = getMenu(world);
  popup[POPUP].tabs[popup[POPUP].horizontalIndex] = "credits";
  const open = jest.spyOn(window, "open").mockImplementation(() => null);
  render(<BrowserPreview world={world} {...dimensions} paused={false} />);
  fireEvent.keyDown(window, { key: "Enter" });
  expect(open).toHaveBeenCalledWith(credits[0].link, "_blank");
});

it("groups equal colors into selectable text without per-cell markup", () => {
  const { world } = setup();
  const cell = (char: string, background = colors.black) => ({
    char,
    foreground: colors.white,
    background,
  });
  jest.spyOn(terminalScreen, "getTerminalFrame").mockReturnValue([
    [cell("A", colors.red), cell("B", colors.red), cell(" "), cell("C")],
    [cell(" "), cell(" "), cell(" "), cell(" ")],
  ]);
  render(<BrowserPreview world={world} {...dimensions} paused />);
  const terminal = screen.getByRole("group", { name: "Terminal renderer" });
  expect(terminal.textContent).toBe("AB C\n    ");
  expect(screen.getByText("AB")).toHaveStyle({ backgroundColor: colors.red });
  expect(screen.getByText("C")).toHaveStyle({ backgroundColor: colors.black });
  // eslint-disable-next-line testing-library/no-node-access
  expect(terminal.querySelectorAll("span")).toHaveLength(3);
  // eslint-disable-next-line testing-library/no-node-access
  expect(terminal.querySelector("svg, .Cell, .Row")).toBeNull();
});

it("prevents game keys from scrolling while retaining browser shortcuts", () => {
  const { world } = setup();
  render(<BrowserPreview world={world} {...dimensions} paused={false} />);
  const move = new KeyboardEvent("keydown", {
    key: "ArrowDown",
    cancelable: true,
  });
  fireEvent(window, move);
  expect(move.defaultPrevented).toBe(true);
  const copy = new KeyboardEvent("keydown", {
    key: "c",
    ctrlKey: true,
    cancelable: true,
  });
  fireEvent(window, copy);
  expect(copy.defaultPrevented).toBe(false);
});

it("pauses, saves, returns to menu and resumes through native session controls", () => {
  const { world, hero } = setup();
  const saveGame = jest.fn();
  const openMenu = jest.fn();
  function Session() {
    const [paused, setPaused] = useState(false);
    return (
      <WorldProvider
        value={createWorldContext(world, {
          paused,
          setPaused,
          saveGame,
          openMenu,
        })}
      >
        <BrowserPreview
          world={world}
          {...dimensions}
          paused={paused}
          interactiveSession
        />
      </WorldProvider>
    );
  }
  render(<Session />);
  fireEvent.keyDown(window, { key: "ArrowRight" });
  expect(hero[MOVABLE].orientations).toEqual(["right"]);
  fireEvent.keyDown(window, { key: "Escape" });
  expect(hero[MOVABLE].orientations).toEqual([]);
  fireEvent.keyDown(window, { key: "ArrowDown" });
  fireEvent.keyDown(window, { key: "Enter" });
  expect(openMenu).toHaveBeenCalledTimes(1);
  fireEvent.keyDown(window, { key: "s", ctrlKey: true });
  expect(saveGame).toHaveBeenCalledTimes(1);
  fireEvent.keyDown(window, { key: "Escape" });
  fireEvent.keyDown(window, { key: "ArrowRight" });
  expect(hero[MOVABLE].orientations).toEqual(["right"]);
});

it("closes a dialog with Escape before pausing the native session", () => {
  const { world } = setup();
  openChat(world);
  const setPaused = jest.fn();
  render(
    <WorldProvider value={createWorldContext(world, { setPaused })}>
      <BrowserPreview
        world={world}
        {...dimensions}
        paused={false}
        interactiveSession
      />
    </WorldProvider>
  );
  fireEvent.keyDown(window, { key: "Escape" });
  expect(getMenu(world)[POPUP].active).toBe(false);
  expect(setPaused).not.toHaveBeenCalled();
});

it("pauses the standalone session when the browser loses focus", () => {
  const { world } = setup();
  const setPaused = jest.fn();
  render(
    <WorldProvider value={createWorldContext(world, { setPaused })}>
      <BrowserPreview
        world={world}
        {...dimensions}
        paused={false}
        interactiveSession
      />
    </WorldProvider>
  );
  fireEvent.blur(window);
  expect(setPaused).toHaveBeenCalledWith(true);
});
