import {
  act,
  advance,
  advanceUntil,
  assertHero,
  face,
  giveItems,
  holdMove,
  step,
  walk,
} from "../../testing/harness";
import { saveAndLoad } from "../../testing/saves";
import { World } from "../../engine";
import { AFFECTABLE } from "../../engine/components/affectable";
import { INVENTORY } from "../../engine/components/inventory";
import { PLAYER } from "../../engine/components/player";
import { POSITION } from "../../engine/components/position";
import { RECHARGABLE } from "../../engine/components/rechargable";
import { SHOOTABLE } from "../../engine/components/shootable";
import { SPAWNABLE } from "../../engine/components/spawnable";
import { STATS } from "../../engine/components/stats";
import { applyEffects, isDead } from "../../engine/systems/damage";
import { isFrozen } from "../../engine/systems/freeze";
import { getLevelStats } from "../../engine/systems/leveling";
import { getSequence } from "../../engine/systems/sequence";
import { attackUntil, createCombatWorld, getUnit } from "../combat/helpers";
import { countAllLoot } from "../skills/helpers";

// ♀ hero, U unit
const area = `
|           |
| ♀ U       |
|           |
`;

// ♀ hero, * campfire
const campfire = `
|         |
| ♀ *     |
|         |
`;

const getHero = (world: World) =>
  world.assertComponents(assertHero(world), [
    AFFECTABLE,
    INVENTORY,
    PLAYER,
    POSITION,
    STATS,
  ]);

const getTarget = (world: World, targetId: number) =>
  world.assertByIdAndComponents(targetId, [
    AFFECTABLE,
    POSITION,
    RECHARGABLE,
    SHOOTABLE,
    STATS,
  ]);

const setupTarget = (unit: string) => {
  const { world, hero } = createCombatWorld(area, { U: unit }, 20);
  const targetId = world.getEntityId(getUnit(world, area, "U"));
  return { world, hero, targetId };
};

const burnDummy = () => {
  const { world, hero, targetId } = setupTarget("dummy");
  walk(world, "right");
  giveItems(world, hero, [
    { weapon: "sword", material: "wood", element: "fire", amount: 1 },
  ]);
  const dummy = getTarget(world, targetId);
  attackUntil(world, "right", () => dummy[STATS].hp < 25);
  return { world, targetId };
};

const recordHp = (world: World, targetId: number, frames: number) =>
  Array.from({ length: frames }, () => {
    step(world);
    return getTarget(world, targetId)[STATS].hp;
  });

