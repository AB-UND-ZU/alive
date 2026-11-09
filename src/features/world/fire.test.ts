import { Entity } from "ecs";
import { World } from "../../engine";
import { BURNABLE } from "../../engine/components/burnable";
import { PARTICLE } from "../../engine/components/particle";
import { getSequence } from "../../engine/systems/sequence";
import {
  advance,
  advanceUntil,
  createAreaWorld,
  findEntityAt,
  findInArea,
} from "../../testing/harness";

// ♀ hero, * campfire
const camp = `
|        |
|  ♀  *  |
|        |
`;

const getSmokeOffsets = (world: World, fire: Entity) =>
  Object.values(getSequence(world, fire, "smoke")?.particles || {}).map(
    (particleId) =>
      world.assertByIdAndComponents(particleId, [PARTICLE])[PARTICLE].offsetY
  );

describe("fire", () => {
  it("burns a campfire with smoke rising above it", () => {
    const world = createAreaWorld(camp);
    const fire = findEntityAt(world, findInArea(camp, "*"), [BURNABLE])!;

    advance(world, 3000);

    expect(getSequence(world, fire, "burn")).toBeDefined();
    const offsets = getSmokeOffsets(world, fire);
    expect(offsets.length).toBeGreaterThan(0);
    expect(Math.min(...offsets)).toBeLessThan(0);
  });

  it("lets the smoke fade after the fire went out before removing its animation", () => {
    const world = createAreaWorld(camp);
    const fire = findEntityAt(world, findInArea(camp, "*"), [BURNABLE])!;
    advance(world, 3000);
    const frameId = getSequence(world, fire, "smoke")!.reference;
    expect(getSequence(world, fire, "burn")!.reference).toBe(frameId);

    fire[BURNABLE].burning = false;
    advance(world, 100);

    // flames are gone, but remaining smoke keeps their shared animation
    expect(getSequence(world, fire, "burn")).toBeUndefined();
    expect(getSmokeOffsets(world, fire).length).toBeGreaterThan(0);
    expect(world.getEntityById(frameId)).toBeDefined();

    advanceUntil(world, () => !getSequence(world, fire, "smoke"));
    advance(world, 100);

    expect(world.getEntityById(frameId)).toBeUndefined();
  });
});
