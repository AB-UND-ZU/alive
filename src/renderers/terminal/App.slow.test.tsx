import { act, fireEvent, render, screen } from "@testing-library/react";
import App from "./App";
import { installFakeIndexedDB } from "../../game/saves/testing";
import { loadSounds } from "../../game/sound";
import * as audio from "../../game/sound/resumable";
import type { WorldContext } from "../interface/hooks";
import { assertHero } from "../../testing/harness";
import { LEVEL } from "../../engine/components/level";
import { MOVABLE } from "../../engine/components/movable";

let mockContext: WorldContext;
jest.mock("./BrowserPreview", () => ({
  __esModule: true,
  default: (props: object) => {
    mockContext = require("../interface/hooks").useWorld();
    return require("react").createElement(
      jest.requireActual("./BrowserPreview").default,
      props
    );
  },
}));

const fake = installFakeIndexedDB();
const originalUrl = window.location.href;

const finishLoading = async () => {
  await act(async () => {
    jest.advanceTimersByTime(32);
    await Promise.resolve();
    jest.runOnlyPendingTimers();
  });
};

const boot = async () => {
  const view = render(<App />);
  await finishLoading();
  const world = mockContext.ecs;
  if (!world) throw new Error("Terminal world was not created");
  return { ...view, world };
};

const message = (type: string, origin = window.location.origin) =>
  fireEvent(
    window,
    new MessageEvent("message", {
      source: window.parent,
      origin,
      data: { type },
    })
  );

beforeEach(() => {
  fake.clear();
  jest.useFakeTimers();
  window.history.replaceState({}, "", "/terminal/");
  jest.spyOn(document, "hidden", "get").mockReturnValue(false);
});

afterEach(() => {
  window.history.replaceState({}, "", originalUrl);
  jest.useRealTimers();
  jest.restoreAllMocks();
  audio.setAudioActive(true);
});

it("waits for sound loading, generates the standard menu and starts the terminal session", async () => {
  let finish!: () => void;
  (loadSounds as jest.Mock).mockReturnValueOnce(
    new Promise<void>((resolve) => {
      finish = resolve;
    })
  );
  render(<App />);
  await act(async () => {
    jest.advanceTimersByTime(32);
  });
  const world = mockContext.ecs!;
  expect(mockContext.suspended).toBe(true);
  expect(mockContext.paused).toBe(true);
  expect(world.getEntities(["PLAYER", "POSITION"])).toHaveLength(0);
  await act(async () => {
    finish();
    await Promise.resolve();
    jest.runOnlyPendingTimers();
  });
  expect(world.metadata.gameEntity[LEVEL].name).toBe("LEVEL_MENU");
  expect(world.getEntities(["PLAYER", "POSITION"])).toHaveLength(1);
  expect(mockContext.suspended).toBe(false);
  expect(mockContext.initial).toBe(false);
  expect(mockContext.paused).toBe(false);
  expect(
    screen.getByRole("group", { name: "Terminal renderer" })
  ).toBeInTheDocument();
});

it("pauses and resumes the running menu with native terminal keys", async () => {
  const { world } = await boot();
  const hero = assertHero(world);
  fireEvent.keyDown(window, { key: "ArrowRight" });
  expect(hero[MOVABLE].orientations).toEqual(["right"]);
  fireEvent.keyDown(window, { key: "Escape" });
  expect(mockContext.paused).toBe(true);
  expect(hero[MOVABLE].orientations).toEqual([]);
  expect(
    screen.getByRole("group", { name: "Terminal renderer" })
  ).toHaveTextContent("RESUME");
  const pausedAt = world.metadata.elapsed;
  act(() => jest.advanceTimersByTime(150));
  expect(world.metadata.elapsed).toBe(pausedAt);
  fireEvent.keyDown(window, { key: "Enter" });
  expect(mockContext.paused).toBe(false);
  act(() => jest.advanceTimersByTime(100));
  expect(world.metadata.elapsed).toBeGreaterThan(pausedAt);
});

it("waits for parent visibility in preview mode and keeps unfocused autoplay muted", async () => {
  window.history.replaceState({}, "", "/terminal/?preview");
  const post = jest
    .spyOn(window.parent, "postMessage")
    .mockImplementation(() => {});
  const activity = jest.spyOn(audio, "setAudioActive");
  const { world } = await boot();
  expect(mockContext.suspended).toBe(false);
  expect(mockContext.paused).toBe(true);
  expect(mockContext.initial).toBe(true);
  expect(activity).toHaveBeenLastCalledWith(false);
  expect(post).toHaveBeenCalledWith(
    { type: "preview-ready" },
    window.location.origin
  );
  message("view", "https://unrelated.example");
  expect(mockContext.paused).toBe(true);
  message("view");
  expect(mockContext.initial).toBe(false);
  expect(mockContext.paused).toBe(false);
  fireEvent.keyDown(window, { key: "ArrowRight" });
  expect(assertHero(world)[MOVABLE].orientations).toEqual(["right"]);
  fireEvent.blur(window);
  expect(assertHero(world)[MOVABLE].orientations).toEqual([]);
  expect(mockContext.paused).toBe(false);
  expect(activity).toHaveBeenLastCalledWith(false);
  jest.spyOn(document, "hidden", "get").mockReturnValue(true);
  fireEvent(document, new Event("visibilitychange"));
  expect(mockContext.paused).toBe(true);
  message("pause");
  fireEvent.blur(window);
  expect(mockContext.paused).toBe(true);
});
