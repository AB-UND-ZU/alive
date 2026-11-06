import {
  act,
  advanceUntil,
  assertHero,
  countItems,
  getItems,
  holdMove,
  step,
} from "../../testing/harness";
import { playedSounds } from "../../testing/env";
import { World } from "../../engine";
import { BAITABLE } from "../../engine/components/baitable";
import { CONDITIONABLE } from "../../engine/components/conditionable";
import { HOOKABLE } from "../../engine/components/hookable";
import { POSITION } from "../../engine/components/position";
import { registerEntity } from "../../engine/systems/map";
import { createCell } from "../../bindings/creation";
import { fishingDistributionLevels } from "../../game/balancing/fishing";
import { getEquipmentStats } from "../../game/balancing/equipment";
import { collectLoot, holdUntil, setupTools } from "./helpers";

const woodHook = { tool: "hook", material: "wood", amount: 1 } as const;
const worms = { stackable: "worm", amount: 2 } as const;

// ♀ hero on the shore of a deep lake, █ mountain
const lake = `
|≈≈≈≈≈≈≈≈≈≈≈≈|
|≈≈≈≈≈≈≈≈≈≈≈≈|
|≈≈≈≈≈≈≈≈≈≈≈≈|
|≈≈≈≈≈≈≈≈≈≈≈≈|
|≈≈≈≈≈≈≈≈≈≈≈≈|
|♀ ≈≈≈≈≈≈≈≈≈≈|
|≈≈≈≈≈≈≈≈≈≈≈≈|
|≈≈≈≈≈≈≈≈≈≈≈≈|
|≈≈≈≈≈≈≈≈≈≈≈≈|
|≈≈≈≈≈≈≈≈≈≈≈≈|
|≈≈≈≈≈≈≈≈≈≈≈≈|
|≈≈≈≈≈≈≈≈≈≈≈≈|
`;

const getBait = (world: World) => world.getEntities([BAITABLE, POSITION])[0];

/** Fish only spawn from habitats below the water surface. */
const addHabitat = (world: World, position: { x: number; y: number }) =>
  createCell(world, position, "habitat", "hidden", false).all.forEach(
    (entity) => registerEntity(world, entity)
  );

const cast = (world: World) => {
  const hero = world.assertComponents(assertHero(world), [CONDITIONABLE]);
  act(world, "skill");
  holdUntil(world, "right", () => !!hero[CONDITIONABLE].hook?.orientation);
  advanceUntil(world, () => !!getBait(world), 2000);
};

describe("hook", () => {
  it("needs a worm as bait", () => {
    const { world, hero } = setupTools(lake, [woodHook]);

    act(world, "skill");

    expect(hero[CONDITIONABLE].hook).toBeUndefined();
    expect(playedSounds).toContain("deny");
  });

  it("takes a worm when readying the hook and returns it when stowed", () => {
    const { world, hero } = setupTools(lake, [woodHook, worms]);

    act(world, "skill");

    expect(hero[CONDITIONABLE].hook).toMatchObject({
      modifier: getEquipmentStats(woodHook).range,
    });
    expect(countItems(world, hero, { stackable: "worm" })).toBe(1);

    act(world, "skill");

    expect(hero[CONDITIONABLE].hook).toBeUndefined();
    expect(countItems(world, hero, { stackable: "worm" })).toBe(2);
  });

  it("casts the bait in the pressed direction up to the hook range", () => {
    const { world, hero } = setupTools(lake, [woodHook, worms]);
    const { range } = getEquipmentStats(woodHook);

    cast(world);

    expect(hero[POSITION]).toEqual({ x: 0, y: 5 });
    expect(getBait(world)[POSITION]).toEqual({ x: range, y: 5 });
  });

  it("stops the line in front of an obstacle", () => {
    const { world } = setupTools(
      `
|        |
|♀  █    |
|        |
`,
      [woodHook, worms]
    );

    cast(world);

    expect(getBait(world)[POSITION]).toEqual({ x: 2, y: 1 });
  });

  it("loses the worm when reeling in without a bite", () => {
    const { world, hero } = setupTools(lake, [woodHook, worms]);

    cast(world);
    step(world, 30);
    act(world, "skill");
    advanceUntil(world, () => !hero[CONDITIONABLE].hook, 3000);

    expect(getBait(world)).toBeUndefined();
    expect(countItems(world, hero, { stackable: "worm" })).toBe(1);
  });

  it("reels in a fish from a habitat near the bait", () => {
    const { world, hero } = setupTools(lake, [woodHook, worms]);
    addHabitat(world, { x: 7, y: 5 });

    cast(world);
    holdMove(world, []);
    advanceUntil(
      world,
      () =>
        world
          .getEntities([HOOKABLE])
          .some((entity) => entity[HOOKABLE].hooked !== undefined),
      30000
    );
    expect(playedSounds).toContain("fish");

    act(world, "skill");
    advanceUntil(world, () => !hero[CONDITIONABLE].hook, 3000);
    collectLoot(world, "right", { x: 1, y: 5 });

    const catchable = fishingDistributionLevels[
      getEquipmentStats(woodHook).fishing
    ].map(([, fish]) => fish.stackable);
    const caught = getItems(world, hero).filter((item) =>
      catchable.includes(item.stackable)
    );
    expect(caught).toEqual([expect.objectContaining({ amount: 1 })]);
  });
});
