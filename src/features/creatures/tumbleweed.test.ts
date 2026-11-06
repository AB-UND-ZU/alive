import { World } from "../../engine";
import { BEHAVIOUR, Pattern } from "../../engine/components/behaviour";
import { FOG } from "../../engine/components/fog";
import { LEVEL } from "../../engine/components/level";
import { POSITION } from "../../engine/components/position";
import { STATS } from "../../engine/components/stats";
import { TypedEntity } from "../../engine/entities";
import { createMatrix } from "../../game/math/matrix";
import { advanceUntil } from "../../testing/harness";
import { createCreatureWorld, trace } from "./helpers";

const desertWidth = 10;

const setup = (area: string) => {
  const { world } = createCreatureWorld(area);
  const level = world.metadata.gameEntity[LEVEL];
  level.biomes = createMatrix(level.size, level.size, "jungle");
  for (let x = 0; x < desertWidth; x += 1) {
    for (let y = 0; y < level.size; y += 1) level.biomes[x][y] = "desert";
  }
  return world;
};

const getTumbleweeds = (world: World) =>
  world
    .getEntities([BEHAVIOUR, POSITION, STATS, FOG])
    .filter((entity) =>
      entity[BEHAVIOUR].patterns.some(
        (pattern: Pattern) => pattern.name === "tumbleweed"
      )
    ) as TypedEntity<"BEHAVIOUR" | "POSITION" | "STATS" | "FOG">[];

describe("tumbleweed", () => {
  it("rolls east across the desert", () => {
    const world = setup(`
|          |
| ø        |
|          |
|♀         |
`);
    const [tumbleweed] = getTumbleweeds(world);

    const positions = trace(world, 12, () => ({ ...tumbleweed[POSITION] }));

    expect(positions.every(({ y }) => y === 1)).toBe(true);
    expect(Math.max(...positions.map(({ x }) => x))).toBeGreaterThan(3);
    expect(
      positions.slice(1).every(({ x }, index) => x >= positions[index].x)
    ).toBe(true);
  });

  it("vanishes at the desert edge and rolls back in healed from the west", () => {
    const world = setup(`
|          |
|       ø  |
|          |
|♀         |
`);
    const [tumbleweed] = getTumbleweeds(world);
    tumbleweed[STATS].hp = 1;

    const size = world.metadata.gameEntity[LEVEL].size;

    advanceUntil(world, () => tumbleweed[POSITION].x === desertWidth, 10000);
    expect(tumbleweed[FOG].visibility).toBe("hidden");

    advanceUntil(world, () => tumbleweed[POSITION].x === size - 1, 3000);
    expect(tumbleweed[STATS].hp).toBe(tumbleweed[STATS].maxHp);

    advanceUntil(world, () => tumbleweed[POSITION].x === 0, 5000);
    expect(tumbleweed[POSITION].y).toBe(1);
  });

  it("never rolls into another visible tumbleweed", () => {
    const world = setup(`
|          |
|   øø█    |
|          |
|♀         |
`);
    const [first, second] = getTumbleweeds(world).sort(
      (left, right) => left[POSITION].x - right[POSITION].x
    );

    const overlaps = trace(
      world,
      16,
      () =>
        first[FOG].visibility === "visible" &&
        second[FOG].visibility === "visible" &&
        first[POSITION].x === second[POSITION].x &&
        first[POSITION].y === second[POSITION].y
    );

    expect(overlaps).not.toContain(true);
  });
});
