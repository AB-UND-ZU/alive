import {
  act,
  advance,
  advanceUntil,
  assertHero,
  countItems,
  face,
  holdMove,
} from "../../testing/harness";
import { saveAndLoad } from "../../testing/saves";
import { World } from "../../engine";
import { CASTABLE } from "../../engine/components/castable";
import { CONDITIONABLE } from "../../engine/components/conditionable";
import { EXERTABLE } from "../../engine/components/exertable";
import { INVENTORY } from "../../engine/components/inventory";
import { ORIENTABLE } from "../../engine/components/orientable";
import { POSITION } from "../../engine/components/position";
import { SHOOTABLE } from "../../engine/components/shootable";
import { STATS } from "../../engine/components/stats";
import { getPendingTotem } from "../../engine/systems/action";
import { getEntityStats, isDead } from "../../engine/systems/damage";
import {
  countAllLoot,
  getProjectiles,
  getUnit,
  setupHero,
} from "../skills/helpers";

// ♀ hero, A and B dummies
const field = `
|            |
| ♀A   B     |
|            |
`;

// prism walks left along the corridor and attacks the hero
const corridor = `
|██████|
|█♀  ◀█|
|██████|
`;

const open = `
|               |
|               |
|               |
|       ♀       |
|               |
|               |
|               |
`;

const getSkilled = (world: World) =>
  world.assertComponents(assertHero(world), [
    CONDITIONABLE,
    INVENTORY,
    POSITION,
    STATS,
  ]);

const getTotems = (world: World) =>
  world
    .getEntities([CASTABLE, EXERTABLE, POSITION, STATS])
    .filter((entity) => !isDead(world, entity));

