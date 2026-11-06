import { EXERTABLE } from "../../engine/components/exertable";
import { materials } from "../../engine/components/item";
import { NPC } from "../../engine/components/npc";
import { POSITION } from "../../engine/components/position";
import { REFERENCE } from "../../engine/components/reference";
import { STATS } from "../../engine/components/stats";
import { getAbilityStats } from "../../game/balancing/abilities";
import { playedSounds } from "../../testing/env";
import { advance, findInArea, step, walk } from "../../testing/harness";
import { World } from "../../engine";
import { cast, createSpellWorld, isCasting, recordHits } from "./helpers";

const trap = { spell: "trap", material: "wood" } as const;

// prism bounces along the closed corridor, hero leaves through the gap
const corridor = `
|███████████|
|█◀    ♀   █|
|██████ ████|
|           |
`;
const trapCell = findInArea(corridor, "♀");

const getTrapAreas = (world: World) =>
  world.getEntities([EXERTABLE, POSITION]).map((area) => area[POSITION]);

const getPrism = (world: World) =>
  world
    .getEntities([NPC, STATS, POSITION])
    .find((entity) => entity[NPC].type === "prism")!;

const setup = (item: {
  spell: "trap";
  material: (typeof materials)[number];
}) => {
  const { world, hero } = createSpellWorld(corridor, item, { size: 20 });
  const prism = getPrism(world);
  prism[STATS].maxHp = 99;
  prism[STATS].hp = 99;
  return { world, hero, prism };
};

describe("trap spell", () => {
  it("arms on the cast cell only after the caster left it", () => {
    const { world } = setup(trap);

    cast(world, "down");
    step(world, 10);

    expect(getTrapAreas(world)).toEqual([]);

    walk(world, "down", 2);

    expect(getTrapAreas(world)).toEqual([trapCell]);
  });

  it("damages the first hostile unit stepping on it and disarms", () => {
    const { world, hero, prism } = setup(trap);

    cast(world, "down");
    walk(world, "down", 2);
    const [hits] = recordHits(world, [prism], 120);

    expect(hits).toEqual([getAbilityStats(trap).magic]);
    expect(getTrapAreas(world)).toEqual([]);
    expect(isCasting(world, hero)).toBe(false);
    expect(playedSounds.filter((sound) => sound === "trap")).toHaveLength(2);

    expect(recordHits(world, [prism], 300)).toEqual([[]]);
  });

  it("is not triggered by its caster", () => {
    const area = `
|       |
| ♀     |
|       |
`;
    const { world, hero } = createSpellWorld(area, trap);
    hero[STATS].maxHp = 10;
    hero[STATS].hp = 10;

    cast(world, "right");
    walk(world, "right", 2);
    walk(world, "left", 2);
    step(world, 10);

    expect(hero[STATS].hp).toBe(10);
    expect(getTrapAreas(world)).toEqual([findInArea(area, "♀")]);
  });

  it("disappears after its duration", () => {
    const area = `
|       |
| ♀     |
|       |
`;
    const { world, hero } = createSpellWorld(area, trap);
    const { duration } = getAbilityStats(trap);
    const tick = world.metadata.gameEntity[REFERENCE].tick;

    cast(world, "right");
    walk(world, "right", 1);
    advance(world, tick * (duration - 5));

    expect(getTrapAreas(world)).toHaveLength(1);

    advance(world, tick * 7);

    expect(getTrapAreas(world)).toEqual([]);
    expect(isCasting(world, hero)).toBe(false);
  });

  it.each(materials)("deals the damage of a %s trap", (material) => {
    const item = { spell: "trap", material } as const;
    const { world, prism } = setup(item);

    cast(world, "down");
    walk(world, "down", 2);
    const [hits] = recordHits(world, [prism], 120);

    expect(hits).toEqual([getAbilityStats(item).magic]);
  });
});
