import { POPUP } from "../../engine/components/popup";
import { countItems, giveItems, step } from "../../testing/harness";
import { getMessages, interact } from "../doors/helpers";
import { claimQuest, getLines, getStep, press } from "./helpers";
import { approach, setupTown, skipTo } from "./town";

const goods = [
  { stackable: "apple", amount: 5 },
  { stackable: "shroom", amount: 5 },
  { stackable: "fruit", amount: 2 },
  { stackable: "herb", amount: 2 },
  { stackable: "banana", amount: 1 },
  { stackable: "coconut", amount: 1 },
] as const;

const setupSmith = () => {
  const town = setupTown();
  skipTo(town.world, town.chief, "ilex");
  approach(town.world, town.smith);
  return town;
};

describe("earth smith", () => {
  it("keeps the anvil closed and refuses the quest without the goods", () => {
    const { world, hero, smith, anvil } = setupSmith();

    expect(getStep(world, smith)).toBe("START_STEP");
    interact(world, 30);
    press(world, "right");

    expect(getMessages(world, hero)).toEqual(["Not completed!"]);
    expect(anvil[POPUP]).toBeUndefined();
  });

  it("pays coins for the goods, opens the anvil and teaches forging", () => {
    const { world, hero, smith, anvil } = setupSmith();
    giveItems(world, hero, [...goods]);

    claimQuest(world);
    step(world, 5);

    expect(countItems(world, hero, { stackable: "coin" })).toBe(5);
    expect(
      countItems(world, hero, { stackable: "resource", material: "iron" })
    ).toBe(1);
    expect(anvil[POPUP].tabs).toEqual(["forge"]);
    expect(smith[POPUP].tabs).toEqual(["talk"]);
    expect(getLines(smith)).toContain("you can forge the");
    expect(getStep(world, smith)).toBe("talk");
  });
});
