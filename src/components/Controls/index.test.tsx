/* eslint-disable testing-library/no-node-access, testing-library/no-container -- controls are drawn as glyph spans and invisible touch areas without accessible roles */
import { act, fireEvent } from "@testing-library/react";
import Controls from ".";
import { openSpriteBuilder } from "../../game/assets/spriteBuilder";
import { World } from "../../engine";
import { ACTIONABLE } from "../../engine/components/actionable";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { LOCKABLE } from "../../engine/components/lockable";
import { INVENTORY } from "../../engine/components/inventory";
import { MOVABLE } from "../../engine/components/movable";
import { PLAYER } from "../../engine/components/player";
import { POSITION } from "../../engine/components/position";
import { PROJECTILE } from "../../engine/components/projectile";
import { STATS } from "../../engine/components/stats";
import { TypedEntity } from "../../engine/entities";
import {
  assignQuickItem,
  closePopup,
  getTab,
  getTabSelections,
  getVerticalIndex,
  isInPopup,
  pushTabSelection,
  setVerticalIndex,
} from "../../engine/systems/popup";
import { stackableConsumptions } from "../../engine/systems/consume";
import { assertIdentifierAndComponents } from "../../engine/utils";
import { getSequence } from "../../engine/systems/sequence";
import { POPUP } from "../../engine/components/popup";
import { getLock, getPrompt } from "../../features/doors/helpers";
import { playedSounds } from "../../testing/env";
import {
  act as perform,
  advanceUntil,
  assertHero,
  countItems,
  createAreaWorld,
  findInArea,
  getHero,
  GivenItem,
  giveItems,
  step,
  walk,
} from "../../testing/harness";
import {
  isDisabledCell,
  readCells,
  readRow,
  readRows,
  renderHud,
  showsLayers,
} from "./testing";
import {
  buttonPalettes,
  createProgress,
  getFacingLayers,
  Palette,
} from "../../game/assets/ui";
import { CONDITIONABLE } from "../../engine/components/conditionable";
import { frameHeight, frameWidth } from "../../game/assets/utils";
import { getIndexFromKey } from "../Keyboard";
import { REVIVABLE } from "../../engine/components/revivable";
import { purchasableItems } from "../../game/balancing/trading";
import { createShop, getTraderDeal } from "../../features/workstations/helpers";
import Stats from "../Stats";

const palettes = Object.keys(buttonPalettes) as Palette[];

const area = `
|         |
|         |
|    ♀    |
|         |
|         |
`;

const setup = (
  items: GivenItem[] = [],
  overrides: Parameters<typeof renderHud>[2] = {},
  map = area,
  legend?: Record<string, string>
) => {
  const world = createAreaWorld(map, { legend });
  const hero = assertHero(world) as TypedEntity<
    | "ACTIONABLE"
    | "CONDITIONABLE"
    | "EQUIPPABLE"
    | "INVENTORY"
    | "MOVABLE"
    | "PLAYER"
    | "POSITION"
    | "STATS"
  >;
  hero[STATS].maxHp = 20;
  hero[STATS].hp = 10;
  giveItems(world, hero, items);
  hero[STATS].maxMp = 5;
  hero[STATS].mp = 5;
  const view = renderHud(world, <Controls />, overrides);
  view.tick(5);
  return { world, hero, ...view };
};

const press = (key: string, init: KeyboardEventInit = {}) =>
  fireEvent.keyDown(document.body, { key, ...init });

const release = (key: string) => fireEvent.keyUp(document.body, { key });

const runUntil = (world: World, predicate: () => boolean, timeout = 1000) =>
  act(() => {
    advanceUntil(world, predicate, timeout);
  });

const getMenu = (world: World) =>
  assertIdentifierAndComponents(world, "use", [POPUP]);

const getProjectiles = (world: World) => world.getEntities([PROJECTILE]);

/** Left and right action button with their label and disabled state. */
const getButtons = (container: HTMLElement, flipped = false) => {
  const rows = Array.from(container.querySelectorAll("footer > .Row"));
  const frameIndex = rows.findIndex((row) => readRow(row).startsWith("─"));
  const cells = readCells(rows[frameIndex + 1]);
  const offset = flipped ? 8 : 0;
  const readButton = (button: typeof cells) => ({
    label: button
      .map(({ char }) => char)
      .join("")
      .replace(/[^A-Z]/g, ""),
    disabled: button.some(({ element, index }) =>
      palettes.some((palette) => isDisabledCell(element, palette, index))
    ),
  });
  const left = readButton(cells.slice(offset, offset + 6));
  const right = readButton(cells.slice(offset + 7, offset + 13));
  return { left, right, activations: readRow(rows[frameIndex + 2]) };
};

const tick = (world: World, frames: number) =>
  act(() => {
    step(world, frames);
  });

const shopArea = `
|         |
|   ♀T    |
|         |
`;

const setupShop = () => {
  const view = setup([], {}, shopArea, { T: "air" });
  const trader = createShop(view.world, findInArea(shopArea, "T"), {
    deals: purchasableItems.map((item) => getTraderDeal(item)),
    tabs: ["buy", "sell"],
  });
  view.tick(5);
  return { ...view, trader };
};

const queryTouchArea = (container: HTMLElement, id: string) =>
  container.querySelector(`#${id}`);

const getTouchArea = (container: HTMLElement, id: string) => {
  const element = queryTouchArea(container, id);
  if (!element) throw new Error(`No touch area #${id}`);
  return element;
};

afterEach(() => {
  document.body.classList.remove("no-cursor");
});

describe("keyboard movement", () => {
  it.each([
    ["ArrowUp", "up", 0, -1],
    ["ArrowRight", "right", 1, 0],
    ["ArrowDown", "down", 0, 1],
    ["ArrowLeft", "left", -1, 0],
    ["w", "up", 0, -1],
    ["d", "right", 1, 0],
    ["s", "down", 0, 1],
    ["a", "left", -1, 0],
    ["W", "up", 0, -1],
    ["D", "right", 1, 0],
    ["S", "down", 0, 1],
    ["A", "left", -1, 0],
  ])("holding %s walks %s", (key, orientation, deltaX, deltaY) => {
    const { world, hero } = setup();
    const { x, y } = hero[POSITION];

    press(key);
    expect(hero[MOVABLE].orientations).toEqual([orientation]);

    runUntil(world, () => hero[POSITION].x !== x || hero[POSITION].y !== y);
    release(key);

    expect(hero[POSITION]).toEqual({ x: x + deltaX, y: y + deltaY });
  });

  it("stops walking when releasing the key", () => {
    const { world, hero, tick } = setup();
    const { x } = hero[POSITION];

    press("ArrowRight");
    runUntil(world, () => hero[POSITION].x === x + 1);
    release("ArrowRight");
    const stopped = { ...hero[POSITION] };
    tick(60);

    expect(hero[MOVABLE].orientations).toEqual([]);
    expect(hero[POSITION]).toEqual(stopped);
  });

  it("follows the latest held direction and resumes the earlier one", () => {
    const { hero } = setup();

    press("ArrowRight");
    press("s");
    expect(hero[MOVABLE].orientations).toEqual(["down", "right"]);

    release("s");
    expect(hero[MOVABLE].orientations).toEqual(["right"]);

    release("ArrowRight");
    expect(hero[MOVABLE].orientations).toEqual([]);
  });

  it("doesn't walk into a mountain", () => {
    const { hero, tick } = setup([], {}, `|  ♀█  |`);
    const position = { ...hero[POSITION] };

    press("ArrowRight");
    tick(60);
    release("ArrowRight");

    expect(hero[POSITION]).toEqual(position);
  });

  it("ignores repeated key events and keys held with a modifier", () => {
    const { hero } = setup();

    press("ArrowRight", { repeat: true });
    press("ArrowLeft", { metaKey: true });
    press("ArrowUp", { altKey: true });

    expect(hero[MOVABLE].orientations).toEqual([]);
  });

  it("ignores keys without a mapped action", () => {
    const { hero } = setup();

    press("x");
    press("Control");

    expect(hero[MOVABLE].orientations).toEqual([]);
    expect(hero[PLAYER].actionTriggered).toBeUndefined();
  });

  it("hides the mouse cursor on key press and shows it on mouse move", () => {
    setup();

    press("x");
    expect(document.body).toHaveClass("no-cursor");

    fireEvent.mouseMove(window);
    expect(document.body).not.toHaveClass("no-cursor");
  });
});

