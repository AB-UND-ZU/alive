import { spendItem } from "../../engine/systems/trigger";
import { SPRITE } from "../../engine/components/sprite";
import { composeCharacterPixels } from "../../components/Row/characters";
import { forgeHit, forgeMiss } from "../../game/assets/sprites";
import { colors } from "../../game/assets/colors";
import { getItemSprite } from "../../game/assets/utils";
import { projectSprite } from "../../renderers/terminal/sprites";
import { getMotion, sampleMotion } from "../../engine/motion";
import { getSequence } from "../../engine/systems/sequence";
import {
  act,
  advanceUntil,
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
import { PARTICLE } from "../../engine/components/particle";
import { PLAYER } from "../../engine/components/player";
import { INVENTORY } from "../../engine/components/inventory";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { FORGABLE } from "../../engine/components/forgable";
import { ITEM } from "../../engine/components/item";
import { POPUP } from "../../engine/components/popup";
import { STATS } from "../../engine/components/stats";
import {
  assignQuickItem,
  getTab,
  getTabSelections,
  getVerticalIndex,
  isInPopup,
} from "../../engine/systems/popup";
import {
  forgingCompleted,
  getForgeOptions,
  getForgeStatus,
  hittingArea,
  hittingOffset,
} from "../../game/balancing/forging";
import {
  AnvilEntity,
  closeStation,
  getHammerIndex,
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
  it.each(["axe", "hook", "shovel", "pickaxe", "hammer"] as const)(
    "upgrades a wood %s for five iron",
    (tool) => {
      const option = getOption(
        { tool, material: "wood", amount: 1 },
        () => true
      );
      expect(option.add).toEqual({
        stackable: "resource",
        material: "iron",
        amount: 5,
      });
      expect(option.result).toEqual({ tool, material: "iron", amount: 1 });
    }
  );

  it("releases perfect-hit and bonus XP only after Yield, keeping both spear slots and its key", () => {
    const spear = {
      weapon: "spear",
      skill: "spear",
      material: "wood",
      amount: 1,
    } as const;
    const { world, hero, anvil } = setup([spear, fireUpgrade.add]);
    const id = hero[INVENTORY].items[0];
    assignQuickItem(world, hero, spear, 0);
    const before = hero[STATS].xp;
    openStation(world);
    selectItems(world, anvil, [0, 1]);
    act(world, "right");
    const forge = anvil[FORGABLE];
    expect(forge.xp).toBe(0);
    forge.steps.forEach(() =>
      hitAt(world, anvil, [hittingOffset + forge.target!])
    );
    expect(forge.xp).toBe(3);
    expect(hero[STATS].xp).toBe(before);
    advanceUntil(
      world,
      () => hero[ACTIONABLE].trade === world.getEntityId(anvil)
    );
    act(world, "right");
    expect(hero[EQUIPPABLE]).toMatchObject({ weapon: id, skill: id });
    expect(hero[PLAYER].quickItems[0]).toMatchObject({
      weapon: "spear",
      element: "fire",
    });
    advanceUntil(world, () => hero[STATS].xp === before + 3);
  });

  it("shows strike feedback at impact until the hammer resets", () => {
    const { world, anvil } = setup([ironSword, materialUpgrade.add]);
    openStation(world);
    selectItems(world, anvil, [0, 1]);
    act(world, "right");
    const forge = anvil[FORGABLE];
    const particles = getSequence(world, anvil, "popup")!.particles;
    const feedback = (color: string) =>
      Array.from({ length: 5 }, (_, i) => {
        const cell = world.assertByIdAndComponents(
          particles[`popup-content-7-${11 + i}`],
          [SPRITE]
        );
        return cell[SPRITE].layers.find((layer) => layer.color === color)?.char ?? " ";
      }).join("");
    for (const [text, color] of [
      ["Ouch!", colors.red],
      ["Miss.", colors.red],
      ["Hit.", colors.lime],
      ["Ace!", colors.lime],
    ]) {
      const current = forge.steps[forge.progress];
      const cell = Array.from({ length: hittingArea }, (_, i) => i).find((i) =>
        text === "Miss."
          ? i < current.offset || i >= current.offset + current.width
          : i >= current.offset &&
            i < current.offset + current.width &&
            i !== forge.target
      )!;
      const target =
        text === "Ouch!"
          ? 0
          : hittingOffset + (text === "Ace!" ? forge.target! : cell);
      advanceUntil(world, () => getHammerIndex(world, anvil) === target);
      act(world, "right");
      const centered = text.padStart(5);
      expect(feedback(color)).not.toBe(centered);
      advanceUntil(world, () => feedback(color) === centered);
      step(world, 4);
      expect(feedback(color)).toBe(centered);
      advanceUntil(world, () => forge.lastAction === "swing");
      expect(feedback(color)).not.toBe(centered);
    }
    const ouch = world.assertByIdAndComponents(particles["popup-content-0-7"], [
      SPRITE,
    ]);
    expect(projectSprite(ouch[SPRITE])).toMatchObject({
      char: "x",
      foreground: colors.red,
    });
    for (const [stepIndex, color] of [
      colors.lime,
      colors.lime,
      colors.grey,
    ].entries()) {
      const cell = world.assertByIdAndComponents(
        particles[`popup-content-0-${9 + stepIndex}`],
        [SPRITE]
      );
      const expected = [
        { char: "_", color },
        ...getItemSprite(forge.steps[stepIndex].item).layers,
      ];
      if (stepIndex === 1) expected.push({ char: "+", color: colors.lime });
      expect(cell[SPRITE].layers.slice(-expected.length)).toEqual(expected);
    }
  });

  const fillTenSlots = () => {
    const { world, hero, anvil } = setup([ironSword, materialUpgrade.add]);
    openStation(world);
    selectItems(world, anvil, [0, 1]);
    act(world, "right");
    const forge = anvil[FORGABLE];
    while (forge.progress < forge.steps.length - 1) hitStep(world, anvil);
    const extraSlots = 10 - forge.steps.length;
    for (let i = 0; i < extraSlots; i++) hitAt(world, anvil, [0]);
    const finalStep = forge.steps[forge.progress];
    expect(finalStep.misses).toHaveLength(extraSlots);
    return { world, hero, anvil, forge, finalStep, extraSlots };
  };

  it("can yield a run that succeeds on the tenth strike", () => {
    const { world, hero, anvil, forge } = fillTenSlots();
    hitAt(world, anvil, [hittingOffset + forge.target!]);
    expect(forgingCompleted(anvil)).toBe(true);
    act(world, "right");
    expect(getItems(world, hero)).toEqual([
      expect.objectContaining(materialUpgrade.result),
    ]);
  });

  it("fails without adding an eleventh slot and retries the same recipe on an empty anvil", () => {
    const { world, hero, anvil, forge, finalStep, extraSlots } = fillTenSlots();
    hitAt(world, anvil, [0]);
    expect(finalStep.result).toBe("failed");
    expect(finalStep.misses).toHaveLength(extraSlots);
    const particles = getSequence(world, anvil, "popup")!.particles;
    const layersAt = (row: number, col: number) =>
      world.assertByIdAndComponents(particles[`popup-content-${row}-${col}`], [
        SPRITE,
      ])[SPRITE].layers;
    for (let i = 0; i < hittingArea; i++) {
      expect(layersAt(4, hittingOffset + i)).toEqual([
        ...layersAt(4, 0),
        { char: "_", color: colors.red },
      ]);
    }
    const label = Array.from(
      { length: 5 },
      (_, i) =>
        layersAt(7, 11 + i).find((layer) => layer.color === colors.red)?.char
    ).join("");
    expect(label).toBe("Lost!");
    expect(hero[ACTIONABLE].trade).toBeUndefined();
    const before = getItems(world, hero);
    act(world, "right");
    expect(getItems(world, hero)).toEqual(before);
    expect(getTabSelections(world, anvil)).toHaveLength(3);
    expect(forge.xp).toBe(0);
    expect(forge.hitIndex).toBeUndefined();
    expect(forge.steps.every((step) => !step.misses && !step.result)).toBe(true);
    expect(forge.lastAction).toBe("swing");
    expect(forge.progress).toBe(0);
    expect(hero[ACTIONABLE].use).toBe(world.getEntityId(anvil));
    hitAt(world, anvil, [hittingOffset + forge.target!]);
    expect(forge.xp).toBe(1);
  });

  it("moves the item after a miss while keeping the hot band, and floors the score at zero", () => {
    const { world, anvil } = setup([ironSword, materialUpgrade.add]);
    openStation(world);
    selectItems(world, anvil, [0, 1]);
    act(world, "right");
    const forge = anvil[FORGABLE];
    const band = forge.steps[0].offset;
    const first = forge.target;
    hitAt(world, anvil, [0, 1]);
    expect(forge.xp).toBe(0);
    expect(forge.progress).toBe(0);
    expect(forge.steps[0].offset).toBe(band);
    expect(forge.target).not.toBe(first);
    hitAt(world, anvil, [hittingOffset + forge.target!]);
    expect(forge.xp).toBe(1);
    const next = forge.steps[1];
    const red = Array.from({ length: hittingArea }, (_, i) => i).filter(
      (i) => i < next.offset || i >= next.offset + next.width
    );
    hitAt(
      world,
      anvil,
      red.map((i) => i + hittingOffset)
    );
    expect(forge.xp).toBe(0);
    const ordinary = Array.from(
      { length: next.width },
      (_, i) => next.offset + i
    ).filter((i) => i !== forge.target);
    hitAt(
      world,
      anvil,
      ordinary.map((i) => i + hittingOffset)
    );
    expect(forge.progress).toBe(2);
    expect(forge.xp).toBe(0);
  });

  it("upgrades a stowed hammer in its assigned slot without replacing the active tool", () => {
    const hammer = { tool: "hammer", material: "wood", amount: 1 } as const;
    const { world, hero, anvil } = setup([
      { tool: "axe", material: "wood", amount: 1 },
      hammer,
      getOption(hammer, () => true).add,
    ]);
    const [axe, stowed] = hero[INVENTORY].items;
    assignQuickItem(world, hero, hammer, 4);
    openStation(world);
    selectItems(world, anvil, [1, 2]);
    act(world, "right");
    hitAllSteps(world, anvil);
    act(world, "right");
    expect(hero[EQUIPPABLE].tool).toBe(axe);
    expect(hero[INVENTORY].items).toContain(stowed);
    expect(hero[PLAYER].quickItems[4]).toEqual({
      tool: "hammer",
      material: "iron",
    });
  });

  it("swings horizontally after aborting a downstroke and restarting", () => {
    const { world, anvil } = setup([ironSword, materialUpgrade.add]);
    openStation(world);
    selectItems(world, anvil, [0, 1]);
    act(world, "right");
    const hammer = world.assertByIdAndComponents(
      getSequence(world, anvil, "popup")!.particles.hammer,
      [PARTICLE]
    );
    const swingHeight = hammer[PARTICLE].offsetY;
    act(world, "right");
    advanceUntil(world, () => hammer[PARTICLE].offsetY > swingHeight);
    act(world, "left");
    expect(getTabSelections(world, anvil)).toHaveLength(2);
    act(world, "right");
    const position = () =>
      sampleMotion(getMotion(hammer)!, world.metadata.elapsed);
    const start = position();
    step(world, 5);
    expect(position().x).toBeLessThan(start.x);
    expect(position().y).toBe(swingHeight);
  });

  it("returns the hammer to the next swing's starting edge without a jump", () => {
    const { world, anvil } = setup([ironSword, materialUpgrade.add]);
    openStation(world);
    selectItems(world, anvil, [0, 1]);
    act(world, "right");
    hitStep(world, anvil);
    const hammerId = getSequence(world, anvil, "popup")!.particles.hammer;
    const hammer = world.assertById(hammerId);
    const before = sampleMotion(getMotion(hammer)!, world.metadata.elapsed).x;
    step(world);
    const after = sampleMotion(getMotion(hammer)!, world.metadata.elapsed).x;
    expect(Math.abs(after - before)).toBeLessThan(1);
    expect(anvil[FORGABLE].progress).toBe(1);
  });
  it("shows the next hit area as soon as a successful hit advances the step", () => {
    const { world, anvil } = setup([ironSword, materialUpgrade.add]);
    openStation(world);
    selectItems(world, anvil, [0, 1]);
    act(world, "right");
    anvil[FORGABLE].steps[0].offset = 0;
    anvil[FORGABLE].steps[1].offset =
      hittingArea - anvil[FORGABLE].steps[1].width;
    hitStep(world, anvil);
    expect(anvil[FORGABLE].progress).toBe(1);
    const next = anvil[FORGABLE].steps[1];
    const state = getSequence(world, anvil, "popup")!;
    for (let index = 0; index < hittingArea; index += 1) {
      const id = state.particles[`popup-content-4-${hittingOffset + index}`];
      const layers = world.assertByIdAndComponents(id, [SPRITE])[SPRITE].layers;
      const marker =
        index >= next.offset && index < next.offset + next.width
          ? forgeHit
          : forgeMiss;
      expect(layers.slice(-marker.layers.length)).toEqual(marker.layers);
    }
  });

  it("keeps the silver air marking on a forged gold spear", () => {
    const spear: GivenItem = {
      weapon: "spear",
      skill: "spear",
      material: "gold",
      amount: 1,
    };
    const upgrade = getOption(spear, (add) => add.element === "air");
    const { world, hero, anvil } = setup([spear, upgrade.add]);
    openStation(world);
    selectItems(world, anvil, [0, 1]);
    act(world, "right");
    hitAllSteps(world, anvil);
    act(world, "right");
    const forged = world
      .getEntities([ITEM, SPRITE])
      .find(
        (entity) =>
          entity[ITEM].carrier === world.getEntityId(hero) &&
          entity[ITEM].weapon === "spear" &&
          entity[ITEM].element === "air"
      );
    expect(forged).toBeDefined();
    expect(composeCharacterPixels(forged![SPRITE].layers)).toContain(
      colors.silver
    );
  });

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

describe("forging selections after inventory changes", () => {
  it("keeps the chosen base when an earlier inventory stack disappears", () => {
    const { world, hero, anvil } = setup([
      { stackable: "apple", amount: 1 },
      ironSword,
      fireUpgrade.add,
    ]);
    openStation(world);
    selectItems(world, anvil, [1]);
    spendItem(world, hero, { stackable: "apple", amount: 1 });
    step(world);
    expect(getTabSelections(world, anvil)).toEqual([0]);
    expect(
      getForgeStatus(world, hero, getTabSelections(world, anvil)[0]).baseItem
    ).toMatchObject(ironSword);
    selectItems(world, anvil, [1]);
    expect(
      getForgeStatus(world, hero, ...getTabSelections(world, anvil)).resultItem
    ).toEqual(fireUpgrade.result);
  });

  it("discards the chosen base if that item is removed instead of forging its replacement row", () => {
    const { world, hero, anvil } = setup([ironSword, fireUpgrade.add]);
    openStation(world);
    selectItems(world, anvil, [0]);
    spendItem(world, hero, ironSword);
    step(world);
    expect(getTabSelections(world, anvil)).toEqual([]);
    expect(getVerticalIndex(world, anvil)).toBe(0);
  });

  it("returns to ingredient selection when the chosen stack is no longer sufficient", () => {
    const { world, hero, anvil } = setup([ironSword, materialUpgrade.add]);
    openStation(world);
    selectItems(world, anvil, [0, 1]);
    act(world, "right");
    spendItem(world, hero, { ...materialUpgrade.add, amount: 1 });
    step(world);
    expect(getTabSelections(world, anvil)).toEqual([0]);
    expect(() => act(world, "right")).not.toThrow();
    expect(countItems(world, hero, { weapon: "sword", material: "iron" })).toBe(
      1
    );
    expect(countItems(world, hero, { weapon: "sword", material: "gold" })).toBe(
      0
    );
  });
});
