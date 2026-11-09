import {
  advanceUntil,
  countItems,
  findEntityAt,
  findInArea,
  giveItems,
  step,
  trigger,
  walk,
} from "../../testing/harness";
import { saveAndLoad } from "../../testing/saves";
import { playedSounds } from "../../testing/env";
import { World } from "../../engine";
import { ACTIONABLE } from "../../engine/components/actionable";
import { LOCKABLE } from "../../engine/components/lockable";
import { NPC } from "../../engine/components/npc";
import { PLAYER } from "../../engine/components/player";
import { Popup, POPUP } from "../../engine/components/popup";
import { POSITION } from "../../engine/components/position";
import { STATS } from "../../engine/components/stats";
import { createSign } from "../../bindings/creation";
import { createPopup } from "../../engine/systems/popup";
import { getSequence } from "../../engine/systems/sequence";
import { setIdentifier } from "../../engine/utils";
import { getLock, getMessages, interact, setup } from "../doors/helpers";
import { setupHero } from "../items/helpers";

// ♀ hero, D and E iron doors
const doors = `
|           |
|  ♀D  E    |
|           |
`;

// ♀ hero, Q quest giver, ◀ prism as quest target
const quest = `
|           |
|  ♀Q   ◀   |
|           |
`;

const key = { consume: "key", material: "iron", amount: 1 } as const;

const setupDoors = () =>
  setup(doors, { legend: { D: "iron_door", E: "iron_door" } });

const setupQuest = (popup: Partial<Popup>) => {
  const { world, hero } = setup(quest);
  const giver = createSign(world, findInArea(quest, "Q"), []);
  createPopup(world, giver, { tabs: ["quest"], lines: [[]], ...popup });
  step(world, 5);
  return { world, hero, giverId: world.getEntityId(giver) };
};

const press = (world: World, action: "right" | "close") => {
  trigger(world, action);
  step(world, 10);
};

// shows the interaction prompt again, see the todo below
const revisit = (world: World) => {
  walk(world, "left");
  walk(world, "right");
  step(world, 5);
};

const getPrism = (world: World) =>
  findEntityAt(world, findInArea(quest, "◀"), [NPC, STATS])!;

describe("saved doors", () => {
  it("finishes an unlock animation and keeps the key consumed", () => {
    const { world, hero } = setupDoors();
    giveItems(world, hero, [key]);
    interact(world);
    const lockId = world.getEntityId(getLock(world, doors, "D"));
    expect(
      getSequence(world, getLock(world, doors, "D"), "unlock")
    ).toBeDefined();

    const loaded = saveAndLoad(world);
    const lock = loaded.assertByIdAndComponents(lockId, [LOCKABLE, POSITION]);
    const loadedHero = setupHero(loaded);
    expect(lock[LOCKABLE].locked).toBe(true);

    advanceUntil(loaded, () => !lock[LOCKABLE].locked, 1000);
    step(loaded, 5);

    expect(getSequence(loaded, lock, "unlock")).toBeUndefined();
    expect(countItems(loaded, loadedHero, { consume: "key" })).toBe(0);
    walk(loaded, "right", 2);
    expect(loadedHero[POSITION].x).toBe(lock[POSITION].x + 1);
  });

  it("opens another door with the remaining key", () => {
    const { world, hero } = setupDoors();
    giveItems(world, hero, [{ ...key, amount: 2 }]);
    interact(world);
    advanceUntil(world, () => !getLock(world, doors, "D")[LOCKABLE].locked);
    walk(world, "right", 3);
    step(world, 5);

    const loaded = saveAndLoad(world);
    const loadedHero = setupHero(loaded);
    const lock = getLock(loaded, doors, "E");
    expect(countItems(loaded, loadedHero, { consume: "key" })).toBe(1);

    revisit(loaded);
    interact(loaded);
    advanceUntil(loaded, () => !lock[LOCKABLE].locked, 1000);
    expect(countItems(loaded, loadedHero, { consume: "key" })).toBe(0);
  });

  it("refuses an iron door without a key after loading", () => {
    const { world } = setupDoors();

    const loaded = saveAndLoad(world);
    const hero = setupHero(loaded);
    revisit(loaded);
    interact(loaded, 30);

    expect(getLock(loaded, doors, "D")[LOCKABLE].locked).toBe(true);
    expect(getMessages(loaded, hero)).toEqual(["Need Key!"]);
    expect(playedSounds).toContain("deny");
  });

  it("rewards a quest whose target was defeated before saving", () => {
    const { world, hero, giverId } = setupQuest({
      targets: [{ unit: "prism", amount: 1 }],
      deals: [{ item: key, stock: 1, prices: [] }],
    });
    getPrism(world)[STATS].hp = 0;
    advanceUntil(world, () => hero[PLAYER].defeatedUnits.prism === 1, 5000);

    const loaded = saveAndLoad(world);
    const loadedHero = setupHero(loaded);
    revisit(loaded);
    interact(loaded, 30);
    press(loaded, "right");

    expect(countItems(loaded, loadedHero, key)).toBe(1);
    press(loaded, "close");
    expect(loaded.assertById(giverId)).not.toHaveProperty(POPUP);
    expect(loadedHero[ACTIONABLE].popup).toBeUndefined();
  });

  it("keeps guiding to an accepted quest's target", () => {
    const { world } = setupQuest({
      targets: [{ unit: "prism", amount: 1 }],
      focuses: [{ identifier: "target", highlight: "enemy" }],
      deals: [{ item: key, stock: 1, prices: [] }],
    });
    const prismId = world.getEntityId(getPrism(world));
    setIdentifier(world, getPrism(world), "target");
    interact(world, 30);
    press(world, "right");

    const loaded = saveAndLoad(world);
    const hero = setupHero(loaded);
    expect(getSequence(loaded, hero, "quest")?.name).toBe("waypointQuest");

    loaded.assertByIdAndComponents(prismId, [STATS])[STATS].hp = 0;
    advanceUntil(loaded, () => hero[PLAYER].defeatedUnits.prism === 1, 5000);
    revisit(loaded);
    interact(loaded, 30);
    press(loaded, "right");

    expect(countItems(loaded, hero, key)).toBe(1);
  });

  it.todo(
    "accepts interacting with a door or popup whose prompt was shown when saving"
  );
});
