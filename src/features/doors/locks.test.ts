import {
  createAreaWorld,
  findEntityAt,
  findInArea,
  giveItems,
  GivenItem,
  holdMove,
  step,
  walk,
  advanceUntil,
} from "../../testing/harness";
import { playedSounds } from "../../testing/env";
import { ACTIONABLE } from "../../engine/components/actionable";
import { ATTACKABLE } from "../../engine/components/attackable";
import { LOCKABLE } from "../../engine/components/lockable";
import { MOVABLE } from "../../engine/components/movable";
import { NPC } from "../../engine/components/npc";
import { POSITION } from "../../engine/components/position";
import { STATS } from "../../engine/components/stats";
import { World } from "../../engine";
import { getLock, getPrompt, interact, setup } from "./helpers";

// ♀ hero, D lock
const area = `
|        |
|  ♀D    |
|        |
`;

const tryWalkRight = (world: World) => {
  holdMove(world, ["right"]);
  step(world, 15);
  holdMove(world, []);
  step(world, 10);
};

const freeLocks = [
  "wood_door",
  "guide_door",
  "nomad_door",
  "wood_port",
  "wood_entry",
  "fence_door",
  "fence_door_path",
  "palisade_door",
  "palisade_door_path",
];

const keyLocks: [string, GivenItem][] = [
  ["iron_door", { consume: "key", material: "iron", amount: 1 }],
  ["gold_door", { consume: "key", material: "gold", amount: 1 }],
  ["earth_door", { consume: "key", element: "earth", amount: 1 }],
  ["iron_port", { consume: "key", material: "iron", amount: 1 }],
  ["fire_port", { consume: "key", element: "fire", amount: 1 }],
  ["iron_entry", { consume: "key", material: "iron", amount: 1 }],
  ["gold_entry", { consume: "key", material: "gold", amount: 1 }],
];

describe("lock kinds", () => {
  it.each(freeLocks)("opens a locked %s without a key", (cell) => {
    const { world, hero } = setup(area, { legend: { D: cell } });
    const lock = getLock(world, area, "D");
    const start = { ...hero[POSITION] };

    expect(lock[LOCKABLE].locked).toBe(true);
    tryWalkRight(world);
    expect(hero[POSITION]).toEqual(start);

    interact(world);

    expect(lock[LOCKABLE].locked).toBe(false);
    expect(playedSounds).toContain("door");
    walk(world, "right", 2);
    expect(hero[POSITION].x).toBe(lock[POSITION].x + 1);
  });

  it.each(keyLocks)("opens a locked %s only with its key", (cell, key) => {
    const { world, hero } = setup(area, { legend: { D: cell } });
    const lock = getLock(world, area, "D");
    const start = { ...hero[POSITION] };

    interact(world, 30);
    expect(lock[LOCKABLE].locked).toBe(true);
    expect(playedSounds).toContain("deny");
    tryWalkRight(world);
    expect(hero[POSITION]).toEqual(start);

    giveItems(world, hero, [key]);
    interact(world);
    advanceUntil(world, () => !lock[LOCKABLE].locked, 1000);

    walk(world, "right", 2);
    expect(hero[POSITION].x).toBe(lock[POSITION].x + 1);
  });

  it.each(["entrance", "fire_entrance"])(
    "hurts the hero bumping into a locked %s",
    (cell) => {
      const { world, hero } = setup(area, { legend: { D: cell } });
      const lock = getLock(world, area, "D");
      const { hp } = hero[STATS];
      const start = { ...hero[POSITION] };

      tryWalkRight(world);

      expect(hero[POSITION]).toEqual(start);
      expect(hero[STATS].hp).toBeLessThan(hp);
      expect(lock[LOCKABLE].locked).toBe(true);
    }
  );

  it("opens a locked entrance without a key", () => {
    const { world, hero } = setup(area, { legend: { D: "entrance" } });
    const lock = getLock(world, area, "D");

    interact(world);

    expect(lock[LOCKABLE].locked).toBe(false);
    walk(world, "right", 2);
    expect(hero[POSITION].x).toBe(lock[POSITION].x + 1);
  });

  it("starts with a plain entry already open", () => {
    const { world, hero } = setup(area, { legend: { D: "entry" } });
    const lock = getLock(world, area, "D");

    expect(lock[LOCKABLE].locked).toBe(false);
    expect(hero[ACTIONABLE].unlock).toBeUndefined();
    expect(getPrompt(world, lock)).toBeUndefined();

    walk(world, "right", 2);
    expect(hero[POSITION].x).toBe(lock[POSITION].x + 1);
  });

  it("offers nothing to open on an unlocked door", () => {
    const { world, hero } = setup(area, { legend: { D: "wood_door" } });
    const lock = getLock(world, area, "D");

    interact(world);

    expect(hero[ACTIONABLE].unlock).toBeUndefined();
    expect(getPrompt(world, lock)).toBeUndefined();
  });

  it.each(["fence", "palisade", "barrier", "iron", "gold"])(
    "can't open a %s",
    (cell) => {
      const { world, hero } = setup(area, { legend: { D: cell } });

      expect(
        findEntityAt(world, findInArea(area, "D"), [LOCKABLE])
      ).toBeUndefined();
      expect(hero[ACTIONABLE].unlock).toBeUndefined();
    }
  );
});

