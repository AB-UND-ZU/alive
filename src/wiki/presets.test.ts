import {
  createPresetWorld,
  getPresetLoadout,
  presets,
  PresetName,
} from "./presets";
import { getItemSprite } from "../game/assets/utils";
import { missing } from "../game/assets/sprites";
import { assertHero, advance } from "../testing/harness";
import { up4Center } from "../game/levels/tutorial/areas";
import { normalize } from "../game/math/std";
import { LEVEL } from "../engine/components/level";

test("Bandit starts at level one with only tutorial supplies", () => {
  expect(getPresetLoadout("bandit")).toEqual({
    level: 1,
    equipment: [{ weapon: "sword", material: "wood", amount: 1, bound: false }],
    items: [
      { consume: "potion", stat: "hp", material: "wood", amount: 10 },
      { stackable: "apple", amount: 3 },
      { stackable: "banana", amount: 2 },
    ],
  });
});
test("Earth and Ilex have early equipment without shields, bows or spare crafting resources", () => {
  for (const name of ["earth", "ilex"] as const) {
    const loadout = getPresetLoadout(name);
    expect(loadout.equipment).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ weapon: "sword", material: "wood" }),
        expect.objectContaining({ tool: "axe" }),
        expect.objectContaining({ accessory: "compass" }),
      ])
    );
    expect(loadout.equipment).toHaveLength(name === "ilex" ? 4 : 3);
    expect(loadout.items).toHaveLength(3);
  }
});
test("Haven and Nomad use level five quest progression and switch spell, accessory and skill", () => {
  for (const name of ["haven", "nomad"] as const) {
    const { level, equipment, items } = getPresetLoadout(name);
    expect(level).toBe(5);
    expect(equipment).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ weapon: "sword", material: "iron" }),
        expect.objectContaining({ tool: "pickaxe" }),
        expect.objectContaining({ accessory: "amulet" }),
        expect.objectContaining({
          spell: name === "haven" ? "dash" : "wave",
          material: "iron",
          element: "earth",
        }),
        expect.objectContaining({
          skill: name === "haven" ? "bow" : "slash",
          material: "iron",
        }),
        expect.objectContaining({
          accessory: name === "haven" ? "boots" : "map",
        }),
      ])
    );
    expect(equipment).not.toContainEqual(
      expect.objectContaining({ spell: "beam" })
    );
    expect(items).toContainEqual({
      stackable: "resource",
      material: "gold",
      amount: 3,
    });
    expect(items).toContainEqual({
      stackable: name === "haven" ? "arrow" : "charge",
      amount: 20,
    });
  }
});
test("all scenario items have an existing game sprite", () => {
  for (const name of Object.keys(presets) as PresetName[]) {
    const { equipment, items } = getPresetLoadout(name);
    for (const item of [...equipment, ...items])
      expect(getItemSprite(item).name).not.toBe(missing.name);
  }
});

test("Ilex adds the wood wave to the early loadout", () => {
  expect(getPresetLoadout("ilex").equipment).toContainEqual(
    expect.objectContaining({ spell: "wave", material: "wood" })
  );
});

test("Dungeon starts empty-handed at level one in the real tutorial", () => {
  const world = createPresetWorld("dungeon"),
    hero = assertHero(world);
  expect(world.metadata.gameEntity[LEVEL].name).toBe("LEVEL_TUTORIAL");
  expect(hero.EQUIPPABLE).toEqual({});
  expect(hero.INVENTORY?.items).toEqual([]);
  expect(hero.STATS?.level).toBe(1);
  expect(hero.STATS?.hp).toBeGreaterThan(0);
});
test("Bandit preset starts inside the boss room with its tutorial sword", () => {
  const world = createPresetWorld("bandit"),
    hero = assertHero(world);
  advance(world, 500);
  expect(hero.EQUIPPABLE?.weapon).toBeDefined();
  expect(hero.EQUIPPABLE?.offhand).toBeUndefined();
  expect(hero.STATS?.level).toBe(1);
  expect(hero.POSITION.y).toBe(
    normalize(up4Center.y + 4, world.metadata.gameEntity[LEVEL].size)
  );
});
