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
import { resolveSprite } from "../../game/assets/spriteIds";
import { eggCrack, heart } from "../../game/assets/sprites";
import { getFacingLayers } from "../../game/assets/ui";
import { saveAndLoad } from "../../testing/saves";
import { advanceUntil, findEntityAt, giveItems } from "../../testing/harness";
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

  it.each([",", "τ", "☼"])("pecks right only when the next tile is suitable (%s)", (tile) => {
    const { world, hero, chick } = setup(`|♀c${tile} |`);
    advanceTicks(world, 2);
    teleport(world, hero, { x: 20, y: 20 });
    const bump = world.assertComponents(chick, [BUMPABLE])[BUMPABLE];

    teleport(world, chick, { x: 2, y: 0 });
    decide(world, 0.9, 0.19);
    expect(bump.orientation).toBeUndefined();

    teleport(world, chick, { x: 1, y: 0 });
    decide(world, 0.9, 0.2);
    expect(bump.orientation).toBeUndefined();
    decide(world, 0.9, 0.19);
    expect(bump.orientation).toBe("right");
  });

  it("returns the planted seed on one in four pecks", () => {
    const { world, hero, chick } = setup("|♀c☼ |");
    const plot = { x: 2, y: 0 };
    const soil = findEntityAt(world, plot, [FARMABLE])!;
    teleport(world, hero, plot);
    const [berry] = giveItems(world, hero, [{ stackable: "berry", amount: 1 }]);
    plantSeed(world, hero, berry);
    advanceTicks(world, 2);
    teleport(world, hero, { x: 20, y: 20 });
    teleport(world, chick, { x: plot.x - 1, y: plot.y });
    const sapling = soil[FARMABLE].sapling!;

    decide(world, 0.9, 0.19, 0.25);
    expect(soil[FARMABLE].planted).toBe("berry");
    expect(countDrops(world, { stackable: "berry" })).toBe(0);

    decide(world, 0.9, 0.19, 0.249);
    expect(soil[FARMABLE].planted).toBeUndefined();
    advanceUntil(
      world,
      () => countDrops(world, { stackable: "berry" }) === 1,
      3000
    );
    expect(world.getEntityById(sapling)).toBeUndefined();
  });

  it.each(["grain", "worm"] as const)("lays an egg after eating %s and uses the whole meal", (food) => {
    const { world, hero, chick } = setup("|♀c |");
    advanceTicks(world, 2);
    teleport(world, hero, { x: 20, y: 20 });
    decide(world, 0);
    expect(countDrops(world, { stackable: "egg" })).toBe(0);

    const carrier = world.assertComponents(chick, [INVENTORY, POSITION]);
    const originalItems = [...carrier.INVENTORY.items];
    giveItems(world, carrier, [{ stackable: food, amount: 2 }, { stackable: "apple", amount: 1 }]);
    const retained = [...originalItems, carrier.INVENTORY.items.at(-1)!];
    decide(world, 0.005);
    expect(countDrops(world, { stackable: "egg" })).toBe(0);
    decide(world, 0.0049);
    expect(countDrops(world, { stackable: "egg" })).toBe(1);
    expect(carrier.INVENTORY.items).toEqual(retained);
    decide(world, 0);
    expect(countDrops(world, { stackable: "egg" })).toBe(1);

    giveItems(world, carrier, [{ stackable: "grain", amount: 3 }, { stackable: "worm", amount: 4 }]);
    decide(world, 0);
    expect(countDrops(world, { stackable: "egg" })).toBe(2);
    expect(carrier.INVENTORY.items).toEqual(retained);
  });
});

describe("ground eggs", () => {
  const setupEgg = (amount = 1, atHero = false) => {
    const { world, hero } = createCreatureWorld("|♀   |");
    advanceTicks(world, 2);
    const position = atHero ? hero.POSITION : { x: 3, y: 0 };
    const data = { stackable: "egg", amount, bound: false } as const;
    const egg = createItemAsDrop(world, position, entities.createItem, {
      [ITEM]: data,
      [SPRITE]: getItemSprite(data),
    });
    const carrier = world.assertByIdAndComponents(egg.ITEM.carrier, [INVENTORY]);
    return { world, hero, egg, carrier, position };
  };

  it("shows three crack frames one world tick apart and hatches at the egg's position after a reload", () => {
    const { world, egg, position } = setupEgg();
    decide(world, 0.001);
    expect(egg.SPRITE.id).toBe(getItemSprite(egg.ITEM).id);
    decide(world, 0.0009);
    expect(resolveSprite(egg.SPRITE).layers).toEqual(getFacingLayers(eggCrack, undefined, 1));
    const id = world.getEntityId(egg);
    const loaded = saveAndLoad(world);
    const savedEgg = loaded.assertByIdAndComponents(id, [SPRITE]);
    for (const stage of [2, 3]) {
      decide(loaded);
      expect(resolveSprite(savedEgg.SPRITE).layers).toEqual(getFacingLayers(eggCrack, undefined, stage));
    }
    decide(loaded);
    expect(countDrops(loaded, { stackable: "egg" })).toBe(0);
    expect(getCreature(loaded, "chick").POSITION).toEqual(position);
  });

  it("keeps an egg at its placement cell when the unit that placed it moves", () => {
    const { world, hero, carrier } = setupEgg(1, true);
    const position = { ...hero.POSITION };
    teleport(world, hero, { x: 7, y: 0 });
    expect(carrier.POSITION).toEqual(position);
  });

  it("leaves the rest of a ground stack intact when one egg hatches", () => {
    const { world, egg } = setupEgg(2);
    decide(world, 0);
    for (let tick = 0; tick < 3; tick++) decide(world);
    expect(getCreature(world, "chick")).toBeDefined();
    expect(egg.ITEM.amount).toBe(1);
    expect(egg.SPRITE.id).toBe(getItemSprite(egg.ITEM).id);
  });

  it.each([0, 1, 2, 3])("collecting at crack stage %i prevents hatching", (stage) => {
    const { world, hero, carrier, egg } = setupEgg();
    for (let n = 1; n <= stage; n++) decide(world, 0);
    expect(resolveSprite(egg.SPRITE).layers).toEqual(getFacingLayers(eggCrack, undefined, stage));
    expect(collectItem(world, hero, carrier)).toBe(true);
    advanceTicks(world, 8);
    expect(world.getEntities(["NPC"]).filter((e) => e.NPC.type === "chick")).toHaveLength(0);
    expect(hero.INVENTORY.items.some((id) => world.assertByIdAndComponents(id, [ITEM]).ITEM.stackable === "egg")).toBe(true);
  });
});
