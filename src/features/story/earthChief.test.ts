import { World } from "../../engine";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { IDENTIFIABLE } from "../../engine/components/identifiable";
import { ACTIONABLE } from "../../engine/components/actionable";
import { POPUP } from "../../engine/components/popup";
import { PLAYER } from "../../engine/components/player";
import { STATS } from "../../engine/components/stats";
import { TypedEntity } from "../../engine/entities";
import { getSequence } from "../../engine/systems/sequence";
import {
  advanceUntil,
  countItems,
  giveItems,
  step,
} from "../../testing/harness";
import { getMessages, interact } from "../doors/helpers";
import {
  addNpc,
  claimQuest,
  getFocus,
  getLines,
  getStep,
  press,
  revisit,
} from "./helpers";
import { approach, setupTown, skipTo, spot } from "./town";

const defeat = (world: World, hero: TypedEntity<"PLAYER">, unit: string) => {
  hero[PLAYER].defeatedUnits = { ...hero[PLAYER].defeatedUnits, [unit]: 1 };
};

describe("earth chief", () => {
  it("welcomes the hero with a compass and experience", () => {
    const { world, hero, chief } = setupTown();

    expect(getStep(world, chief)).toBe("compass");
    expect(getLines(chief).slice(0, 3)).toEqual([
      "Welcome to the",
      "earth town! I am",
      "the Chief.",
    ]);

    claimQuest(world);
    advanceUntil(world, () => hero[STATS].xp === 3, 3000);

    expect(hero[EQUIPPABLE].compass).toBeDefined();
    expect(getStep(world, chief)).toBe("wood");
  });

  it("asks for wood and lets the hero pick a gathering tool", () => {
    const { world, hero, chief } = setupTown();
    claimQuest(world);
    step(world, 30);

    expect(getLines(chief)[0]).toBe("Gathering is the");
    revisit(world);
    interact(world, 30);
    press(world, "right");
    expect(getMessages(world, hero)).toEqual(["Not completed!"]);
    press(world, "close");

    giveItems(world, hero, [
      { stackable: "resource", material: "wood", amount: 1 },
    ]);
    interact(world, 30);
    press(world, "right");
    press(world, "down");
    press(world, "right");
    press(world, "close");
    step(world, 5);

    expect(countItems(world, hero, { tool: "axe" })).toBe(1);
    expect(countItems(world, hero, { consume: "key", material: "iron" })).toBe(
      1
    );
    expect(countItems(world, hero, { stackable: "resource" })).toBe(0);
    expect(getStep(world, chief)).toBe("plants");
    expect(getLines(chief)[0]).toBe("There have been a");
  });

  it("introduces the druid with a potion request when gathering starts", () => {
    const { world, druid } = setupTown();

    expect(druid[POPUP]).toBeUndefined();
    claimQuest(world);

    expect(getLines(druid).slice(0, 2)).toEqual([
      "Hello stranger!",
      "My name is Druid.",
    ]);
    expect(druid[POPUP].tabs).toEqual(["quest"]);
    expect(getStep(world, druid)).toBe("START_STEP");
  });

  it("rewards saplings from plants with a shield or spell", () => {
    const { world, hero, chief } = setupTown();
    skipTo(world, chief, "plants");
    giveItems(world, hero, [{ stackable: "sapling", amount: 5 }]);

    interact(world, 30);
    press(world, "right");
    press(world, "right");
    press(world, "close");
    step(world, 5);

    expect(hero[EQUIPPABLE].offhand).toBeDefined();
    expect(countItems(world, hero, { stackable: "resource" })).toBe(1);
    expect(getStep(world, chief)).toBe("ilex");
  });

  it("points the hero to the ilex and introduces the smith", () => {
    const { world, hero, chief, smith } = setupTown();
    skipTo(world, chief, "ilex");
    const ilex = addNpc(world, "earthTrader", { x: 14, y: 4 });
    ilex[IDENTIFIABLE].name = "ilex_elite";

    expect(getLines(smith).slice(0, 2)).toEqual([
      "Hey mate! My name",
      "is Smith, and I",
    ]);
    expect(getLines(chief)).toContain("Can you fight the");

    interact(world, 30);
    press(world, "right");

    expect(hero[PLAYER].popup).toBeUndefined();
    expect(getFocus(world)).toEqual({
      target: world.getEntityId(ilex),
      highlight: "enemy",
    });
    expect(getStep(world, chief)).toBe("ilex");
  });

  it("rewards defeating the ilex with a gold key and a weapon", () => {
    const { world, hero, chief } = setupTown();
    skipTo(world, chief, "ilex");
    defeat(world, hero, "ilexElite");

    interact(world, 30);
    press(world, "right");
    press(world, "right");
    press(world, "close");
    step(world, 5);

    expect(countItems(world, hero, { consume: "key", material: "gold" })).toBe(
      1
    );
    expect(hero[EQUIPPABLE].weapon).toBeDefined();
    expect(getStep(world, chief)).toBe("oak");
  });

  it("rewards defeating the oak with coins, a letter and an accessory", () => {
    const { world, hero, chief } = setupTown();
    skipTo(world, chief, "oak");
    expect(getLines(chief)).toContain("defeat the Oak?");
    defeat(world, hero, "oakBoss");

    interact(world, 30);
    press(world, "right");
    press(world, "down");
    press(world, "down");
    press(world, "right");
    press(world, "close");
    step(world, 5);

    expect(countItems(world, hero, { stackable: "coin" })).toBe(50);
    expect(countItems(world, hero, { stackable: "letter" })).toBe(1);
    expect(countItems(world, hero, { accessory: "map" })).toBe(1);
    expect(getStep(world, chief)).toBe("haven");
  });

  it("sends the letter to the fire gate guard and ends after delivery", () => {
    const { world, hero, chief } = setupTown();
    const guard = addNpc(world, "fireGateGuard", spot("T"), "fireGateGuardNpc");
    step(world, 5);
    expect(getStep(world, guard)).toBe("START_STEP");
    expect(guard[POPUP]).toBeUndefined();

    skipTo(world, chief, "haven");
    advanceUntil(world, () => getStep(world, chief) === "guard", 2000);

    expect(getLines(chief)).toContain("report the news.");
    expect(getLines(guard)).toContain("You have a report");

    giveItems(world, hero, [{ stackable: "letter", amount: 1 }]);
    approach(world, guard);
    expect(hero[ACTIONABLE].popup).toBe(world.getEntityId(guard));
    claimQuest(world);
    advanceUntil(world, () => !getSequence(world, chief, "npc"), 2000);

    expect(countItems(world, hero, { stackable: "letter" })).toBe(0);
    expect(countItems(world, hero, { stackable: "resource" })).toBe(1);
    expect(guard[POPUP]).toBeUndefined();
    expect(chief[POPUP]).toBeUndefined();
  });

  it("guides the hero to the fire gate guard with the letter", () => {
    const { world, chief } = setupTown();
    const guard = addNpc(world, "fireGateGuard", spot("T"));
    skipTo(world, chief, "haven");

    interact(world, 30);
    press(world, "right");

    expect(getFocus(world)).toEqual({
      target: world.getEntityId(guard),
      highlight: "quest",
    });
  });
});
