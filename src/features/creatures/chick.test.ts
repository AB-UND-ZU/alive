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
import { chickFemale, eggCrack, heart } from "../../game/assets/sprites";
import { unitDefinitions } from "../../game/balancing/units";
import { createDialog, getFacingLayers, rage } from "../../game/assets/ui";
import { saveAndLoad } from "../../testing/saves";
import { advanceUntil, countItems, findEntityAt, giveItems } from "../../testing/harness";
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

  it.each([["chick", 0.2], ["hen", 0.4], ["rooster", 0.4]] as const)("a %s digs planted seeds at its own peck chance", (type, chance) => {
    const { world, hero } = createCreatureWorld("|♀B☼ |", { B: type });
    const chick = getCreature(world, type);
    const plot = { x: 2, y: 0 };
    const soil = findEntityAt(world, plot, [FARMABLE])!;
    teleport(world, hero, plot);
    const [berry] = giveItems(world, hero, [{ stackable: "berry", amount: 1 }]);
    plantSeed(world, hero, berry);
    advanceTicks(world, 2);
    teleport(world, hero, { x: 20, y: 20 });
    teleport(world, chick, { x: plot.x - 1, y: plot.y });
    const sapling = soil[FARMABLE].sapling!;

    decide(world, 0.9, 0.19, chance);
    expect(soil[FARMABLE].planted).toBe("berry");
    expect(countDrops(world, { stackable: "berry" })).toBe(0);

    decide(world, 0.9, 0.19, chance - 0.001);
    expect(soil[FARMABLE].planted).toBeUndefined();
    advanceUntil(
      world,
      () => countDrops(world, { stackable: "berry" }) === 1,
      3000
    );
    expect(world.getEntityById(sapling)).toBeUndefined();
  });

  it.each([["chick", 1], ["hen", 2], ["rooster", 2]] as const)("drops the correct amount of Raw when a %s dies", (type, amount) => {
    const { world } = createCreatureWorld("|♀   B |", { B: type });
    getCreature(world, type).STATS.hp = 0;
    advanceUntil(world, () => countDrops(world, { stackable: "raw" }) === amount, 5000);
    expect(getDrops(world).filter((item) => item.stackable === "raw" && item.amount === 1)).toHaveLength(amount);
  });

  it.each(["hen", "rooster"] as const)("grows into a %s after a reload and consumes all its feed", (adult) => {
    const { world, hero, chick } = setup("|♀ c |");
    advanceTicks(world, 2);
    teleport(world, hero, { x: 20, y: 20 });
    const bird = world.assertComponents(chick, [SPRITE]);
    bird.SPRITE = adult === "hen" ? chickFemale : unitDefinitions.chick.sprite;
    decide(world, 0);
    expect(chick.NPC.type).toBe("chick");
    giveItems(world, chick, [{ stackable: "worm", amount: 2 }, { stackable: "grain", amount: 3 }]);
    expect(countItems(world, chick, { stackable: "raw" })).toBe(1);
    decide(world, 0.003);
    expect(chick.NPC.type).toBe("chick");
    const id = world.getEntityId(chick);
    const loaded = saveAndLoad(world);
    decide(loaded, 0.0029);
    const grown = getCreature(loaded, adult);
    expect(loaded.getEntityId(grown)).toBe(id);
    expect(grown.STATS).toMatchObject({ hp: adult === "hen" ? 6 : 10, maxHp: adult === "hen" ? 6 : 10, armor: 1, resist: 2 });
    expect(grown.SPRITE?.id).toBe(unitDefinitions[adult].sprite.id);
    expect(countItems(loaded, grown, { stackable: "worm" })).toBe(0);
    expect(countItems(loaded, grown, { stackable: "grain" })).toBe(0);
    expect(countItems(loaded, grown, { stackable: "raw" })).toBe(2);
    expect(countDrops(loaded, { stackable: "egg" })).toBe(0);
  });

  it("a wounded rooster acquires at five cells, pecks for one damage, and calms when fed", () => {
    const { world, hero } = createCreatureWorld("|♀     R  |", { R: "rooster" });
    advanceTicks(world, 2);
    const bird = getCreature(world, "rooster");
    teleport(world, bird, { x: 7, y: 5 });
    teleport(world, hero, { x: 1, y: 5 });
    const hp = hero.STATS.hp;
    expect(bird.BELONGABLE.faction).toBe("animal");
    bird.STATS.hp -= 1;
    decide(world);
    expect(bird.BELONGABLE.faction).toBe("animal");
    expect(bird.POSITION).toEqual({ x: 7, y: 5 });
    teleport(world, hero, { x: 2, y: 5 });
    decide(world);
    expect(bird.TOOLTIP.idle?.id).toBe(rage.id);
    expect(bird.POSITION.x).toBe(6);
    teleport(world, hero, { x: 37, y: 5 }); // exactly ten from the chase origin
    decide(world);
    expect(bird.POSITION.x).toBe(5);
    teleport(world, hero, { x: 36, y: 5 });
    decide(world);
    expect(bird.POSITION.x).toBe(6);
    expect(bird.TOOLTIP.idle).toBeUndefined();
    expect(bird.BELONGABLE.faction).toBe("hostile");
    expect(bird.EQUIPPABLE?.weapon).toBeUndefined();

    // Finish returning even if the player comes back into detection range.
    teleport(world, hero, { x: 4, y: 5 });
    decide(world);
    expect(bird.POSITION).toEqual({ x: 7, y: 5 });
    expect(bird.TOOLTIP.idle).toBeUndefined();
    teleport(world, hero, { x: 20, y: 20 });
    decide(world, 0.9, 0.1, 0);
    const secondOrigin = { ...bird.POSITION };
    expect(secondOrigin).not.toEqual({ x: 7, y: 5 });

    teleport(world, hero, { x: secondOrigin.x + 5, y: secondOrigin.y });
    decide(world);
    expect(bird.TOOLTIP.idle?.id).toBe(rage.id);
    expect(bird.POSITION.x).toBe(secondOrigin.x + 1);
    teleport(world, hero, { x: 20, y: 20 });
    decide(world);
    expect(bird.POSITION).toEqual(secondOrigin);
    expect(bird.TOOLTIP.idle).toBeUndefined();

    teleport(world, hero, { x: secondOrigin.x + 1, y: secondOrigin.y });
    advanceUntil(world, () => hero.STATS.hp < hp, 2000);
    expect(hero.STATS.hp).toBe(hp - 1);
    dropGrain(world, { x: bird.POSITION.x, y: bird.POSITION.y + 1 });
    advanceUntil(world, () => bird.STATS.hp === 10 && !bird.EQUIPPABLE?.weapon, 4000);
    expect(bird.BELONGABLE.faction).toBe("animal");
    expect(countItems(world, bird, { stackable: "grain" })).toBe(0);
  });

  it("a wounded hen consumes a worm to heal and keeps subsequent feed", () => {
    const { world, hero } = createCreatureWorld("|♀ H    |", { H: "hen" });
    const bird = getCreature(world, "hen");
    teleport(world, hero, { x: 20, y: 20 });
    giveItems(world, bird, [{ stackable: "grain", amount: 3 }, { stackable: "worm", amount: 2 }]);
    bird.STATS.hp = 2;
    const feed = { stackable: "worm", amount: 1, bound: false } as const;
    const item = createItemAsDrop(world, { x: 3, y: 0 }, entities.createItem, { ITEM: feed, SPRITE: getItemSprite(feed) });
    collectItem(world, bird, world.assertByIdAndComponents(item.ITEM.carrier, [POSITION, INVENTORY]));
    advanceUntil(world, () => bird.STATS.hp === 6, 3000);
    expect(countItems(world, bird, { stackable: "worm" })).toBe(0);
    expect(countItems(world, bird, { stackable: "grain" })).toBe(0);
    dropGrain(world, { x: bird.POSITION.x + 1, y: bird.POSITION.y });
    advanceUntil(world, () => countItems(world, bird, { stackable: "grain" }) === 1, 4000);
  });

  it.each([["chick", "Chirp"], ["hen", "Bok bok bok"], ["rooster", "\u010d"]] as const)(
    "uses the %s's own call", (type, call) => {
      const { world, hero } = createCreatureWorld("|♀    B |", { B: type });
      advanceTicks(world, 2);
      const bird = getCreature(world, type);
      teleport(world, bird, { x: 5, y: 5 });
      teleport(world, hero, { x: 1, y: 5 });
      decide(world, 0.9, 0);
      expect(bird.TOOLTIP.dialogs).toEqual([createDialog(call)]);
    }
  );

  it("brings a diagonal pair together without both birds circling", () => {
    const { world, hero } = createCreatureWorld("|♀ H R |", { H: "hen", R: "rooster" });
    advanceTicks(world, 2);
    teleport(world, hero, { x: 20, y: 20 });
    const hen = getCreature(world, "hen");
    const rooster = getCreature(world, "rooster");
    teleport(world, hen, { x: 4, y: 5 });
    teleport(world, rooster, { x: 5, y: 6 });
    for (const bird of [hen, rooster]) giveItems(world, bird, [{ stackable: "grain", amount: 1 }]);
    decide(world, 0.004);
    for (let i = 0; i < 8; i++) decide(world);
    expect(countDrops(world, { stackable: "egg" })).toBe(1);
  });

  it.each(["hen", "rooster"] as const)("lets a fed %s court, bump its partner and lay one egg", (initiator) => {
    const opposite = initiator === "hen" ? "rooster" : "hen";
    const { world, hero } = createCreatureWorld("|♀ H  R  |", { H: initiator, R: opposite });
    advanceTicks(world, 2);
    teleport(world, hero, { x: 20, y: 20 });
    const first = getCreature(world, initiator);
    const second = getCreature(world, opposite);
    teleport(world, first, { x: 3, y: 5 });
    teleport(world, second, { x: 6, y: 5 });
    for (const bird of [first, second]) {
      giveItems(world, bird, [{ stackable: "grain", amount: 3 }, { stackable: "worm", amount: 2 }]);
    }
    decide(world, 0.0049);
    for (const bird of [first, second]) expect(bird.TOOLTIP.idle?.id).toBe(heart.id);
    const hen = initiator === "hen" ? first : second;
    const layingEgg = () => world.getEntities(["SEQUENCABLE"]).find((entity) => {
      const args = entity.SEQUENCABLE.states.collect?.args;
      return args?.drop && world.getEntityById(args.itemId)?.ITEM?.stackable === "egg";
    });
    advanceUntil(world, () => !!layingEgg(), 2500);
    expect(layingEgg()?.SEQUENCABLE.states.collect?.args.origin).toEqual(hen.POSITION);
    advanceUntil(world, () => countDrops(world, { stackable: "egg" }) === 1, 1500);
    expect(countDrops(world, { stackable: "egg" })).toBe(1);
    expect(first.BUMPABLE?.orientation).toBe("right");
    expect(second.BUMPABLE?.orientation).toBe("left");
    const meals = [first, second].map((bird) => [
      countItems(world, bird, { stackable: "grain" }),
      countItems(world, bird, { stackable: "worm" }),
    ]);
    expect(meals).toContainEqual([0, 0]);
    expect(meals).toContainEqual([3, 2]);
  });

  it.each(["chick", "hen", "rooster"] as const)("a hen cannot lay with an ineligible %s", (other) => {
    const { world, hero } = createCreatureWorld("|♀ H R |", { H: "hen", R: other });
    advanceTicks(world, 2);
    teleport(world, hero, { x: 20, y: 20 });
    const hen = getCreature(world, "hen");
    giveItems(world, hen, [{ stackable: "grain", amount: 2 }]);
    if (other !== "rooster") {
      const neighbor = world.getEntities(["NPC", INVENTORY, POSITION]).find((unit) => unit !== hen)!;
      giveItems(world, neighbor, [{ stackable: "worm", amount: 1 }]);
    }
    decide(world, 0.0049);
    expect(hen.TOOLTIP.idle?.id).toBe(heart.id);
    for (let i = 0; i < 20; i++) decide(world);
    expect(hen.TOOLTIP.idle?.id).toBe(heart.id);
    teleport(world, hen, { x: 21, y: 20 });
    decide(world);
    expect(hen.POSITION).not.toEqual({ x: 21, y: 20 });
    for (let i = 0; i < 74; i++) decide(world);
    expect(hen.TOOLTIP.idle?.id).not.toBe(heart.id);
    expect(countDrops(world, { stackable: "egg" })).toBe(0);
    expect(countItems(world, hen, { stackable: "grain" })).toBe(2);
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
