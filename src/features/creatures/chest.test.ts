import { World } from "../../engine";
import { BELONGABLE } from "../../engine/components/belongable";
import { IDENTIFIABLE } from "../../engine/components/identifiable";
import { POSITION } from "../../engine/components/position";
import { STATS } from "../../engine/components/stats";
import { TypedEntity } from "../../engine/entities";
import { isDead } from "../../engine/systems/damage";
import { getIdentifier } from "../../engine/utils";
import { advanceUntil, assertHero, holdMove } from "../../testing/harness";
import {
  advanceTicks,
  createCreatureWorld,
  getSpells,
  giveSword,
  toughen,
} from "./helpers";

const arena = `
|               |
|               |
| Y     C     Y |
|               |
|               |
|               |
| y           y |
|               |
|       ♀       |
`;

const named = (world: World, name: string) =>
  world
    .getEntities([IDENTIFIABLE])
    .filter((entity) => entity[IDENTIFIABLE].name === name);

const setup = () => {
  const { world, hero } = createCreatureWorld(arena, {
    y: "chest_tower_statue",
  });
  toughen(hero);
  giveSword(world, hero);
  const chest = getIdentifier(world, "chest_boss") as TypedEntity<
    "STATS" | "POSITION" | "BELONGABLE"
  >;
  return { world, hero, chest };
};

const provoke = (world: World, chest: ReturnType<typeof setup>["chest"]) => {
  holdMove(world, ["up"]);
  advanceUntil(world, () => chest[STATS].hp < chest[STATS].maxHp, 5000);
  holdMove(world, []);
};

const sustained = (world: World, predicate: () => boolean, timeout: number) => {
  const hero = world.assertComponents(assertHero(world), [STATS]);
  advanceUntil(
    world,
    () => {
      hero[STATS].hp = hero[STATS].maxHp;
      return predicate();
    },
    timeout
  );
};

describe("chest boss", () => {
  it("rests as an ordinary chest until it is hit", () => {
    const { world, hero, chest } = setup();

    advanceTicks(world, 10);

    expect(chest[BELONGABLE].faction).toBe("unit");
    expect(named(world, "chest_tower_statue")).toHaveLength(2);
    expect(hero[STATS].hp).toBe(hero[STATS].maxHp);
  });

  it("turns wild and raises wave towers from the statues when hit", () => {
    const { world, chest } = setup();

    provoke(world, chest);
    advanceUntil(world, () => chest[BELONGABLE].faction === "wild", 3000);

    expect(named(world, "chest_tower_statue")).toHaveLength(0);
    expect(named(world, "chest_tower")).toHaveLength(4);
  });

  it("casts waves at the hero", () => {
    const { world, chest } = setup();
    provoke(world, chest);

    sustained(world, () => getSpells(world, chest).length > 0, 15000);
  });

  it("calls gold mobs to its side", () => {
    const { world, chest } = setup();
    provoke(world, chest);

    sustained(world, () => named(world, "chest_mob").length > 0, 40000);
  });

  it("defeats a weak hero and then returns to rest with full health", () => {
    const { world, hero, chest } = setup();
    const start = { ...chest[POSITION] };
    provoke(world, chest);

    advanceUntil(world, () => isDead(world, hero), 30000);
    advanceUntil(world, () => chest[BELONGABLE].faction === "unit", 5000);

    expect(chest[STATS].hp).toBe(chest[STATS].maxHp);
    advanceUntil(
      world,
      () => chest[POSITION].x === start.x && chest[POSITION].y === start.y,
      10000
    );
  });
});
