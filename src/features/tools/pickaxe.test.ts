import {
  act,
  countItems,
  findInArea,
  holdMove,
  step,
} from "../../testing/harness";
import { CONDITIONABLE } from "../../engine/components/conditionable";
import { HARVESTABLE } from "../../engine/components/harvestable";
import { POSITION } from "../../engine/components/position";
import { getHarvestConfig } from "../../game/balancing/harvesting";
import { getEquipmentStats } from "../../game/balancing/equipment";
import {
  collectLoot,
  getLootItems,
  getResource,
  holdUntil,
  setupTools,
  workUntilDepleted,
} from "./helpers";

// ♀ hero, █ mountain, I iron mine, G gold mine, O ore vein, # tree
const area = `
|       |
| ♀█    |
|       |
`;
const mountain = findInArea(area, "█");
const woodPickaxe = { tool: "pickaxe", material: "wood", amount: 1 } as const;
const ironPickaxe = { tool: "pickaxe", material: "iron", amount: 1 } as const;

const mineArea = (cell: string) => `
|       |
| ♀${cell}    |
|       |
`;

describe("pickaxe", () => {
  it("activates the pickaxe condition with its mining stat", () => {
    const { world, hero } = setupTools(area, [ironPickaxe]);

    act(world, "skill");

    expect(hero[CONDITIONABLE].pickaxe).toMatchObject({
      amount: getEquipmentStats(ironPickaxe).mining,
    });

    act(world, "skill");

    expect(hero[CONDITIONABLE].pickaxe).toBeUndefined();
  });

  it("mines a mountain into ore and leaves rubble", () => {
    const { world, hero } = setupTools(area, [woodPickaxe]);
    const mountainEntity = getResource(world, mountain)!;

    act(world, "skill");

    expect(workUntilDepleted(world, "right", mountainEntity)).toBe(
      getHarvestConfig("mountain").harvestable.maximum
    );
    step(world, 60);
    expect(getLootItems(world, mountain)).toEqual(
      getHarvestConfig("mountain").yields
    );
    expect(getResource(world, mountain)?.[HARVESTABLE].resource).toBe("rubble");

    collectLoot(world, "right", mountain);

    expect(countItems(world, hero, { stackable: "ore" })).toBe(1);
  });

  it("mines faster with an iron pickaxe", () => {
    const { world } = setupTools(area, [ironPickaxe]);
    const { maximum } = getHarvestConfig("mountain").harvestable;

    act(world, "skill");

    expect(
      workUntilDepleted(world, "right", getResource(world, mountain)!)
    ).toBe(Math.ceil(maximum / getEquipmentStats(ironPickaxe).mining));
  });

  it.each([
    ["iron", "I"],
    ["gold", "G"],
  ] as const)("mines a %s mine into its resource", (resource, char) => {
    const minesArea = mineArea(char);
    const mine = findInArea(minesArea, char);
    const { world, hero } = setupTools(minesArea, [ironPickaxe], {
      [char]: resource,
    });
    const { harvestable, yields } = getHarvestConfig(resource);

    act(world, "skill");

    expect(workUntilDepleted(world, "right", getResource(world, mine)!)).toBe(
      Math.ceil(harvestable.maximum / getEquipmentStats(ironPickaxe).mining)
    );
    step(world, 60);
    expect(getLootItems(world, mine)).toEqual(yields);

    collectLoot(world, "right", mine);

    expect(
      countItems(world, hero, { stackable: "resource", material: resource })
    ).toBe(1);
  });

  it("collects the ore of a vein before mining it", () => {
    const veinArea = mineArea("O");
    const vein = findInArea(veinArea, "O");
    const { world, hero } = setupTools(veinArea, [woodPickaxe], { O: "ore" });
    const veinEntity = getResource(world, vein)!;
    const [veinOre] = getLootItems(world, vein);

    act(world, "skill");
    holdUntil(world, "right", () => getLootItems(world, vein).length === 0);
    step(world, 30);

    expect(veinOre).toMatchObject({ stackable: "ore" });
    expect(countItems(world, hero, { stackable: "ore" })).toBe(veinOre.amount);
    expect(veinEntity[HARVESTABLE].amount).toBe(
      getHarvestConfig("mountain").harvestable.maximum
    );

    workUntilDepleted(world, "right", veinEntity);
    collectLoot(world, "right", vein);

    expect(countItems(world, hero, { stackable: "ore" })).toBe(
      veinOre.amount + 1
    );
  });

  it("mines adjacent rocks at once with the range of a gold pickaxe", () => {
    const ridge = `
|       |
| █     |
| ♀█    |
| █     |
`;
    const { world, hero } = setupTools(ridge, [
      { tool: "pickaxe", material: "gold", amount: 1 },
    ]);
    const { x, y } = hero[POSITION];
    const rocks = [
      { x: x + 1, y },
      { x, y: y - 1 },
      { x, y: y + 1 },
    ].map((position) => getResource(world, position)!);

    act(world, "skill");
    workUntilDepleted(world, "right", rocks[0]);

    expect(rocks.map((entity) => entity[HARVESTABLE].amount)).toEqual([
      0, 0, 0,
    ]);
  });

  it("does not chop a tree", () => {
    const treeArea = mineArea("#");
    const tree = findInArea(treeArea, "#");
    const { world } = setupTools(treeArea, [woodPickaxe]);

    act(world, "skill");
    holdMove(world, ["right"]);
    step(world, 60);
    holdMove(world, []);

    expect(getResource(world, tree)?.[HARVESTABLE].amount).toBe(
      getHarvestConfig("tree").harvestable.maximum
    );
  });
});
