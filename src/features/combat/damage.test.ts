import { createAreaWorld } from "../../testing/harness";
import {
  emptyUnitStats,
  STATS,
  UnitStats,
} from "../../engine/components/stats";
import { calculateDamage } from "../../engine/systems/damage";

const area = `
|♀ |
`;

const unit = (stats: Partial<UnitStats> = {}) => ({
  [STATS]: { ...emptyUnitStats, hp: 10, maxHp: 10, ...stats },
});

describe("damage formula", () => {
  const world = createAreaWorld(area);

  it.each([
    [3, 0, 7],
    [3, 1, 8],
    [3, 3, 9.5],
    [3, 5, 9.75],
  ])("deals melee %i against armor %i", (melee, armor, hp) => {
    expect(calculateDamage(world, { melee }, unit(), unit({ armor })).hp).toBe(
      hp
    );
  });

  it("adds attacker power to melee and ignores resist", () => {
    const { damage, hp } = calculateDamage(
      world,
      { melee: 2 },
      unit({ power: 2 }),
      unit({ armor: 1, resist: 5 })
    );

    expect(damage).toBe(3);
    expect(hp).toBe(7);
  });

  it("adds attacker wisdom to magic and reduces it by resist", () => {
    const { damage, hp } = calculateDamage(
      world,
      { magic: 2 },
      unit({ wisdom: 2, power: 5 }),
      unit({ resist: 1, armor: 5 })
    );

    expect(damage).toBe(3);
    expect(hp).toBe(7);
  });

  it("deals true damage regardless of armor and resist", () => {
    const { damage, hp } = calculateDamage(
      world,
      { true: 2 },
      unit({ power: 5, wisdom: 5 }),
      unit({ armor: 5, resist: 5 })
    );

    expect(damage).toBe(2);
    expect(hp).toBe(8);
  });

  it("deals no damage without an attack value", () => {
    expect(calculateDamage(world, {}, unit({ power: 5 }), unit())).toEqual({
      damage: 0,
      hp: 10,
    });
  });

  it("never reduces hp below zero", () => {
    expect(calculateDamage(world, { true: 15 }, unit(), unit())).toEqual({
      damage: 15,
      hp: 0,
    });
  });

  it("shows a point of damage only when a full hp point is lost", () => {
    const defender = unit({ armor: 3 });

    const first = calculateDamage(world, { melee: 3 }, unit(), defender);
    defender[STATS].hp = first.hp;
    const second = calculateDamage(world, { melee: 3 }, unit(), defender);

    expect(first).toEqual({ damage: 1, hp: 9.5 });
    expect(second).toEqual({ damage: 0, hp: 9 });
  });

  it("keeps a unit with less than one hp visibly alive", () => {
    const { damage, hp } = calculateDamage(
      world,
      { melee: 1 },
      unit(),
      unit({ hp: 1, armor: 2 })
    );

    expect(hp).toBeCloseTo(2 / 3);
    expect(damage).toBe(0);
  });
});
