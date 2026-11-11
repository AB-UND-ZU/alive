/* eslint-disable testing-library/no-node-access, testing-library/no-container -- pause screen is drawn as glyph spans without accessible roles */
import { act, fireEvent, render } from "@testing-library/react";
import { useEffect } from "react";
import World from ".";
import { World as WorldType } from "../../engine";
import { useWorld, WorldContext } from "../../bindings/hooks";
import { LEVEL } from "../../engine/components/level";
import { MOVABLE } from "../../engine/components/movable";
import { POSITION } from "../../engine/components/position";
import { TypedEntity } from "../../engine/entities";
import { getSaveSummaries, SaveGame, setSaveSummaries } from "../../game/saves";
import { storeGame } from "../../game/saves/storage";
import { installFakeIndexedDB } from "../../game/saves/testing";
import {
  assertHero,
  createAreaWorld,
  holdMove,
  step,
} from "../../testing/harness";
import Controls from "../Controls";
import Paused from "../Paused";
import { readRows } from "../Controls/testing";

// every test generates the main menu, which takes a few seconds under load
jest.setTimeout(30000);

// ♀ hero
const area = `
|     |
|  ♀  |
|     |
`;

const fake = installFakeIndexedDB();
const readSaves = () => fake.read("alive", "saves") as SaveGame[];

let context: WorldContext;
let mounts = 0;

function Probe() {
  context = useWorld();
  useEffect(() => {
    mounts += 1;
  }, []);
  return null;
}

const ecs = () => context.ecs as WorldType;
const levelName = () => ecs().metadata.gameEntity[LEVEL].name;

// storage settles in promises, which fake timers don't run
const flush = () =>
  act(async () => {
    for (let index = 0; index < 20; index += 1) await Promise.resolve();
  });

// the menu is generated in a timeout after showing the loading screen
const generateMenu = () =>
  act(async () => {
    jest.advanceTimersByTime(32);
    await Promise.resolve();
    jest.runOnlyPendingTimers();
  });

const renderWorld = (
  props: React.ComponentProps<typeof World> = {},
  controls = false
) => {
  const view = render(
    <World {...props}>
      <Probe />
      <Paused />
      {controls && <Controls />}
    </World>
  );
  const saveText = () => {
    const rows = readRows(view.container, ".Overlay .Row");
    return rows[rows.length - 1].trim();
  };

  return { ...view, saveText };
};

const renderGame = (controls = false) =>
  renderWorld(
    { createInitialWorld: () => createAreaWorld(area), persistent: true },
    controls
  );

const pause = () => {
  act(() => context.setPaused(false));
  act(() => context.setPaused(true));
};

const removeMovable = (world: WorldType) =>
  world.removeComponentFromEntity(
    assertHero(world) as TypedEntity<"MOVABLE">,
    MOVABLE,
    false
  );

