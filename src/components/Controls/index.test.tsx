/* eslint-disable testing-library/no-node-access, testing-library/no-container -- controls are drawn as glyph spans and invisible touch areas without accessible roles */
import { act, fireEvent } from "@testing-library/react";
import Controls from ".";
import { World } from "../../engine";
import { ACTIONABLE } from "../../engine/components/actionable";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { LOCKABLE } from "../../engine/components/lockable";
import { MOVABLE } from "../../engine/components/movable";
import { PLAYER } from "../../engine/components/player";
import { POSITION } from "../../engine/components/position";
import { PROJECTILE } from "../../engine/components/projectile";
import { STATS } from "../../engine/components/stats";
import { TypedEntity } from "../../engine/entities";
import {
  assignQuickItem,
  getTab,
  getTabSelections,
  getVerticalIndex,
  isInPopup,
  pushTabSelection,
} from "../../engine/systems/popup";
import { stackableConsumptions } from "../../engine/systems/consume";
import { assertIdentifierAndComponents } from "../../engine/utils";
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
import { readRow, readRows, renderHud } from "./testing";
import { CONDITIONABLE } from "../../engine/components/conditionable";
import { frameHeight, frameWidth } from "../../game/assets/utils";
import { getIndexFromKey } from "../Keyboard";
import { REVIVABLE } from "../../engine/components/revivable";
import { purchasableItems } from "../../game/balancing/trading";
import { createShop, getTraderDeal } from "../../features/workstations/helpers";

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
  const cells = Array.from(rows[frameIndex + 1].querySelectorAll(".Cell"));
  const offset = flipped ? 8 : 0;
  const readButton = (button: Element[]) => ({
    label: button
      .map((cell) => cell.querySelector(".Layer:last-child")?.textContent)
      .join("")
      .replace(/[^A-Z]/g, ""),
    disabled: button.some((cell) =>
      Array.from(cell.querySelectorAll(".Layer")).some(
        (layer) => layer.textContent === "░"
      )
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

describe("touch controls", () => {
  const touch = (
    type: "touchStart" | "touchMove" | "touchEnd",
    points: [number, number][],
    target: Element = document.body
  ) =>
    fireEvent[type](window, {
      touches: points.map(([clientX, clientY]) => ({ clientX, clientY })),
      changedTouches: [{ target }],
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

    expect(queryTouchArea(container, "interact")).not.toBeInTheDocument();
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
    Object.defineProperty(content, "offsetWidth", {
      value: (frameWidth - 2) * 10,
    });
    Object.defineProperty(content, "offsetHeight", {
      value: (frameHeight - 2) * 10,
    });
    const tapRow = (row: number) => {
      fireEvent.click(content, { clientX: 45, clientY: row * 10 + 5 });
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

  it("tapping menu arrows selects and confirms a row", () => {
    const { world, hero, container } = setup([
      { skill: "bow", material: "wood", amount: 1 },
      { tool: "axe", material: "wood", amount: 1 },
    ]);
    press("q");
    runUntil(world, () => !!isInPopup(world, hero));
    runUntil(world, () => !hero[PLAYER].actionTriggered);

    fireEvent.pointerDown(getTouchArea(container, "down"));
    fireEvent.pointerUp(getTouchArea(container, "down"));
    fireEvent.click(getTouchArea(container, "right"));
    runUntil(world, () => !isInPopup(world, hero));

    expect(hero[ACTIONABLE].toolEquipped).toBe(true);
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

  it("short taps don't walk", () => {
    const { hero } = setup();

    touch("touchStart", [[100, 100]]);
    touch("touchMove", [[104, 103]]);

    expect(hero[MOVABLE].orientations).toEqual([]);
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
