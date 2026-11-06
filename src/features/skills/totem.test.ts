import { World } from "../../engine";
import { CASTABLE } from "../../engine/components/castable";
import { EXERTABLE } from "../../engine/components/exertable";
import { Material } from "../../engine/components/item";
import { POSITION } from "../../engine/components/position";
import { STATS } from "../../engine/components/stats";
import { getPendingTotem } from "../../engine/systems/action";
import { getEntityStats, isDead } from "../../engine/systems/damage";
import { playedSounds, resetPlayedSounds } from "../../testing/env";
import {
  act,
  advance,
  advanceUntil,
  countItems,
  face,
  getMessages,
  walk,
} from "../../testing/harness";
import { setupHero } from "./helpers";

const area = `
|               |
|               |
|               |
|       ♀       |
|               |
|               |
|               |
`;

const setup = (material: Material = "wood", charges = 2) => {
  const { world, hero } = setupHero(
    area,
    [
      { skill: "totem", material, amount: 1 },
      ...(charges > 0
        ? [{ stackable: "charge" as const, amount: charges }]
        : []),
    ],
    { size: 16 }
  );
  face(world, "right");
  return { world, hero };
};

const getTotems = (world: World) =>
  world
    .getEntities([CASTABLE, EXERTABLE, POSITION, STATS])
    .filter((entity) => !isDead(world, entity));

describe("totem", () => {
  it("spends a charge to summon a totem in front of the hero", () => {
    const { world, hero } = setup();

    act(world, "skill");

    expect(playedSounds).toContain("totem");
    expect(countItems(world, hero, { stackable: "charge" })).toBe(1);
    const totems = getTotems(world);
    expect(totems).toHaveLength(1);
    expect(totems[0][POSITION]).toEqual({
      x: hero[POSITION].x + 1,
      y: hero[POSITION].y,
    });
  });

  it("raises attributes of the hero within its aura", () => {
    const { world, hero } = setup();
    const before = getEntityStats(world, hero);

    act(world, "skill");
    advance(world, 100);
    const buffed = getEntityStats(world, hero);

    expect(buffed.power).toBe(before.power + 1);
    expect(buffed.wisdom).toBe(before.wisdom + 1);
    expect(buffed.armor).toBe(before.armor + 1);
    expect(buffed.resist).toBe(before.resist + 1);
  });

  it("does not raise attributes outside of its aura", () => {
    const { world, hero } = setup();
    const before = getEntityStats(world, hero);
    act(world, "skill");

    walk(world, "left", 6);

    expect(getEntityStats(world, hero).power).toBe(before.power);
  });

  it("ignores summoning again while the totem is still rising", () => {
    const { world, hero } = setup();
    act(world, "skill");
    resetPlayedSounds();

    act(world, "skill");

    expect(getPendingTotem(world, hero)).toBeDefined();
    expect(countItems(world, hero, { stackable: "charge" })).toBe(1);
    expect(getTotems(world)).toHaveLength(1);
    expect(playedSounds).not.toContain("deny");
  });

  it("summons another totem once the first one stands", () => {
    const { world, hero } = setup();
    act(world, "skill");
    advanceUntil(world, () => !getPendingTotem(world, hero), 2000);

    face(world, "left");
    act(world, "skill");

    expect(countItems(world, hero, { stackable: "charge" })).toBe(0);
    expect(getTotems(world)).toHaveLength(2);
  });

  it.each([
    ["wood", 10],
    ["iron", 15],
    ["gold", 20],
    ["diamond", 25],
    ["ruby", 30],
  ] as const)("%s totem starts with %i health", (material, hp) => {
    const { world } = setup(material);

    act(world, "skill");

    expect(getTotems(world)[0][STATS].maxHp).toBe(hp);
  });

  it("crumbles over time and its aura ends", () => {
    const { world, hero } = setup();
    const before = getEntityStats(world, hero);
    act(world, "skill");
    const [totem] = getTotems(world);

    advance(world, 2500);
    expect(isDead(world, totem)).toBeFalsy();
    expect(totem[STATS].hp).toBeLessThan(totem[STATS].maxHp);

    advanceUntil(world, () => isDead(world, totem), 2000);
    advance(world, 1000);
    expect(getEntityStats(world, hero).power).toBe(before.power);
  });

  it("refuses without charges", () => {
    const { world, hero } = setup("wood", 0);

    act(world, "skill");

    expect(playedSounds).toContain("deny");
    expect(getMessages(world, hero)).toContainEqual(
      expect.stringMatching(/^Need .Charge!$/)
    );
    expect(getTotems(world)).toHaveLength(0);
  });
});
