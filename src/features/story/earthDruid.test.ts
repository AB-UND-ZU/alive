import { POPUP } from "../../engine/components/popup";
import { PLAYER } from "../../engine/components/player";
import { getSequence } from "../../engine/systems/sequence";
import { brewingRecipes } from "../../game/balancing/brewing";
import { countItems, giveItems, step } from "../../testing/harness";
import { getMessages, interact } from "../doors/helpers";
import { claimQuest, getLines, getStep, press } from "./helpers";
import { approach, setupTown } from "./town";

const potions = [
  { consume: "potion", material: "wood", stat: "hp", amount: 5 },
  { consume: "potion", material: "wood", stat: "mp", amount: 5 },
] as const;

const setupDruid = () => {
  const town = setupTown();
  claimQuest(town.world);
  approach(town.world, town.druid);
  return town;
};

describe("earth druid", () => {
  it("opens the kettle for brewing once the hero listens to her", () => {
    const { world, druid, kettle } = setupDruid();

    expect(kettle[POPUP]).toBeUndefined();

    interact(world, 30);
    step(world, 5);

    expect(getStep(world, druid)).toBe("quest");
    expect(kettle[POPUP].tabs).toEqual(["brew"]);
    expect(kettle[POPUP].recipes).toBe(brewingRecipes);
  });

  it("refuses the potion quest without the potions", () => {
    const { world, hero, druid } = setupDruid();

    interact(world, 30);
    press(world, "right");

    expect(getMessages(world, hero)).toEqual(["Not completed!"]);
    expect(getLines(druid)).toContain("Could you make me");
  });

  it("trades potions for iron and then teaches brewing recipes", () => {
    const { world, hero, druid } = setupDruid();
    giveItems(world, hero, [...potions]);

    claimQuest(world);
    step(world, 5);

    expect(countItems(world, hero, { consume: "potion" })).toBe(5);
    expect(
      countItems(world, hero, { stackable: "resource", material: "iron" })
    ).toBe(1);
    expect(getSequence(world, druid, "npc")).toBeUndefined();
    expect(druid[POPUP].tabs).toEqual(["talk"]);
    expect(getLines(druid)[0]).toMatch(/Brewing$/);
    expect(getLines(druid)).toContain("Gather some items");
    expect(hero[PLAYER].popup).toBeUndefined();
  });
});
