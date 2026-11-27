import { World, entities } from "../../engine";
import { BUMPABLE } from "../../engine/components/bumpable";
import { ITEM } from "../../engine/components/item";
import { POSITION, Position } from "../../engine/components/position";
import { SPRITE } from "../../engine/components/sprite";
import { TOOLTIP } from "../../engine/components/tooltip";
import { FARMABLE } from "../../engine/components/farmable";
import { INVENTORY } from "../../engine/components/inventory";
import { collectItem } from "../../engine/systems/collect";
import { plantSeed } from "../../engine/systems/harvest";
import { createItemAsDrop } from "../../engine/systems/drop";
import { getItemSprite } from "../../game/assets/utils";
import { heart } from "../../game/assets/sprites";
import { advanceUntil, findEntityAt, giveItems } from "../../testing/harness";
import {
  advanceTicks,
  countDrops,
  createCreatureWorld,
  distanceBetween,
  getCreature,
  getDrops,
  teleport,
  trace,
} from "./helpers";

const dropGrain = (world: World, position: Position) => {
  const grain = { stackable: "grain", amount: 1, bound: false } as const;
  createItemAsDrop(world, position, entities.createItem, {
    [ITEM]: grain,
    [SPRITE]: getItemSprite(grain),
  });
};

const setup = (area: string) => {
  const { world, hero } = createCreatureWorld(area);
  const chick = getCreature(world, "chick");
  return { world, hero, chick };
};

const decide = (world: World, ...rolls: number[]) => {
  const random = jest.spyOn(Math, "random").mockReturnValue(0.9);
  rolls.forEach((roll) => random.mockReturnValueOnce(roll));
  try {
    advanceTicks(world, 1);
  } finally {
    random.mockRestore();
  }
};

describe("chick", () => {
  it("runs away from the hero coming close", () => {
    const { world, hero, chick } = setup(`
|          |
|   ♀ c    |
|          |
`);
    const start = distanceBetween(world, chick[POSITION], hero[POSITION]);

    advanceUntil(
      world,
      () => distanceBetween(world, chick[POSITION], hero[POSITION]) > start,
      3000
    );
  });

  it("wanders around its spot while alone", () => {
    const { world, hero, chick } = setup(`
|♀        c|
`);
    teleport(world, hero, { x: 20, y: 20 });
    teleport(world, chick, { x: 5, y: 5 });

    const positions = trace(world, 40, () => ({ ...chick[POSITION] }));

    expect(positions.some(({ x, y }) => x !== 5 || y !== 5)).toBe(true);
    expect(
      positions.every(
        ({ x, y }) => Math.abs(x - 5) < 15 && Math.abs(y - 5) < 15
      )
    ).toBe(true);
  });

  it("hurries with a heart to grain lying nearby and picks it up", () => {
    const { world, hero, chick } = setup(`
|♀        c|
`);
    teleport(world, hero, { x: 20, y: 20 });
    teleport(world, chick, { x: 2, y: 5 });
    dropGrain(world, { x: 6, y: 5 });

    advanceTicks(world, 2);
    expect(chick[TOOLTIP].idle?.id).toBe(heart.id);

    advanceUntil(
      world,
      () => countDrops(world, { stackable: "grain" }) === 0,
      5000
    );
  });

  it("ignores grain too far away", () => {
    const { world, hero, chick } = setup(`
|♀        c|
`);
    teleport(world, hero, { x: 20, y: 20 });
    teleport(world, chick, { x: 2, y: 5 });
    dropGrain(world, { x: 12, y: 5 });

    advanceTicks(world, 2);

    expect(chick[TOOLTIP].idle?.id).not.toBe(heart.id);
    expect(countDrops(world, { stackable: "grain" })).toBe(1);
  });

  it.each([",", "τ", "☼"])("pecks down only on its own tile (%s)", (tile) => {
    const { world, hero, chick } = setup(`|♀c${tile} |`);
    advanceTicks(world, 2);
    teleport(world, hero, { x: 20, y: 20 });
    const bump = world.assertComponents(chick, [BUMPABLE])[BUMPABLE];

    teleport(world, chick, { x: 1, y: 0 });
    decide(world, 0.19);
    expect(bump.orientation).toBeUndefined();

    teleport(world, chick, { x: 2, y: 0 });
    decide(world, 0.2);
    expect(bump.orientation).toBeUndefined();
    decide(world, 0.19);
    expect(bump.orientation).toBe("down");
  });

  it("returns the planted seed on one in five pecks", () => {
    const { world, hero, chick } = setup("|♀c☼ |");
    const plot = { x: 2, y: 0 };
    const soil = findEntityAt(world, plot, [FARMABLE])!;
    teleport(world, hero, plot);
    const [berry] = giveItems(world, hero, [{ stackable: "berry", amount: 1 }]);
    plantSeed(world, hero, berry);
    advanceTicks(world, 2);
    teleport(world, hero, { x: 20, y: 20 });
    teleport(world, chick, plot);
    const sapling = soil[FARMABLE].sapling!;

    decide(world, 0.19, 0.2);
    expect(soil[FARMABLE].planted).toBe("berry");
    expect(countDrops(world, { stackable: "berry" })).toBe(0);

    decide(world, 0.19, 0.19);
    expect(soil[FARMABLE].planted).toBeUndefined();
    advanceUntil(
      world,
      () => countDrops(world, { stackable: "berry" }) === 1,
      3000
    );
    expect(world.getEntityById(sapling)).toBeUndefined();
  });

  it("lays another egg only after the previous one is picked up", () => {
    const { world, hero } = setup("|♀c |");
    advanceTicks(world, 2);
    teleport(world, hero, { x: 20, y: 20 });
    const lay = () => decide(world, 0.9, 0.9, 0);
    lay();
    lay();
    expect(countDrops(world, { stackable: "egg" })).toBe(1);

    const egg = getDrops(world).find((item) => item.stackable === "egg")!;
    const drop = world.assertByIdAndComponents(egg.carrier, [INVENTORY]);
    expect(collectItem(world, hero, drop)).toBe(true);
    expect(countDrops(world, { stackable: "egg" })).toBe(0);
    lay();
    expect(countDrops(world, { stackable: "egg" })).toBe(1);
  });
});
