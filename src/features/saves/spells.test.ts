import {
  advance,
  advanceUntil,
  assertHero,
  step,
  walk,
} from "../../testing/harness";
import { saveAndLoad } from "../../testing/saves";
import { playedSounds } from "../../testing/env";
import { World } from "../../engine";
import { CASTABLE } from "../../engine/components/castable";
import { moveEntity } from "../../engine/systems/map";
import { EXERTABLE } from "../../engine/components/exertable";
import { NPC } from "../../engine/components/npc";
import { POSITION } from "../../engine/components/position";
import { REFERENCE } from "../../engine/components/reference";
import { STATS } from "../../engine/components/stats";
import { getAbilityStats } from "../../game/balancing/abilities";
import {
  cast,
  createSpellWorld,
  getLastMessage,
  getUnit,
  isCasting,
  recordHits,
  waitForSpell,
} from "../spells/helpers";

const wave = { spell: "wave", material: "wood" } as const;
const trap = { spell: "trap", material: "wood" } as const;

// A, B, C and E dummies around the hero
const field = `
|         |
|    A    |
|         |
|         |
|B   ♀   C|
|         |
|      E  |
|         |
|         |
`;
const legend = { A: "dummy", B: "dummy", C: "dummy", E: "dummy" };
const dummies = ["A", "B", "C", "E"];

// prism bounces along the closed corridor, hero leaves through the gap
const corridor = `
|███████████|
|█◀    ♀   █|
|██████ ████|
|           |
`;

const getStats = (world: World) =>
  world.assertComponents(assertHero(world), [STATS]);

const getTrapAreas = (world: World) =>
  world.getEntities([EXERTABLE, POSITION]).map((area) => area[POSITION]);

const getPrism = (world: World) =>
  world
    .getEntities([NPC, STATS, POSITION])
    .find((entity) => entity[NPC].type === "prism")!;

const castWave = () => {
  const { world } = createSpellWorld(field, wave, { legend, size: 20 });
  const unitIds = dummies.map((char) =>
    world.getEntityId(getUnit(world, field, char))
  );
  cast(world, "up");
  return { world, unitIds };
};

const recordUnitHits = (world: World, unitIds: number[], frames: number) =>
  recordHits(
    world,
    unitIds.map((unitId) => world.assertByIdAndComponents(unitId, [STATS])),
    frames
  );

const placeTrap = () => {
  const { world } = createSpellWorld(corridor, trap, { size: 20 });
  const prism = getPrism(world);
  prism[STATS].maxHp = 99;
  prism[STATS].hp = 99;
  cast(world, "down");
  walk(world, "down", 2);
  return world;
};

describe("saved spells", () => {
  it("keeps spreading a cast wave to hit every unit once", () => {
    const unsaved = castWave();
    const saved = castWave();
    const before = recordUnitHits(saved.world, saved.unitIds, 3);
    const loaded = saveAndLoad(saved.world);
    const after = recordUnitHits(loaded, saved.unitIds, 117);

    expect(before.map((hits, index) => [...hits, ...after[index]])).toEqual(
      recordUnitHits(unsaved.world, unsaved.unitIds, 120)
    );
    expect(after.flat()).toContain(getAbilityStats(wave).magic);
  });

  it("refuses a channeled spell while active and casts it again after it ended", () => {
    const { world } = castWave();

    const loaded = saveAndLoad(world);
    const hero = getStats(loaded);
    expect(hero[STATS].mp).toBe(4);
    expect(isCasting(loaded, hero)).toBe(true);

    cast(loaded, "up");
    expect(getLastMessage(loaded, hero)).toBe("Not ready!");
    expect(hero[STATS].mp).toBe(4);

    waitForSpell(loaded, hero);
    cast(loaded, "up");
    expect(hero[STATS].mp).toBe(3);
    expect(isCasting(loaded, hero)).toBe(true);
  });

  it("triggers an armed trap once when a hostile unit steps on it", () => {
    const world = placeTrap();
    const prismId = world.getEntityId(getPrism(world));
    expect(getTrapAreas(world)).toHaveLength(9);

    const loaded = saveAndLoad(world);
    const prism = loaded.assertByIdAndComponents(prismId, [STATS]);
    const [hits] = recordHits(loaded, [prism], 120);

    expect(hits).toEqual([getAbilityStats(trap).magic]);
    expect(getTrapAreas(loaded)).toEqual([]);
    expect(isCasting(loaded, assertHero(loaded))).toBe(false);
    expect(playedSounds.filter((sound) => sound === "trap")).toHaveLength(2);
    expect(recordHits(loaded, [prism], 300)).toEqual([[]]);
  });

  it.each([200, 700])(
    "keeps a triggered trap's remaining lifetime after saving at %ims",
    (elapsed) => {
      const area = `
|       |
| ♀  D  |
|       |
|       |
`;
      const { world, hero } = createSpellWorld(area, trap);
      const enemy = getUnit(world, area, "D");
      enemy[STATS].maxHp = 99;
      enemy[STATS].hp = 99;
      const enemyId = world.getEntityId(enemy);
      const center = { ...hero[POSITION] };
      cast(world, "down");
      walk(world, "down", 2);
      advance(world, 5000);
      moveEntity(world, enemy, center);
      advanceUntil(world, () =>
        world
          .getEntities([CASTABLE])
          .some((entity) => entity[CASTABLE].trigger?.frame !== undefined)
      );
      advance(world, elapsed);
      const hp = enemy[STATS].hp;

      const loaded = saveAndLoad(world);
      const restoredEnemy = loaded.assertByIdAndComponents(enemyId, [STATS]);
      expect(restoredEnemy[STATS].hp).toBe(hp);
      const [hits] = recordHits(loaded, [restoredEnemy], 60);
      expect(hits).toEqual(elapsed < 500 ? [getAbilityStats(trap).magic] : []);
      expect(getTrapAreas(loaded)).toEqual([]);
      expect(isCasting(loaded, assertHero(loaded))).toBe(false);
    }
  );

  it("removes a trap after its duration", () => {
    const area = `
|       |
| ♀     |
|       |
`;
    const { world } = createSpellWorld(area, trap);
    const { duration } = getAbilityStats(trap);
    const tick = world.metadata.gameEntity[REFERENCE].tick;
    cast(world, "right");
    walk(world, "right", 1);
    advance(world, tick * (duration / 2));

    const loaded = saveAndLoad(world);
    advance(loaded, tick * (duration / 2 - 5));
    expect(getTrapAreas(loaded)).toHaveLength(9);

    advance(loaded, tick * 7);
    step(loaded);
    expect(getTrapAreas(loaded)).toEqual([]);
    expect(isCasting(loaded, assertHero(loaded))).toBe(false);
  });
});
