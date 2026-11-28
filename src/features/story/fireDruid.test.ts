import { getSequence } from "../../engine/systems/sequence";
import { countItems, findInArea, giveItems, step } from "../../testing/harness";
import { getMessages, interact, setup } from "../doors/helpers";
import { addNpc, claimQuest, getLines, press } from "./helpers";

// ♀ hero, E fire druid
const area = `
|          |
|  ♀E      |
|          |
`;

const wishes = [
  { stackable: "juice", amount: 2 },
  { stackable: "curry", amount: 2 },
  { stackable: "crystal", amount: 2 },
  { stackable: "mineral", amount: 2 },
  { stackable: "thorn", amount: 30 },
  { consume: "potion", material: "iron", stat: "hp", amount: 5 },
  { consume: "potion", material: "iron", stat: "mp", amount: 5 },
] as const;

const setupDruid = (wish?: number) => {
  const { world, hero } = setup(area);
  const druid = addNpc(
    world,
    "fireDruid",
    findInArea(area, "E"),
    "fireDruidNpc"
  );
  const random = wish === undefined ? undefined : jest.spyOn(Math, "random").mockReturnValue((wish + 0.5) / wishes.length);
  try { step(world, 5); } finally { random?.mockRestore(); }
  return { world, hero, druid };
};

describe("fire druid", () => {
  it("wishes for a rare item and refuses the quest without it", () => {
    const { world, hero, druid } = setupDruid();

    expect(getLines(druid).slice(0, 2)).toEqual([
      "Life gets boring",
      "here sometimes.",
    ]);
    expect(getLines(druid)).toContainEqual(
      expect.stringMatching(/^(Could you|Break some|Cut some)/)
    );

    interact(world, 30);
    press(world, "right");

    expect(getMessages(world, hero)).toEqual(["Not completed!"]);
  });

  it.each([[2, "crystal", "rock2"], [3, "mineral", "rock1"]] as const)(
    "shows the source rock for wish %i (%s)", (index, item, rock) => {
      const { druid } = setupDruid(index);
      expect(druid.POPUP.deals[0].prices[0].stackable).toBe(item);
      expect(druid.POPUP.lines[0].flat().filter((sprite) => /^rock[12]$/.test(sprite.id))
        .map((sprite) => sprite.id)).toEqual([rock]);
    }
  );

  it("trades the wished item for gold", () => {
    const { world, hero, druid } = setupDruid();
    giveItems(world, hero, [...wishes]);

    claimQuest(world);

    expect(
      countItems(world, hero, { stackable: "resource", material: "gold" })
    ).toBe(1);
    expect(getSequence(world, druid, "npc")).toBeUndefined();
  });
});
