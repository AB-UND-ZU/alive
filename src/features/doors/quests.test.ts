import {
  advanceUntil,
  countItems,
  findEntityAt,
  findInArea,
  giveItems,
  step,
  trigger,
} from "../../testing/harness";
import { playedSounds } from "../../testing/env";
import { World } from "../../engine";
import { ACTIONABLE } from "../../engine/components/actionable";
import { NPC } from "../../engine/components/npc";
import { PLAYER } from "../../engine/components/player";
import { Popup, POPUP } from "../../engine/components/popup";
import { STATS } from "../../engine/components/stats";
import { createSign } from "../../bindings/creation";
import { createPopup } from "../../engine/systems/popup";
import { getSequence } from "../../engine/systems/sequence";
import { setIdentifier } from "../../engine/utils";
import { getMessages, getPrompt, interact, setup } from "./helpers";

// ♀ hero, Q quest giver, ◀ prism as quest target
const area = `
|           |
|  ♀Q   ◀   |
|           |
`;

const reward = { consume: "key", material: "iron", amount: 1 } as const;

const setupQuest = (quest: Partial<Popup>) => {
  const { world, hero } = setup(area);
  const giver = createSign(world, findInArea(area, "Q"), []);
  createPopup(world, giver, { tabs: ["quest"], lines: [[]], ...quest });
  step(world, 5);
  return { world, hero, giver };
};

const press = (world: World, action: "right" | "down" | "close") => {
  trigger(world, action);
  step(world, 10);
};

const getPrism = (world: World) =>
  findEntityAt(world, findInArea(area, "◀"), [NPC, STATS])!;

describe("quests", () => {
  it("refuses an unfinished quest", () => {
    const { world, hero, giver } = setupQuest({
      targets: [{ unit: "prism", amount: 1 }],
      deals: [{ item: reward, stock: 1, prices: [] }],
    });

    expect(getPrompt(world, giver)).toBe("QUEST");
    interact(world, 30);
    press(world, "right");

    expect(playedSounds).toContain("deny");
    expect(getMessages(world, hero)).toEqual(["Not completed!"]);
    expect(countItems(world, hero, { consume: "key" })).toBe(0);
  });

  it("guides the hero to the quest target", () => {
    const { world, hero } = setupQuest({
      targets: [{ unit: "prism", amount: 1 }],
      focuses: [{ identifier: "target", highlight: "enemy" }],
      deals: [{ item: reward, stock: 1, prices: [] }],
    });
    setIdentifier(world, getPrism(world), "target");

    interact(world, 30);
    press(world, "right");

    expect(hero[PLAYER].popup).toBeUndefined();
    expect(getSequence(world, hero, "quest")?.name).toBe("waypointQuest");
  });

  it("rewards the hero after defeating the target", () => {
    const { world, hero, giver } = setupQuest({
      targets: [{ unit: "prism", amount: 1 }],
      deals: [{ item: reward, stock: 1, prices: [] }],
    });

    getPrism(world)[STATS].hp = 0;
    advanceUntil(world, () => hero[PLAYER].defeatedUnits.prism === 1, 5000);
    interact(world, 30);
    press(world, "right");

    expect(countItems(world, hero, reward)).toBe(1);
    expect(playedSounds).toContain("confirm");

    press(world, "close");
    expect(giver).not.toHaveProperty(POPUP);
    expect(hero[ACTIONABLE].popup).toBeUndefined();
  });

  it("trades delivered items for a chosen reward", () => {
    const { world, hero, giver } = setupQuest({
      deals: [
        {
          item: reward,
          stock: 1,
          prices: [{ stackable: "resource", material: "wood", amount: 2 }],
        },
      ],
      choices: [
        { stackable: "arrow", amount: 3 },
        { stackable: "charge", amount: 3 },
      ],
    });
    giveItems(world, hero, [
      { stackable: "resource", material: "wood", amount: 3 },
    ]);
    step(world, 5);

    interact(world, 30);
    press(world, "right");
    press(world, "down");
    press(world, "right");

    expect(countItems(world, hero, { stackable: "charge" })).toBe(3);
    expect(countItems(world, hero, { stackable: "arrow" })).toBe(0);
    expect(countItems(world, hero, reward)).toBe(1);
    expect(countItems(world, hero, { stackable: "resource" })).toBe(1);
    expect(getMessages(world, hero)).toEqual(["3x Charge", "1x Key"]);

    press(world, "close");
    expect(giver).not.toHaveProperty(POPUP);
  });

  it("refuses a delivery quest without the items", () => {
    const { world, hero } = setupQuest({
      deals: [
        {
          item: reward,
          stock: 1,
          prices: [{ stackable: "resource", material: "wood", amount: 2 }],
        },
      ],
    });
    giveItems(world, hero, [
      { stackable: "resource", material: "wood", amount: 1 },
    ]);

    interact(world, 30);
    press(world, "right");

    expect(getMessages(world, hero)).toEqual(["Not completed!"]);
    expect(countItems(world, hero, { stackable: "resource" })).toBe(1);
  });
});