describe("saved combat", () => {
  it("keeps burning a unit for the same damage over time", () => {
    const unsaved = burnDummy();
    const saved = burnDummy();
    const loaded = saveAndLoad(saved.world);
    const dummy = getTarget(loaded, saved.targetId);
    expect(dummy[AFFECTABLE].burn).toBe(3);

    expect(recordHp(loaded, saved.targetId, 150)).toEqual(
      recordHp(unsaved.world, unsaved.targetId, 150)
    );
    expect(dummy[AFFECTABLE].burn).toBe(0);
    expect(dummy[STATS].hp).toBe(20);
  });

  it("keeps burning the hero after leaving a fire until it ends", () => {
    const leaveFire = () => {
      const { world } = createCombatWorld(campfire, {}, 20);
      walk(world, "right", 3);
      return world;
    };
    const recordBurn = (world: World) =>
      Array.from({ length: 150 }, () => {
        step(world);
        const hero = getHero(world);
        return [hero[STATS].hp, hero[AFFECTABLE].burn];
      });
    const unsaved = leaveFire();
    const loaded = saveAndLoad(leaveFire());
    const hero = getHero(loaded);
    const hp = hero[STATS].hp;
    expect(hero[AFFECTABLE].burn).toBeGreaterThan(0);

    expect(recordBurn(loaded)).toEqual(recordBurn(unsaved));
    expect(hero[AFFECTABLE].burn).toBe(0);
    expect(hero[STATS].hp).toBeLessThan(hp);
  });

  it("thaws a frozen hero to walk again", () => {
    const { world, hero } = createCombatWorld(area);
    applyEffects(world, hero, 0, 2);

    const loaded = saveAndLoad(world);
    const loadedHero = assertHero(loaded);
    expect(isFrozen(loaded, loadedHero)).toBe(true);

    holdMove(loaded, ["right"]);
    step(loaded, 15);
    expect(loadedHero[POSITION]).toEqual({ x: 1, y: 1 });

    advanceUntil(loaded, () => loadedHero[POSITION].x > 1);
    holdMove(loaded, []);
    expect(isFrozen(loaded, loadedHero)).toBe(false);
  });

  it("keeps fractional hp of a hit unit for the following hits", () => {
    const hit = () => {
      const { world, hero, targetId } = setupTarget("dummy");
      getTarget(world, targetId)[STATS].armor = 3;
      walk(world, "right");
      giveItems(world, hero, [
        { weapon: "sword", material: "wood", amount: 1 },
      ]);
      const dummy = getTarget(world, targetId);
      attackUntil(world, "right", () => dummy[STATS].hp < dummy[STATS].maxHp);
      return { world, targetId };
    };
    const unsaved = hit();
    const saved = hit();
    const loaded = saveAndLoad(saved.world);
    const hp = getTarget(loaded, saved.targetId)[STATS].hp;
    expect(hp % 1).not.toBe(0);

    holdMove(loaded, ["right"]);
    holdMove(unsaved.world, ["right"]);
    expect(recordHp(loaded, saved.targetId, 120)).toEqual(
      recordHp(unsaved.world, unsaved.targetId, 120)
    );
    expect(getTarget(loaded, saved.targetId)[STATS].hp).toBeLessThan(hp);
  });

  it("finishes a level up and collects xp of a defeated unit", () => {
    const { world, hero } = createCombatWorld(area, { U: "prism" });
    world.assertComponents(hero, [SPAWNABLE])[SPAWNABLE].classKey = "knight";
    Object.assign(hero[STATS], getLevelStats("knight", 1));
    hero[STATS].hp = hero[STATS].maxHp;
    hero[STATS].xp = 12;
    const prismId = world.getEntityId(getUnit(world, area, "U"));
    advanceUntil(world, () => !!getSequence(world, hero, "progress"));
    const { maxHp } = hero[STATS];

    const loaded = saveAndLoad(world);
    const loadedHero = getHero(loaded);
    advanceUntil(loaded, () => loadedHero[STATS].level === 2);
    step(loaded, 60);

    expect(loadedHero[STATS]).toEqual(
      expect.objectContaining({
        level: 2,
        xp: 2,
        maxXp: 15,
        maxHp: maxHp + 1,
        hp: maxHp + 1,
      })
    );

    const prism = loaded.assertById(prismId);
    walk(loaded, "right");
    giveItems(loaded, loadedHero, [
      { weapon: "sword", material: "iron", amount: 1 },
    ]);
    attackUntil(loaded, "right", () => isDead(loaded, prism));
    advanceUntil(loaded, () => loadedHero[STATS].xp === 3);
    step(loaded, 60);

    expect(loadedHero[STATS].level).toBe(2);
    expect(loadedHero[PLAYER].defeatedUnits).toEqual({ prism: 1 });
  });

  it("drops arrows that were stuck in a target before saving", () => {
    const { world, hero, targetId } = setupTarget("dummy");
    giveItems(world, hero, [
      { skill: "bow", material: "ruby", amount: 1 },
      { stackable: "arrow", amount: 3 },
    ]);
    face(world, "right");
    act(world, "skill");
    advance(world, 1000);
    expect(getTarget(world, targetId)[SHOOTABLE].shots).toBe(1);

    const loaded = saveAndLoad(world);
    const target = getTarget(loaded, targetId);
    face(loaded, "right");
    act(loaded, "skill");
    advanceUntil(loaded, () => isDead(loaded, target), 2000);
    advance(loaded, 3000);

    expect(countAllLoot(loaded, { stackable: "arrow" })).toBe(2);
    expect(countAllLoot(loaded, { stackable: "coin" })).toBe(1);
  });

  it("drops a charge for a melee hit before saving", () => {
    const { world, hero, targetId } = setupTarget("dummy");
    walk(world, "right");
    giveItems(world, hero, [
      { weapon: "sword", material: "wood", amount: 1 },
      { skill: "bow", material: "ruby", amount: 1 },
      { stackable: "arrow", amount: 2 },
      { skill: "slash", material: "wood", amount: 1 },
    ]);
    const dummy = getTarget(world, targetId);
    attackUntil(world, "right", () => dummy[STATS].hp < dummy[STATS].maxHp);
    expect(dummy[RECHARGABLE].hit).toBe(true);

    const loaded = saveAndLoad(world);
    const target = getTarget(loaded, targetId);
    face(loaded, "right");
    act(loaded, "skill");
    advance(loaded, 1000);
    act(loaded, "skill");
    advanceUntil(loaded, () => isDead(loaded, target), 2000);
    advance(loaded, 3000);

    expect(countAllLoot(loaded, { stackable: "charge" })).toBe(1);
    expect(countAllLoot(loaded, { stackable: "arrow" })).toBe(2);
  });
});
