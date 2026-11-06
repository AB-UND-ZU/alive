import { entities } from "../../engine";
import { BUMPABLE } from "../../engine/components/bumpable";
import { ITEM } from "../../engine/components/item";
import { POSITION, Position } from "../../engine/components/position";
import { SPRITE } from "../../engine/components/sprite";
import { TOOLTIP } from "../../engine/components/tooltip";
import { World } from "../../engine";
import { createItemAsDrop } from "../../engine/systems/drop";
import { getItemSprite } from "../../game/assets/utils";
import { heart } from "../../game/assets/sprites";
import { advanceUntil } from "../../testing/harness";
import {
  advanceTicks,
  countDrops,
  createCreatureWorld,
  distanceBetween,
  getCreature,
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
    expect(chick[TOOLTIP].idle).toBe(heart);

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

    expect(chick[TOOLTIP].idle).not.toBe(heart);
    expect(countDrops(world, { stackable: "grain" })).toBe(1);
  });

  it("pecks at grass next to it", () => {
    const { world, hero, chick } = setup(`
|♀         |
|          |
|    ,c,   |
|     ,    |
`);
    teleport(world, hero, { x: 20, y: 20 });
    const bumpable = world.assertComponents(chick, [BUMPABLE])[BUMPABLE];
    const generation = bumpable.generation;

    advanceUntil(world, () => bumpable.generation !== generation, 10000);
  });
});
