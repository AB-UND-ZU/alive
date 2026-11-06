import {
  act,
  countItems,
  createAreaWorld,
  findEntityAt,
  findInArea,
  getItems,
  giveItems,
  GivenItem,
  step,
} from "../../testing/harness";
import { playedSounds } from "../../testing/env";
import { World } from "../../engine";
import { ACTIONABLE } from "../../engine/components/actionable";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { FORGABLE } from "../../engine/components/forgable";
import { ITEM } from "../../engine/components/item";
import { POPUP } from "../../engine/components/popup";
import { STATS } from "../../engine/components/stats";
import {
  getTab,
  getTabSelections,
  getVerticalIndex,
  isInPopup,
} from "../../engine/systems/popup";
import {
  forgingCompleted,
  getForgeOptions,
  hittingArea,
  hittingOffset,
} from "../../game/balancing/forging";
import {
  AnvilEntity,
  closeStation,
  getShopper,
  hitAt,
  hitStep,
  openStation,
  selectRow,
} from "./helpers";

// ♀ hero, A anvil
const area = `
|       |
|  ♀A   |
|       |
`;

const ironSword: GivenItem = { weapon: "sword", material: "iron", amount: 1 };
const getOption = (base: GivenItem, match: (add: GivenItem) => boolean) => {
  const option = getForgeOptions({ ...base, bound: false, carrier: -1 }).find(
    (option) => match(option.add)
  );
  if (!option) throw new Error("Forge option not found");
  return option;
};
const materialUpgrade = getOption(ironSword, (add) => !add.element);
const fireUpgrade = getOption(ironSword, (add) => add.element === "fire");

const setup = (items: GivenItem[]) => {
  const world = createAreaWorld(area, { legend: { A: "anvil" } });
  const hero = getShopper(world);
  hero[STATS].maxHp = 10;
  hero[STATS].hp = 10;
  giveItems(world, hero, items);
  const anvil = findEntityAt(world, findInArea(area, "A"), [
    FORGABLE,
    POPUP,
  ]) as AnvilEntity;

  return { world, hero, anvil };
};

/** Select a base and an added item by their rows in the bag. */
const selectItems = (world: World, anvil: AnvilEntity, rows: number[]) => {
  for (const row of rows) {
    selectRow(world, anvil, row);
    act(world, "right");
  }
};

const hitAllSteps = (world: World, anvil: AnvilEntity) => {
  for (let hit = 0; hit < 20 && !forgingCompleted(anvil); hit += 1) {
    hitStep(world, anvil);
  }
  step(world, 1);
};

