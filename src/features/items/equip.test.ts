import {
  countItems,
  createAreaWorld,
  getItems,
  giveItems,
  walk,
} from "../../testing/harness";
import { playedSounds, resetPlayedSounds } from "../../testing/env";
import { ITEM } from "../../engine/components/item";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { ACTIONABLE } from "../../engine/components/actionable";
import { PLAYER } from "../../engine/components/player";
import { INVENTORY } from "../../engine/components/inventory";
import { equipItem } from "../../engine/systems/collect";
import {
  findItem,
  finishCollecting,
  placeDrop,
  recordMessages,
  setupHero,
} from "./helpers";

const area = `
|     |
| ♀   |
|     |
`;
const ground = { x: 2, y: 1 };

const setup = () => {
  const world = createAreaWorld(area);
  const hero = setupHero(world);
  return { world, hero };
};

const pickUp = (
  world: ReturnType<typeof createAreaWorld>,
  items: Parameters<typeof placeDrop>[2]
) => {
  const hero = setupHero(world);
  placeDrop(world, ground, items);
  walk(world, "right");
  finishCollecting(world, hero);
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe("sticks as weapon", () => {
  it("turns wood into a wood sword when no sword is equipped", () => {
    const area = `
|     |
| ♀≡  |
|     |
`;
    const world = createAreaWorld(area);
    const hero = setupHero(world);

    walk(world, "right");
    finishCollecting(world, hero);

    const sword = world.assertByIdAndComponents(hero[EQUIPPABLE].weapon, [
      ITEM,
    ]);
    expect(sword[ITEM]).toMatchObject({ weapon: "sword", material: "wood" });
    expect(countItems(world, hero, { stackable: "stick" })).toBe(0);
  });

  it("keeps the remaining sticks of a stack after making a sword", () => {
    const { world, hero } = setup();

    pickUp(world, [{ stackable: "stick", amount: 3 }]);

    expect(hero[EQUIPPABLE].weapon).toBeDefined();
    expect(countItems(world, hero, { stackable: "stick" })).toBe(2);
  });

  it("keeps sticks as material while a sword is equipped", () => {
    const { world, hero } = setup();
    const [sword] = giveItems(world, hero, [
      { weapon: "sword", material: "iron", amount: 1 },
    ]);

    pickUp(world, [{ stackable: "stick", amount: 1 }]);

    expect(hero[EQUIPPABLE].weapon).toBe(world.getEntityId(sword));
    expect(countItems(world, hero, { stackable: "stick" })).toBe(1);
  });
});

describe("equipment pickup", () => {
  it("equips a picked up sword into a free slot", () => {
    const { world, hero } = setup();
    const messages = recordMessages();

    pickUp(world, [{ weapon: "sword", material: "iron", amount: 1 }]);

    const sword = findItem(world, hero, { weapon: "sword" })!;
    expect(hero[EQUIPPABLE].weapon).toBe(world.getEntityId(sword));
    expect(messages).toContainEqual(expect.stringMatching(/^Equipped /));
    expect(playedSounds).toContain("equip");
  });

  it("keeps the current sword and suggests swapping a new one", () => {
    const { world, hero } = setup();
    const [woodSword] = giveItems(world, hero, [
      { weapon: "sword", material: "wood", amount: 1 },
    ]);
    const messages = recordMessages();

    pickUp(world, [{ weapon: "sword", material: "iron", amount: 1 }]);

    expect(hero[EQUIPPABLE].weapon).toBe(world.getEntityId(woodSword));
    expect(getItems(world, hero)).toEqual([
      expect.objectContaining({ weapon: "sword", material: "wood" }),
      expect.objectContaining({ weapon: "sword", material: "iron" }),
    ]);
    expect(messages).toContainEqual(
      expect.stringMatching(/^Swap with .*EQUIP/)
    );
    expect(hero[PLAYER].quickItems[1]).toEqual({
      weapon: "sword",
      material: "iron",
    });
  });

  it("does not equip a tool while the shared skill slot is taken", () => {
    const { world, hero } = setup();
    giveItems(world, hero, [{ skill: "bow", material: "wood", amount: 1 }]);
    const messages = recordMessages();

    pickUp(world, [{ tool: "axe", material: "wood", amount: 1 }]);

    expect(hero[EQUIPPABLE].tool).toBeUndefined();
    expect(hero[ACTIONABLE].toolEquipped).toBeFalsy();
    expect(messages).toContainEqual(
      expect.stringMatching(/^Swap with .*EQUIP/)
    );
  });

  it("equips and activates a tool while no skill is equipped", () => {
    const { world, hero } = setup();

    pickUp(world, [{ tool: "axe", material: "wood", amount: 1 }]);

    expect(hero[EQUIPPABLE].tool).toBe(
      world.getEntityId(findItem(world, hero, { tool: "axe" })!)
    );
    expect(hero[ACTIONABLE].toolEquipped).toBe(true);
  });
});

describe("equipping items", () => {
  it("replaces the previous equipment and keeps it in the inventory", () => {
    const { world, hero } = setup();
    const [woodSword] = giveItems(world, hero, [
      { weapon: "sword", material: "wood", amount: 1 },
    ]);
    const [ironSword] = giveItems(world, hero, [
      { weapon: "sword", material: "iron", amount: 1 },
    ]);

    const unequipped = equipItem(world, hero, ironSword);

    expect(unequipped).toBe(woodSword);
    expect(hero[EQUIPPABLE].weapon).toBe(world.getEntityId(ironSword));
    expect(hero[INVENTORY].items).toContain(world.getEntityId(woodSword));
  });

  it("rejects equipping an item that is already worn", () => {
    const { world, hero } = setup();
    const [sword] = giveItems(world, hero, [
      { weapon: "sword", material: "iron", amount: 1 },
    ]);
    const messages = recordMessages();
    resetPlayedSounds();

    const unequipped = equipItem(world, hero, sword);

    expect(unequipped).toBeUndefined();
    expect(hero[EQUIPPABLE].weapon).toBe(world.getEntityId(sword));
    expect(messages).toEqual([expect.stringMatching(/ already worn!$/)]);
    expect(playedSounds).not.toContain("equip");
  });

  it("switches from skill to tool and returns the skill for a quick slot", () => {
    const { world, hero } = setup();
    const [bow] = giveItems(world, hero, [
      { skill: "bow", material: "wood", amount: 1 },
    ]);
    const [axe] = giveItems(world, hero, [
      { tool: "axe", material: "wood", amount: 1 },
    ]);

    const unequipped = equipItem(world, hero, axe);

    expect(unequipped).toBe(bow);
    expect(hero[EQUIPPABLE].skill).toBe(world.getEntityId(bow));
    expect(hero[EQUIPPABLE].tool).toBe(world.getEntityId(axe));
    expect(hero[ACTIONABLE].toolEquipped).toBe(true);
  });

  it("switches back to the skill and returns the tool", () => {
    const { world, hero } = setup();
    const [axe] = giveItems(world, hero, [
      { tool: "axe", material: "wood", amount: 1 },
    ]);
    const [bow] = giveItems(world, hero, [
      { skill: "bow", material: "wood", amount: 1 },
    ]);
    expect(hero[ACTIONABLE].toolEquipped).toBe(true);

    const unequipped = equipItem(world, hero, bow);

    expect(unequipped).toBe(axe);
    expect(hero[EQUIPPABLE].skill).toBe(world.getEntityId(bow));
    expect(hero[ACTIONABLE].toolEquipped).toBe(false);
  });
});
