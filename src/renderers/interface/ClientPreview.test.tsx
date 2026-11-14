import { act, render } from "@testing-library/react";
import ClientPreview, { isClientPreview } from "./ClientPreview";
import { WorldProvider } from "./hooks";
import { createWorldContext } from "../../testing/context";
import { assertHero, createAreaWorld } from "../../testing/harness";
import { PLAYER } from "../../engine/components/player";
import { POPUP } from "../../engine/components/popup";
import { POSITION } from "../../engine/components/position";
import { STATS } from "../../engine/components/stats";
import { closePopup, openPopup } from "../../engine/systems/popup";
import { getMenu } from "../../features/items/helpers";
import { setAudioActive } from "../../game/sound/resumable";

jest.mock("../../game/sound/resumable", () => ({
  ensureAudio: jest.fn(() => Promise.resolve()),
  setAudioActive: jest.fn(),
}));

beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(document, "hidden", "get").mockReturnValue(false);
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

const setup = (suspended = false) => {
  const world = createAreaWorld(`
|         |
|   ♀     |
|         |
`);
  const hero = world.assertComponents(assertHero(world), [
    PLAYER,
    POSITION,
    STATS,
  ]);
  const paused = jest.fn();
  const initial = jest.fn();
  const context = createWorldContext(world, {
    suspended,
    setInitial: initial,
    setPaused: paused,
  });
  const post = jest
    .spyOn(window.parent, "postMessage")
    .mockImplementation(() => {});
  const view = render(
    <WorldProvider value={context}>
      <ClientPreview />
    </WorldProvider>
  );
  const message = (
    type: string,
    origin = window.location.origin,
    source: MessageEventSource | null = window.parent
  ) =>
    act(() =>
      window.dispatchEvent(
        new MessageEvent("message", { origin, source, data: { type } })
      )
    );
  return { ...view, world, hero, context, post, initial, paused, message };
};

it("reports ready after loading completes, then follows parent visibility", () => {
  const { rerender, context, post, message, paused, initial } = setup(true);
  expect(post).not.toHaveBeenCalledWith(
    { type: "preview-ready" },
    window.location.origin
  );
  rerender(
    <WorldProvider value={{ ...context, suspended: false }}>
      <ClientPreview />
    </WorldProvider>
  );
  expect(post).toHaveBeenCalledWith(
    { type: "preview-ready" },
    window.location.origin
  );
  message("view");
  expect(initial).toHaveBeenLastCalledWith(false);
  expect(paused).toHaveBeenLastCalledWith(false);
  message("pause");
  expect(paused).toHaveBeenLastCalledWith(true);
  expect(setAudioActive).toHaveBeenLastCalledWith(false);
});

it("ignores commands from another origin or a source other than its parent", () => {
  const { message, initial, paused } = setup();
  message("view", "https://elsewhere.invalid");
  message("view", window.location.origin, null);
  expect(initial).not.toHaveBeenCalled();
  expect(paused).not.toHaveBeenCalled();
  message("view");
  expect(initial).toHaveBeenCalledWith(false);
  expect(paused).toHaveBeenCalledWith(false);
});

it("silences blur without stopping a visible menu, and keeps hidden frames paused", () => {
  const { message, paused, post } = setup();
  message("view");
  act(() => window.dispatchEvent(new Event("blur")));
  expect(setAudioActive).toHaveBeenLastCalledWith(false);
  expect(paused).toHaveBeenLastCalledWith(false);
  expect(post).toHaveBeenLastCalledWith(
    { type: "preview-focus", active: false },
    window.location.origin
  );
  jest.spyOn(document, "hidden", "get").mockReturnValue(true);
  act(() => window.dispatchEvent(new Event("blur")));
  expect(paused).toHaveBeenLastCalledWith(true);
  message("pause");
  paused.mockClear();
  act(() => window.dispatchEvent(new Event("focus")));
  expect(paused).not.toHaveBeenCalledWith(false);
});

it("lets Escape close a live dialog before returning focus to the wiki", () => {
  const { world, hero, post } = setup();
  const popup = getMenu(world);
  openPopup(world, hero, popup, true);
  const close = jest.fn(() => closePopup(world, hero, popup));
  window.addEventListener("keydown", close);
  try {
    post.mockClear();
    const first = new KeyboardEvent("keydown", {
      key: "Escape",
      cancelable: true,
    });
    act(() => window.dispatchEvent(first));
    expect(first.defaultPrevented).toBe(false);
    expect(close).toHaveBeenCalledTimes(1);
    expect(popup[POPUP].active).toBe(false);
    expect(post).not.toHaveBeenCalledWith(
      { type: "preview-unfocus" },
      window.location.origin
    );
    const second = new KeyboardEvent("keydown", {
      key: "Escape",
      cancelable: true,
    });
    act(() => window.dispatchEvent(second));
    expect(second.defaultPrevented).toBe(true);
    expect(close).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith(
      { type: "preview-unfocus" },
      window.location.origin
    );
  } finally {
    window.removeEventListener("keydown", close);
  }
});

it("reports the current hero and active dialog, and stops reporting when unmounted", () => {
  const { world, hero, post, unmount } = setup();
  expect(post).toHaveBeenCalledWith(
    {
      type: "preview-state",
      position: hero[POSITION],
      hp: hero[STATS].hp,
      dialog: "",
      automatic: false,
    },
    window.location.origin
  );
  const popup = getMenu(world);
  openPopup(world, hero, popup, true);
  popup[POPUP].horizontalIndex = popup[POPUP].tabs.indexOf("inspect");
  act(() => jest.advanceTimersByTime(200));
  expect(post).toHaveBeenLastCalledWith(
    expect.objectContaining({ type: "preview-state", dialog: "inspect" }),
    window.location.origin
  );
  unmount();
  post.mockClear();
  act(() => jest.advanceTimersByTime(1000));
  expect(post).not.toHaveBeenCalled();
  expect(setAudioActive).toHaveBeenLastCalledWith(false);
});

it("only enables embedded preview mode when its URL requests it", () => {
  const previous = window.location.href;
  try {
    window.history.replaceState({}, "", "/alive/html/?preview");
    expect(isClientPreview()).toBe(true);
    window.history.replaceState({}, "", "/alive/html/");
    expect(isClientPreview()).toBe(false);
  } finally {
    window.history.replaceState({}, "", previous);
  }
});
