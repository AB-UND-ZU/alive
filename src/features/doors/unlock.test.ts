import {
  advanceUntil,
  countItems,
  giveItems,
  holdMove,
  step,
  walk,
} from "../../testing/harness";
import { playedSounds } from "../../testing/env";
import { entities } from "../../engine";
import { ACTIONABLE } from "../../engine/components/actionable";
import { LOCKABLE } from "../../engine/components/lockable";
import { POSITION } from "../../engine/components/position";
import { STATS } from "../../engine/components/stats";
import { barrierSide } from "../../game/assets/sprites";
import { getItemSprite } from "../../game/assets/utils";
import { getSequence } from "../../engine/systems/sequence";
import { lockDoor } from "../../engine/systems/trigger";
import {
  assertPlayer,
  getLock,
  getMessageIcons,
  getMessages,
  getPrompt,
  interact,
  interactAsPlayer,
  setup,
} from "./helpers";

// ♀ hero, D door
const area = `
|        |
|  ♀D    |
|        |
`;

const setupDoor = (door: string) => {
  const { world, hero } = setup(area, { legend: { D: door } });
  return { world, hero, lock: getLock(world, area, "D") };
};

const tryWalkRight = (world: ReturnType<typeof setup>["world"]) => {
  holdMove(world, ["right"]);
  step(world, 15);
  holdMove(world, []);
  step(world, 10);
};

