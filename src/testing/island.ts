/**
 * Generate seeded islands and check with the game's pathfinding that all
 * waypoints are reachable from the spawn. Shared by the seeded
 * `island/generation-*.slow.test.ts` files so jest runs them in parallel.
 */
import { assertHero, createTestWorld } from "./harness";
import { seedRandom } from "./env";
import { World } from "../engine";
import { LEVEL } from "../engine/components/level";
import { Position, POSITION } from "../engine/components/position";
import { COLLIDABLE } from "../engine/components/collidable";
import { LOCKABLE } from "../engine/components/lockable";
import { getCellEntities } from "../engine/systems/map";
import { initializeCell } from "../engine/systems/initialize";
import { assertIdentifierAndComponents } from "../engine/utils";
import { findPath } from "../game/math/path";
import { createMatrix, getOverlappingCell, setPath } from "../game/math/matrix";

const waypoints = [
  "spawn_sign",
  "earth_town",
  "earth_anvil",
  "earth_kettle",
  "earth_bench",
  "fire_haven",
  "fire_anvil",
  "fire_kettle",
  "fire_bench",
  "nomad_house",
];

// generator silently retries up to this many times
const islandTries = 5;

const waterCells = ["water_shallow", "water_deep"];

/**
 * Walkable matrix in the format of `findPath`, like `getWalkableMatrix` but
 * without initializing the whole map: only one cell of each kind is
 * initialized to determine whether it blocks. Doors count as walkable since
 * keys can be found, units are ignored as they move or can be defeated.
 *
 * The island is centered at 0,0 and wraps around the map edges, so the matrix
 * is shifted by half the map to center the island, see `toMatrix`.
 */
export const getPlayableMatrix = (world: World) => {
  const level = world.metadata.gameEntity[LEVEL];
  const blockedKinds = new Map<string, boolean>();
  const matrix = createMatrix(level.size * 2, level.size * 2, 0);

  const isWater = (x: number, y: number) =>
    waterCells.includes(getOverlappingCell(level.cells, x, y));
  const isBlocked = (x: number, y: number) =>
    getCellEntities(world, { x, y }).some(
      (entity) => COLLIDABLE in entity && !(LOCKABLE in entity)
    );

  for (let x = 0; x < level.size; x += 1) {
    for (let y = 0; y < level.size; y += 1) {
      // same as isSubmerged: water surrounded by water can't be walked on
      const submerged = [-1, 0, 1].every((offsetX) =>
        [-1, 0, 1].every((offsetY) => isWater(x + offsetX, y + offsetY))
      );
      if (submerged) continue;

      const kind = `${level.cells[x][y]}|${level.objects[x][y] || ""}`;
      if (!level.initialized[x][y] && !blockedKinds.has(kind)) {
        initializeCell(world, x, y);
        blockedKinds.set(kind, isBlocked(x, y));
      }
      const blocked = level.initialized[x][y]
        ? isBlocked(x, y)
        : blockedKinds.get(kind);

      if (!blocked) setPath(matrix, x + level.size / 2, y + level.size / 2, 1);
    }
  }

  return matrix;
};

export const toMatrix = (world: World, position: Position) => {
  const half = world.metadata.gameEntity[LEVEL].size / 2;
  return { x: position.x + half, y: position.y + half };
};

// centered island never needs to wrap within the matrix
const centerQuadrant = { x: 0, y: 0 };

export const describeIslandSeeds = (seeds: number[]) =>
  describe.each(seeds)("island seed %i", (seed) => {
    let world: World;
    let failedAttempts = 0;

    beforeAll(() => {
      const error = jest.spyOn(console, "error").mockImplementation(() => {});
      seedRandom(seed);
      world = createTestWorld({ level: "LEVEL_ISLAND" });
      failedAttempts = error.mock.calls.filter((args) =>
        String(args[0]).startsWith("Failed island generation")
      ).length;
      error.mockRestore();
    }, 120000);

    afterAll(() => {
      // release memory before generating the next island
      world = undefined as unknown as World;
    });

    it("generates within the allowed attempts", () => {
      expect(failedAttempts).toBeLessThan(islandTries);
    });

    it("reaches all waypoints from the spawn", () => {
      const spawn = toMatrix(world, assertHero(world)[POSITION]);
      const matrix = getPlayableMatrix(world);

      const unreachable = waypoints.filter((identifier) => {
        const target = toMatrix(
          world,
          assertIdentifierAndComponents(world, identifier, [POSITION])[POSITION]
        );
        const path = findPath(
          matrix,
          spawn,
          target,
          true,
          true,
          centerQuadrant
        );
        return path.length === 0;
      });

      expect(unreachable).toEqual([]);
    });
  });
