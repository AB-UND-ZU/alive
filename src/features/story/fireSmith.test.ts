import { PLAYER } from "../../engine/components/player";
import { getSequence } from "../../engine/systems/sequence";
import { countItems, findInArea, step } from "../../testing/harness";
import { getMessages, interact, setup } from "../doors/helpers";
import { addNpc, claimQuest, getLines, press } from "./helpers";

// ♀ hero, B fire smith
const area = `
|          |
|  ♀B      |
|          |
`;

const setupSmith = () => {
  const { world, hero } = setup(area);
  const smith = addNpc(
    world,
    "fireSmith",
    findInArea(area, "B"),
    "fireSmithNpc"
  );
  step(world, 5);
  return { world, hero, smith };
};

describe("fire smith", () => {
  it("asks the hero to hunt golden creatures", () => {
    const { world, hero, smith } = setupSmith();

    expect(getLines(smith)).toContain("the desert?");
    expect(getLines(smith)).toContainEqual(
      expect.stringMatching(/^Kill (10.Prism|8.Eye|6.Orb) and$/)
    );

    interact(world, 30);
    press(world, "right");

    expect(getMessages(world, hero)).toEqual(["Not completed!"]);
  });

  it("rewards the hunt with gold", () => {
    const { world, hero, smith } = setupSmith();
    hero[PLAYER].defeatedUnits = { goldPrism: 10, goldEye: 8, goldOrb: 6 };

    claimQuest(world);

    expect(
      countItems(world, hero, { stackable: "resource", material: "gold" })
    ).toBe(1);
    expect(getSequence(world, smith, "npc")).toBeUndefined();
  });
});
