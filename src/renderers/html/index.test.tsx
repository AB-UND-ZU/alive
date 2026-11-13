import { act, render, screen } from "@testing-library/react";
import HtmlRenderer from ".";
import * as sceneFrame from "../interface/frame";
import { systemsFrame } from "../interface/clock";
import { createAreaWorld, assertHero } from "../../testing/harness";
import { colors } from "../../game/assets/colors";
import { Sprite } from "../../engine/components/sprite";

const createWorld = () =>
  createAreaWorld(
    `
|████████|
|█ ♀    █|
|████████|
`,
    { size: 32 }
  );

let time = 0;
let nextFrame = 0;
let frames: Map<number, FrameRequestCallback>;

beforeEach(() => {
  time = 0;
  nextFrame = 0;
  frames = new Map();
  jest.spyOn(performance, "now").mockImplementation(() => time);
  jest.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    nextFrame += 1;
    frames.set(nextFrame, callback);
    return nextFrame;
  });
  jest.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => {
    frames.delete(id);
  });
});

afterEach(() => jest.restoreAllMocks());

const advanceFrame = (deltaMs: number) => {
  time += deltaMs;
  const callbacks = [...frames.values()];
  frames.clear();
  act(() => callbacks.forEach((callback) => callback(time)));
};

const dimensions = { columns: 11, rows: 7, cellWidth: 18, cellHeight: 32 };

it("advances the supplied world, pauses without catchup, and releases its animation loop", () => {
  const world = createWorld();
  const otherWorld = createWorld();
  const update = jest.spyOn(world, "update");
  const { rerender, unmount } = render(
    <HtmlRenderer world={world} {...dimensions} paused={false} />
  );

  advanceFrame(systemsFrame);
  expect(update).toHaveBeenCalled();
  const runningElapsed = world.metadata.elapsed;

  rerender(<HtmlRenderer world={world} {...dimensions} paused />);
  advanceFrame(60_000);
  expect(world.metadata.elapsed).toBe(runningElapsed);

  rerender(<HtmlRenderer world={world} {...dimensions} paused={false} />);
  advanceFrame(systemsFrame + 1);
  expect(world.metadata.elapsed - runningElapsed).toBeCloseTo(systemsFrame);

  const previousElapsed = world.metadata.elapsed;
  const otherElapsed = otherWorld.metadata.elapsed;
  rerender(<HtmlRenderer world={otherWorld} {...dimensions} paused={false} />);
  advanceFrame(systemsFrame);
  expect(otherWorld.metadata.elapsed).toBeGreaterThan(otherElapsed);
  expect(world.metadata.elapsed).toBe(previousElapsed);

  unmount();
  expect(frames.size).toBe(0);
});

it("keeps a single glyph as selectable text and resolves stacked layers into one SVG", () => {
  const world = createWorld();
  const entity = assertHero(world);
  const letter: Sprite = {
    name: "Letter",
    layers: [{ char: "A", color: colors.lime }],
  };
  const stacked: Sprite = {
    name: "Stacked letter",
    layers: [
      { char: "█", color: colors.black },
      { char: "B", color: colors.white },
    ],
  };
  jest.spyOn(sceneFrame, "getSceneFrame").mockReturnValue([
    {
      key: "letter",
      x: 4,
      y: 3,
      z: 0,
      layers: letter.layers,
      sprite: letter,
      entity,
    },
    {
      key: "stacked",
      x: 5,
      y: 3,
      z: 0,
      layers: stacked.layers,
      sprite: stacked,
      entity,
    },
  ]);
  const { container } = render(
    <HtmlRenderer world={world} {...dimensions} paused />
  );

  expect(screen.getByText("A")).toHaveStyle({ color: colors.lime });
  expect(container.textContent).toBe("A");
  // Decorative SVG layers deliberately have no accessible text or role.
  // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
  const resolved = container.querySelectorAll("svg");
  expect(resolved).toHaveLength(1);
  expect(resolved[0]).toHaveAttribute("viewBox", "0 0 9 16");
  expect(resolved[0].innerHTML).not.toBe("");
  expect(sceneFrame.getSceneFrame).toHaveBeenCalledWith(
    world,
    11,
    7,
    expect.any(Object)
  );
});
