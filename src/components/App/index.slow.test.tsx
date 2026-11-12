/* eslint-disable testing-library/no-node-access, testing-library/no-container -- UI is drawn as glyph spans without accessible roles */
import { installFakeIndexedDB } from "../../game/saves/testing";
import { StrictMode } from "react";
import { act, fireEvent, render } from "@testing-library/react";
import App from ".";
import { loadSounds } from "../../game/sound";
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

const boot = async () => {
  const view = render(<App />);
  const loading = readOverlay(view.container);

  await act(async () => {
    jest.advanceTimersByTime(32);
    await Promise.resolve();
    jest.runOnlyPendingTimers();
  });

  return { ...view, loading, world: mockWorlds[mockWorlds.length - 1] };
};

const start = (container: HTMLElement) =>
  fireEvent.click(container.querySelector("#resume")!);

const fake = installFakeIndexedDB();

beforeEach(() => {
  fake.clear();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe("App", () => {
  it("waits for sounds before generating the menu under StrictMode", async () => {
    let finish!: () => void;
    (loadSounds as jest.Mock).mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finish = resolve;
      })
    );
    const { container } = render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    expect(readOverlay(container)).toContain("Loading game...");
    expect(container.querySelector("#resume")).not.toBeInTheDocument();
    await act(async () => {
      jest.advanceTimersByTime(32);
    });
    const world = mockWorlds[mockWorlds.length - 1];
    expect(world.getEntities(["PLAYER", "POSITION"])).toHaveLength(0);
    expect(readOverlay(container)).toContain("Loading game...");
    await act(async () => {
      finish();
      await Promise.resolve();
    });
    expect(readOverlay(container)).toContain("Loading map...");
    expect(world.getEntities(["PLAYER", "POSITION"])).toHaveLength(0);
    act(() => {
      jest.runOnlyPendingTimers();
    });
    expect(world.getEntities(["PLAYER", "POSITION"])).toHaveLength(1);
    expect(readOverlay(container)).toContain("to start the game");
  });

  it("does not generate an abandoned menu when sound loading finishes", async () => {
    let finish!: () => void;
    (loadSounds as jest.Mock).mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finish = resolve;
      })
    );
    const view = render(<App />);
    await act(async () => {
      jest.advanceTimersByTime(32);
    });
    const world = mockWorlds[mockWorlds.length - 1];
    view.unmount();
    await act(async () => {
      finish();
      await Promise.resolve();
      jest.runOnlyPendingTimers();
    });
    expect(world.getEntities(["PLAYER", "POSITION"])).toHaveLength(0);
  });

  it("shows loading screen, then title screen once the level is ready", async () => {
    const { container, loading } = await boot();

    expect(loading).toContain("Loading game...");
    expect(readOverlay(container)).toContain("to start the game");
    expect(container.querySelector(".Terminal")).toBeInTheDocument();
  });

  it("starts the game when clicking resume", async () => {
    const { container, world } = await boot();

    start(container);

    expect(container.querySelector(".Paused")).not.toBeInTheDocument();
    expect(world.metadata.initial).toBe(false);
  });

  it("moves the hero with arrow keys", async () => {
    const { container, world } = await boot();
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

  it("toggles pause with Escape", async () => {
    const { container } = await boot();
    start(container);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(container.querySelector(".Paused")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(container.querySelector(".Paused")).not.toBeInTheDocument();
  });
});