describe("unlocking doors", () => {
  it("opens a wood door without a key", () => {
    const { world, hero, lock } = setupDoor("wood_door");

    expect(hero[ACTIONABLE].unlock).toBe(world.getEntityId(lock));
    interact(world);

    expect(lock[LOCKABLE].locked).toBe(false);
    expect(playedSounds).toContain("door");
    walk(world, "right", 2);
    expect(hero[POSITION].x).toBe(lock[POSITION].x + 1);
  });

  it("refuses an iron door without a key and keeps blocking the way", () => {
    const { world, hero, lock } = setupDoor("iron_door");
    const start = { ...hero[POSITION] };

    interact(world, 30);

    expect(lock[LOCKABLE].locked).toBe(true);
    expect(playedSounds).toContain("deny");
    expect(getMessages(world, hero)).toEqual(["Need Key!"]);
    expect(getMessageIcons(world, hero)).toEqual([
      [getItemSprite({ consume: "key", material: "iron" }, "display")],
    ]);

    tryWalkRight(world);
    expect(hero[POSITION]).toEqual(start);
  });

  it("unlocks an iron door with an iron key after the unlock animation", () => {
    const { world, hero, lock } = setupDoor("iron_door");
    giveItems(world, hero, [{ consume: "key", material: "iron", amount: 1 }]);

    interact(world);

    expect(countItems(world, hero, { consume: "key" })).toBe(0);
    expect(getSequence(world, lock, "unlock")).toBeDefined();
    expect(lock[LOCKABLE].locked).toBe(true);
    expect(playedSounds).not.toContain("door");

    advanceUntil(world, () => !lock[LOCKABLE].locked, 1000);
    expect(playedSounds).toEqual(expect.arrayContaining(["unlock", "door"]));
    expect(playedSounds.indexOf("unlock")).toBeLessThan(
      playedSounds.indexOf("door")
    );

    step(world, 5);
    expect(getSequence(world, lock, "unlock")).toBeUndefined();
    expect(hero[ACTIONABLE].unlock).toBeUndefined();
    walk(world, "right", 2);
    expect(hero[POSITION].x).toBe(lock[POSITION].x + 1);
  });

  it("refuses a key of another material without consuming it", () => {
    const { world, hero, lock } = setupDoor("gold_door");
    giveItems(world, hero, [{ consume: "key", material: "iron", amount: 1 }]);

    interact(world, 30);

    expect(lock[LOCKABLE].locked).toBe(true);
    expect(playedSounds).toContain("deny");
    expect(getMessageIcons(world, hero)).toEqual([
      [getItemSprite({ consume: "key", material: "gold" }, "display")],
    ]);
    expect(countItems(world, hero, { consume: "key", material: "iron" })).toBe(
      1
    );
  });

  it("unlocks a gold door with a gold key", () => {
    const { world, hero, lock } = setupDoor("gold_door");
    giveItems(world, hero, [{ consume: "key", material: "gold", amount: 1 }]);

    interact(world);
    advanceUntil(world, () => !lock[LOCKABLE].locked, 1000);

    expect(countItems(world, hero, { consume: "key" })).toBe(0);
  });

  it("needs a key of the same element for an element door", () => {
    const { world, hero, lock } = setupDoor("earth_door");
    giveItems(world, hero, [
      { consume: "key", material: "iron", amount: 1 },
      { consume: "key", element: "fire", amount: 1 },
    ]);

    interact(world, 30);

    expect(lock[LOCKABLE].locked).toBe(true);
    expect(playedSounds).toContain("deny");
    expect(countItems(world, hero, { consume: "key" })).toBe(2);

    giveItems(world, hero, [{ consume: "key", element: "earth", amount: 1 }]);
    interact(world);
    advanceUntil(world, () => !lock[LOCKABLE].locked, 1000);

    expect(countItems(world, hero, { consume: "key", element: "earth" })).toBe(
      0
    );
    expect(countItems(world, hero, { consume: "key" })).toBe(2);
  });

  it("consumes exactly one key from a stack", () => {
    const { world, hero, lock } = setupDoor("iron_door");
    giveItems(world, hero, [{ consume: "key", material: "iron", amount: 3 }]);

    interact(world);
    advanceUntil(world, () => !lock[LOCKABLE].locked, 1000);

    expect(countItems(world, hero, { consume: "key", material: "iron" })).toBe(
      2
    );
  });

  it("ignores repeated interaction while the unlock animation plays", () => {
    const { world, hero, lock } = setupDoor("iron_door");
    giveItems(world, hero, [{ consume: "key", material: "iron", amount: 2 }]);

    interact(world, 3);
    interact(world, 3);

    expect(countItems(world, hero, { consume: "key" })).toBe(1);
    expect(playedSounds).not.toContain("deny");
    advanceUntil(world, () => !lock[LOCKABLE].locked, 1000);
  });

  it("shows an open prompt with the needed key next to a locked door", () => {
    const { world, lock } = setupDoor("iron_door");

    expect(getPrompt(world, lock)).toBe("OPEN");
    expect(getSequence(world, lock, "interact")?.args.sprite.layers).toEqual(
      expect.arrayContaining(
        getItemSprite({ consume: "key", material: "iron" }).layers
      )
    );
  });

  it("can't unlock a door covered by a barrier", () => {
    const { world, hero, lock } = setupDoor("wood_door");
    entities.createBarrier(world, {
      BLOCKABLE: {},
      COLLIDABLE: {},
      FOG: { visibility: "visible", type: "float", fixed: true },
      ORIENTABLE: { facing: "up" },
      POSITION: { ...lock[POSITION] },
      RENDERABLE: { generation: 0 },
      SPRITE: barrierSide,
    });
    step(world, 5);

    expect(hero[ACTIONABLE].unlock).toBeUndefined();
    expect(getPrompt(world, lock)).toBeUndefined();

    interact(world, 30);
    expect(lock[LOCKABLE].locked).toBe(true);
  });

  it("can't unlock a door while dead", () => {
    const { world, hero, lock } = setupDoor("wood_door");

    hero[STATS].hp = 0;
    step(world, 60);
    const ghost = assertPlayer(world);

    expect(ghost[POSITION]).toEqual(hero[POSITION]);
    expect(ghost[ACTIONABLE].unlock).toBeUndefined();

    interactAsPlayer(world, 30);
    expect(lock[LOCKABLE].locked).toBe(true);
  });

  it("blocks the way again when a scripted door is locked", () => {
    const { world, hero, lock } = setupDoor("wood_door");
    const start = { ...hero[POSITION] };
    interact(world);

    lockDoor(world, lock);
    step(world, 5);

    expect(lock[LOCKABLE].locked).toBe(true);
    expect(hero[ACTIONABLE].unlock).toBe(world.getEntityId(lock));
    tryWalkRight(world);
    expect(hero[POSITION]).toEqual(start);
  });
});
