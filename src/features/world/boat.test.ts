import {
  advanceUntil,
  createAreaWorld,
  giveItems,
  step,
  trigger,
} from "../../testing/harness";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { INVENTORY } from "../../engine/components/inventory";
import { ITEM } from "../../engine/components/item";
import { MOUNTABLE } from "../../engine/components/mountable";
import { MOVABLE } from "../../engine/components/movable";
import { PLAYER } from "../../engine/components/player";
import { POSITION } from "../../engine/components/position";
import { TypedEntity } from "../../engine/entities";
import { playedSounds, resetPlayedSounds } from "../../testing/env";
import { isMounting } from "../../engine/systems/vessel";
import { addCell, assertUnit, hold } from "./helpers";

// boat is placed on the water right of the hero
const area = `
|                |
|   ≈≈≈≈≈≈≈≈     |
|  ♀≈≈≈≈≈≈≈≈     |
|   ≈≈≈≈≈≈≈≈     |
|                |
`;

const shore = { x: 10, y: 2 };

const setup = (map = area) => {
  const world = createAreaWorld(map);
  const boat = addCell(world, { x: 3, y: 2 }, "boat") as TypedEntity<
    "MOUNTABLE" | "MOVABLE" | "POSITION"
  >;
  const hero = assertUnit(world);
  step(world, 15);
  return { world, boat, hero };
};

const mount = (world: ReturnType<typeof setup>["world"]) => {
  trigger(world, "interact");
  advanceUntil(world, () => isMounting(world, assertUnit(world)), 1000);
};

// steering is a single command per key press
const steer = (
  world: ReturnType<typeof setup>["world"],
  orientation: "left" | "right" | "up" | "down"
) => {
  const hero = assertUnit(world);
  hold(world, [orientation]);
  advanceUntil(world, () => hero[MOVABLE].orientations.length === 0, 1000);
  hold(world, []);
};

describe("boats", () => {
  it("washes through water while sailing and only bubbles when starting or stopping", () => {
    const { world, boat } = setup(`
|                            |
|   ≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈     |
|  ♀≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈     |
|   ≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈     |
|                            |
`);
    mount(world);
    resetPlayedSounds();
    steer(world, "right");
    expect(playedSounds).toContain("bubble");
    advanceUntil(world, () => boat[POSITION].x === 5, 2000);
    resetPlayedSounds();
    advanceUntil(world, () => boat[POSITION].x === 12, 3000);
    expect(playedSounds.filter((sound) => sound === "sail")).toHaveLength(1);
    expect(playedSounds).not.toContain("bubble");
    resetPlayedSounds();
    steer(world, "left");
    expect(playedSounds).toContain("bubble");
    resetPlayedSounds();
    step(world, 30);
    expect(playedSounds).not.toContain("sail");
    expect(playedSounds).not.toContain("bubble");
  });

  it("boards an adjacent boat", () => {
    const { world, boat, hero } = setup();

    mount(world);

    expect(hero[POSITION]).toEqual(boat[POSITION]);
    expect(hero[PLAYER].mount).toBe(world.getEntityId(boat));
    expect(boat[MOUNTABLE].passenger).toBe(world.getEntityId(hero));
  });

  it("keeps a blocked empty boat silent", () => {
    const { world, hero, boat } = setup(`
|                |
|   ≈≈≈≈≈≈≈≈     |
|  ♀≈█≈≈≈≈≈≈     |
|   ≈≈≈≈≈≈≈≈     |
|                |
`);
    resetPlayedSounds();
    hold(world, ["right"]);
    step(world, 30);
    hold(world, []);
    expect(hero[POSITION]).toEqual({ x: 2, y: 2 });
    expect(boat[POSITION]).toEqual({ x: 3, y: 2 });
    expect(
      playedSounds.filter((sound) =>
        ["push", "sail", "bubble"].includes(String(sound))
      )
    ).toEqual([]);
  });

  it("pushes an empty boat instead of boarding it", () => {
    const { world, hero, boat } = setup();

    hold(world, ["right"]);
    advanceUntil(world, () => hero[POSITION].x === 3, 1000);
    hold(world, []);
    step(world, 30);

    expect(boat[POSITION]).toEqual({ x: 4, y: 2 });
    expect(isMounting(world, hero)).toBe(false);
  });

  it("keeps sailing in the steered direction until reaching the shore", () => {
    const { world, boat, hero } = setup();
    mount(world);

    steer(world, "right");
    advanceUntil(world, () => boat[POSITION].x === shore.x, 3000);
    step(world, 30);

    expect(boat[POSITION]).toEqual(shore);
    expect(hero[POSITION]).toEqual(shore);
    expect(boat[MOVABLE].orientations).toEqual([]);
    expect(isMounting(world, hero)).toBe(true);
  });

  it("stops sailing when steering backwards", () => {
    const { world, boat, hero } = setup();
    mount(world);

    steer(world, "right");
    advanceUntil(world, () => boat[POSITION].x === 5, 2000);
    steer(world, "left");
    step(world, 30);

    expect(boat[POSITION]).toEqual({ x: 5, y: 2 });
    expect(hero[POSITION]).toEqual({ x: 5, y: 2 });
  });

  it("changes course when steering sideways", () => {
    const { world, boat } = setup();
    mount(world);

    steer(world, "right");
    advanceUntil(world, () => boat[POSITION].x === 5, 2000);
    resetPlayedSounds();
    steer(world, "down");
    expect(playedSounds).toContain("bubble");
    advanceUntil(world, () => boat[MOVABLE].orientations.length === 0, 2000);

    expect(boat[POSITION]).toEqual({ x: 5, y: 3 });
  });

  it("leaves the boat at the shore when steering onto land", () => {
    const { world, boat, hero } = setup();
    mount(world);
    steer(world, "right");
    advanceUntil(world, () => boat[POSITION].x === shore.x, 3000);
    step(world, 30);

    hold(world, ["right"]);
    advanceUntil(world, () => hero[POSITION].x === shore.x + 1, 2000);
    hold(world, []);

    expect(isMounting(world, hero)).toBe(false);
    expect(boat[MOUNTABLE].passenger).toBeUndefined();
    expect(boat[POSITION]).toEqual(shore);
  });

  it("stows the weapon while sailing", () => {
    const { world, boat, hero } = setup();
    const armed = world.assertComponents(hero, [
      EQUIPPABLE,
      INVENTORY,
      POSITION,
    ]);
    const [sword] = giveItems(world, armed, [
      { weapon: "sword", material: "iron", amount: 1 },
    ]);
    const weapon = world.assertByIdAndComponents(armed[EQUIPPABLE].weapon, [
      ITEM,
    ]);
    expect(sword).toBe(weapon);

    mount(world);
    expect(weapon[ITEM].amount).toBe(0);

    steer(world, "right");
    advanceUntil(world, () => boat[POSITION].x === shore.x, 3000);
    step(world, 30);
    hold(world, ["right"]);
    advanceUntil(world, () => !isMounting(world, hero), 1000);
    hold(world, []);

    expect(weapon[ITEM].amount).toBe(1);
  });
});
