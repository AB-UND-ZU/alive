import { BEHAVIOUR } from "../../engine/components/behaviour";
import { ORIENTABLE } from "../../engine/components/orientable";
import { POSITION } from "../../engine/components/position";
import { PROJECTILE } from "../../engine/components/projectile";
import { STATS } from "../../engine/components/stats";
import { TOOLTIP } from "../../engine/components/tooltip";
import { NpcType } from "../../engine/components/npc";
import { rage } from "../../game/assets/ui";
import { advanceUntil } from "../../testing/harness";
import {
  advanceTicks,
  createCreatureWorld,
  distanceBetween,
  getCreature,
  getSpells,
  toughen,
  trace,
} from "./helpers";

const setup = (
  type: NpcType,
  area = `
|          |
|          |
|♀         |
|          |
|         B|
`
) => {
  const { world, hero } = createCreatureWorld(area, { B: type });
  toughen(hero);
  const bandit = getCreature(world, type);
  return { world, hero, bandit };
};

describe("tutorial boss", () => {
  it("opens the fight with a dash towards the hero", () => {
    const { world, hero, bandit } = setup("tutorialBoss");
    const start = distanceBetween(world, bandit[POSITION], hero[POSITION]);

    advanceUntil(world, () => getSpells(world, bandit).length > 0, 2000);
    advanceUntil(world, () => getSpells(world, bandit).length === 0, 3000);

    expect(
      distanceBetween(world, bandit[POSITION], hero[POSITION])
    ).toBeLessThan(start - 3);
  });

  it("lines up with the hero and shoots arrows at it", () => {
    const { world, hero, bandit } = setup("tutorialBoss");

    advanceUntil(world, () => world.getEntities([PROJECTILE]).length > 0, 8000);
    advanceUntil(world, () => hero[STATS].hp < hero[STATS].maxHp, 3000);

    expect(bandit[POSITION].y).toBe(hero[POSITION].y);
  });

  it("dashes again each time it loses a fifth of its health", () => {
    const { world, bandit } = setup("tutorialBoss");
    advanceUntil(world, () => getSpells(world, bandit).length > 0, 2000);
    advanceUntil(world, () => getSpells(world, bandit).length === 0, 3000);

    advanceTicks(world, 6);
    expect(getSpells(world, bandit)).toHaveLength(0);

    bandit[STATS].hp = Math.floor(bandit[STATS].maxHp * 0.75);
    advanceUntil(world, () => getSpells(world, bandit).length > 0, 2000);
  });
});

describe("bandit archer", () => {
  it("moves into line with the hero and aims with rage", () => {
    const { world, hero, bandit } = setup("banditArcher");

    advanceUntil(world, () => bandit[TOOLTIP].idle === rage, 3000);

    expect(bandit[POSITION].y).toBe(hero[POSITION].y);
    expect(bandit[ORIENTABLE].facing).toBe("left");
  });

  it("never looses an arrow as it carries none", () => {
    const { world, hero } = setup("banditArcher");

    const projectiles = trace(
      world,
      12,
      () => world.getEntities([PROJECTILE]).length
    );

    expect(Math.max(...projectiles)).toBe(0);
    expect(hero[STATS].hp).toBe(hero[STATS].maxHp);
  });

  it("backs off from a hero standing next to it", () => {
    const { world, hero, bandit } = setup(
      "banditArcher",
      `
|          |
|    ♀B    |
|          |
`
    );

    advanceUntil(
      world,
      () => distanceBetween(world, bandit[POSITION], hero[POSITION]) > 2,
      3000
    );
  });
});

describe("bandit knight", () => {
  it("has no behaviour of its own and stays in place", () => {
    const { world, bandit } = setup("banditKnight");
    const start = { ...bandit[POSITION] };

    advanceTicks(world, 6);

    expect(bandit[BEHAVIOUR].patterns).toHaveLength(0);
    expect(bandit[POSITION]).toEqual(start);
  });
});