describe("action keys", () => {
  const doorArea = `
|         |
|   ♀D    |
|         |
`;
  const doorLegend = { D: "wood_door" };

  it("Enter opens the door shown with an OPEN prompt", () => {
    const { world, container, tick } = setup([], {}, doorArea, doorLegend);
    const lock = getLock(world, doorArea, "D");

    expect(getPrompt(world, lock)).toBe("OPEN");
    expect(queryTouchArea(container, "interact")).toBeInTheDocument();

    press("Enter");
    tick(10);

    expect(lock[LOCKABLE].locked).toBe(false);
  });

  it("Space casts the equipped spell", () => {
    const { world, hero } = setup([
      { spell: "wave", material: "wood", amount: 1 },
    ]);

    press(" ");
    runUntil(world, () => hero[STATS].mp === 4);

    expect(playedSounds).not.toContain("deny");
  });

  it("Space refuses to cast without MP", () => {
    const { hero, tick } = setup([
      { spell: "wave", material: "wood", amount: 1 },
    ]);
    hero[STATS].mp = 0;

    press(" ");
    tick(15);

    expect(hero[ACTIONABLE].spellTriggered).toBe(false);
    expect(playedSounds).toContain("deny");
  });

  it("Shift shoots the equipped bow", () => {
    const { world, hero } = setup([
      { skill: "bow", material: "wood", amount: 1 },
      { stackable: "arrow", amount: 3 },
    ]);

    press("Shift");
    runUntil(world, () => getProjectiles(world).length === 1);

    expect(countItems(world, hero, { stackable: "arrow" })).toBe(2);
  });

  it("Shift doesn't shoot without arrows", () => {
    const { world, tick } = setup([
      { skill: "bow", material: "wood", amount: 1 },
    ]);

    press("Shift");
    tick(15);

    expect(getProjectiles(world)).toHaveLength(0);
    expect(playedSounds).toContain("deny");
  });

  it.each([
    ["b", "inspect"],
    ["B", "inspect"],
    ["e", "use"],
    ["E", "use"],
    ["Tab", "use"],
    ["q", "equip"],
    ["Q", "equip"],
    ["g", "gear"],
    ["G", "gear"],
    ["t", "stats"],
    ["T", "stats"],
  ])("%s opens the %s tab of the menu", (key, tab) => {
    const { world, hero } = setup();

    press(key);
    runUntil(world, () => !!isInPopup(world, hero));

    expect(getTab(world, getMenu(world))).toBe(tab);
  });

  it("M opens the map when carrying one", () => {
    const { world, hero } = setup([
      { accessory: "map", material: "gold", amount: 1 },
    ]);

    press("m");
    runUntil(world, () => !!isInPopup(world, hero));

    expect(getTab(world, getMenu(world))).toBe("map");
  });

  it("M doesn't open a map without one", () => {
    const { world, hero, tick } = setup();

    press("M");
    tick(30);

    expect(isInPopup(world, hero)).toBeFalsy();
  });

  it("number keys use the item in their quick slot", () => {
    const { world, hero } = setup([{ stackable: "apple", amount: 2 }]);
    assignQuickItem(world, hero, { stackable: "apple" }, 3);

    press("3");
    runUntil(world, () => hero[STATS].hp > 10);

    expect(hero[STATS].hp).toBe(10 + stackableConsumptions.apple!.amount);
    expect(countItems(world, hero, { stackable: "apple" })).toBe(1);
  });

  it("number keys of an empty quick slot don't use anything", () => {
    const { world, hero, tick } = setup([{ stackable: "apple", amount: 2 }]);
    assignQuickItem(world, hero, { stackable: "apple" }, 3);

    press("4");
    tick(30);

    expect(hero[STATS].hp).toBe(10);
    expect(countItems(world, hero, { stackable: "apple" })).toBe(2);
  });

  it("Tab and Shift+Tab change the shop tab", () => {
    const { world, hero, trader } = setupShop();

    expect(getPrompt(world, trader)).toBe("SHOP");

    press("Enter");
    runUntil(world, () => !!isInPopup(world, hero));
    runUntil(world, () => !hero[ACTIONABLE].interactTriggered);
    tick(world, 30);

    press("Tab");
    runUntil(world, () => getTab(world, trader) === "sell");
    runUntil(world, () => !hero[PLAYER].actionTriggered);

    press("Tab", { shiftKey: true });
    runUntil(world, () => getTab(world, trader) === "buy");
  });

  it("Tab closes the hero menu from any tab", () => {
    const { world, hero } = setup();
    press("g");
    runUntil(world, () => !!isInPopup(world, hero));
    runUntil(world, () => !hero[PLAYER].actionTriggered);

    press("Tab");
    runUntil(world, () => !isInPopup(world, hero));
  });

  it("Enter respawns at the tombstone with a SPAWN prompt", () => {
    const { world, hero } = setup();
    act(() => {
      walk(world, "right", 2);
    });
    hero[STATS].hp = 0;
    runUntil(world, () => !getHero(world));
    const tombstone = () => world.getEntity([REVIVABLE]);
    runUntil(world, () => !!tombstone()?.[REVIVABLE].available, 10000);
    runUntil(world, () => !!world.metadata.interact.active);

    expect(getPrompt(world, tombstone()!)).toBe("SPAWN");

    press("Enter");
    runUntil(world, () => !!getHero(world), 10000);
  });

  it("Backspace erases sprites and layers while Escape follows the BACK action", () => {
    const { world, hero } = setup();
    act(() => {
      openSpriteBuilder(world, hero);
      step(world, 30);
    });
    const popup = world.assertByIdAndComponents(hero[PLAYER].popup!, [POPUP]);
    const editor = popup[POPUP].sprite!;
    press("Backspace");
    runUntil(world, () => editor.sprites.length === 1);
    press("Enter");
    runUntil(world, () => getTab(world, popup) === "sprite");
    const original = [...editor.sprites[0].layers];
    press("Enter");
    runUntil(world, () => editor.moving === true);
    press("Enter");
    runUntil(world, () => getTab(world, popup) === "layer");
    tick(world, 30);
    press("Escape");
    runUntil(world, () => getTab(world, popup) === "sprite");
    expect(editor.sprites[0].layers).toEqual(original);
    expect(editor.moving).toBe(false);
    press("Backspace");
    runUntil(
      world,
      () => editor.sprites[0].layers.length === original.length - 1
    );
    press("Escape");
    runUntil(world, () => !isInPopup(world, hero));
  });

  it("Escape closes an open menu without pausing", () => {
    const setPaused = jest.fn();
    const { world, hero } = setup([], { setPaused });
    press("g");
    runUntil(world, () => !!isInPopup(world, hero));
    runUntil(world, () => !hero[PLAYER].actionTriggered);

    press("Escape");
    runUntil(world, () => !isInPopup(world, hero));

    expect(setPaused).not.toHaveBeenCalled();
  });

  it("selects and confirms a menu row with arrow keys and Enter", () => {
    const { world, hero } = setup([
      { skill: "bow", material: "wood", amount: 1 },
      { tool: "axe", material: "wood", amount: 1 },
    ]);
    expect(hero[ACTIONABLE].toolEquipped).toBe(false);

    press("q");
    runUntil(world, () => !!isInPopup(world, hero));
    runUntil(world, () => !hero[PLAYER].actionTriggered);
    press("ArrowDown");
    release("ArrowDown");
    press("Enter");
    runUntil(world, () => !isInPopup(world, hero));

    expect(hero[ACTIONABLE].toolEquipped).toBe(true);
  });
});

