import {
  act,
  countItems,
  findEntityAt,
  getEntitiesAt,
  step,
  walk,
} from "../../testing/harness";
import { getBumpMotion, sampleMotion } from "../../engine/motion";
import { playedSounds } from "../../testing/env";
import { World } from "../../engine";
import { CONDITIONABLE } from "../../engine/components/conditionable";
import { FARMABLE } from "../../engine/components/farmable";
import { HARVESTABLE } from "../../engine/components/harvestable";
import { IMMERSIBLE } from "../../engine/components/immersible";
import { Material } from "../../engine/components/item";
import { POSITION, Position } from "../../engine/components/position";
import { getHarvestConfig } from "../../game/balancing/harvesting";
import { getEquipmentStats } from "../../game/balancing/equipment";
import { GivenItem } from "../../testing/harness";
import {
  collectAdjacentLoot,
  findLoot,
  getLootItems,
  getResource,
  setupTools,
} from "./helpers";

const sword = { weapon: "sword", material: "wood", amount: 1 } as const;

/** Step onto the cell right of the spawn and dig there. */
const digOn = (
  area: string,
  material: Material,
  legend?: Record<string, string>,
  items: GivenItem[] = []
) => {
  const { world, hero } = setupTools(
    area,
    [sword, { tool: "shovel", material, amount: 1 }, ...items],
    legend
  );
  walk(world, "right");
  step(world, 10);
  const position = { ...hero[POSITION] };
  act(world, "skill");
  step(world, 30);
  return { world, hero, position };
};

const getSoil = (world: World, position: Position) =>
  findEntityAt(world, position, [FARMABLE]);

const isWater = (world: World, position: Position) =>
  getEntitiesAt(world, position).some((entity) => IMMERSIBLE in entity);

// ♀ hero, ░ sand, ▒ path, ~ shallow water, B beach, S stump or soil
const ground = (cell: string) => `
|       |
| ♀${cell.padEnd(5)}|
|       |
`;

