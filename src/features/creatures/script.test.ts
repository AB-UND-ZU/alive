import { entities } from "../../engine";
import { ATTACKABLE } from "../../engine/components/attackable";
import { BEHAVIOUR, Pattern } from "../../engine/components/behaviour";
import { BELONGABLE } from "../../engine/components/belongable";
import { COLLIDABLE } from "../../engine/components/collidable";
import { ITEM } from "../../engine/components/item";
import { LOCKABLE } from "../../engine/components/lockable";
import { POPUP } from "../../engine/components/popup";
import { POSITION } from "../../engine/components/position";
import { SPRITE } from "../../engine/components/sprite";
import { STATS } from "../../engine/components/stats";
import { TOOLTIP } from "../../engine/components/tooltip";
import { isDead } from "../../engine/systems/damage";
import { createItemAsDrop } from "../../engine/systems/drop";
import { setIdentifier } from "../../engine/utils";
import { getItemSprite } from "../../game/assets/utils";
import { createDialog, rage } from "../../game/assets/ui";
import {
  advanceUntil,
  countItems,
  findEntityAt,
  findInArea,
  getItems,
  giveItems,
} from "../../testing/harness";
import { createNpc } from "../../bindings/creation";
import { registerEntity } from "../../engine/systems/map";
import {
  advanceTicks,
  countDrops,
  createCreatureWorld,
  getCreature,
  getSpells,
  toughen,
} from "./helpers";

const setup = (area: string, legend: Record<string, string> = {}) => {
  const { world, hero } = createCreatureWorld(area, legend);
  toughen(hero);
  const npc = createNpc(world, "guide", findInArea(area, "N"));
  registerEntity(world, npc);
  const script = (...patterns: Pattern[]) =>
    npc[BEHAVIOUR].patterns.push(...patterns);
  const names = () =>
    npc[BEHAVIOUR].patterns.map((pattern: Pattern) => pattern.name);
  return { world, hero, npc, script, names };
};