describe("pausing", () => {
  it("Escape toggles pause during play", () => {
    const setPaused = jest.fn();
    setup([], { setPaused });

    press("Escape");

    expect(setPaused).toHaveBeenCalledTimes(1);
    const toggle = setPaused.mock.calls[0][0] as (paused: boolean) => boolean;
    expect(toggle(false)).toBe(true);
    expect(toggle(true)).toBe(false);
  });

  it("Escape doesn't pause on the title screen", () => {
    const setPaused = jest.fn();
    setup([], { setPaused, initial: true });

    press("Escape");

    expect(setPaused).not.toHaveBeenCalled();
  });

  it("pauses when the browser tab is hidden", () => {
    const setPaused = jest.fn();
    setup([], { setPaused });
    const hidden = jest.spyOn(document, "hidden", "get").mockReturnValue(true);

    fireEvent(document, new Event("visibilitychange"));
    hidden.mockRestore();

    expect(setPaused).toHaveBeenCalledWith(true);
  });

  it.each(["blur", "pagehide"])(
    "%s pauses and releases held movement without a visibility event",
    (type) => {
      const setPaused = jest.fn();
      const { hero } = setup([], { setPaused });
      press("ArrowRight");
      expect(hero[MOVABLE].orientations).toEqual(["right"]);

      fireEvent(window, new Event(type));

      expect(setPaused).toHaveBeenCalledWith(true);
      expect(hero[MOVABLE].orientations).toEqual([]);
    }
  );

  it("moving focus between page controls doesn't pause or release movement", () => {
    const setPaused = jest.fn();
    const { hero, container } = setup([], { setPaused });
    press("ArrowRight");

    fireEvent.blur(getTouchArea(container, "spell"));

    expect(setPaused).not.toHaveBeenCalled();
    expect(hero[MOVABLE].orientations).toEqual(["right"]);
  });

  it("ignores action keys while paused", () => {
    const { world, hero, tick } = setup(
      [
        { spell: "wave", material: "wood", amount: 1 },
        { skill: "bow", material: "wood", amount: 1 },
        { stackable: "arrow", amount: 3 },
      ],
      { paused: true }
    );

    ["Enter", " ", "Shift", "b", "e", "g", "t", "q", "1"].forEach((key) =>
      press(key)
    );
    tick(30);

    expect(hero[ACTIONABLE].spellTriggered).toBe(false);
    expect(hero[ACTIONABLE].skillTriggered).toBe(false);
    expect(hero[ACTIONABLE].interactTriggered).toBe(false);
    expect(hero[PLAYER].actionTriggered).toBeUndefined();
    expect(hero[STATS].mp).toBe(5);
    expect(getProjectiles(world)).toHaveLength(0);
    expect(isInPopup(world, hero)).toBeFalsy();
  });
});

describe("action buttons", () => {
  it("shows key names as disabled buttons without spell or skill", () => {
    const { container } = setup();

    expect(getButtons(container)).toMatchObject({
      left: { label: "SHIFT", disabled: true },
      right: { label: "SPACE", disabled: true },
    });
  });

  it("shows the equipped spell and skill with their supplies", () => {
    const { container } = setup([
      { spell: "wave", material: "wood", amount: 1 },
      { skill: "bow", material: "wood", amount: 1 },
      { stackable: "arrow", amount: 3 },
    ]);
    const buttons = getButtons(container);

    expect(buttons.left).toEqual({ label: "BOW", disabled: false });
    expect(buttons.right).toEqual({ label: "WAVE", disabled: false });
    expect(buttons.activations).toContain("1/3");
    expect(buttons.activations).toContain("1/5");
  });

  it("disables the skill without ammunition", () => {
    const { container } = setup([
      { skill: "bow", material: "wood", amount: 1 },
    ]);

    expect(getButtons(container).left).toEqual({
      label: "BOW",
      disabled: true,
    });
  });

  it("disables the spell once the last MP is spent", () => {
    const { world, hero, container } = setup([
      { spell: "wave", material: "wood", amount: 1 },
    ]);
    hero[STATS].mp = 1;
    expect(getButtons(container).right.disabled).toBe(false);

    press(" ");
    runUntil(world, () => hero[STATS].mp === 0);
    act(() => {
      advanceUntil(world, () => getButtons(container).right.disabled, 3000);
    });

    expect(getButtons(container).right).toEqual({
      label: "WAVE",
      disabled: true,
    });
  });

  it.each([
    ["pickaxe", "MINE"],
    ["shovel", "DIG"],
    ["hammer", "BUILD"],
    ["axe", "AXE"],
  ] as const)("names the %s tool action %s", (tool, label) => {
    const { container } = setup([{ tool, material: "wood", amount: 1 }]);

    expect(getButtons(container).left.label).toBe(label);
  });

  it("shows the tool instead of the skill after switching with Q", () => {
    const { world, hero, container } = setup([
      { skill: "bow", material: "wood", amount: 1 },
      { stackable: "arrow", amount: 3 },
      { tool: "pickaxe", material: "wood", amount: 1 },
    ]);
    expect(getButtons(container).left.label).toBe("BOW");

    press("Q");
    runUntil(world, () => !!isInPopup(world, hero));
    runUntil(world, () => !hero[PLAYER].actionTriggered);
    press("ArrowDown");
    release("ArrowDown");
    press("Enter");
    runUntil(world, () => !isInPopup(world, hero));

    expect(hero[EQUIPPABLE].tool).toBeDefined();
    expect(getButtons(container).left.label).toBe("MINE");
  });

  it("shows empty buttons while paused", () => {
    const { container } = setup(
      [{ spell: "wave", material: "wood", amount: 1 }],
      {
        paused: true,
      }
    );

    expect(getButtons(container).right).toEqual({
      label: "SPACE",
      disabled: true,
    });
  });

  it("swaps the buttons in the flipped layout", () => {
    const { container } = setup(
      [
        { spell: "wave", material: "wood", amount: 1 },
        { skill: "bow", material: "wood", amount: 1 },
      ],
      { flipped: true }
    );
    const buttons = getButtons(container, true);

    expect(container.querySelector(".ControlsFlipped")).toBeInTheDocument();
    expect(buttons.left.label).toBe("WAVE");
    expect(buttons.right.label).toBe("BOW");
  });

  it("hides the buttons on the title screen", () => {
    const { container } = setup(
      [{ spell: "wave", material: "wood", amount: 1 }],
      {
        initial: true,
      }
    );

    expect(container.textContent).not.toContain("WAVE");
    expect(container.textContent).not.toContain("SPACE");
  });
});

