import { deserialize, serialize } from "v8";
import { assertHero, createTestWorld, step, walk } from "../testing/harness";
import { createSystems, preloadLevel } from "./ecs";
import { createSnapshot, restoreSnapshot, WorldSnapshot } from "./snapshot";
import { POSITION } from "./components/position";
import { SPRITE } from "./components/sprite";
import { SEQUENCABLE } from "./components/sequencable";
import { STATS } from "./components/stats";
import { LEVEL } from "./components/level";
import { getCellEntities } from "./systems/map";
import { World } from "./ecs";
import { none } from "../game/assets/sprites";

// IndexedDB stores values with the same structured clone algorithm
const store = (world: World) =>
  restoreSnapshot(
    deserialize(serialize(createSnapshot(world))) as WorldSnapshot
  );

const storeAndLoad = (world: World) => {
  const restored = store(world);
  createSystems(restored);
  preloadLevel(restored);
  return restored;
};

const getEntityIds = (world: World) =>
  world.getEntities([]).map((entity) => world.getEntityId(entity));

describe("world snapshot", () => {
  it("restores all entities with their IDs and level", () => {
    const world = createTestWorld();
    walk(world, "down", 2);

    const restored = store(world);

    expect(getEntityIds(restored)).toEqual(getEntityIds(world));
    expect(restored.metadata.gameEntity[LEVEL].name).toBe("LEVEL_MENU");
    expect(restored.metadata.playtime).toBe(world.metadata.playtime);
    expect(assertHero(restored)[POSITION]).toEqual(assertHero(world)[POSITION]);
    expect(assertHero(restored)[STATS]).toEqual(assertHero(world)[STATS]);
  });

  it("keeps sprite identity and map references", () => {
    const world = createTestWorld();
    const restored = storeAndLoad(world);
    const hero = assertHero(restored);

    const emptySprites = (target: World) =>
      target.getEntities([SPRITE]).filter((entity) => entity[SPRITE] === none)
        .length;
    expect(emptySprites(restored)).toBe(emptySprites(world));
    expect(emptySprites(restored)).toBeGreaterThan(0);
    expect(getCellEntities(restored, hero[POSITION])).toContain(hero);
  });

  it("keeps values that JSON can't store", () => {
    const restored = store(createTestWorld());
    const weather = restored
      .getEntities([SEQUENCABLE])
      .map((entity) => entity[SEQUENCABLE].states.weather)
      .find(Boolean);

    expect(weather?.args.end).toBe(Infinity);
  });

  it("keeps playing after loading", () => {
    const world = createTestWorld();
    step(world, 30);
    const restored = storeAndLoad(world);
    const { x, y } = assertHero(restored)[POSITION];

    walk(restored, "down", 2);

    expect(assertHero(restored)[POSITION]).toEqual({ x, y: y + 2 });
  });
});
