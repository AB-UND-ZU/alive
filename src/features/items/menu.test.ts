import { createAreaWorld, giveItems } from "../../testing/harness";
import { playedSounds, resetPlayedSounds } from "../../testing/env";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { ACTIONABLE } from "../../engine/components/actionable";
import { PLAYER } from "../../engine/components/player";
import { POPUP } from "../../engine/components/popup";
import {
  getTab,
  getVerticalIndex,
  isInPopup,
} from "../../engine/systems/popup";
import { equipItem } from "../../engine/systems/collect";
import { act, getMenu, recordMessages, setupHero } from "./helpers";

const area = `
|     |
| ♀   |
|     |
`;

const setup = () => {
  const world = createAreaWorld(area);
  const hero = setupHero(world);
  return { world, hero, menu: getMenu(world) };
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe("inventory menu", () => {
  it.each(["use", "inspect", "gear", "equip", "stats"] as const)(
    "opens the %s tab and closes it with the same key",
    (tab) => {
      const { world, hero, menu } = setup();

      act(world, tab);

      expect(isInPopup(world, hero)).toBeTruthy();
      expect(hero[PLAYER].popup).toBe(world.getEntityId(menu));
      expect(getTab(world, menu)).toBe(tab);
      expect(playedSounds).toContain("open");

      act(world, tab);

      expect(isInPopup(world, hero)).toBeFalsy();
      expect(menu[POPUP].active).toBe(false);
      expect(playedSounds).toContain("close");
    }
  );

  it("switches between tabs while open", () => {
    const { world, hero, menu } = setup();

    act(world, "inspect");
    resetPlayedSounds();
    act(world, "gear");

    expect(isInPopup(world, hero)).toBeTruthy();
    expect(getTab(world, menu)).toBe("gear");
    expect(playedSounds).toEqual(["tab"]);

    act(world, "tab");
    expect(getTab(world, menu)).toBe("equip");

    act(world, "backtab");
    act(world, "backtab");
    expect(getTab(world, menu)).toBe("inspect");
  });

  it("closes from another tab when pressing use", () => {
    const { world, hero, menu } = setup();

    act(world, "stats");
    act(world, "use");

    expect(isInPopup(world, hero)).toBeFalsy();
    expect(getTab(world, menu)).toBe("use");
  });

  it("closes with the close action", () => {
    const { world, hero } = setup();

    act(world, "inspect");
    act(world, "close");

    expect(isInPopup(world, hero)).toBeFalsy();
  });

  it("scrolls through the inventory within its bounds", () => {
    const { world, menu } = setup();
    const hero = setupHero(world);
    giveItems(world, hero, [
      { stackable: "coin", amount: 1 },
      { stackable: "apple", amount: 1 },
    ]);

    act(world, "inspect");
    act(world, "down");
    expect(getVerticalIndex(world, menu)).toBe(1);

    act(world, "down");
    expect(getVerticalIndex(world, menu)).toBe(1);

    act(world, "up");
    act(world, "up");
    expect(getVerticalIndex(world, menu)).toBe(0);
  });

  it("resets the scroll position when reopening a tab", () => {
    const { world, hero, menu } = setup();
    giveItems(world, hero, [
      { stackable: "coin", amount: 1 },
      { stackable: "apple", amount: 1 },
    ]);

    act(world, "inspect");
    act(world, "down");
    act(world, "inspect");
    act(world, "inspect");

    expect(getVerticalIndex(world, menu)).toBe(0);
  });
});

describe("map tab", () => {
  it("does not open without a map", () => {
    const { world, hero } = setup();

    act(world, "map");

    expect(isInPopup(world, hero)).toBeFalsy();
    expect(playedSounds).not.toContain("deny");
  });

  it("tells that a map is needed when chosen in the use tab", () => {
    const { world, hero, menu } = setup();
    const messages = recordMessages();

    act(world, "use");
    act(world, "map");

    expect(isInPopup(world, hero)).toBeTruthy();
    expect(getTab(world, menu)).toBe("use");
    expect(playedSounds).toContain("deny");
    expect(messages).toEqual([expect.stringMatching(/^Need .*Map!$/)]);
  });

  it("opens with a map", () => {
    const { world, hero, menu } = setup();
    giveItems(world, hero, [{ accessory: "map", material: "gold", amount: 1 }]);
    expect(hero[EQUIPPABLE].map).toBeDefined();

    act(world, "map");

    expect(isInPopup(world, hero)).toBeTruthy();
    expect(getTab(world, menu)).toBe("map");
  });
});

describe("equip tab", () => {
  it("equips the selected item and closes", () => {
    const { world, hero } = setup();
    giveItems(world, hero, [{ weapon: "sword", material: "wood", amount: 1 }]);
    const [ironSword] = giveItems(world, hero, [
      { weapon: "sword", material: "iron", amount: 1 },
    ]);

    act(world, "equip");
    act(world, "down");
    act(world, "right");

    expect(hero[EQUIPPABLE].weapon).toBe(world.getEntityId(ironSword));
    expect(isInPopup(world, hero)).toBeFalsy();
  });

  it("switches back to a carried tool", () => {
    const { world, hero } = setup();
    const [axe] = giveItems(world, hero, [
      { tool: "axe", material: "wood", amount: 1 },
    ]);
    const [bow] = giveItems(world, hero, [
      { skill: "bow", material: "wood", amount: 1 },
    ]);
    equipItem(world, hero, bow);
    expect(hero[ACTIONABLE].toolEquipped).toBe(false);

    act(world, "equip");
    act(world, "right");

    expect(hero[EQUIPPABLE].tool).toBe(world.getEntityId(axe));
    expect(hero[ACTIONABLE].toolEquipped).toBe(true);
  });

  it("switches back to a carried skill", () => {
    const { world, hero } = setup();
    const [bow] = giveItems(world, hero, [
      { skill: "bow", material: "wood", amount: 1 },
    ]);
    const [axe] = giveItems(world, hero, [
      { tool: "axe", material: "wood", amount: 1 },
    ]);
    equipItem(world, hero, axe);
    expect(hero[ACTIONABLE].toolEquipped).toBe(true);

    act(world, "equip");
    act(world, "right");

    expect(hero[EQUIPPABLE].skill).toBe(world.getEntityId(bow));
    expect(hero[ACTIONABLE].toolEquipped).toBe(false);
  });
});
