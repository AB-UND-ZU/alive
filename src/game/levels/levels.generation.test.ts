import {
  advance,
  createTestWorld,
  getHero,
  snapshot,
} from "../../testing/harness";
import { seedRandom } from "../../testing/env";
import { LEVEL, LevelName } from "../../engine/components/level";
import { VIEWABLE } from "../../engine/components/viewable";
import { getCellEntities } from "../../engine/systems/map";
import { isWalkable } from "../../engine/systems/movement";

// island is covered by seeded island/island-*.generation.test.ts
const levels: LevelName[] = ["LEVEL_MENU", "LEVEL_TUTORIAL"];

describe.each(levels)("level %s", (level) => {
  it("generates the level and spawns the hero", () => {
    const world = createTestWorld({ level });
    const game = world.metadata.gameEntity;
    const hero = getHero(world)!;

    expect(game[LEVEL].name).toBe(level);
    expect(game[LEVEL].cells).toHaveLength(game[LEVEL].size);
    expect(hero).toBeDefined();
    expect(world.assertComponents(hero, [VIEWABLE])[VIEWABLE].active).toBe(
      true
    );
    expect(getCellEntities(world, hero.POSITION)).toContain(hero);
  });

  it("lets the hero walk off the spawn", () => {
    const world = createTestWorld({ level });
    const { x, y } = getHero(world)!.POSITION;
    const size = world.metadata.gameEntity[LEVEL].size;

    const free = [
      { x: x + 1, y },
      { x: x - 1, y },
      { x, y: y + 1 },
      { x, y: y - 1 },
    ].some((position) =>
      isWalkable(world, {
        x: (position.x + size) % size,
        y: (position.y + size) % size,
      })
    );

    expect(free).toBe(true);
  });

  it("keeps running for 10s of game time", () => {
    const world = createTestWorld({ level });

    expect(() => advance(world, 10000)).not.toThrow();
    expect(getHero(world)).toBeDefined();
  });
});

describe("determinism", () => {
  const run = (seed: number) => {
    seedRandom(seed);
    const world = createTestWorld({ level: "LEVEL_TUTORIAL" });
    advance(world, 2000);
    return snapshot(world);
  };

  it("produces identical worlds from identical seeds", () => {
    expect(run(42)).toBe(run(42));
  });

  it("produces different worlds from different seeds", () => {
    expect(run(42)).not.toBe(run(43));
  });
});
