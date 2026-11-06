import {
  advanceUntil,
  countItems,
  findInArea,
  step,
  walk,
} from "../../testing/harness";
import { playedSounds } from "../../testing/env";
import { LOCKABLE } from "../../engine/components/lockable";
import { POSITION } from "../../engine/components/position";
import { getIdentifier } from "../../engine/utils";
import { getLock, interact, setup } from "./helpers";

// ♀ hero, ! iron key, ¡ spawn key, D iron door
const area = `
|          |
|  ♀!¡D    |
|          |
`;

describe("keys on the ground", () => {
  it("picks up iron keys by walking over them", () => {
    const { world, hero } = setup(area, { legend: { D: "iron_door" } });

    walk(world, "right");
    step(world, 30);
    expect(countItems(world, hero, { consume: "key", material: "iron" })).toBe(
      1
    );
    expect(playedSounds).toContain("pickup");

    walk(world, "right");
    step(world, 30);
    expect(countItems(world, hero, { consume: "key", material: "iron" })).toBe(
      2
    );
  });

  it("marks the spawn key container", () => {
    const { world } = setup(area, { legend: { D: "iron_door" } });
    const container = getIdentifier(world, "spawn_key");

    expect(container?.[POSITION]).toEqual(findInArea(area, "¡"));
  });

  it("opens an iron door with a key picked up from the ground", () => {
    const { world, hero } = setup(area, { legend: { D: "iron_door" } });
    const lock = getLock(world, area, "D");

    walk(world, "right", 2);
    step(world, 30);
    interact(world);
    advanceUntil(world, () => !lock[LOCKABLE].locked, 1000);

    expect(countItems(world, hero, { consume: "key" })).toBe(1);
    walk(world, "right", 2);
    expect(hero[POSITION].x).toBe(lock[POSITION].x + 1);
  });
});
