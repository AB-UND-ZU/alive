import {
  act,
  advanceUntil,
  assertHero,
  countItems,
  findEntityAt,
  findInArea,
  getItems,
  holdMove,
  step,
  walk,
} from "../../testing/harness";
import { saveAndLoad } from "../../testing/saves";
import { World } from "../../engine";
import { BAITABLE } from "../../engine/components/baitable";
import { BUILDABLE } from "../../engine/components/buildable";
import { CONDITIONABLE } from "../../engine/components/conditionable";
import { FARMABLE } from "../../engine/components/farmable";
import { HARVESTABLE } from "../../engine/components/harvestable";
import { HOOKABLE } from "../../engine/components/hookable";
import { INVENTORY } from "../../engine/components/inventory";
import { ORIENTABLE } from "../../engine/components/orientable";
import { POSITION, Position } from "../../engine/components/position";
import { STATS } from "../../engine/components/stats";
import { createCell } from "../../bindings/creation";
import { registerEntity } from "../../engine/systems/map";
import { buildConstructions } from "../../game/balancing/building";
import { getEquipmentStats } from "../../game/balancing/equipment";
import { fishingDistributionLevels } from "../../game/balancing/fishing";
import {
  getHarvestConfig,
  plantConfigs,
} from "../../game/balancing/harvesting";
import {
  collectAdjacentLoot,
  collectLoot,
  getLootItems,
  getResource,
  holdUntil,
  setupTools,
  workUntilDepleted,
} from "../tools/helpers";

const sword = { weapon: "sword", material: "wood", amount: 1 } as const;
const shovel = { tool: "shovel", material: "wood", amount: 1 } as const;
const woodAxe = { tool: "axe", material: "wood", amount: 1 } as const;
const woodHammer = { tool: "hammer", material: "wood", amount: 1 } as const;
const woodHook = { tool: "hook", material: "wood", amount: 1 } as const;

// ♀ hero, ☼ wet soil
const field = `
|       |
| ♀☼    |
|       |
`;

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

const soil = findInArea(field, "☼");
const fence = buildConstructions.find((construction) =>
  construction.variants.some((variant) => variant.cell === "fence")
)!;

const getSoil = (world: World) => findEntityAt(world, soil, [FARMABLE])!;

const getPlot = (world: World, position: Position) =>
  findEntityAt(world, position, [BUILDABLE, STATS]);

const getBait = (world: World) => world.getEntities([BAITABLE, POSITION])[0];

const isHooked = (world: World) =>
  world
    .getEntities([HOOKABLE])
    .some((entity) => entity[HOOKABLE].hooked !== undefined);

const getTools = (world: World) =>
  world.assertComponents(assertHero(world), [
    CONDITIONABLE,
    INVENTORY,
    ORIENTABLE,
    POSITION,
  ]);