describe("saved skills", () => {
  it("keeps a bubble absorbing hits until it pops", () => {
    const { world, hero } = setupHero(corridor, [
      { skill: "block", material: "iron", amount: 1 },
      { stackable: "charge", amount: 1 },
    ]);
    getUnit(world, corridor, "◀")[ORIENTABLE].facing = "left";
    act(world, "skill");
    expect(hero[CONDITIONABLE].block?.amount).toBe(2);

    const loaded = saveAndLoad(world);
    const loadedHero = getSkilled(loaded);
    advanceUntil(loaded, () => !loadedHero[CONDITIONABLE].block, 3000);
    expect(loadedHero[STATS].hp).toBe(loadedHero[STATS].maxHp);

    advanceUntil(
      loaded,
      () => loadedHero[STATS].hp < loadedHero[STATS].maxHp,
      3000
    );
  });

  it("lets a bubble fade after its duration", () => {
    const { world } = setupHero(open, [
      { skill: "block", material: "wood", amount: 1 },
      { stackable: "charge", amount: 2 },
    ]);
    act(world, "skill");
    advance(world, 1000);

    const loaded = saveAndLoad(world);
    const hero = getSkilled(loaded);
    act(loaded, "skill");
    expect(countItems(loaded, hero, { stackable: "charge" })).toBe(1);

    advance(loaded, 1500);
    expect(hero[CONDITIONABLE].block).toBeDefined();
    advance(loaded, 1500);
    expect(hero[CONDITIONABLE].block).toBeUndefined();
  });

  it("discharges a loaded zap on the next melee hit", () => {
    const { world, hero } = setupHero(
      field,
      [
        { weapon: "sword", material: "wood", amount: 1 },
        { skill: "zap", material: "iron", amount: 1 },
        { stackable: "charge", amount: 1 },
      ],
      { legend: { A: "dummy", B: "dummy" } }
    );
    const struckId = world.getEntityId(getUnit(world, field, "A"));
    const nearbyId = world.getEntityId(getUnit(world, field, "B"));
    act(world, "skill");
    expect(hero[CONDITIONABLE].zap?.amount).toBe(2);

    const loaded = saveAndLoad(world);
    const loadedHero = getSkilled(loaded);
    const struck = loaded.assertByIdAndComponents(struckId, [STATS]);
    const nearby = loaded.assertByIdAndComponents(nearbyId, [STATS]);
    holdMove(loaded, ["right"]);
    advanceUntil(loaded, () => struck[STATS].hp < struck[STATS].maxHp);
    holdMove(loaded, []);
    advance(loaded, 500);

    expect(struck[STATS].hp).toBe(struck[STATS].maxHp - 2 - 3);
    expect(nearby[STATS].hp).toBe(nearby[STATS].maxHp - 3);
    expect(loadedHero[CONDITIONABLE].zap).toBeUndefined();
  });

  it("lets a loaded zap fade after its duration", () => {
    const { world } = setupHero(open, [
      { skill: "zap", material: "wood", amount: 1 },
      { stackable: "charge", amount: 1 },
    ]);
    act(world, "skill");
    advance(world, 6000);

    const loaded = saveAndLoad(world);
    const hero = getSkilled(loaded);
    advance(loaded, 6000);
    expect(hero[CONDITIONABLE].zap).toBeDefined();
    advance(loaded, 1000);
    expect(hero[CONDITIONABLE].zap).toBeUndefined();
  });

  it("raises a rising totem whose aura ends when it crumbles", () => {
    const { world, hero } = setupHero(
      open,
      [
        { skill: "totem", material: "wood", amount: 1 },
        { stackable: "charge", amount: 2 },
      ],
      { size: 16 }
    );
    const before = getEntityStats(world, hero);
    face(world, "right");
    act(world, "skill");
    expect(getPendingTotem(world, hero)).toBeDefined();

    const loaded = saveAndLoad(world);
    const loadedHero = getSkilled(loaded);
    act(loaded, "skill");
    expect(getTotems(loaded)).toHaveLength(1);
    expect(countItems(loaded, loadedHero, { stackable: "charge" })).toBe(1);

    advanceUntil(loaded, () => !getPendingTotem(loaded, loadedHero), 2000);
    advance(loaded, 100);
    expect(getEntityStats(loaded, loadedHero).power).toBe(before.power + 1);

    const [totem] = getTotems(loaded);
    advanceUntil(loaded, () => isDead(loaded, totem), 5000);
    advance(loaded, 1000);
    expect(getEntityStats(loaded, loadedHero).power).toBe(before.power);
  });

  it("hits a target with an arrow in flight and drops it on the kill", () => {
    const area = `
|              |
| ♀      A     |
|              |
`;
    const { world } = setupHero(
      area,
      [
        { skill: "bow", material: "ruby", amount: 1 },
        { stackable: "arrow", amount: 2 },
      ],
      { legend: { A: "dummy" } }
    );
    const targetId = world.getEntityId(getUnit(world, area, "A"));
    face(world, "right");
    act(world, "skill");
    expect(getProjectiles(world)).toHaveLength(1);

    const loaded = saveAndLoad(world);
    const target = loaded.assertByIdAndComponents(targetId, [SHOOTABLE, STATS]);
    expect(getProjectiles(loaded)).toHaveLength(1);
    advanceUntil(loaded, () => getProjectiles(loaded).length === 0, 2000);
    expect(target[SHOOTABLE].shots).toBe(1);
    expect(target[STATS].hp).toBeLessThan(target[STATS].maxHp);

    face(loaded, "right");
    act(loaded, "skill");
    advanceUntil(loaded, () => isDead(loaded, target), 2000);
    advance(loaded, 3000);
    expect(countAllLoot(loaded, { stackable: "arrow" })).toBe(2);
  });

  it("drops a missed arrow in flight at the end of its range", () => {
    const { world } = setupHero(
      open,
      [
        { skill: "bow", material: "wood", amount: 1 },
        { stackable: "arrow", amount: 1 },
      ],
      { size: 30 }
    );
    face(world, "right");
    act(world, "skill");

    const loaded = saveAndLoad(world);
    advanceUntil(loaded, () => getProjectiles(loaded).length === 0, 3000);
    advance(loaded, 1000);
    expect(countAllLoot(loaded, { stackable: "arrow" })).toBe(1);
  });
});
