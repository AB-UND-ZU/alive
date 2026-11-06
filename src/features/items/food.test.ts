import {
  advanceUntil,
  countItems,
  createAreaWorld,
  giveItems,
} from "../../testing/harness";
import { playedSounds } from "../../testing/env";
import { STATS } from "../../engine/components/stats";
import { PLAYER } from "../../engine/components/player";
import { INVENTORY } from "../../engine/components/inventory";
import { Stackable } from "../../engine/components/item";
import {
  consumeItem,
  getItemConsumption,
  stackableConsumptions,
} from "../../engine/systems/consume";
import { getVerticalIndex } from "../../engine/systems/popup";
import { act, getMenu, recordMessages, setupHero } from "./helpers";

const area = `
|     |
| ♀   |
|     |
`;

const setup = () => {
  const world = createAreaWorld(area);
  const hero = setupHero(world);
  hero[STATS].maxHp = 20;
  hero[STATS].hp = 10;
  hero[STATS].maxMp = 20;
  hero[STATS].mp = 10;
  return { world, hero };
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe("eating from the inventory", () => {
  it("eats a selected apple to restore health", () => {
    const { world, hero } = setup();
    giveItems(world, hero, [{ stackable: "apple", amount: 2 }]);

    act(world, "inspect");
    act(world, "right");

    expect(hero[STATS].hp).toBe(10 + stackableConsumptions.apple!.amount);
    expect(countItems(world, hero, { stackable: "apple" })).toBe(1);
    expect(hero[PLAYER].quickItems[1]).toEqual({ stackable: "apple" });
  });

  it("eats the selected item further down the list", () => {
    const { world, hero } = setup();
    giveItems(world, hero, [
      { stackable: "apple", amount: 1 },
      { stackable: "shroom", amount: 1 },
    ]);

    act(world, "inspect");
    act(world, "down");
    act(world, "right");

    expect(hero[STATS].hp).toBe(10);
    expect(hero[STATS].mp).toBe(10 + stackableConsumptions.shroom!.amount);
    expect(countItems(world, hero, { stackable: "shroom" })).toBe(0);
    expect(getVerticalIndex(world, getMenu(world))).toBe(0);
  });

  it("refuses to eat items without a consumption effect", () => {
    const { world, hero } = setup();
    giveItems(world, hero, [{ stackable: "coin", amount: 3 }]);
    const messages = recordMessages();

    act(world, "inspect");
    act(world, "right");

    expect(countItems(world, hero, { stackable: "coin" })).toBe(3);
    expect(messages).toEqual([expect.stringMatching(/^Can't use .*Coin!$/)]);
    expect(playedSounds).toContain("deny");
  });

  it("tells when there is nothing to eat", () => {
    const { world } = setup();
    const messages = recordMessages();

    act(world, "inspect");
    act(world, "right");

    expect(messages).toEqual(["Nothing to use!"]);
  });
});

describe("food effects", () => {
  const consume = (stackable: Stackable, amount = 1) => {
    const { world, hero } = setup();
    const [item] = giveItems(world, hero, [{ stackable, amount }]);
    const consumed = consumeItem(world, hero, getItemConsumption(item));
    return { world, hero, consumed };
  };

  it("restores a fixed amount of health or mana", () => {
    const { hero } = consume("banana");
    expect(hero[STATS].hp).toBe(10 + stackableConsumptions.banana!.amount);

    const { hero: other } = consume("coconut");
    expect(other[STATS].mp).toBe(10 + stackableConsumptions.coconut!.amount);
  });

  it("restores a percentage of maximum health", () => {
    const { hero } = consume("toast");

    expect(hero[STATS].hp).toBe(
      10 + (20 * stackableConsumptions.toast!.amount) / 100
    );
  });

  it("does not restore beyond maximum health", () => {
    const { world, hero } = setup();
    hero[STATS].hp = 19;
    const [item] = giveItems(world, hero, [{ stackable: "bread", amount: 1 }]);

    consumeItem(world, hero, getItemConsumption(item));

    expect(hero[STATS].hp).toBe(20);
    expect(hero[PLAYER].receivedStats.hp).toBe(1);
  });

  it("hurts when eating thorns", () => {
    const { hero } = consume("thorn");

    expect(hero[STATS].hp).toBe(9);
    expect(hero[PLAYER].receivedStats.true).toBe(1);
    expect(playedSounds).toContain("hit");
  });

  it("grants experience from saplings", () => {
    const { world, hero } = consume("sapling");

    advanceUntil(world, () => hero[STATS].xp > 0);

    expect(hero[STATS].xp).toBe(stackableConsumptions.sapling!.amount);
  });

  it("reports when the last piece of a stack is eaten", () => {
    const single = consume("apple");
    expect(single.consumed).toBe(true);
    expect(single.hero[INVENTORY].items).toEqual([]);

    const stack = consume("apple", 2);
    expect(stack.consumed).toBe(false);
    expect(countItems(stack.world, stack.hero, { stackable: "apple" })).toBe(1);
  });

  it("does nothing without a consumption", () => {
    const { world, hero } = setup();
    const [item] = giveItems(world, hero, [{ stackable: "coin", amount: 1 }]);

    expect(getItemConsumption(item)).toBeUndefined();
    expect(consumeItem(world, hero, getItemConsumption(item))).toBe(false);
    expect(countItems(world, hero, { stackable: "coin" })).toBe(1);
  });
});
