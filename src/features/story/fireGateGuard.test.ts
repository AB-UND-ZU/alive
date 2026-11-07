import { POPUP } from "../../engine/components/popup";
import { getSequence } from "../../engine/systems/sequence";
import { countItems, giveItems, step } from "../../testing/harness";
import { getMessages, interact } from "../doors/helpers";
import { addNpc, claimQuest, getLines, getStep, press } from "./helpers";
import { approach, setupTown, skipTo, spot } from "./town";

const setupGuard = () => {
  const town = setupTown();
  const guard = addNpc(
    town.world,
    "fireGateGuard",
    spot("T"),
    "fireGateGuardNpc"
  );
  step(town.world, 5);
  return { ...town, guard };
};

describe("fire gate guard", () => {
  it("has no quest before the earth chief sends a report", () => {
    const { world, chief, guard } = setupGuard();
    skipTo(world, chief, "oak");
    step(world, 30);

    expect(getStep(world, guard)).toBe("START_STEP");
    expect(guard[POPUP]).toBeUndefined();
  });

  it("asks for the report once the oak is defeated", () => {
    const { world, hero, chief, guard } = setupGuard();
    skipTo(world, chief, "haven");
    approach(world, guard);

    expect(getLines(guard)).toEqual(
      expect.arrayContaining(["Hello traveller.", "Wow, great news!"])
    );

    interact(world, 30);
    press(world, "right");

    expect(getMessages(world, hero)).toEqual(["Not completed!"]);
  });

  it("trades the letter for gold", () => {
    const { world, hero, chief, guard } = setupGuard();
    skipTo(world, chief, "haven");
    giveItems(world, hero, [{ stackable: "letter", amount: 1 }]);
    approach(world, guard);

    claimQuest(world);

    expect(countItems(world, hero, { stackable: "letter" })).toBe(0);
    expect(
      countItems(world, hero, { stackable: "resource", material: "gold" })
    ).toBe(1);
    expect(getSequence(world, guard, "npc")).toBeUndefined();
  });
});
