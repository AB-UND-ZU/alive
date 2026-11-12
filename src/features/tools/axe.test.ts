import {
  act,
  advanceUntil,
  countItems,
  findInArea,
  getItems,
  holdMove,
  step,
} from "../../testing/harness";
import { getBumpMotion, sampleMotion } from "../../engine/motion";
import { playedSounds } from "../../testing/env";
import { ACTIONABLE } from "../../engine/components/actionable";
import { CONDITIONABLE } from "../../engine/components/conditionable";
import { HARVESTABLE } from "../../engine/components/harvestable";
import { POSITION } from "../../engine/components/position";
import { getHarvestConfig } from "../../game/balancing/harvesting";
import { getEquipmentStats } from "../../game/balancing/equipment";
import {
  collectLoot,
  getLootItems,
  getResource,
  setupTools,
  workUntilDepleted,
} from "./helpers";

// ♀ hero, # tree, ¶ palm, █ mountain
const area = `
|       |
| ♀#    |
|       |
`;
const tree = findInArea(area, "#");
const sword = { weapon: "sword", material: "wood", amount: 1 } as const;
const woodAxe = { tool: "axe", material: "wood", amount: 1 } as const;

describe("axe", () => {
  it("bumps a tree immediately when an axe hit lands", () => {
    const { world } = setupTools(area, [sword, woodAxe]);
    const treeEntity = getResource(world, tree)!;
    const amount = treeEntity[HARVESTABLE].amount;
    act(world, "skill");
    holdMove(world, ["right"]);
    advanceUntil(world, () => treeEntity[HARVESTABLE].amount < amount, 2000);
    holdMove(world, []);
    const bump = getBumpMotion(treeEntity)!;
    expect(bump).toBeDefined();
    expect(bump.startedAt).toBe(world.metadata.elapsed);
    expect(sampleMotion(bump, bump.startedAt).x).toBeCloseTo(0.225);
  });

  it("activates with the skill button when only a tool is equipped", () => {
    const { world, hero } = setupTools(area, [woodAxe]);

    act(world, "skill");

    expect(hero[ACTIONABLE].toolEquipped).toBe(true);
    expect(hero[CONDITIONABLE].axe).toMatchObject({
      amount: getEquipmentStats(woodAxe).logging,
    });
    expect(playedSounds).toContain("tool");
  });

  it("puts the axe away on a second use", () => {
    const { world, hero } = setupTools(area, [woodAxe]);

    act(world, "skill");
    expect(hero[CONDITIONABLE].axe).toBeDefined();
    act(world, "skill");

    expect(hero[CONDITIONABLE].axe).toBeUndefined();
  });

  it("chops a tree with one hit per point of effort using a wood axe", () => {
    const { world } = setupTools(area, [sword, woodAxe]);
    const treeEntity = getResource(world, tree)!;
    const { maximum } = getHarvestConfig("tree").harvestable;

    act(world, "skill");

    expect(treeEntity[HARVESTABLE].amount).toBe(maximum);
    expect(workUntilDepleted(world, "right", treeEntity)).toBe(maximum);
    expect(playedSounds).toContain("harvest");
  });

  it("chops faster with an iron axe", () => {
    const { world } = setupTools(area, [
      sword,
      { tool: "axe", material: "iron", amount: 1 },
    ]);
    const { maximum } = getHarvestConfig("tree").harvestable;
    const { logging } = getEquipmentStats({ tool: "axe", material: "iron" });

    act(world, "skill");

    expect(workUntilDepleted(world, "right", getResource(world, tree)!)).toBe(
      Math.ceil(maximum / logging)
    );
  });

  it("drops the tree yield and leaves a stump", () => {
    const { world, hero } = setupTools(area, [sword, woodAxe]);

    act(world, "skill");
    workUntilDepleted(world, "right", getResource(world, tree)!);
    step(world, 60);

    expect(getLootItems(world, tree)).toEqual(getHarvestConfig("tree").yields);
    expect(getResource(world, tree)?.[HARVESTABLE].resource).toBe("stump");

    collectLoot(world, "right", tree);

    expect(countItems(world, hero, { stackable: "stick" })).toBe(1);
  });

  it("turns the first stick into a wooden sword when unarmed", () => {
    const { world, hero } = setupTools(area, [woodAxe]);

    act(world, "skill");
    workUntilDepleted(world, "right", getResource(world, tree)!);
    collectLoot(world, "right", tree);

    expect(countItems(world, hero, { stackable: "stick" })).toBe(0);
    expect(getItems(world, hero)).toContainEqual(
      expect.objectContaining({ weapon: "sword", material: "wood" })
    );
  });

  it("chops a palm into two sticks and leaves a husk", () => {
    const palmArea = `
|       |
| ♀¶    |
|       |
`;
    const palm = findInArea(palmArea, "¶");
    const { world } = setupTools(palmArea, [sword, woodAxe]);
    const palmEntity = getResource(world, palm)!;

    act(world, "skill");

    expect(workUntilDepleted(world, "right", palmEntity)).toBe(
      getHarvestConfig("palm").harvestable.maximum
    );
    step(world, 60);
    expect(getLootItems(world, palm)).toEqual([
      { stackable: "stick", amount: 2 },
    ]);
    expect(getResource(world, palm)?.[HARVESTABLE].resource).toBe("husk");
  });

  it("chops neighbouring trees at once with the range of a gold axe", () => {
    const grove = `
|       |
| #     |
| ♀#    |
| #     |
`;
    const { world, hero } = setupTools(grove, [
      sword,
      { tool: "axe", material: "gold", amount: 1 },
    ]);
    const { x, y } = hero[POSITION];
    const trees = [
      { x: x + 1, y },
      { x, y: y - 1 },
      { x, y: y + 1 },
    ].map((position) => getResource(world, position)!);

    act(world, "skill");
    workUntilDepleted(world, "right", trees[0]);

    expect(trees.map((entity) => entity[HARVESTABLE].amount)).toEqual([
      0, 0, 0,
    ]);
  });

  it("does not harvest a mountain", () => {
    const rockArea = `
|       |
| ♀█    |
|       |
`;
    const mountain = findInArea(rockArea, "█");
    const { world, hero } = setupTools(rockArea, [sword, woodAxe]);

    act(world, "skill");
    holdMove(world, ["right"]);
    step(world, 60);
    holdMove(world, []);

    expect(getResource(world, mountain)?.[HARVESTABLE].amount).toBe(
      getHarvestConfig("mountain").harvestable.maximum
    );
    expect(hero[POSITION]).toEqual({ x: mountain.x - 1, y: mountain.y });
  });

  it("does not chop without activating the axe", () => {
    const { world, hero } = setupTools(area, [sword, woodAxe]);

    holdMove(world, ["right"]);
    step(world, 60);
    holdMove(world, []);

    expect(hero[CONDITIONABLE].axe).toBeUndefined();
    expect(getResource(world, tree)?.[HARVESTABLE].amount).toBe(
      getHarvestConfig("tree").harvestable.maximum
    );
  });
});
