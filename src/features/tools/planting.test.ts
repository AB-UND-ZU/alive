import {
  act,
  advanceUntil,
  countItems,
  findEntityAt,
  GivenItem,
  step,
  walk,
} from "../../testing/harness";
import { playedSounds } from "../../testing/env";
import { World } from "../../engine";
import { ACTIONABLE } from "../../engine/components/actionable";
import { FARMABLE } from "../../engine/components/farmable";
import { HARVESTABLE } from "../../engine/components/harvestable";
import { PLAYER } from "../../engine/components/player";
import { POSITION, Position } from "../../engine/components/position";
import { SPRITE } from "../../engine/components/sprite";
import { getTab } from "../../engine/systems/popup";
import { plantConfigs } from "../../game/balancing/harvesting";
import { sapling1 } from "../../game/assets/sprites";
import {
  collectAdjacentLoot,
  findLoot,
  getLootItems,
  getResource,
  setupTools,
} from "./helpers";

const sword = { weapon: "sword", material: "wood", amount: 1 } as const;
const shovel = { tool: "shovel", material: "wood", amount: 1 } as const;

// ♀ hero, ☼ wet soil, S dry soil
const field = `
|       |
| ♀☼    |
|       |
`;

const getSoil = (world: World, position: Position) =>
  findEntityAt(world, position, [FARMABLE, SPRITE])!;

/** Step onto the wet soil and plant the first seed of the plant menu. */
const plant = (items: GivenItem[]) => {
  const { world, hero } = setupTools(field, [sword, shovel, ...items]);
  walk(world, "right");
  step(world, 10);
  const position = { ...hero[POSITION] };
  act(world, "interact");
  step(world, 30);
  act(world, "right");
  return { world, hero, position, soil: getSoil(world, position) };
};

describe("planting", () => {
  it("offers to plant on soil while holding a shovel", () => {
    const { world, hero } = setupTools(field, [shovel]);

    walk(world, "right");
    step(world, 10);

    expect(hero[ACTIONABLE].plant).toBe(
      world.getEntityId(getSoil(world, hero[POSITION]))
    );
  });

  it("does not offer to plant without a shovel", () => {
    const { world, hero } = setupTools(field, [
      { tool: "axe", material: "wood", amount: 1 },
    ]);

    walk(world, "right");
    step(world, 10);

    expect(hero[ACTIONABLE].plant).toBeUndefined();
  });

  it("opens the plant menu on wet soil", () => {
    const { world, hero } = setupTools(field, [
      shovel,
      { stackable: "berry", amount: 1 },
    ]);

    walk(world, "right");
    step(world, 10);
    act(world, "interact");

    const popup = world.assertById(hero[PLAYER].popup!);
    expect(getTab(world, popup)).toBe("plant");
  });

  it("asks for a bucket of water on dry soil", () => {
    const dry = `
|       |
| ♀S    |
|       |
`;
    const { world, hero } = setupTools(
      dry,
      [shovel, { stackable: "berry", amount: 1 }],
      { S: "soil" }
    );

    walk(world, "right");
    step(world, 10);
    act(world, "interact");

    expect(hero[PLAYER].popup).toBeUndefined();
    expect(playedSounds).toContain("deny");
  });

  it("plants a seed as a sapling and dries the soil", () => {
    const { world, hero, position, soil } = plant([
      { stackable: "berry", amount: 2 },
    ]);
    const sapling = getResource(world, position)!;

    expect(countItems(world, hero, { stackable: "berry" })).toBe(1);
    expect(soil[FARMABLE]).toMatchObject({
      planted: "berry",
      progress: 0,
      watered: false,
    });
    expect(sapling[HARVESTABLE].resource).toBe(plantConfigs.berry!.harvest);
    expect(sapling[SPRITE]).toBe(sapling1);
    expect(hero[ACTIONABLE].plant).toBeUndefined();
    expect(playedSounds).toContain("confirm");
  });

  it("does not water planted soil", () => {
    const { world, hero, soil } = plant([
      { stackable: "berry", amount: 1 },
      { consume: "bucket", material: "iron", element: "water", amount: 1 },
    ]);

    step(world, 30);

    expect(soil[FARMABLE].watered).toBe(false);
    expect(
      countItems(world, hero, { consume: "bucket", element: "water" })
    ).toBe(1);
  });

  it("grows a seed through its sapling stages into a crop", () => {
    const { world, hero, position, soil } = plant([
      { stackable: "spore", amount: 1 },
    ]);
    const sapling = getResource(world, position)!;
    walk(world, "left");

    advanceUntil(world, () => soil[FARMABLE].progress === 1, 60000);
    expect(sapling[SPRITE]).not.toBe(sapling1);

    advanceUntil(world, () => !soil[FARMABLE].planted, 120000);
    step(world, 30);

    expect(getLootItems(world, position)).toEqual([plantConfigs.spore!.crop]);

    collectAdjacentLoot(world);

    expect(countItems(world, hero, { stackable: "shroom" })).toBe(1);
    expect(getSoil(world, position)[FARMABLE].planted).toBeUndefined();
  });

  it("grows a leaf into a hedge that replaces the soil", () => {
    const { world, position, soil } = plant([{ stackable: "leaf", amount: 1 }]);
    walk(world, "left");

    advanceUntil(world, () => !soil[FARMABLE].planted, 180000);
    step(world, 30);

    expect(findEntityAt(world, position, [FARMABLE])).toBeUndefined();
    expect(getResource(world, position)?.[HARVESTABLE].resource).toBe("hedge");
  });

  it("digs up a sapling into its seed and resets the soil", () => {
    const { world, hero, position, soil } = plant([
      { stackable: "berry", amount: 1 },
    ]);

    act(world, "skill");
    step(world, 30);

    expect(soil[FARMABLE].planted).toBeUndefined();
    expect(getLootItems(world, findLoot(world))).toEqual([
      { stackable: "berry", amount: 1 },
    ]);

    collectAdjacentLoot(world);

    expect(countItems(world, hero, { stackable: "berry" })).toBe(1);
    expect(getResource(world, position)).toBeUndefined();
  });
});
