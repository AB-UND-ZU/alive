import {
  countItems,
  createAreaWorld,
  giveItems,
  step,
  walk,
} from "../../testing/harness";
import { playedSounds } from "../../testing/env";
import { STATS } from "../../engine/components/stats";
import { PLAYER } from "../../engine/components/player";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { stackableConsumptions } from "../../engine/systems/consume";
import {
  assignQuickItem,
  getTab,
  getTabSelections,
  isInPopup,
} from "../../engine/systems/popup";
import { act, getMenu, pressQuickKey, setupHero } from "./helpers";

const area = `
|     |
| ♀   |
|     |
`;

const setup = () => {
  const world = createAreaWorld(area);
  const hero = setupHero(world);
  hero[STATS].maxHp = 20;
  hero[STATS].hp = 10;
  return { world, hero };
};

describe("quick slot assignment", () => {
  it("fills slots from one to nine and then zero", () => {
    const { world, hero } = setup();
    const quickItems = hero[PLAYER].quickItems;
    for (let slot = 1; slot <= 9; slot += 1) {
      quickItems[slot] = { stackable: "coin", material: "wood" };
    }

    assignQuickItem(world, hero, { stackable: "apple", amount: 3 });

    expect(quickItems[0]).toEqual({ stackable: "apple" });
  });

  it("moves an item to a chosen slot without duplicates", () => {
    const { world, hero } = setup();

    assignQuickItem(world, hero, { stackable: "apple" });
    assignQuickItem(world, hero, { stackable: "apple" }, 5);

    expect(hero[PLAYER].quickItems[1]).toBeUndefined();
    expect(hero[PLAYER].quickItems[5]).toEqual({ stackable: "apple" });
  });

  it("keeps an item in its slot when assigned again", () => {
    const { world, hero } = setup();

    assignQuickItem(world, hero, { stackable: "apple" });
    assignQuickItem(world, hero, { stackable: "shroom" });
    assignQuickItem(world, hero, { stackable: "apple" });

    expect(hero[PLAYER].quickItems).toEqual({
      1: { stackable: "apple" },
      2: { stackable: "shroom" },
    });
  });
});

describe("quick slot keys", () => {
  it("eats the assigned food", () => {
    const { world, hero } = setup();
    giveItems(world, hero, [{ stackable: "apple", amount: 2 }]);
    assignQuickItem(world, hero, { stackable: "apple" });

    pressQuickKey(world, 1);

    expect(hero[STATS].hp).toBe(10 + stackableConsumptions.apple!.amount);
    expect(countItems(world, hero, { stackable: "apple" })).toBe(1);
    expect(isInPopup(world, hero)).toBeFalsy();
  });

  it("does nothing when the assigned item is used up", () => {
    const { world, hero } = setup();
    assignQuickItem(world, hero, { stackable: "apple" });

    pressQuickKey(world, 1);
    pressQuickKey(world, 2);

    expect(hero[STATS].hp).toBe(10);
  });

  it("equips the assigned item and puts the old one on that key", () => {
    const { world, hero } = setup();
    const [woodSword] = giveItems(world, hero, [
      { weapon: "sword", material: "wood", amount: 1 },
    ]);
    const [ironSword] = giveItems(world, hero, [
      { weapon: "sword", material: "iron", amount: 1 },
    ]);
    assignQuickItem(world, hero, { weapon: "sword", material: "iron" }, 3);

    pressQuickKey(world, 3);

    expect(hero[EQUIPPABLE].weapon).toBe(world.getEntityId(ironSword));
    expect(hero[PLAYER].quickItems[3]).toEqual({
      weapon: "sword",
      material: "wood",
    });

    pressQuickKey(world, 3);

    expect(hero[EQUIPPABLE].weapon).toBe(world.getEntityId(woodSword));
  });

  it("works while the inventory menu is open", () => {
    const { world, hero } = setup();
    giveItems(world, hero, [{ stackable: "apple", amount: 1 }]);
    assignQuickItem(world, hero, { stackable: "apple" });

    act(world, "inspect");
    pressQuickKey(world, 1);

    expect(hero[STATS].hp).toBe(10 + stackableConsumptions.apple!.amount);
  });

  it("ignores keys while reading a sign", () => {
    const world = createAreaWorld(`
|         |
| ♀     ¾ |
|         |
`);
    const hero = setupHero(world);
    hero[STATS].maxHp = 20;
    hero[STATS].hp = 10;
    giveItems(world, hero, [{ stackable: "apple", amount: 1 }]);
    assignQuickItem(world, hero, { stackable: "apple" });
    walk(world, "right", 5);
    step(world, 15);

    act(world, "interact");
    expect(isInPopup(world, hero)).toBeTruthy();
    pressQuickKey(world, 1);

    expect(hero[STATS].hp).toBe(10);
  });
});

