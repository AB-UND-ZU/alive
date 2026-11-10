/**
 * Generate seeded islands and check with the game's pathfinding that all
 * waypoints are reachable from the spawn. Shared by the seeded
 * `island/island-*.generation.test.ts` files so jest runs them in parallel.
 */
import { assertHero, createTestWorld } from "./harness";
import { seedRandom } from "./env";
import { pixelCircle } from "../game/math/tracing";
import { wormRadius } from "../game/levels/island/areas";
import { islandNpcDistribution } from "../game/levels/island/units";
import { World } from "../engine";
import { LEVEL } from "../engine/components/level";
import { Position, POSITION } from "../engine/components/position";
import { COLLIDABLE } from "../engine/components/collidable";
import { LOCKABLE } from "../engine/components/lockable";
import { getCellEntities, moveEntity } from "../engine/systems/map";
import { initializeCell } from "../engine/systems/initialize";
import { getSequence } from "../engine/systems/sequence";
import { orientationPoints } from "../engine/components/orientable";
import { rotateOrientation } from "../game/math/path";
import { assertIdentifierAndComponents } from "../engine/utils";
import { findPath } from "../game/math/path";
import { combine, getDistance, normalize } from "../game/math/std";
import { executeCommand } from "../game/assets/commands";
import { MAX_DROP_RADIUS } from "../engine/systems/drop";
import { isWalkable } from "../engine/systems/movement";
import { isImmersible } from "../engine/systems/immersion";
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

    it("leaves the jetty boat for the player to build and places a water guard on glacier", () => {
      const level = world.metadata.gameEntity[LEVEL];
      expect(level.objects.flat(2)).not.toContain("boat");
      const guard = assertIdentifierAndComponents(world, "waterGuard", [
        POSITION,
        "BELONGABLE",
      ]);
      expect(guard[POSITION]).toEqual({ x: level.size / 2, y: level.size / 2 });
      expect(guard.BELONGABLE.faction).toBe("water");
      expect(isImmersible(world, guard[POSITION])).toBe(false);
      const jettyGuard = assertIdentifierAndComponents(
        world,
        "fireJettyGuard",
        [POSITION]
      );
      const facing = getSequence(world, jettyGuard, "npc")!.args.memory
        .orientation;
      expect(
        [-1, 1].some((turn) =>
          isWalkable(
            world,
            combine(
              level.size,
              jettyGuard[POSITION],
              orientationPoints[rotateOrientation(facing, turn)]
            )
          )
        )
      ).toBe(true);
    });

    it("registers worm teleport destinations before visiting the cave", () => {
      const hero = assertHero(world);
      const origin = { ...hero[POSITION] };
      const level = world.metadata.gameEntity[LEVEL];
      for (const id of ["worm_bait", "worm_sign", "worm_room"]) {
        const destination = assertIdentifierAndComponents(world, id, [
          POSITION,
        ]);
        expect(
          level.initialized[destination[POSITION].x][destination[POSITION].y]
        ).toBe(true);
        expect(
          executeCommand(world, hero, { handler: "tp", args: [id] })
        ).toBeUndefined();
        expect(
          getDistance(
            hero[POSITION],
            destination[POSITION],
            level.size,
            1,
            false
          )
        ).toBeLessThanOrEqual(MAX_DROP_RADIUS);
        expect(isWalkable(world, hero[POSITION], hero)).toBe(true);
      }
      moveEntity(world, hero, origin);
    });

    it("places one walkable jetty cell in the cave's lower lake", () => {
      const level = world.metadata.gameEntity[LEVEL];
      const cells: string[][] = level.cells;
      const x = cells.findIndex((column) => column.includes("worm_bait"));
      expect(x).toBeGreaterThanOrEqual(0);
      const centerY = normalize(cells[x].indexOf("worm_bait") + 4, level.size);
      expect(level.cells[x][centerY]).toBe("water_deep");
      expect(level.cells[x][normalize(centerY + 1, level.size)]).toBe(
        "water_shallow"
      );
      for (const offsetY of [2]) {
        const y = normalize(centerY + offsetY, level.size);
        expect(level.cells[x][y]).toBe("jetty_vertical");
        expect(level.objects[x][y]).toEqual([]);
        initializeCell(world, x, y);
        expect(isWalkable(world, { x, y })).toBe(true);
        expect(isImmersible(world, { x, y })).toBe(false);
        for (const offsetX of [-1, 1]) {
          expect(level.cells[normalize(x + offsetX, level.size)][y]).toBe(
            "water_shallow"
          );
        }
      }
      expect(["sand", "beach"]).toContain(
        level.cells[x][normalize(centerY + 3, level.size)]
      );
    });

    it("places the worm sign five cells south of the lake center", () => {
      const level = world.metadata.gameEntity[LEVEL];
      const cells: string[][] = level.cells;
      const x = cells.findIndex((column) => column.includes("worm_bait"));
      const centerY = normalize(cells[x].indexOf("worm_bait") + 4, level.size);
      const signY = cells[x].indexOf("worm_sign");
      initializeCell(world, x, signY);
      const sign = assertIdentifierAndComponents(world, "worm_sign", [
        POSITION,
      ]);
      expect(sign[POSITION]).toEqual({
        x,
        y: normalize(centerY + 5, level.size),
      });
    });

    it("keeps ambient mobs and golems away from the worm cave edge while retaining island mobs", () => {
      const level = world.metadata.gameEntity[LEVEL];
      const cells: string[][] = level.cells;
      const x = cells.findIndex((column) => column.includes("worm_bait"));
      const center = {
        x,
        y: normalize(cells[x].indexOf("worm_bait") + 4, level.size),
      };
      const mobs = new Set([
        "golem",
        ...Object.values(islandNpcDistribution).flatMap((distribution) =>
          Object.keys(distribution)
        ),
      ]);
      const nearby = pixelCircle(
        center,
        wormRadius + 3,
        undefined,
        true
      ).flatMap((point) => {
        const px = normalize(point.x, level.size),
          py = normalize(point.y, level.size);
        return [level.cells[px][py], ...(level.objects[px][py] || [])].filter(
          (cell) => mobs.has(cell)
        );
      });
      expect(nearby).toEqual([]);
      expect(
        level.objects.some((column) =>
          column.some((objects) => objects?.some((cell) => mobs.has(cell)))
        )
      ).toBe(true);
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
