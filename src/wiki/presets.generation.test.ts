import { createPresetWorld, presets, PresetName } from "./presets";
import { assertHero, advanceUntil } from "../testing/harness";
import { getIdentifierAndComponents } from "../engine/utils";
import { getDistance } from "../game/math/std";
import { ITEM } from "../engine/components/item";
import { LEVEL } from "../engine/components/level";
for (const name of [
  "island",
  "earth",
  "ilex",
  "oak",
  "haven",
  "nomad",
] as PresetName[]) {
  test(`${presets[name].title} preset has a playable starting position`, () => {
    const world = createPresetWorld(name),
      hero = assertHero(world);
    expect(world.metadata.gameEntity[LEVEL].name).toBe("LEVEL_ISLAND");
    expect(hero.EQUIPPABLE?.weapon).toBeDefined();
    expect(hero.STATS?.hp).toBeGreaterThan(0);
    expect(hero.POSITION.x).toBeGreaterThanOrEqual(0);
    expect(hero.POSITION.y).toBeGreaterThanOrEqual(0);
  }, 120000);
}

test("Worm Boss preset equips the hero beside the bait and starts the encounter", () => {
  const world = createPresetWorld("worm");
  const hero = assertHero(world);

  const bait = getIdentifierAndComponents(world, "worm_bait", [
    "POSITION",
    "STATS",
  ])!;
  expect(bait.STATS.hp).toBe(1);
  expect(
    getDistance(
      hero.POSITION,
      bait.POSITION,
      world.metadata.gameEntity[LEVEL].size
    )
  ).toBeLessThanOrEqual(1);
  const weapon = world.assertByIdAndComponents(hero.EQUIPPABLE!.weapon!, [
    ITEM,
  ]);
  expect(weapon[ITEM]).toMatchObject({ weapon: "sword", material: "gold" });
  expect(hero.EQUIPPABLE!.spell).toBeDefined();
  expect(hero.EQUIPPABLE!.skill).toBeDefined();
  expect(
    world
      .getEntities([ITEM])
      .some(
        (item) =>
          item[ITEM].carrier === world.getEntityId(hero) &&
          item[ITEM].tool === "pickaxe"
      )
  ).toBe(true);
  bait.STATS.hp = 0;
  advanceUntil(
    world,
    () => !!getIdentifierAndComponents(world, "worm_boss", ["STATS"]),
    30000
  );
}, 120000);

const carried = (world: ReturnType<typeof createPresetWorld>) => {
  const hero = assertHero(world);
  return world
    .getEntities([ITEM])
    .filter((entity) => entity.ITEM.carrier === world.getEntityId(hero))
    .map((entity) => entity.ITEM);
};
test("Dungeon begins empty-handed at level one", () => {
  const world = createPresetWorld("dungeon");
  expect(assertHero(world).STATS?.level).toBe(1);
  expect(carried(world)).toEqual([]);
}, 120000);
test.each([
  ["island", 2],
  ["oak", 4],
  ["worm", 6],
] as const)(
  "%s has its progression equipment and full mana at level %s",
  (name, level) => {
    const world = createPresetWorld(name);
    const hero = assertHero(world);
    expect(hero.STATS?.level).toBe(level);
    expect(hero.STATS?.mp).toBe(hero.STATS?.maxMp);
    const items = carried(world);
    const worm = name === "worm";
    expect(items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          weapon: "sword",
          material: name === "island" ? "wood" : worm ? "gold" : "iron",
        }),
        expect.objectContaining({
          consume: "potion",
          stat: "hp",
          material: worm ? "iron" : "wood",
          amount: name === "island" ? 10 : 20,
        }),
      ])
    );
    if (name === "island") return;
    expect(items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          spell: worm ? "wave" : "beam",
          material: worm ? "iron" : "wood",
          ...(worm ? { element: "earth" } : {}),
        }),
        expect.objectContaining({
          skill: worm ? "block" : "slash",
          material: worm ? "iron" : "wood",
        }),
        expect.objectContaining({
          stackable: "charge",
          amount: worm ? 20 : 10,
        }),
        expect.objectContaining({
          consume: "potion",
          stat: "mp",
          amount: 10,
          material: worm ? "iron" : "wood",
        }),
      ])
    );
  },
  120000
);