describe("forging at an anvil", () => {
  it("opens the anvil and lists the carried items", () => {
    const { world, hero, anvil } = setup([ironSword, materialUpgrade.add]);

    const popup = openStation(world);

    expect(popup).toBe(anvil);
    expect(getTab(world, popup)).toBe("forge");
    expect(hero[ACTIONABLE].add).toBe(world.getEntityId(anvil));
    act(world, "down");
    act(world, "down");
    expect(getVerticalIndex(world, anvil)).toBe(1);
  });

  it("upgrades equipment after hitting every step", () => {
    const { world, hero, anvil } = setup([ironSword, materialUpgrade.add]);
    openStation(world);

    selectItems(world, anvil, [0, 1]);
    expect(getTabSelections(world, anvil)).toEqual([0, 1]);

    act(world, "right");
    expect(anvil[FORGABLE].steps).toHaveLength(materialUpgrade.add.amount + 1);
    expect(hero[ACTIONABLE].use).toBe(world.getEntityId(anvil));
    expect(hero[ACTIONABLE].trade).toBeUndefined();

    hitAllSteps(world, anvil);
    expect(anvil[FORGABLE].progress).toBe(anvil[FORGABLE].steps.length);
    expect(hero[ACTIONABLE].trade).toBe(world.getEntityId(anvil));
    expect(getItems(world, hero)).toHaveLength(2);

    act(world, "right");

    expect(getItems(world, hero)).toEqual([
      expect.objectContaining(materialUpgrade.result),
    ]);
    const weapon = world.assertByIdAndComponents(hero[EQUIPPABLE].weapon, [
      ITEM,
    ]);
    expect(weapon[ITEM]).toMatchObject(materialUpgrade.result);
    expect(anvil[FORGABLE].completed).toEqual(materialUpgrade.result);
  });

  it("adds an element with a single resource", () => {
    const { world, hero, anvil } = setup([ironSword, fireUpgrade.add]);
    openStation(world);
    selectItems(world, anvil, [0, 1]);
    act(world, "right");

    expect(anvil[FORGABLE].steps).toHaveLength(2);
    hitAllSteps(world, anvil);
    act(world, "right");

    expect(getItems(world, hero)).toEqual([
      expect.objectContaining({
        weapon: "sword",
        material: "iron",
        element: "fire",
      }),
    ]);
  });

  it("closes the completed forging on back", () => {
    const { world, hero, anvil } = setup([ironSword, fireUpgrade.add]);
    openStation(world);
    selectItems(world, anvil, [0, 1]);
    act(world, "right");
    hitAllSteps(world, anvil);
    act(world, "right");
    expect(getTabSelections(world, anvil)).toHaveLength(4);

    act(world, "left");

    expect(isInPopup(world, hero)).toBeFalsy();
    expect(getTabSelections(world, anvil)).toEqual([]);
  });

  it("keeps the step after missing it on the anvil", () => {
    const { world, anvil } = setup([ironSword, fireUpgrade.add]);
    openStation(world);
    selectItems(world, anvil, [0, 1]);
    act(world, "right");
    const { offset, width } = anvil[FORGABLE].steps[0];
    const missIndexes = Array.from(
      { length: hittingArea },
      (_, index) => hittingOffset + index
    ).filter(
      (index) =>
        index < hittingOffset + offset ||
        index >= hittingOffset + offset + width
    );

    expect(missIndexes).toContain(hitAt(world, anvil, missIndexes));

    expect(anvil[FORGABLE].progress).toBe(0);
    expect(playedSounds).toContain("cling");
  });

  it("hurts the hero when hitting beside the anvil", () => {
    const { world, hero, anvil } = setup([ironSword, fireUpgrade.add]);
    openStation(world);
    selectItems(world, anvil, [0, 1]);
    act(world, "right");
    const hp = hero[STATS].hp;

    hitAt(world, anvil, [0, 1]);

    expect(anvil[FORGABLE].progress).toBe(0);
    expect(hero[STATS].hp).toBe(hp - 1);
    expect(playedSounds).toContain("magic");
  });

  it("keeps the items when leaving before forging is complete", () => {
    const { world, hero, anvil } = setup([ironSword, fireUpgrade.add]);
    openStation(world);
    selectItems(world, anvil, [0, 1]);
    act(world, "right");
    hitStep(world, anvil);
    const before = getItems(world, hero);

    closeStation(world);

    expect(getItems(world, hero)).toEqual(before);
    expect(getTabSelections(world, anvil)).toEqual([]);
  });

  it("goes back to choose another added item", () => {
    const { world, anvil } = setup([ironSword, fireUpgrade.add]);
    openStation(world);
    selectItems(world, anvil, [0]);

    act(world, "left");

    expect(getTabSelections(world, anvil)).toEqual([]);
    expect(getVerticalIndex(world, anvil)).toBe(0);
    expect(playedSounds).toContain("back");
  });

  it("refuses an item without an upgrade", () => {
    const goldAxe: GivenItem = { tool: "axe", material: "gold", amount: 1 };
    const { world, hero, anvil } = setup([goldAxe]);
    expect(getForgeOptions({ ...goldAxe, bound: false, carrier: -1 })).toEqual(
      []
    );
    openStation(world);

    act(world, "right");

    expect(playedSounds).toContain("deny");
    expect(getTabSelections(world, anvil)).toEqual([]);
    expect(getItems(world, hero)).toEqual([expect.objectContaining(goldAxe)]);
  });

  it("refuses an added item that does not fit the base", () => {
    const { world, anvil } = setup([
      ironSword,
      { stackable: "ore", amount: 9 },
    ]);
    openStation(world);

    selectItems(world, anvil, [0, 1]);

    expect(playedSounds).toContain("deny");
    expect(getTabSelections(world, anvil)).toEqual([0]);
  });

  it("refuses too few resources for the upgrade", () => {
    const { world, hero, anvil } = setup([
      ironSword,
      { ...materialUpgrade.add, amount: materialUpgrade.add.amount - 1 },
    ]);
    openStation(world);

    selectItems(world, anvil, [0, 1]);

    expect(playedSounds).toContain("deny");
    expect(getTabSelections(world, anvil)).toEqual([0]);
    expect(
      countItems(world, hero, { stackable: "resource", material: "gold" })
    ).toBe(materialUpgrade.add.amount - 1);
  });

  it("refuses the base item as its own addition", () => {
    const { world, anvil } = setup([ironSword]);
    openStation(world);

    selectItems(world, anvil, [0, 0]);

    expect(playedSounds).toContain("deny");
    expect(getTabSelections(world, anvil)).toEqual([0]);
  });

  it("closes the anvil", () => {
    const { world, hero } = setup([ironSword]);
    openStation(world);

    closeStation(world);

    expect(isInPopup(world, hero)).toBeFalsy();
    expect(hero[ACTIONABLE].add).toBeUndefined();
  });

  it("offers no forging at a passive anvil", () => {
    const world = createAreaWorld(area, { legend: { A: "anvil_passive" } });
    const hero = getShopper(world);

    step(world, 15);

    expect(findEntityAt(world, findInArea(area, "A"), [POPUP])).toBeUndefined();
    expect(hero[ACTIONABLE].popup).toBeUndefined();
  });
});
