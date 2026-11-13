/* eslint-disable testing-library/no-node-access, testing-library/no-container -- pause screen is drawn as glyph spans without accessible roles */
import { fireEvent } from "@testing-library/react";
import Paused from ".";
import { World } from "../../engine";
import { MOVABLE } from "../../engine/components/movable";
import { TypedEntity } from "../../engine/entities";
import { saveVersion, setSaveSummaries } from "../../game/saves";
import {
  assertHero,
  createAreaWorld,
  createTestWorld,
} from "../../testing/harness";
import { isDisabledCell, readRows, renderHud } from "../Controls/testing";
import { WorldContext } from "../../renderers/interface/hooks";

// ♀ hero
const area = `
|     |
|  ♀  |
|     |
`;

let menu: World;

beforeAll(() => {
  menu = createTestWorld();
});

beforeEach(() => {
  setSaveSummaries([]);
});

const renderPaused = (world: World, overrides: Partial<WorldContext> = {}) => {
  const context = {
    paused: true,
    setPaused: jest.fn(),
    setInitial: jest.fn(),
    saveGame: jest.fn(),
    openMenu: jest.fn(),
    ...overrides,
  };
  const view = renderHud(world, <Paused />, context);
  const overlay = () => readRows(view.container, ".Overlay .Row");
  const click = (id: string) =>
    fireEvent.click(view.container.querySelector(`#${id}`)!);
  const isDisabled = (id: string) =>
    Array.from(view.container.querySelectorAll(`#${id} .Cell`)).some((cell) =>
      isDisabledCell(cell, "white")
    );

  return { ...view, ...context, overlay, click, isDisabled };
};

const removeMovable = (world: World) =>
  world.removeComponentFromEntity(
    assertHero(world) as TypedEntity<"MOVABLE">,
    MOVABLE,
    false
  );

describe("Paused", () => {
  it("is hidden while playing", () => {
    const { container } = renderPaused(createAreaWorld(area), {
      paused: false,
    });

    expect(container.querySelector(".Paused")).not.toBeInTheDocument();
  });

  it("shows the loading screen while a level is prepared", () => {
    const { overlay } = renderPaused(menu, { paused: false, suspended: true });

    expect(overlay()[0]).toContain("Loading map...");
  });

  it("starts the game from the title screen with a click", () => {
    const { overlay, click, setPaused, setInitial } = renderPaused(menu, {
      initial: true,
    });

    expect(overlay()).toContain("to start the game");
    expect(overlay()).toHaveLength(5);

    click("resume");

    expect(setPaused).toHaveBeenCalledWith(false);
    expect(setInitial).toHaveBeenCalledWith(false);
  });

  it("offers only resume in the main menu, centered in an odd number of rows", () => {
    const { overlay, container, click, setPaused, setInitial, openMenu } =
      renderPaused(menu);

    expect(overlay().join("\n")).toContain("RESUME");
    expect(overlay()).toHaveLength(5);
    expect(container.querySelector("#pause-menu")).not.toBeInTheDocument();
    expect(container.querySelector("#pause-save")).not.toBeInTheDocument();

    click("pause-resume");

    expect(setPaused).toHaveBeenCalledWith(false);
    expect(setInitial).not.toHaveBeenCalled();
    expect(openMenu).not.toHaveBeenCalled();
  });

  it("offers resume, menu and save in a level, centered in an odd number of rows", () => {
    const { overlay } = renderPaused(createAreaWorld(area));
    const text = overlay().join("\n");

    expect(text).toContain("RESUME");
    expect(text).toContain("MENU");
    expect(text).toContain("SAVE");
    expect(overlay()).toHaveLength(11);
  });

  it("resumes the game with the RESUME button", () => {
    const { click, setPaused, saveGame, openMenu } = renderPaused(
      createAreaWorld(area)
    );

    click("pause-resume");

    expect(setPaused).toHaveBeenCalledWith(false);
    expect(saveGame).not.toHaveBeenCalled();
    expect(openMenu).not.toHaveBeenCalled();
  });

  it("returns to the main menu with the MENU button", () => {
    const { click, openMenu, setPaused } = renderPaused(createAreaWorld(area));

    click("pause-menu");

    expect(openMenu).toHaveBeenCalledTimes(1);
    expect(setPaused).not.toHaveBeenCalled();
  });

  it("saves the game with the SAVE button", () => {
    const { click, saveGame, isDisabled } = renderPaused(createAreaWorld(area));

    expect(isDisabled("pause-save")).toBe(false);
    click("pause-save");

    expect(saveGame).toHaveBeenCalledTimes(1);
  });

  it("disables SAVE and shows progress while saving", () => {
    const { click, saveGame, isDisabled, overlay } = renderPaused(
      createAreaWorld(area),
      { saveStatus: { saving: true } }
    );

    expect(isDisabled("pause-save")).toBe(true);
    expect(overlay()[overlay().length - 1]).toContain("Saving...");

    click("pause-save");

    expect(saveGame).not.toHaveBeenCalled();
  });

  it("disables SAVE while the hero steps through a portal", () => {
    const world = createAreaWorld(area);
    removeMovable(world);
    const { click, saveGame, isDisabled } = renderPaused(world);

    expect(isDisabled("pause-save")).toBe(true);

    click("pause-save");

    expect(saveGame).not.toHaveBeenCalled();
  });

  it("shows the name of the new save after saving", () => {
    const { overlay } = renderPaused(createAreaWorld(area), {
      saveStatus: { saving: false, name: "20261011-151323" },
    });

    expect(overlay()[overlay().length - 1]).toContain("20261011-151323");
  });

  it("shows the name of the loaded save", () => {
    const world = createAreaWorld(area);
    world.metadata.saveId = "loaded";
    setSaveSummaries([
      {
        id: "loaded",
        name: "20261012-080000",
        version: saveVersion,
        level: "LEVEL_TUTORIAL",
        classKey: "scout",
        hairColor: "",
        heroLevel: 1,
        items: [],
        playtime: 0,
        kills: 0,
        deaths: 0,
      },
    ]);

    const { overlay } = renderPaused(world);

    expect(overlay()[overlay().length - 1]).toContain("20261012-080000");
  });

  it("shows no save name for an unsaved game", () => {
    const { overlay } = renderPaused(createAreaWorld(area));

    expect(overlay()[overlay().length - 1].trim()).toBe("");
  });

  it("shows when saving failed and allows retrying", () => {
    const { overlay, click, saveGame, isDisabled } = renderPaused(
      createAreaWorld(area),
      { saveStatus: { saving: false, failed: true } }
    );

    expect(overlay()[overlay().length - 1]).toContain("Failed!");
    expect(isDisabled("pause-save")).toBe(false);

    click("pause-save");

    expect(saveGame).toHaveBeenCalledTimes(1);
  });
});