describe("chat", () => {
  const openChat = (world: World) =>
    act(() => {
      perform(world, "chat");
      step(world, 15);
    });

  it("shows the on-screen keyboard in the chat", () => {
    const { world, container } = setup();
    expect(queryTouchArea(container, "keyboard")).not.toBeInTheDocument();

    openChat(world);

    expect(getTab(world, getMenu(world))).toBe("chat");
    expect(queryTouchArea(container, "keyboard")).toBeInTheDocument();
  });

  it("Backspace clears the typed chat message", () => {
    const { world } = setup();
    openChat(world);
    const menu = getMenu(world);
    ["h", "i"].forEach((key) => {
      const index = getIndexFromKey(key)!;
      pushTabSelection(world, menu, index.offset * 10 + index.content);
    });

    press("Backspace");
    runUntil(world, () => getTabSelections(world, menu).length === 0);
  });

  it("Backspace does nothing outside the chat", () => {
    const { world, hero, tick } = setup();

    press("Backspace");
    tick(15);

    expect(hero[PLAYER].actionTriggered).toBeUndefined();
    expect(isInPopup(world, hero)).toBeFalsy();
  });
});

describe("equipment display", () => {
  it("lists a carried compass next to the buttons", () => {
    const compassArea = `
|         |
|   ♀φ    |
|         |
`;
    const { world, hero, container } = setup([], {}, compassArea);
    expect(readRows(container).join("\n")).not.toContain("Compass");

    press("ArrowRight");
    runUntil(world, () => !!hero[EQUIPPABLE].compass, 3000);
    release("ArrowRight");
    act(() => {
      step(world, 30);
    });

    expect(readRows(container).join("\n")).toContain("Compass");
  });

  it.each([
    [[], "STOW"],
    [[{ weapon: "sword", material: "wood", amount: 1 }], "SWORD"],
  ] as [GivenItem[], string][])(
    "names a swinging axe after the weapon to stow it",
    (weapon, label) => {
      const { world, hero, container } = setup([
        { tool: "axe", material: "wood", amount: 1 },
        ...weapon,
      ]);

      press("Shift");
      runUntil(world, () => !!hero[CONDITIONABLE].axe);

      expect(getButtons(container).left.label).toBe(label);
    }
  );
});

describe.each([false, true])("stats HUD with flipped=%s", (flipped) => {
  const setupStats = (paused = false) => {
    const world = createAreaWorld(area);
    const hero = world.assertComponents(assertHero(world), [STATS, PLAYER]);
    Object.assign(hero[STATS], {
      hp: 8,
      maxHp: 20,
      mp: 4,
      maxMp: 7,
      xp: 3,
      maxXp: 10,
    });
    const setPaused = jest.fn();
    const view = renderHud(world, <Stats />, { flipped, paused, setPaused });
    return { ...view, world, hero, setPaused };
  };

  it("shows the hero's HP, MP and XP values in the HUD", () => {
    const { container, hero } = setupStats();

    for (const stat of ["hp", "mp", "xp"] as const) {
      const selector =
        stat === "xp" ? ".StatProgress" : `.Stat${stat.toUpperCase()}`;
      const cells = readCells(container.querySelector(selector)!);
      const offset = stat === "xp" ? 0 : flipped ? 5 : 3;
      const progress = createProgress(hero[STATS], stat, 13, stat !== "hp");
      expect(progress).toHaveLength(13);
      for (const [index, sprite] of progress.entries()) {
        const cell = cells[index + offset];
        expect(
          showsLayers(cell.element, getFacingLayers(sprite), cell.index)
        ).toBe(true);
      }
    }
  });

  it("keeps pause and quick actions working", () => {
    const { container, world, hero, setPaused } = setupStats();
    const header = container.querySelector("header")!;
    expect(header).toHaveClass(flipped ? "StatsFlipped" : "Stats");

    fireEvent.click(getTouchArea(container, "menu"));
    const toggle = setPaused.mock.calls[0][0] as (value: boolean) => boolean;
    expect(toggle(false)).toBe(true);
    expect(toggle(true)).toBe(false);

    fireEvent.click(getTouchArea(container, "quick"));
    tick(world, 20);
    expect(getTab(world, getMenu(world))).toBe("use");
    expect(isInPopup(world, hero)).toBeTruthy();
  });

  it("doesn't open quick actions while paused", () => {
    const { container, world, hero, tick } = setupStats(true);

    fireEvent.click(getTouchArea(container, "quick"));
    tick(20);

    expect(hero[PLAYER].actionTriggered).toBeUndefined();
    expect(isInPopup(world, hero)).toBeFalsy();
  });
});