describe("saved tools", () => {
  it("keeps growing a planted seed into a crop", () => {
    const { world } = setupTools(field, [
      sword,
      shovel,
      { stackable: "spore", amount: 1 },
    ]);
    walk(world, "right");
    step(world, 10);
    act(world, "interact");
    step(world, 30);
    act(world, "right");
    walk(world, "left");
    advanceUntil(world, () => getSoil(world)[FARMABLE].progress === 1, 60000);

    const loaded = saveAndLoad(world);
    const hero = getTools(loaded);
    expect(getSoil(loaded)[FARMABLE]).toMatchObject({
      planted: "spore",
      progress: 1,
    });

    advanceUntil(loaded, () => !getSoil(loaded)[FARMABLE].planted, 120000);
    step(loaded, 30);
    expect(getLootItems(loaded, soil)).toEqual([plantConfigs.spore!.crop]);

    collectAdjacentLoot(loaded);
    expect(countItems(loaded, hero, { stackable: "shroom" })).toBe(1);
  });

  it("keeps chopping a tree with an active axe", () => {
    const area = `
|       |
| ♀#    |
|       |
`;
    const { world } = setupTools(area, [sword, woodAxe]);
    const { maximum } = getHarvestConfig("tree").harvestable;
    const resource = getResource(world, { x: 2, y: 1 })!;
    act(world, "skill");
    holdUntil(world, "right", () => resource[HARVESTABLE].amount < maximum);

    const loaded = saveAndLoad(world);
    expect(getTools(loaded)[CONDITIONABLE].axe).toBeDefined();
    const loadedTree = getResource(loaded, { x: 2, y: 1 })!;

    expect(workUntilDepleted(loaded, "right", loadedTree)).toBe(maximum - 1);
  });

  it("finishes hammering a plot with the same number of hits", () => {
    const { world, hero } = setupTools(field, [woodHammer, ...fence.parts]);
    const target = { x: hero[POSITION].x, y: hero[POSITION].y + 1 };
    act(world, "skill");
    step(world, 30);
    const index = buildConstructions.indexOf(fence) + 1;
    for (let line = 0; line < index; line += 1) act(world, "down");
    act(world, "right");
    hero[ORIENTABLE].facing = "down";
    step(world, 30);
    act(world, "interact");
    step(world, 5);
    act(world, "skill");
    const plot = getPlot(world, target)!;
    holdUntil(world, "down", () => plot[STATS].hp > 1);

    const loaded = saveAndLoad(world);
    const loadedPlot = getPlot(loaded, target)!;
    let hits = 1;
    while (loadedPlot[STATS].hp < loadedPlot[STATS].maxHp) {
      const hp = loadedPlot[STATS].hp;
      holdUntil(loaded, "down", () => loadedPlot[STATS].hp !== hp);
      hits += 1;
    }
    advanceUntil(loaded, () => !getPlot(loaded, target), 1000);

    expect(hits).toBe(
      Math.ceil(fence.effort / getEquipmentStats(woodHammer).build)
    );
    expect(getResource(loaded, target)?.[HARVESTABLE].resource).toBe("fence");
  });

  it("reels in a fish biting a bait cast before saving", () => {
    const { world, hero } = setupTools(lake, [
      woodHook,
      { stackable: "worm", amount: 2 },
    ]);
    createCell(world, { x: 7, y: 5 }, "habitat", "hidden", false).all.forEach(
      (entity) => registerEntity(world, entity)
    );
    act(world, "skill");
    holdUntil(world, "right", () => !!hero[CONDITIONABLE].hook?.orientation);
    advanceUntil(world, () => !!getBait(world), 2000);
    holdMove(world, []);

    const loaded = saveAndLoad(world);
    const loadedHero = getTools(loaded);
    expect(getBait(loaded)[POSITION]).toEqual({
      x: getEquipmentStats(woodHook).range,
      y: 5,
    });

    advanceUntil(loaded, () => isHooked(loaded), 30000);
    act(loaded, "skill");
    advanceUntil(loaded, () => !loadedHero[CONDITIONABLE].hook, 3000);
    collectLoot(loaded, "right", { x: 1, y: 5 });

    const catchable = fishingDistributionLevels[
      getEquipmentStats(woodHook).fishing
    ].map(([, fish]) => fish.stackable);
    expect(
      getItems(loaded, loadedHero).filter((item) =>
        catchable.includes(item.stackable)
      )
    ).toEqual([expect.objectContaining({ amount: 1 })]);
    expect(countItems(loaded, loadedHero, { stackable: "worm" })).toBe(1);
  });

  it("returns the worm when stowing a hook readied before saving", () => {
    const { world } = setupTools(lake, [
      woodHook,
      { stackable: "worm", amount: 2 },
    ]);
    act(world, "skill");

    const loaded = saveAndLoad(world);
    const hero = getTools(loaded);
    expect(countItems(loaded, hero, { stackable: "worm" })).toBe(1);
    act(loaded, "skill");

    expect(hero[CONDITIONABLE].hook).toBeUndefined();
    expect(countItems(loaded, hero, { stackable: "worm" })).toBe(2);
  });
});