describe("scripted npc patterns", () => {
  it("walks around obstacles to a target position", () => {
    const { world, npc, script, names } = setup(`
|♀        |
|   █     |
| N █     |
|   █     |
`);
    script({ name: "move", memory: { targetPosition: { x: 7, y: 2 } } });

    advanceUntil(
      world,
      () => npc[POSITION].x === 7 && npc[POSITION].y === 2,
      10000
    );
    advanceTicks(world, 2);

    expect(names()).not.toContain("move");
  });

  it("gets as close as it can to a walled off target and keeps trying", () => {
    const { world, npc, script, names } = setup(`
|♀   █████|
|    █   █|
| N  █   █|
|    █████|
`);
    const start = { ...npc[POSITION] };
    script({ name: "move", memory: { targetPosition: { x: 6, y: 2 } } });

    advanceTicks(world, 12);

    expect(npc[POSITION]).not.toEqual(start);
    expect(npc[POSITION].x).toBeGreaterThanOrEqual(4);
    expect(npc[POSITION].x).toBeLessThanOrEqual(8);
    expect([0, 3, 4, 39]).toContain(npc[POSITION].y);
    expect(names()).toContain("move");
  });

  it("waits a number of ticks before the following pattern", () => {
    const { world, npc, script } = setup(`
|♀        |
| N       |
`);
    script(
      { name: "wait", memory: { ticks: 6 } },
      { name: "move", memory: { targetPosition: { x: 5, y: 1 } } }
    );

    advanceTicks(world, 5);
    expect(npc[POSITION]).toEqual({ x: 1, y: 1 });

    advanceUntil(world, () => npc[POSITION].x === 5, 5000);
  });

  it("shows a dialog and a shout on its tooltip", () => {
    const { world, npc, script, names } = setup(`
|♀ N|
`);
    const dialogs = [createDialog("Hello")];
    script(
      { name: "dialog", memory: { dialogs } },
      { name: "wait", memory: { ticks: 1 } },
      { name: "shout", memory: { dialogs: [createDialog("Help")] } }
    );

    advanceUntil(world, () => npc[TOOLTIP].dialogs === dialogs, 2000);
    advanceUntil(world, () => names().length === 0, 2000);

    expect(npc[TOOLTIP].enemy).toBe(true);
    expect(npc[TOOLTIP].override).toBe("visible");
  });

  it("turns hostile with rage when enraged and calms down when soothed", () => {
    const { world, hero, npc, script } = setup(`
|♀N|
`);
    script({ name: "enrage", memory: { shout: "Get out" } });

    advanceUntil(world, () => npc[BELONGABLE].faction === "hostile", 2000);
    expect(npc[TOOLTIP].idle).toBe(rage);
    expect(npc[TOOLTIP].dialogs).toHaveLength(1);

    script({ name: "soothe", memory: {} });
    advanceUntil(world, () => npc[BELONGABLE].faction === "settler", 2000);
    expect(npc[TOOLTIP].idle).toBeUndefined();
    expect(npc[TOOLTIP].dialogs).toHaveLength(0);
    expect(hero[STATS].hp).toBeGreaterThan(0);
  });

  it("hunts down a kill target and then forgets it", () => {
    const { world, script, names } = setup(`
|♀        |
| N    Ω  |
`);
    const dummy = getCreature(world, "dummy");
    script({ name: "kill", memory: { target: world.getEntityId(dummy) } });

    advanceUntil(world, () => isDead(world, dummy), 20000);
    advanceTicks(world, 2);

    expect(names()).not.toContain("kill");
  });

  it("drops a kill order against a friendly target", () => {
    const { world, hero, script, names } = setup(`
|♀ N|
`);
    script({ name: "kill", memory: { target: world.getEntityId(hero) } });

    advanceTicks(world, 3);

    expect(names()).not.toContain("kill");
    expect(hero[STATS].hp).toBe(hero[STATS].maxHp);
  });

  it("walks up to a locked door and opens it", () => {
    const { world, npc, script, names } = setup(
      `
|♀ ██████|
|  N   D |
|  ██████|
`,
      { D: "wood_door" }
    );
    const door = findEntityAt(world, { x: 6, y: 1 }, [LOCKABLE])!;
    script({ name: "unlock", memory: { target: world.getEntityId(door) } });

    advanceUntil(world, () => door[LOCKABLE].locked === false, 10000);
    advanceTicks(world, 2);

    expect(npc[POSITION].x).toBe(5);
    expect(names()).not.toContain("unlock");
  });

  it("locks a door", () => {
    const { world, script } = setup(
      `
|♀ N D|
`,
      { D: "wood_door" }
    );
    const door = findEntityAt(world, { x: 4, y: 0 }, [LOCKABLE])!;
    door[LOCKABLE].locked = false;
    script({ name: "lock", memory: { target: world.getEntityId(door) } });

    advanceUntil(world, () => door[LOCKABLE].locked === true, 2000);
  });

  it("fetches an item lying elsewhere", () => {
    const { world, npc, script, names } = setup(`
|♀        |
| N       |
`);
    const coin = { stackable: "coin", amount: 1, bound: false } as const;
    const item = createItemAsDrop(world, { x: 6, y: 1 }, entities.createItem, {
      [ITEM]: coin,
      [SPRITE]: getItemSprite(coin),
    });
    setIdentifier(world, item, "quest_coin");
    script({ name: "collect", memory: { identifier: "quest_coin" } });

    advanceUntil(
      world,
      () => countDrops(world, { stackable: "coin" }) === 0,
      10000
    );
    advanceTicks(world, 2);

    expect(countItems(world, npc, { stackable: "coin" })).toBe(1);
    expect(names()).not.toContain("collect");
  });

  it("carries an item to a spot and drops it there", () => {
    const { world, npc, script } = setup(`
|♀        |
| N       |
`);
    const shield = getItems(world, npc).find((item) => item.offhand)!;
    const shieldId = world
      .getEntities([ITEM])
      .find((entity) => entity[ITEM] === shield)!;
    script({
      name: "drop",
      memory: {
        item: world.getEntityId(shieldId),
        targetPosition: { x: 6, y: 1 },
      },
    });

    advanceUntil(world, () => shield.carrier !== world.getEntityId(npc), 10000);

    expect(npc[POSITION].x).toBe(5);
    expect(countDrops(world, { offhand: "shield" })).toBe(1);
  });

  it("opens a shop with its deals", () => {
    const { world, npc, script } = setup(`
|♀ N|
`);
    const deals = [
      {
        item: { stackable: "coin", amount: 1 },
        stock: 1,
        prices: [{ stackable: "stick", amount: 1 }],
      },
    ];
    script({ name: "sell", memory: { deals } });

    advanceUntil(world, () => POPUP in npc, 2000);

    expect((npc as any)[POPUP].deals).toBe(deals);
    expect((npc as any)[POPUP].tabs).toEqual(["buy"]);
  });

  it("casts its equipped spell on command", () => {
    const { world, npc, script, names } = setup(`
|♀   |
|  N |
`);
    npc[STATS].maxMp = 1;
    npc[STATS].mp = 1;
    giveItems(world, npc, [{ spell: "beam", material: "iron", amount: 1 }]);
    script({ name: "action", memory: { spell: true } });

    advanceUntil(world, () => getSpells(world, npc).length > 0, 2000);
    expect(names()).not.toContain("action");
  });

  it("becomes untouchable while invincible and attackable again when vulnerable", () => {
    const { world, npc, script, names } = setup(`
|♀ N|
`);
    script({ name: "invincible", memory: {} });

    advanceUntil(world, () => !(ATTACKABLE in npc), 2000);
    expect(COLLIDABLE in npc).toBe(true);

    script({ name: "vulnerable", memory: {} });
    advanceUntil(world, () => ATTACKABLE in npc, 2000);
    expect(COLLIDABLE in npc).toBe(false);
    expect(names()).toHaveLength(0);
  });
});