beforeEach(() => {
  jest.useFakeTimers();
  fake.clear();
  setSaveSummaries([]);
  mounts = 0;
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe("World", () => {
  it("lists stored saves on start", async () => {
    const save = await storeGame(createAreaWorld(area));
    setSaveSummaries([]);

    renderWorld();
    await flush();

    expect(getSaveSummaries().map(({ id }) => id)).toEqual([save.id]);
  });

  it("starts without saves when listing them fails", async () => {
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    await storeGame(createAreaWorld(area));
    setSaveSummaries([]);
    fake.abortNext(new Error("UnknownError"));

    renderWorld();
    await flush();
    await generateMenu();

    expect(error).toHaveBeenCalledWith(
      "Loading saves failed:",
      expect.any(Error)
    );
    expect(getSaveSummaries()).toEqual([]);
    expect(levelName()).toBe("LEVEL_MENU");
    expect(context.suspended).toBe(false);
  });

  it("saves when pausing and shows progress, then the save name", async () => {
    const { saveText } = renderGame();

    pause();

    expect(context.saveStatus).toEqual({ saving: true });
    expect(saveText()).toBe("Saving...");

    await flush();

    const [save] = readSaves();
    expect(ecs().metadata.saveId).toBe(save.id);
    expect(saveText()).toBe(save.name);
  });

  it("doesn't save when pausing an already paused game", async () => {
    renderGame();

    act(() => context.setPaused(true));
    await flush();

    expect(readSaves()).toEqual([]);
    expect(context.saveStatus).toBeUndefined();
  });

  it("replaces the same save when pausing again", async () => {
    renderGame();
    pause();
    await flush();
    const [first] = readSaves();
    act(() => step(ecs(), 30));

    pause();
    await flush();

    const [second, ...others] = readSaves();
    expect(others).toEqual([]);
    expect(second.id).toBe(first.id);
    expect(second.playtime).toBeGreaterThan(first.playtime);
  });

  it("pauses and saves with Escape, and resumes with Escape", async () => {
    renderGame(true);
    act(() => context.setPaused(false));

    fireEvent.keyDown(window, { key: "Escape" });
    await flush();

    expect(context.paused).toBe(true);
    expect(readSaves()).toHaveLength(1);

    fireEvent.keyDown(window, { key: "Escape" });
    await flush();

    expect(context.paused).toBe(false);
    expect(readSaves()).toHaveLength(1);
  });

  it("pauses and saves when switching browser tabs", async () => {
    renderGame(true);
    act(() => context.setPaused(false));
    const hidden = jest.spyOn(document, "hidden", "get").mockReturnValue(true);

    fireEvent(document, new Event("visibilitychange"));
    hidden.mockRestore();
    await flush();

    expect(context.paused).toBe(true);
    expect(readSaves()).toHaveLength(1);
  });

  it("saves with the SAVE button of the pause screen", async () => {
    const { container, saveText } = renderGame();

    fireEvent.click(container.querySelector("#pause-save")!);
    await flush();

    expect(readSaves()).toHaveLength(1);
    expect(saveText()).toBe(readSaves()[0].name);
  });

  it("shows when saving failed", async () => {
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    const { saveText } = renderGame();
    await flush();
    fake.abortNext(new Error("QuotaExceededError"));

    pause();
    await flush();

    expect(saveText()).toBe("Failed!");
    expect(context.saveStatus).toEqual({ saving: false, failed: true });
    expect(error).toHaveBeenCalledWith("Saving failed:", expect.any(Error));
    expect(readSaves()).toEqual([]);
  });

  it("doesn't save while the hero steps through a portal", async () => {
    renderGame();
    removeMovable(ecs());

    pause();
    await flush();

    expect(readSaves()).toEqual([]);
    expect(context.saveStatus).toBeUndefined();
  });

  it("doesn't save in the main menu", async () => {
    renderWorld();
    await generateMenu();

    pause();
    await flush();

    expect(levelName()).toBe("LEVEL_MENU");
    expect(readSaves()).toEqual([]);
    expect(context.saveStatus).toBeUndefined();
  });

  it("doesn't read or write saves in wiki scenes", async () => {
    await storeGame(createAreaWorld(area));
    setSaveSummaries([]);
    renderWorld({ createInitialWorld: () => createAreaWorld(area) });

    pause();
    await flush();

    expect(getSaveSummaries()).toEqual([]);
    expect(readSaves()).toHaveLength(1);
    expect(context.saveStatus).toBeUndefined();
  });

  it("saves before returning to the main menu", async () => {
    renderGame();
    const game = ecs();

    act(() => context.openMenu());

    expect(context.suspended).toBe(true);
    expect(context.paused).toBe(false);
    expect(ecs()).not.toBe(game);
    expect(levelName()).toBe("LEVEL_MENU");
    expect(mounts).toBe(2);

    await flush();
    await generateMenu();

    expect(readSaves().map(({ id }) => id)).toEqual([game.metadata.saveId]);
    expect(context.suspended).toBe(false);
    expect(ecs().metadata.initial).toBe(false);
  });

  it("loads a save from the continue portal into a running world", async () => {
    const saved = createAreaWorld(area);
    const save = await storeGame(saved);
    const { x, y } = assertHero(saved)[POSITION];
    renderWorld();
    await generateMenu();
    const menu = ecs();

    act(() => menu.metadata.suspend());
    act(() => {
      menu.metadata.loadGame(save.id);
    });
    await flush();

    const loaded = ecs();
    expect(loaded).not.toBe(menu);
    expect(loaded.metadata.saveId).toBe(save.id);
    expect(loaded.metadata.initial).toBe(false);
    expect(levelName()).toBe("LEVEL_TUTORIAL");
    expect(context.suspended).toBe(false);
    expect(mounts).toBe(2);

    const hero = assertHero(loaded);
    expect(hero[POSITION]).toEqual({ x, y });
    holdMove(loaded, ["right"]);
    act(() => step(loaded, 10));
    expect(hero[POSITION]).toEqual({ x: x + 1, y });
  });

  it("replaces the loaded save when saving again", async () => {
    const save = await storeGame(createAreaWorld(area));
    renderWorld();
    await generateMenu();
    act(() => {
      ecs().metadata.loadGame(save.id);
    });
    await flush();

    pause();
    await flush();

    expect(readSaves().map(({ id }) => id)).toEqual([save.id]);
  });

  it("starts the menu after a loaded game without its save", async () => {
    const save = await storeGame(createAreaWorld(area));
    renderWorld();
    await generateMenu();
    act(() => {
      ecs().metadata.loadGame(save.id);
    });
    await flush();

    act(() => context.openMenu());
    await flush();
    await generateMenu();

    expect(levelName()).toBe("LEVEL_MENU");
    expect(ecs().metadata.saveId).toBeUndefined();
  });

  it("returns to the main menu when loading fails", async () => {
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    renderWorld();
    await generateMenu();
    const menu = ecs();

    act(() => {
      menu.metadata.loadGame("missing");
    });
    await flush();

    expect(error).toHaveBeenCalledWith("Loading failed:", expect.any(Error));
    expect(ecs()).not.toBe(menu);
    expect(context.suspended).toBe(true);

    await generateMenu();

    expect(levelName()).toBe("LEVEL_MENU");
    expect(context.suspended).toBe(false);
  });

  it("erases saves from the menu", async () => {
    const save = await storeGame(createAreaWorld(area));
    renderWorld();
    await generateMenu();

    act(() => {
      ecs().metadata.eraseGame(save.id);
    });
    await flush();

    expect(readSaves()).toEqual([]);
  });

  it("reports failures when erasing", async () => {
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    renderWorld();
    await generateMenu();
    await flush();
    fake.abortNext(new Error("UnknownError"));

    act(() => {
      ecs().metadata.eraseGame("any");
    });
    await flush();

    expect(error).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledWith("Erasing failed:", expect.any(Error));
  });
});
