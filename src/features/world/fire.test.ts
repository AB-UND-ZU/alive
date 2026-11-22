import { Entity } from "ecs";
import { World } from "../../engine";
import { BURNABLE } from "../../engine/components/burnable";
import { PLAYER } from "../../engine/components/player";
import { SOUL } from "../../engine/components/soul";
import { STATS } from "../../engine/components/stats";
import { REFERENCE } from "../../engine/components/reference";
import { FREEZABLE } from "../../engine/components/freezable";
import {
  coverSnow,
  isCampfireWarm,
  isSnowy,
} from "../../engine/systems/freeze";
import { moveEntity } from "../../engine/systems/map";
import { playedSounds, resetPlayedSounds } from "../../testing/env";
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
  it("attenuates fire for the living hero and the ghost at the same distance", () => {
    const world = createAreaWorld(camp, { size: 64 });
    const hero = world.getEntity([PLAYER, STATS])!;
    const near = findInArea(camp, "♀");
    const far = { x: near.x + 24, y: near.y };
    const hearFire = () => {
      resetPlayedSounds();
      advance(world, 1200);
      return playedSounds.includes("fire");
    };
    expect(hearFire()).toBe(true);
    moveEntity(world, hero, far);
    expect(hearFire()).toBe(false);
    hero[STATS].hp = 0;
    advanceUntil(world, () => !!world.getEntity([PLAYER, SOUL]));
    expect(hearFire()).toBe(false);
    moveEntity(world, world.getEntity([PLAYER, SOUL])!, near);
    expect(hearFire()).toBe(true);
  });

  it("melts one cell every three ticks and shields nearby water across the map edge", () => {
    const layout = `|*%%%    ≈≈  ♀|`;
    const world = createAreaWorld(layout, { size: 32 });
    const near = { x: 8, y: 0 };
    const far = { x: 9, y: 0 };
    expect(isCampfireWarm(world, { x: 31, y: 0 })).toBe(true);
    expect(isCampfireWarm(world, { x: 0, y: 6 })).toBe(false);
    const getIce = () =>
      world.getEntities([FREEZABLE]).filter((e) => e[FREEZABLE].frozen).length;
    expect(getIce()).toBe(3);
    advanceUntil(world, () => getIce() === 2);
    const tick = world.metadata.gameEntity[REFERENCE].tick;
    advance(world, 2 * tick);
    expect(getIce()).toBe(2);
    advance(world, tick);
    expect(getIce()).toBe(1);
    coverSnow(world, near);
    expect(findEntityAt(world, near, [FREEZABLE])![FREEZABLE].frozen).toBe(
      false
    );
    expect(isSnowy(world, near)).toBe(false);
    coverSnow(world, far);
    expect(findEntityAt(world, far, [FREEZABLE])![FREEZABLE].frozen).toBe(true);
    world.getEntity([BURNABLE])![BURNABLE].burning = false;
    coverSnow(world, near);
    expect(findEntityAt(world, near, [FREEZABLE])![FREEZABLE].frozen).toBe(
      true
    );
  });

  it("leaves snow and ice beside an ordinary burning tree", () => {
    const area = `|♀  +#% |`;
    const world = createAreaWorld(area);
    const tree = findEntityAt(world, findInArea(area, "#"), [BURNABLE])!;
    tree[BURNABLE].burning = true;
    advance(world, 3 * world.metadata.gameEntity[REFERENCE].tick);
    expect(getSequence(world, tree, "burn")).toBeDefined();
    expect(isSnowy(world, findInArea(area, "+"))).toBe(true);
    expect(
      findEntityAt(world, findInArea(area, "%"), [FREEZABLE])![FREEZABLE].frozen
    ).toBe(true);
  });

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
