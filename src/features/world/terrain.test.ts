import {
  advanceUntil,
  createAreaWorld,
  findEntityAt,
  FRAME,
  getEntitiesAt,
  step,
} from "../../testing/harness";
import { getBumpMotion, sampleMotion } from "../../engine/motion";
import { AFFECTABLE } from "../../engine/components/affectable";
import { COVERABLE } from "../../engine/components/coverable";
import { MOVABLE } from "../../engine/components/movable";
import { POSITION } from "../../engine/components/position";
import { SWIMMABLE } from "../../engine/components/swimmable";
import { moveEntity } from "../../engine/systems/map";
import { NPC } from "../../engine/components/npc";
import { LIGHT } from "../../engine/components/light";
import { getHasteInterval } from "../../engine/systems/movement";
import { IMMERSIBLE } from "../../engine/components/immersible";
import {
  coverSnow,
  isSnowy,
  freezeTerrain,
  thawTerrain,
} from "../../engine/systems/freeze";
import { isImmersible } from "../../engine/systems/immersion";
import { sum } from "../../game/math/std";
import { assertUnit, hold, measureSteps } from "./helpers";

const terrainArea = (terrain: string) => `
|                |
|  ♀${terrain.repeat(8)}     |
|                |
`;

describe("terrain", () => {
  it.each([
    ["faster on paths", "▒", 3],
    ["slower on sand", "░", -2],
    ["slower in shallow water", "~", -6],
  ])("walks %s", (_, terrain, tempo) => {
    const world = createAreaWorld(terrainArea(terrain));
    const interval = getHasteInterval(world, tempo + 2);

    // skip steps that start on the plain ground
    const steps = measureSteps(world, "right", 7).slice(3);
    const average = (sum(steps) * FRAME) / steps.length;

    expect(Math.abs(average - interval)).toBeLessThan(FRAME);
  });

  it("can only step towards shore when thawing water surrounds it", () => {
    const world = createAreaWorld(`
|♀          |
| ~~~~~~~~~ |
| ~~~~~~~~~ |
| ~~~~~~~~~ |
| ~~~~~~~~~ |
| ~~~~~~~~~ |
| ~~~~~~~~~ |
| ~~~~~~~~~ |
|           |
`);
    const hero = assertUnit(world);
    const center = { x: 5, y: 3 };
    const ice = findEntityAt(world, center, [IMMERSIBLE])!;
    freezeTerrain(world, ice);
    moveEntity(world, hero, center);
    thawTerrain(world, ice);
    hold(world, ["down"]);
    step(world, 45);
    expect(hero[POSITION]).toEqual(center);
    hold(world, ["up"]);
    advanceUntil(world, () => hero[POSITION].y === 0, 3000);
  });

  it("flies over ice without accumulating momentum", () => {
    const world = createAreaWorld(terrainArea("%"));
    const hero = assertUnit(world);
    hero[MOVABLE].flying = true;
    hold(world, ["right"]);
    advanceUntil(world, () => hero[POSITION].x === 3, 1000);
    hold(world, []);
    step(world, 45);
    expect(hero[POSITION].x).toBe(3);
    expect(hero[MOVABLE].momentum).toBeUndefined();
  });

  it("slides over ice until reaching solid ground", () => {
    const world = createAreaWorld(`
|            |
|  ♀%%%      |
|            |
`);
    const hero = assertUnit(world);

    hold(world, ["right"]);
    advanceUntil(world, () => hero[POSITION].x === 3, 1000);
    hold(world, []);
    advanceUntil(world, () => !hero[MOVABLE].momentum, 3000);
    step(world, 30);

    expect(hero[POSITION]).toEqual({ x: 6, y: 1 });
  });

  it("stops sliding in front of an obstacle on ice", () => {
    const world = createAreaWorld(`
|            |
|  ♀%%%█     |
|            |
`);
    const hero = assertUnit(world);

    hold(world, ["right"]);
    advanceUntil(world, () => hero[POSITION].x === 3, 1000);
    hold(world, []);
    step(world, 60);

    expect(hero[POSITION]).toEqual({ x: 5, y: 1 });
    expect(hero[MOVABLE].momentum).toBeUndefined();
  });

  it("cannot steer while sliding over ice", () => {
    const world = createAreaWorld(`
|            |
|  ♀%%%      |
|            |
`);
    const hero = assertUnit(world);

    hold(world, ["right"]);
    advanceUntil(world, () => hero[POSITION].x === 3, 1000);
    expect(hero[AFFECTABLE].freeze).toBeGreaterThan(0);

    hold(world, ["down"]);
    advanceUntil(world, () => !hero[MOVABLE].momentum, 3000);
    hold(world, []);

    expect(hero[POSITION]).toEqual({ x: 6, y: 1 });
  });

  it("clears snow before stepping on it", () => {
    const world = createAreaWorld(terrainArea("+"));
    const hero = assertUnit(world);
    const snow = { x: 3, y: 1 };
    const isSnowy = () =>
      getEntitiesAt(world, snow).some(
        (entity) => entity[COVERABLE]?.type === "snow"
      );
    expect(isSnowy()).toBe(true);

    hold(world, ["right"]);
    advanceUntil(world, () => !isSnowy(), 1000);
    expect(hero[POSITION]).toEqual({ x: 2, y: 1 });
    const bump = getBumpMotion(hero)!;
    expect(bump).toBeDefined();
    expect(sampleMotion(bump, world.metadata.elapsed).x).toBeGreaterThan(0);
    expect(sampleMotion(bump, bump.startedAt).x).toBeCloseTo(0.225);

    advanceUntil(world, () => hero[POSITION].x === 3, 1000);
    hold(world, []);
  });

  it("swims in water and walks again on land", () => {
    const world = createAreaWorld(terrainArea("~"));
    const hero = assertUnit(world);

    hold(world, ["right"]);
    advanceUntil(world, () => hero[POSITION].x === 3, 1000);
    step(world);
    expect(hero[SWIMMABLE].swimming).toBe(true);

    hold(world, ["left"]);
    advanceUntil(world, () => hero[POSITION].x === 2, 1000);
    hold(world, []);
    step(world);

    expect(hero[SWIMMABLE].swimming).toBe(false);
  });

  it("swims into deep water along the shore", () => {
    const world = createAreaWorld(terrainArea("≈"));
    const hero = assertUnit(world);

    hold(world, ["right"]);
    advanceUntil(world, () => hero[POSITION].x === 4, 2000);
    hold(world, []);
    step(world);

    expect(hero[SWIMMABLE].swimming).toBe(true);
    expect(findEntityAt(world, hero[POSITION], [SWIMMABLE])).toBe(hero);
  });

  it("keeps natural snow off occupants but lets a spell freeze the terrain underneath", () => {
    const layout = `| ♀≈≈≈█0 |`;
    const world = createAreaWorld(layout);
    const hero = assertUnit(world);
    const wall = findEntityAt(world, { x: 5, y: 0 }, [LIGHT])!;
    const eye = findEntityAt(world, { x: 6, y: 0 }, [NPC, POSITION])!;
    coverSnow(world, eye[POSITION]);
    expect(isSnowy(world, eye[POSITION])).toBe(false);
    for (const [index, occupant] of [hero, wall, eye].entries()) {
      const position = { x: 2 + index, y: 0 };
      const water = findEntityAt(world, position, [IMMERSIBLE])!;
      moveEntity(world, occupant, position);
      coverSnow(world, position);
      expect(water[IMMERSIBLE]).toBeDefined();
      freezeTerrain(world, water);
      expect(water[IMMERSIBLE]).toBeUndefined();
      expect(isSnowy(world, position)).toBe(false);
    }
  });

  it("walks over frozen water and swims again once it thaws", () => {
    const world = createAreaWorld(`
|            |
|  ~~~~~~~   |
|  ♀≈≈≈≈≈█   |
|  ~~~~~~~   |
|            |
`);
    const hero = assertUnit(world);
    const lake = [3, 4, 5, 6, 7].map(
      (x) => findEntityAt(world, { x, y: 2 }, [IMMERSIBLE])!
    );

    lake.forEach((water) => freezeTerrain(world, water));
    hold(world, ["right"]);
    advanceUntil(world, () => hero[POSITION].x === 5, 3000);
    hold(world, []);
    advanceUntil(world, () => !hero[MOVABLE].momentum, 3000);
    expect(hero[POSITION]).toEqual({ x: 7, y: 2 });
    expect(hero[SWIMMABLE].swimming).toBe(false);

    lake.forEach((water) => thawTerrain(world, water));
    step(world);

    expect(isImmersible(world, hero[POSITION])).toBe(true);
    expect(hero[SWIMMABLE].swimming).toBe(true);
  });
});