describe("touch controls", () => {
  let lastTouch: [number, number] = [0, 0];
  const touch = (
    type: "touchStart" | "touchMove" | "touchEnd" | "touchCancel",
    points: [number, number][],
    target: Element = document.body,
    identifier = 1
  ) => {
    if (points[0]) lastTouch = points[0];
    return fireEvent[type](window, {
      touches: points.map(([clientX, clientY], index) => ({
        target,
        identifier: identifier + index,
        clientX,
        clientY,
      })),
      changedTouches: [
        { target, identifier, clientX: lastTouch[0], clientY: lastTouch[1] },
      ],
    });
  };

  const releasePointer = (
    target: Element,
    clientX: number,
    clientY: number
  ) => {
    const event = new MouseEvent("pointerup", {
      bubbles: true,
      clientX,
      clientY,
    });
    Object.defineProperties(event, {
      pointerType: { value: "touch" },
      pointerId: { value: 1 },
    });
    fireEvent(target, event);
  };

  it.each([
    ["menu", 1],
    ["quick", "use"],
    ["spell", true],
  ] as const)(
    "a tap can activate %s after a swipe without a touchstart event",
    (id, expected) => {
      const world = createAreaWorld(area);
      const hero = world.assertComponents(assertHero(world), [
        ACTIONABLE,
        PLAYER,
        INVENTORY,
        POSITION,
      ]);
      giveItems(world, hero, [{ spell: "wave", material: "wood", amount: 1 }]);
      const setPaused = jest.fn();
      const { container, tick } = renderHud(
        world,
        <>
          <Stats />
          <Controls />
        </>,
        { setPaused }
      );
      tick(5);
      touch("touchStart", [[100, 100]]);
      touch("touchMove", [[160, 100]]);
      touch("touchEnd", []);
      tick(20);

      const button = getTouchArea(container, id);
      for (const type of ["pointerdown", "pointerup"]) {
        const event = new Event(type, { bubbles: true });
        Object.defineProperty(event, "pointerType", { value: "touch" });
        fireEvent(button, event);
      }
      fireEvent.click(button, { detail: 1 });

      const outcomes = {
        menu: setPaused.mock.calls.length,
        quick: hero[PLAYER].actionTriggered,
        spell: hero[ACTIONABLE].spellTriggered,
      };
      expect(outcomes[id]).toBe(expected);
    }
  );

  const pointerEvent = (
    type: "pointerdown" | "pointermove" | "click",
    target: Element,
    id: number,
    clientX = 175,
    clientY = 45
  ) => {
    const event = new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      detail: 1,
      clientX,
      clientY,
    });
    Object.defineProperties(event, {
      clientX: { value: clientX },
      clientY: { value: clientY },
      pointerId: { value: id },
      pointerType: { value: "touch" },
      isPrimary: { value: true },
    });
    fireEvent(target, event);
  };

  const scrollbar = (container: HTMLElement) => {
    const bar = getTouchArea(container, "scroll") as HTMLElement;
    jest.spyOn(bar, "getBoundingClientRect").mockReturnValue({
      left: 170,
      top: 0,
      width: 10,
      height: Number(bar.dataset.rows) * 10,
    } as DOMRect);
    bar.setPointerCapture = jest.fn();
    return bar;
  };

  it("a handled drag consumes only one click from its native pointer", () => {
    const { hero, container } = setup([
      { spell: "wave", material: "wood", amount: 1 },
    ]);
    const spell = getTouchArea(container, "spell");
    pointerEvent("pointerdown", spell, 11);
    touch("touchStart", [[100, 100]], spell);
    touch("touchMove", [[160, 100]], spell);
    touch("touchEnd", [], spell);
    pointerEvent("click", spell, 11);
    expect(hero[ACTIONABLE].spellTriggered).toBe(false);
    pointerEvent("click", spell, 11);
    expect(hero[ACTIONABLE].spellTriggered).toBe(true);
  });

  it.each(["another pointer", "keyboard"])(
    "a handled drag cannot block a click from %s without new start events",
    (source) => {
      const { hero, container } = setup([
        { spell: "wave", material: "wood", amount: 1 },
      ]);
      const spell = getTouchArea(container, "spell");
      pointerEvent("pointerdown", spell, 11);
      touch("touchStart", [[100, 100]], spell);
      touch("touchMove", [[160, 100]], spell);
      touch("touchEnd", [], spell);
      if (source === "another pointer") pointerEvent("click", spell, 12);
      else fireEvent.click(spell, { detail: 0 });
      expect(hero[ACTIONABLE].spellTriggered).toBe(true);
    }
  );

  it("a drag establishes a new origin when touchstart is absent", () => {
    const { world, hero } = setup();
    const x = hero[POSITION].x;
    touch("touchMove", [[100, 100]]);
    touch("touchMove", [[160, 100]]);
    expect(hero[MOVABLE].orientations).toEqual(["right"]);
    runUntil(world, () => hero[POSITION].x === x + 1);
    releasePointer(document.body, 160, 100);
    expect(hero[MOVABLE].orientations).toEqual([]);
    expect(touch("touchEnd", [])).toBe(true);
  });

  it("a completed swipe cannot leave future pause taps globally blocked", () => {
    const world = createAreaWorld(area);
    const setPaused = jest.fn();
    const { container, tick } = renderHud(
      world,
      <>
        <Stats />
        <Controls />
      </>,
      { setPaused }
    );
    tick(5);
    touch("touchStart", [[100, 100]]);
    touch("touchMove", [[160, 100]]);
    expect(touch("touchEnd", [])).toBe(true);
    // A click can arrive without another touchstart or pointerdown.
    fireEvent.click(getTouchArea(container, "menu"), {
      detail: 1,
      clientX: 20,
      clientY: 20,
    });
    expect(setPaused).toHaveBeenCalledTimes(1);
  });

  it("releasing another touch cannot block the next action tap", () => {
    const { hero, container } = setup([
      { spell: "wave", material: "wood", amount: 1 },
    ]);
    const spell = getTouchArea(container, "spell");
    touch("touchStart", [[100, 100]]);
    touch("touchMove", [[160, 100]]);
    touch("touchEnd", [], spell, 2);
    expect(hero[MOVABLE].orientations).toEqual([]);
    touch("touchEnd", [], document.body, 1);
    fireEvent.click(spell);
    expect(hero[ACTIONABLE].spellTriggered).toBe(true);
  });

  it("normal taps and small finger drift retain native clicks", () => {
    const { hero, container } = setup([
      { spell: "wave", material: "wood", amount: 1 },
    ]);
    const quick = getTouchArea(container, "spell");
    expect(touch("touchStart", [[100, 100]], quick)).toBe(true);
    expect(touch("touchMove", [[104, 103]], quick)).toBe(true);
    expect(touch("touchEnd", [], quick)).toBe(true);
    fireEvent.click(quick);
    expect(hero[ACTIONABLE].spellTriggered).toBe(true);
  });

  it("missing the next start events cannot make its releases retain an old swipe veto", () => {
    const world = createAreaWorld(area);
    const setPaused = jest.fn();
    const { container, tick } = renderHud(
      world,
      <>
        <Stats />
        <Controls />
      </>,
      { setPaused }
    );
    tick(5);
    touch("touchStart", [[100, 100]]);
    touch("touchMove", [[160, 100]]);
    touch("touchEnd", []);
    const target = getTouchArea(container, "menu");
    for (let index = 0; index < 3; index += 1) {
      const release = new MouseEvent("pointerup", {
        bubbles: true,
        clientX: 20,
        clientY: 20,
      });
      Object.defineProperties(release, {
        pointerType: { value: "touch" },
        pointerId: { value: index + 2 },
      });
      fireEvent(target, release);
      fireEvent.touchEnd(target, {
        touches: [],
        changedTouches: [
          { target, identifier: index + 2, clientX: 20, clientY: 20 },
        ],
      });
      fireEvent.click(target, { detail: 1, clientX: 20, clientY: 20 });
    }
    expect(setPaused).toHaveBeenCalledTimes(3);
  });

  it("a released scrollbar cannot keep owning later movement after a dialog closes", () => {
    const { world, hero, container, trader } = setupShop();
    press("Enter");
    runUntil(world, () => !!isInPopup(world, hero));
    runUntil(world, () => !hero[PLAYER].actionTriggered);
    const bar = scrollbar(container);
    pointerEvent("pointerdown", bar, 1);
    touch("touchStart", [[175, 45]], bar);
    tick(world, 15);
    releasePointer(bar, 175, 45);
    touch("touchEnd", [], bar);
    press("Escape");
    runUntil(world, () => !isInPopup(world, hero));
    tick(world, 30);
    expect(trader[POPUP].active).toBe(false);
    const x = hero[POSITION].x;
    // Replay moves after the next start event was lost, without any world/UI change.
    touch("touchMove", [[100, 100]]);
    touch("touchMove", [[40, 100]]);
    runUntil(world, () => hero[POSITION].x === x - 1);
    touch("touchEnd", []);
  });

  it("losing the popup during a scrollbar hold cannot trap movement without a release event", () => {
    const { world, hero, container, trader } = setupShop();
    press("Enter");
    runUntil(world, () => !!isInPopup(world, hero));
    runUntil(world, () => !hero[PLAYER].actionTriggered);
    const bar = scrollbar(container);
    pointerEvent("pointerdown", bar, 1);
    touch("touchStart", [[175, 45]], bar);
    tick(world, 15);
    // The melee damage system uses this same close path when the hero is hit.
    act(() => closePopup(world, hero, trader));
    tick(world, 10);
    expect(bar).not.toBeInTheDocument();
    expect(hero[MOVABLE].orientations).toEqual([]);
    const x = hero[POSITION].x;
    // A different touch still works if the old target lost its release.
    touch("touchMove", [[100, 100]], document.body, 2);
    touch("touchMove", [[40, 100]], document.body, 2);
    runUntil(world, () => hero[POSITION].x === x - 1);
    touch("touchEnd", [], document.body, 2);
  });

  it("tapping the spell button casts the spell", () => {
    const { world, hero, container } = setup([
      { spell: "wave", material: "wood", amount: 1 },
    ]);

    fireEvent.click(getTouchArea(container, "spell"));
    runUntil(world, () => hero[STATS].mp === 4);
  });

  it("tapping the skill button uses the skill", () => {
    const { world, container } = setup([
      { skill: "bow", material: "wood", amount: 1 },
      { stackable: "arrow", amount: 3 },
    ]);

    fireEvent.click(getTouchArea(container, "skill"));
    runUntil(world, () => getProjectiles(world).length === 1);
  });

  it("tapping the prompt interacts", () => {
    const doorArea = `|  ♀D  |`;
    const { world, container, tick } = setup([], {}, doorArea, {
      D: "wood_door",
    });

    fireEvent.click(getTouchArea(container, "interact"));
    tick(10);

    expect(getLock(world, doorArea, "D")[LOCKABLE].locked).toBe(false);
  });

  it("doesn't show a prompt without anything to interact with", () => {
    const { container } = setup();

    expect(queryTouchArea(container, "interact")).not.toBeVisible();
  });

  it("tapping tab areas changes the shop tab", () => {
    const { world, hero, trader, container } = setupShop();
    press("Enter");
    runUntil(world, () => !!isInPopup(world, hero));
    tick(world, 30);

    fireEvent.click(getTouchArea(container, "tab-1"));
    runUntil(world, () => getTab(world, trader) === "sell");
    runUntil(world, () => !hero[PLAYER].actionTriggered);

    fireEvent.click(getTouchArea(container, "tab-0"));
    runUntil(world, () => getTab(world, trader) === "buy");
  });

  it("tapping the close area closes the menu", () => {
    const { world, hero, container } = setup();
    press("g");
    runUntil(world, () => !!isInPopup(world, hero));
    runUntil(world, () => !hero[PLAYER].actionTriggered);
    expect(queryTouchArea(container, "tab-0")).not.toBeInTheDocument();

    fireEvent.click(getTouchArea(container, "close"));
    runUntil(world, () => !isInPopup(world, hero));
  });

  it("tapping a menu row selects it and tapping it again confirms", () => {
    const { world, hero, container } = setup([
      { skill: "bow", material: "wood", amount: 1 },
      { tool: "axe", material: "wood", amount: 1 },
    ]);
    press("q");
    runUntil(world, () => !!isInPopup(world, hero));
    runUntil(world, () => !hero[PLAYER].actionTriggered);
    const content = getTouchArea(container, "content") as HTMLElement;
    jest.spyOn(content, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: (frameWidth - 2) * 10.25,
      height: (frameHeight - 2) * 10.25,
    } as DOMRect);
    const tapRow = (row: number) => {
      fireEvent.click(content, { clientX: 45, clientY: row * 10.25 + 5.125 });
      runUntil(world, () => !hero[PLAYER].actionTriggered);
    };
    const menu = getMenu(world);

    tapRow(1);
    expect(getVerticalIndex(world, menu)).toBe(1);
    expect(hero[ACTIONABLE].toolEquipped).toBe(false);

    tapRow(1);
    runUntil(world, () => !isInPopup(world, hero));
    expect(hero[ACTIONABLE].toolEquipped).toBe(true);
  });

  it("a short dialog has no scrollbar touch areas", () => {
    const { world, hero, container } = setup([
      { skill: "bow", material: "wood", amount: 1 },
      { tool: "axe", material: "wood", amount: 1 },
    ]);
    press("q");
    runUntil(world, () => !!isInPopup(world, hero));
    runUntil(world, () => !hero[PLAYER].actionTriggered);
    expect(queryTouchArea(container, "scroll")).not.toBeInTheDocument();

    press("ArrowDown");
    release("ArrowDown");
    fireEvent.click(getTouchArea(container, "right"));
    runUntil(world, () => !isInPopup(world, hero));
    expect(hero[ACTIONABLE].toolEquipped).toBe(true);
  });

  it("scrollbar touch areas follow the visible bar when switching dialog tabs", () => {
    const { world, hero, trader, container } = setupShop();
    press("Enter");
    runUntil(world, () => !!isInPopup(world, hero));
    runUntil(world, () => !hero[PLAYER].actionTriggered);
    const down = scrollbar(container);
    expect(getTouchArea(container, "scroll")).toBeInTheDocument();
    pointerEvent("pointerdown", down, 1);
    touch("touchStart", [[175, 45]], down);
    runUntil(world, () => getVerticalIndex(world, trader) > 0);

    fireEvent.click(getTouchArea(container, "tab-1"));
    runUntil(world, () => getTab(world, trader) === "sell");
    tick(world, 10);
    expect(queryTouchArea(container, "scroll")).not.toBeInTheDocument();
    expect(hero[MOVABLE].orientations).toEqual([]);
    touch("touchEnd", [], down);

    fireEvent.click(getTouchArea(container, "tab-0"));
    runUntil(world, () => getTab(world, trader) === "buy");
    tick(world, 10);
    expect(getTouchArea(container, "scroll")).toBeInTheDocument();
  });

  it.each([8, 0])(
    "releasing a scrollbar from row %s cannot click a content row",
    (start) => {
      const { world, hero, container, trader } = setupShop();
      press("Enter");
      runUntil(world, () => hero[PLAYER].popup === world.getEntityId(trader));
      runUntil(world, () => !hero[PLAYER].actionTriggered);
      act(() => setVerticalIndex(world, trader, start));
      const content = getTouchArea(container, "content");
      jest.spyOn(content, "getBoundingClientRect").mockReturnValue({
        left: 0,
        top: 0,
        width: 170,
        height: 90,
      } as DOMRect);
      const bar = scrollbar(container);
      pointerEvent("pointerdown", bar, 1);
      touch("touchStart", [[175, 45]], bar);
      tick(world, 15);
      touch("touchMove", [[168, 45]], bar);
      releasePointer(bar, 168, 45);
      expect(touch("touchEnd", [], bar)).toBe(true);
      pointerEvent("click", content, 1, 168, 45);
      tick(world, 5);
      const selected = getVerticalIndex(world, trader);
      expect(selected).not.toBe(start);

      tick(world, 5);
      expect(getVerticalIndex(world, trader)).toBe(selected);
      expect(getTabSelections(world, trader)).toEqual([]);

      const firstRow =
        getSequence(world, trader, "popup")?.args.scrollIndex || 0;
      touch("touchStart", [[45, 5]], content);
      touch("touchEnd", [], content);
      fireEvent.click(content, { clientX: 45, clientY: 5, detail: 1 });
      runUntil(world, () => getVerticalIndex(world, trader) === firstRow);
    }
  );

  it.each([0, 0.25, 0.5, 1])(
    "scrolls to %s of the content on the next popup tick",
    (percentage) => {
      const { world, hero, container, trader } = setupShop();
      press("Enter");
      runUntil(world, () => !!isInPopup(world, hero));
      runUntil(world, () => !hero[PLAYER].actionTriggered);
      const bar = scrollbar(container);
      const height = bar.getBoundingClientRect().height;
      pointerEvent("pointerdown", bar, 1, 175, 20 + percentage * (height - 40));
      expect(getVerticalIndex(world, trader)).toBe(0);
      runUntil(world, () => !hero[PLAYER].actionTriggered);
      const maximum = getSequence(world, trader, "popup")!.args.scrollMax!;
      expect(getVerticalIndex(world, trader)).toBe(
        Math.round(percentage * maximum)
      );
      releasePointer(bar, 175, 45);
    }
  );

  it("uses the latest drag position, clamps to both ends, and keeps a released tap queued", () => {
    const { world, hero, container, trader } = setupShop();
    press("Enter");
    runUntil(world, () => !!isInPopup(world, hero));
    runUntil(world, () => !hero[PLAYER].actionTriggered);
    const bar = scrollbar(container);
    pointerEvent("pointerdown", bar, 1, 175, 20);
    for (let index = 0; index < 100; index += 1)
      pointerEvent("pointermove", document.body, 1, 120, index * 10);
    releasePointer(bar, 120, 1000);
    expect(getVerticalIndex(world, trader)).toBe(0);
    runUntil(world, () => !hero[PLAYER].actionTriggered);
    expect(getVerticalIndex(world, trader)).toBe(
      trader[POPUP].deals.length - 1
    );
    pointerEvent("pointerdown", bar, 2, 175, 45);
    pointerEvent("pointermove", document.body, 2, 300, -100);
    runUntil(world, () => !hero[PLAYER].actionTriggered);
    expect(getVerticalIndex(world, trader)).toBe(0);
  });

  it("can close the dialog before its queued scroll is processed", () => {
    const { world, hero, container } = setupShop();
    press("Enter");
    runUntil(world, () => !!isInPopup(world, hero));
    runUntil(world, () => !hero[PLAYER].actionTriggered);
    pointerEvent("pointerdown", scrollbar(container), 1);
    press("Escape");
    runUntil(world, () => !isInPopup(world, hero));
  });

  it("a scrollbar press owns horizontal finger movement", () => {
    const { world, hero, container, trader } = setupShop();
    press("Enter");
    runUntil(world, () => hero[PLAYER].popup === world.getEntityId(trader));
    const down = scrollbar(container);
    pointerEvent("pointerdown", down, 1);
    touch("touchStart", [[175, 45]], down);
    touch("touchMove", [[220, 45]], down);
    expect(hero[MOVABLE].orientations).toEqual([]);
    expect(hero[PLAYER].actionTriggered).toBe("scroll");
    fireEvent.pointerUp(down);
    touch("touchEnd", [], down);
    expect(hero[MOVABLE].orientations).toEqual([]);
  });

  it("releasing the scrollbar cannot confirm a sprite row and change tabs", () => {
    localStorage.setItem(
      "alive.sprites",
      JSON.stringify(
        Array.from({ length: 24 }, (_, i) => ({
          name: `Sprite ${i}`,
          layers: [],
        }))
      )
    );
    const { world, hero, container } = setup();
    act(() => {
      openSpriteBuilder(world, hero);
      step(world, 30);
    });
    runUntil(world, () => !!isInPopup(world, hero));
    const popup = world.assertByIdAndComponents(hero[PLAYER].popup, [POPUP]);
    const content = getTouchArea(container, "content");
    jest.spyOn(content, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 170,
      height: 90,
    } as DOMRect);
    const down = scrollbar(container);
    pointerEvent("pointerdown", down, 1);
    touch("touchStart", [[175, 45]], down);
    tick(world, 10);
    releasePointer(down, 168, 45);
    expect(touch("touchEnd", [], down)).toBe(true);
    pointerEvent("click", content, 1, 168, 45);
    tick(world, 5);
    const row = getVerticalIndex(world, popup);
    expect(row).toBeGreaterThan(0);

    tick(world, 5);
    expect(getTab(world, popup)).toBe("pack");
    expect(getVerticalIndex(world, popup)).toBe(row);
  });

  it.each([
    [-1, 5],
    [171, 5],
    [45, -1],
    [45, 91],
  ])(
    "ignores content clicks outside its displayed bounds (%s, %s)",
    (clientX, clientY) => {
      const { world, hero, container, trader } = setupShop();
      press("Enter");
      runUntil(world, () => hero[PLAYER].popup === world.getEntityId(trader));
      runUntil(world, () => !hero[PLAYER].actionTriggered);
      act(() => setVerticalIndex(world, trader, 4));
      const content = getTouchArea(container, "content");
      jest.spyOn(content, "getBoundingClientRect").mockReturnValue({
        left: 0,
        top: 0,
        width: 170,
        height: 90,
      } as DOMRect);
      fireEvent.click(content, { clientX, clientY });
      tick(world, 5);
      expect(getVerticalIndex(world, trader)).toBe(4);
    }
  );

  it.each([false, true])(
    "a dialog swipe cannot tap its release row, including after pointer release: %s",
    (pointerRelease) => {
      const { world, hero, container, trader } = setupShop();
      press("Enter");
      runUntil(world, () => hero[PLAYER].popup === world.getEntityId(trader));
      runUntil(world, () => !hero[PLAYER].actionTriggered);
      const content = getTouchArea(container, "content");
      jest.spyOn(content, "getBoundingClientRect").mockReturnValue({
        left: 0,
        top: 0,
        width: 170,
        height: 90,
      } as DOMRect);
      touch("touchStart", [[50, 20]], content);
      touch("touchMove", [[50, 80]], content);
      runUntil(world, () => getVerticalIndex(world, trader) >= 2);
      const selected = getVerticalIndex(world, trader);
      touch("touchMove", [[50, 20]], content);
      if (pointerRelease) {
        releasePointer(content, 50, 20);
      }
      expect(touch("touchEnd", [], content)).toBe(true);
      tick(world, 5);
      expect(getVerticalIndex(world, trader)).toBe(selected);
      expect(getTabSelections(world, trader)).toEqual([]);
      touch("touchStart", [[45, 5]], content);
      touch("touchEnd", [], content);
      fireEvent.click(content, { clientX: 45, clientY: 5, detail: 1 });
      runUntil(world, () => getVerticalIndex(world, trader) === 0);
    }
  );

  it.each([
    ["keyboard", "down"],
    ["keyboard", "up"],
    ["swipe", "down"],
    ["swipe", "up"],
  ] as const)(
    "%s %s starts dialog navigation with one step, then repeats at dialog speed",
    (input, direction) => {
      const { world, hero, container, trader } = setupShop();
      press("Enter");
      runUntil(world, () => hero[PLAYER].popup === world.getEntityId(trader));
      runUntil(world, () => !hero[PLAYER].actionTriggered);
      const start = direction === "down" ? 0 : 5;
      const delta = direction === "down" ? 1 : -1;
      act(() => setVerticalIndex(world, trader, start));
      if (input === "keyboard")
        press(direction === "down" ? "ArrowDown" : "ArrowUp");
      else {
        const content = getTouchArea(container, "content");
        touch("touchStart", [[50, 100]], content);
        touch("touchMove", [[50, 100 + delta * 60]], content);
      }
      runUntil(world, () => getVerticalIndex(world, trader) === start + delta);
      tick(world, 3);
      expect(getVerticalIndex(world, trader)).toBe(start + delta);
      runUntil(
        world,
        () => getVerticalIndex(world, trader) === start + delta * 2
      );
      if (input === "keyboard")
        release(direction === "down" ? "ArrowDown" : "ArrowUp");
      else touch("touchEnd", []);
    }
  );

  it("a short direction press immediately after confirming a dialog moves exactly one row", () => {
    const { world, hero, container } = setup();
    act(() => {
      openSpriteBuilder(world, hero);
      step(world, 30);
    });
    runUntil(world, () => !!isInPopup(world, hero));
    fireEvent.click(getTouchArea(container, "right"));
    const popup = world.assertByIdAndComponents(hero[PLAYER].popup, [POPUP]);
    runUntil(world, () => getTab(world, popup) === "sprite");
    press("ArrowDown");
    release("ArrowDown");
    runUntil(world, () => getVerticalIndex(world, popup) === 1);
    tick(world, 10);
    expect(getVerticalIndex(world, popup)).toBe(1);
  });

  it("dragging walks in the dragged direction and lifting stops", () => {
    const { world, hero, container } = setup();
    const { x, y } = hero[POSITION];

    touch("touchStart", [[100, 100]]);
    touch("touchMove", [[100, 160]]);

    expect(hero[MOVABLE].orientations[0]).toBe("down");
    expect(container.querySelector(".Joystick")).toBeInTheDocument();
    runUntil(world, () => hero[POSITION].y === y + 1);

    touch("touchEnd", []);

    expect(hero[MOVABLE].orientations).toEqual([]);
    expect(hero[POSITION].x).toBe(x);
  });

  it("steering against a wall still releases held movement", () => {
    const { hero, tick } = setup([], {}, "|  ♀D  |", { D: "wood_door" });
    const position = { ...hero[POSITION] };
    touch("touchStart", [[100, 100]]);
    touch("touchMove", [[160, 100]]);
    tick(20);
    expect(hero[POSITION]).toEqual(position);
    touch("touchEnd", []);
    expect(hero[MOVABLE].orientations).toEqual([]);
  });

  it("short taps don't walk", () => {
    const { hero } = setup();

    touch("touchStart", [[100, 100]]);
    touch("touchMove", [[104, 103]]);

    expect(hero[MOVABLE].orientations).toEqual([]);
  });

  it.each(["pointerup", "pointercancel"])(
    "%s releases a touch drag even without a touchend event",
    (type) => {
      const { hero, container, tick } = setup();
      touch("touchStart", [[100, 100]]);
      touch("touchMove", [[160, 100]]);
      expect(hero[MOVABLE].orientations[0]).toBe("right");

      const event = new Event(type, { bubbles: true });
      Object.defineProperty(event, "pointerType", { value: "touch" });
      fireEvent(window, event);

      expect(hero[MOVABLE].orientations).toEqual([]);
      expect(container.querySelector(".Joystick")).not.toBeInTheDocument();
      tick(20);
      const stopped = { ...hero[POSITION] };
      tick(20);
      expect(hero[POSITION]).toEqual(stopped);
    }
  );

  it("releases a drag after walking away from its interaction prompt", () => {
    const { world, hero, container } = setup([], {}, "|  ♀D  |", {
      D: "wood_door",
    });
    const prompt = getTouchArea(container, "interact");
    expect(prompt).toBeVisible();

    touch("touchStart", [[100, 100]], prompt);
    touch("touchMove", [[40, 100]], prompt);
    runUntil(world, () => !world.metadata.interact.active);

    expect(getTouchArea(container, "interact")).toBe(prompt);
    expect(prompt).not.toBeVisible();
    const event = new Event("pointerup", { bubbles: true });
    Object.defineProperty(event, "pointerType", { value: "touch" });
    fireEvent(prompt, event);

    expect(hero[MOVABLE].orientations).toEqual([]);
    expect(container.querySelector(".Joystick")).not.toBeInTheDocument();
  });

  it("a mouse pointer release doesn't cancel held keyboard movement", () => {
    const { hero } = setup();
    press("ArrowRight");
    const event = new Event("pointerup", { bubbles: true });
    Object.defineProperty(event, "pointerType", { value: "mouse" });

    fireEvent(window, event);

    expect(hero[MOVABLE].orientations).toEqual(["right"]);
    release("ArrowRight");
    expect(hero[MOVABLE].orientations).toEqual([]);
  });

  it("cancelling a touch clears the joystick and stops walking", () => {
    const { hero, container } = setup();
    touch("touchStart", [[100, 100]]);
    touch("touchMove", [[160, 100]]);

    touch("touchCancel", []);

    expect(hero[MOVABLE].orientations).toEqual([]);
    expect(container.querySelector(".Joystick")).not.toBeInTheDocument();
  });

  it("a second finger stops walking", () => {
    const { hero } = setup();

    touch("touchStart", [[100, 100]]);
    touch("touchMove", [[160, 100]]);
    expect(hero[MOVABLE].orientations[0]).toBe("right");

    touch("touchStart", [
      [160, 100],
      [200, 200],
    ]);

    expect(hero[MOVABLE].orientations).toEqual([]);
  });
});
