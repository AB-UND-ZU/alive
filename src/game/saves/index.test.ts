import {
  advance,
  advanceUntil,
  assertHero,
  createAreaWorld,
  createTestWorld,
  FRAME,
} from "../../testing/harness";
import { NPC } from "../../engine/components/npc";
import { STATS } from "../../engine/components/stats";
import { PLAYER } from "../../engine/components/player";
import { MOVABLE } from "../../engine/components/movable";
import { TypedEntity } from "../../engine/entities";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { ITEM } from "../../engine/components/item";
import { INVENTORY } from "../../engine/components/inventory";
import { POSITION } from "../../engine/components/position";
import { populateItems } from "../../bindings/creation";
import {
  canSave,
  createSave,
  formatPlaytime,
  getPlayer,
  getSaveName,
  SaveGame,
  saveVersion,
  upgradeSave,
} from ".";

// ♀ hero, c chick
const area = `
|       |
| ♀   c |
|       |
`;

const savedAt = new Date(2026, 9, 11, 15, 13, 23);

describe("save games", () => {
  it("names saves by local time to fit next to the hero in a popup row", () => {
    expect(getSaveName(savedAt)).toBe("20261011-151323");
    expect(getSaveName(savedAt)).toHaveLength(15);
  });

  it("formats playtime", () => {
    expect(formatPlaytime(45 * 1000)).toBe("0:00:45");
    expect(formatPlaytime(12.5 * 60 * 1000)).toBe("0:12:30");
    expect(formatPlaytime((83 * 60 + 45) * 1000)).toBe("1:23:45");
  });

  it("only counts playtime outside of the menu", () => {
    const menu = createTestWorld();
    advance(menu, 1000);
    expect(menu.metadata.playtime).toBe(0);

    const world = createAreaWorld(area);
    advance(world, 1000);
    expect(world.metadata.playtime).toBeCloseTo(
      Math.ceil(1000 / FRAME) * FRAME
    );
  });

  it("summarizes class, playtime, kills and deaths of the hero", () => {
    const world = createAreaWorld(area);
    const chick = world.getEntities([NPC, STATS])[0];

    chick[STATS].hp = 0;
    advanceUntil(world, () => getPlayer(world)?.[PLAYER].kills === 1);

    world.assertComponents(assertHero(world), [STATS])[STATS].hp = 0;
    advanceUntil(world, () => getPlayer(world)?.[PLAYER].deaths === 1, 20000);

    const save = createSave(world, savedAt);

    expect(save).toMatchObject({
      name: "20261011-151323",
      version: saveVersion,
      level: "LEVEL_TUTORIAL",
      classKey: "scout",
      kills: 1,
      deaths: 1,
    });
    expect(save.playtime).toBe(world.metadata.playtime);
    expect(save.snapshot.entities.length).toBeGreaterThan(0);
  });

  it("lists equipped items of the hero once", () => {
    const world = createAreaWorld(area);
    const hero = world.assertComponents(assertHero(world), [
      EQUIPPABLE,
      INVENTORY,
      POSITION,
    ]);
    populateItems(world, hero, [
      { weapon: "sword", material: "wood", amount: 1, bound: true },
      { accessory: "map", amount: 1, bound: true },
    ]);
    const equippedIds = new Set(Object.values(hero[EQUIPPABLE]));

    const { items } = createSave(world, savedAt);

    expect(equippedIds.size).toBe(2);
    expect(items).toEqual(
      Array.from(equippedIds).map((itemId) => {
        const { carrier, amount, bound, ...item } =
          world.assertByIdAndComponents(itemId, [ITEM])[ITEM];
        return item;
      })
    );
  });

  it("creates a separate save for each new game", () => {
    const first = createSave(createAreaWorld(area), savedAt);
    const second = createSave(createAreaWorld(area), savedAt);

    expect(first.id).not.toBe(second.id);
  });

  it("keeps the same save when saving a game again", () => {
    const world = createAreaWorld(area);
    const save = createSave(world, savedAt);
    world.metadata.saveId = save.id;

    expect(createSave(world).id).toBe(save.id);
  });

  it("can't save in the menu or while stepping through a portal", () => {
    expect(canSave(createTestWorld())).toBe(false);

    const world = createAreaWorld(area);
    expect(canSave(world)).toBe(true);

    world.removeComponentFromEntity(
      assertHero(world) as TypedEntity<"MOVABLE">,
      MOVABLE,
      false
    );
    expect(canSave(world)).toBe(false);
  });
});

describe("save upgrades", () => {
  const save = { version: "0.4.0", name: "old" } as SaveGame;
  const upgrades = [
    {
      version: "0.6.0",
      upgrade: (save: SaveGame) => ({ ...save, name: `${save.name} 0.6` }),
    },
    {
      version: "0.4.0",
      upgrade: (save: SaveGame) => ({ ...save, name: `${save.name} 0.4` }),
    },
    {
      version: "0.5.1",
      upgrade: (save: SaveGame) => ({ ...save, name: `${save.name} 0.5.1` }),
    },
    {
      version: "1.0.0",
      upgrade: (save: SaveGame) => ({ ...save, name: `${save.name} 1.0` }),
    },
  ];

  it("applies all newer upgrades up to the game version in order", () => {
    expect(upgradeSave(save, "0.6.0", upgrades)).toMatchObject({
      name: "old 0.5.1 0.6",
      version: "0.6.0",
    });
  });

  it("loads saves of the same version unchanged", () => {
    expect(upgradeSave(save, "0.4.0", upgrades)).toBe(save);
  });

  it("refuses saves of newer game versions", () => {
    expect(() => upgradeSave(save, "0.3.9", upgrades)).toThrow("newer version");
  });
});