describe("open locks", () => {
  it("lets the hero stop inside an open gate", () => {
    const { world, hero } = setup(area, { legend: { D: "fence_door" } });
    const lock = getLock(world, area, "D");
    interact(world);

    walk(world, "right");
    step(world, 30);

    expect(hero[POSITION].x).toBe(lock[POSITION].x);
  });

  it.each(["fence_door", "palisade_door", "entrance"])(
    "can't attack an open %s any more",
    (cell) => {
      const { world } = setup(area, { legend: { D: cell } });
      const lock = getLock(world, area, "D");

      expect(lock).toHaveProperty(ATTACKABLE);
      expect(lock).toHaveProperty(STATS);

      interact(world);

      expect(lock).not.toHaveProperty(ATTACKABLE);
      expect(lock).not.toHaveProperty(STATS);
    }
  );

  it("can attack a fire entrance until its fire key opens it", () => {
    const { world, hero } = setup(area, { legend: { D: "fire_entrance" } });
    const lock = getLock(world, area, "D");

    interact(world, 30);
    expect(lock).toHaveProperty(ATTACKABLE);

    giveItems(world, hero, [{ consume: "key", element: "fire", amount: 1 }]);
    interact(world);
    advanceUntil(world, () => !lock[LOCKABLE].locked, 1000);

    expect(lock).not.toHaveProperty(ATTACKABLE);
    walk(world, "right", 2);
    expect(hero[POSITION].x).toBe(lock[POSITION].x + 1);
  });
});

describe("roaming units and open locks", () => {
  // ◀ prism roaming in a closed corridor, D at the corridor's end
  const corridor = `
|███████████|
|█    ◀  D █|
|███████████|
|           |
| ♀         |
`;

  const getVisited = (cell: string) => {
    const world = createAreaWorld(corridor, { legend: { D: cell } });
    const prism = findEntityAt(world, findInArea(corridor, "◀"), [
      NPC,
      MOVABLE,
      POSITION,
    ])!;
    const visited = new Set<number>();
    for (let frame = 0; frame < 300; frame += 1) {
      step(world);
      visited.add(prism[POSITION].x);
    }
    return visited;
  };

  it("roams up to the end of an empty corridor", () => {
    expect(getVisited("air")).toContain(findInArea(corridor, "D").x);
  });

  it("doesn't roam through an open entry", () => {
    expect(getVisited("entry")).not.toContain(findInArea(corridor, "D").x);
  });
});