describe("shovel", () => {
  it("digs dry soil into empty ground", () => {
    const { world, hero, position } = digOn(ground(" "), "wood");

    expect(getSoil(world, position)?.[FARMABLE].watered).toBe(false);
    expect(hero[CONDITIONABLE].shovel).toBeUndefined();
    expect(playedSounds).toContain("dig");
    const bump = getBumpMotion(hero)!;
    expect(bump).toBeDefined();
    expect(sampleMotion(bump, bump.startedAt).y).toBeCloseTo(0.225);
  });

  it("digs wet soil close to water", () => {
    const { world, position } = digOn(
      `
|       |
| ♀  ~  |
|       |
`,
      "wood"
    );

    expect(getSoil(world, position)?.[FARMABLE].watered).toBe(true);
  });

  it("fills up unplanted soil again", () => {
    const { world, position } = digOn(ground("S"), "wood", { S: "soil" });

    expect(getSoil(world, position)).toBeUndefined();
  });

  it.each([
    ["grass", ","],
    ["stump", "S"],
  ] as const)("digs up %s and drops its yield", (resource, char) => {
    const { world, hero, position } = digOn(ground(char), "wood", {
      S: "stump",
    });
    const { yields } = getHarvestConfig(resource);

    expect(getResource(world, position)).toBeUndefined();
    expect(getLootItems(world, findLoot(world))).toEqual(yields);

    collectAdjacentLoot(world);

    expect(countItems(world, hero, { stackable: yields[0].stackable })).toBe(
      yields[0].amount
    );
  });

  it.each([
    ["sand", "░"],
    ["path", "▒"],
  ] as const)("can't dig %s with a wood shovel", (resource, char) => {
    const { world, hero, position } = digOn(ground(char), "wood");

    expect(hero[CONDITIONABLE].shovel).toBeUndefined();
    expect(getResource(world, position)?.[HARVESTABLE]).toMatchObject({
      resource,
      amount: getHarvestConfig(resource).harvestable.maximum,
    });
    expect(playedSounds).not.toContain("dig");
  });

  it.each([
    ["sand", "░"],
    ["path", "▒"],
  ] as const)("digs %s with an iron shovel", (resource, char) => {
    const { world, hero, position } = digOn(ground(char), "iron");
    const { yields } = getHarvestConfig(resource);

    expect(getResource(world, position)).toBeUndefined();

    collectAdjacentLoot(world);

    expect(countItems(world, hero, { stackable: yields[0].stackable })).toBe(
      yields[0].amount
    );
  });

  it("applies the farming stat of the shovel material", () => {
    const { world, hero } = setupTools(ground(" "), [
      { tool: "shovel", material: "gold", amount: 1 },
    ]);

    act(world, "skill");

    expect(hero[CONDITIONABLE].shovel).toMatchObject({
      amount: getEquipmentStats({ tool: "shovel", material: "gold" }).farming,
    });
  });

  it("leaves a beach when digging up a path next to water", () => {
    const { world, position } = digOn(ground("▒~"), "iron");

    expect(getResource(world, position)?.[HARVESTABLE].resource).toBe("beach");
    expect(isWater(world, position)).toBe(false);
  });

  it("digs a trench into sand next to water", () => {
    const { world, position } = digOn(ground("░~"), "iron");

    expect(isWater(world, position)).toBe(true);
    expect(getResource(world, position)).toBeUndefined();
    expect(
      getResource(world, { x: position.x, y: position.y - 1 })?.[HARVESTABLE]
        .resource
    ).toBe("beach");
  });

  it("needs a gold shovel to dig a trench into a beach", () => {
    const iron = digOn(ground("B~"), "iron", { B: "beach" });

    expect(isWater(iron.world, iron.position)).toBe(false);
    expect(iron.hero[CONDITIONABLE].shovel).toBeUndefined();

    const gold = digOn(ground("B~"), "gold", { B: "beach" });

    expect(isWater(gold.world, gold.position)).toBe(true);
  });

  it("fills shallow water next to sand with sand using a gold shovel", () => {
    const { world, hero, position } = digOn(ground("~░"), "gold", undefined, [
      { stackable: "sand", amount: 3 },
    ]);

    expect(isWater(world, position)).toBe(false);
    expect(["sand", "beach"]).toContain(
      getResource(world, position)?.[HARVESTABLE].resource
    );
    expect(countItems(world, hero, { stackable: "sand" })).toBe(0);
  });

  it("can't fill water without enough sand", () => {
    const { world, hero, position } = digOn(ground("~░"), "gold", undefined, [
      { stackable: "sand", amount: 2 },
    ]);

    expect(isWater(world, position)).toBe(true);
    expect(countItems(world, hero, { stackable: "sand" })).toBe(2);
  });
  it("dries up a beach into sand once the water next to it is filled", () => {
    const { world, position } = digOn(ground("~B"), "gold", { B: "beach" }, [
      { stackable: "sand", amount: 3 },
    ]);
    const beach = { x: position.x + 1, y: position.y };

    expect(isWater(world, position)).toBe(false);
    expect(getResource(world, beach)?.[HARVESTABLE].resource).toBe("sand");
  });

  it("turns deep water shallow when filling the water next to it", () => {
    const lake = `
|♀        |
|░~~~~~   |
|░~≈≈≈~   |
|░~~~~~   |
|         |
`;
    const { world } = setupTools(lake, [
      sword,
      { tool: "shovel", material: "gold", amount: 1 },
      { stackable: "sand", amount: 3 },
    ]);
    const getWater = () => findEntityAt(world, { x: 2, y: 2 }, [IMMERSIBLE])!;
    expect(getWater()[IMMERSIBLE].deep).toBe(true);

    walk(world, "down");
    walk(world, "right");
    step(world, 10);
    act(world, "skill");
    step(world, 30);

    expect(isWater(world, { x: 1, y: 1 })).toBe(false);
    expect(getWater()[IMMERSIBLE].deep).toBe(false);
  });
});
