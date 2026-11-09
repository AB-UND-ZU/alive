/* eslint-disable testing-library/no-node-access -- UI is drawn as glyph spans without accessible roles */
import { act, fireEvent, render } from "@testing-library/react";
import App from ".";
import { readRows } from "../Controls/testing";
import type { World } from "../../engine";
import { assertHero, step } from "../../testing/harness";
import { MOVABLE } from "../../engine/components/movable";
import { POSITION } from "../../engine/components/position";

// WebGL is not available in jsdom, the scene is covered by Systems tests
jest.mock("@react-three/fiber", () => ({
  ...jest.requireActual("@react-three/fiber"),
  Canvas: () => null,
}));

// capture the world created by the World component through its context
const mockWorlds: World[] = [];
jest.mock("../Stats", () => ({
  __esModule: true,
  default: (props: object) => {
    const ecs = require("../../bindings/hooks").useWorld().ecs;
    if (ecs && !mockWorlds.includes(ecs)) mockWorlds.push(ecs);
    return require("react").createElement(
      jest.requireActual("../Stats").default,
      props
    );
  },
}));

const readOverlay = (container: HTMLElement) =>
  readRows(container, ".Paused .Overlay .Row").join("\n");

const boot = () => {
  const view = render(<App />);
  const loading = readOverlay(view.container);

  // level is generated in a deferred timeout to show loading screen first
  act(() => {
    jest.runOnlyPendingTimers();
  });

  return { ...view, loading, world: mockWorlds[mockWorlds.length - 1] };
};

const start = (container: HTMLElement) =>
  fireEvent.click(container.querySelector("#resume")!);

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("App", () => {
  it("shows loading screen, then title screen once the level is ready", () => {
    const { container, loading } = boot();

    expect(loading).toContain("Loading map...");
    expect(readOverlay(container)).toContain("to start the game");
    expect(container.querySelector(".Terminal")).toBeInTheDocument();
  });

  it("starts the game when clicking resume", () => {
    const { container, world } = boot();

    start(container);

    expect(container.querySelector(".Paused")).not.toBeInTheDocument();
    expect(world.metadata.initial).toBe(false);
  });

  it("moves the hero with arrow keys", () => {
    const { container, world } = boot();
    start(container);
    const hero = assertHero(world);
    const { x, y } = hero[POSITION];

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(hero[MOVABLE].orientations).toEqual(["right"]);

    // canvas is not mounted, so tick the systems manually
    act(() => step(world, 10));
    fireEvent.keyUp(window, { key: "ArrowRight" });

    expect(hero[MOVABLE].orientations).toEqual([]);
    expect(hero[POSITION]).toEqual({ x: x + 1, y });
  });

  it("toggles pause with Escape", () => {
    const { container } = boot();
    start(container);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(container.querySelector(".Paused")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(container.querySelector(".Paused")).not.toBeInTheDocument();
  });
});