describe("editing quick slots in the use tab", () => {
  it("assigns the selected item to a pressed key", () => {
    const { world, hero } = setup();
    giveItems(world, hero, [
      { stackable: "apple", amount: 1 },
      { stackable: "shroom", amount: 1 },
    ]);
    const menu = getMenu(world);

    act(world, "use");
    act(world, "right");
    expect(getTabSelections(world, menu)).toHaveLength(1);

    pressQuickKey(world, 4);
    expect(getTabSelections(world, menu)).toEqual([0, 4]);

    act(world, "down");
    act(world, "right");

    expect(hero[PLAYER].quickItems[4]).toEqual({ stackable: "shroom" });
    expect(getTabSelections(world, menu)).toEqual([]);
    expect(hero[STATS].hp).toBe(10);
  });

  it("clears an assigned key while editing", () => {
    const { world, hero } = setup();
    giveItems(world, hero, [{ stackable: "apple", amount: 1 }]);
    assignQuickItem(world, hero, { stackable: "apple" });

    act(world, "use");
    act(world, "right");
    pressQuickKey(world, 1);

    expect(hero[PLAYER].quickItems[1]).toBeUndefined();
    expect(playedSounds).toContain("back");
    expect(countItems(world, hero, { stackable: "apple" })).toBe(1);
  });

  it("goes back from choosing an item", () => {
    const { world } = setup();
    const menu = getMenu(world);

    act(world, "use");
    act(world, "right");
    act(world, "left");

    expect(getTabSelections(world, menu)).toEqual([]);
  });
});

describe("clicking the use tab", () => {
  const click = (
    world: ReturnType<typeof createAreaWorld>,
    content: number,
    offset: number
  ) => {
    const hero = setupHero(world);
    hero[PLAYER].contentTriggered = content;
    hero[PLAYER].offsetTriggered = offset;
    act(world, "content");
  };

  it.each([
    [0, "inspect"],
    [2, "equip"],
    [4, "gear"],
    [6, "stats"],
  ] as const)("opens a tab from the menu row %i", (content, tab) => {
    const { world, hero } = setup();
    const menu = getMenu(world);

    act(world, "use");
    click(world, content, 12);

    expect(isInPopup(world, hero)).toBeTruthy();
    expect(getTab(world, menu)).toBe(tab);
  });

  it("uses the item of a clicked quick slot", () => {
    const { world, hero } = setup();
    giveItems(world, hero, [{ stackable: "apple", amount: 1 }]);
    assignQuickItem(world, hero, { stackable: "apple" }, 4);

    act(world, "use");
    click(world, 2, 6);

    expect(hero[STATS].hp).toBe(10 + stackableConsumptions.apple!.amount);
  });

  it("ignores clicks between slots", () => {
    const { world, hero } = setup();
    giveItems(world, hero, [{ stackable: "apple", amount: 1 }]);
    assignQuickItem(world, hero, { stackable: "apple" }, 1);

    act(world, "use");
    click(world, 1, 2);

    expect(hero[STATS].hp).toBe(10);
    expect(getTab(world, getMenu(world))).toBe("use");
  });
});
