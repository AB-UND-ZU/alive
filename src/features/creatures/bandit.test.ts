import { BEHAVIOUR } from "../../engine/components/behaviour";
import { BELONGABLE } from "../../engine/components/belongable";
import { BURNABLE } from "../../engine/components/burnable";
import { CASTABLE } from "../../engine/components/castable";
import { CONDITIONABLE } from "../../engine/components/conditionable";
import { PARTICLE } from "../../engine/components/particle";
import { SPRITE } from "../../engine/components/sprite";
import { ORIENTABLE } from "../../engine/components/orientable";
import { POSITION } from "../../engine/components/position";
import { PROJECTILE } from "../../engine/components/projectile";
import { SEQUENCABLE } from "../../engine/components/sequencable";
import { STATS } from "../../engine/components/stats";
import { TOOLTIP } from "../../engine/components/tooltip";
import { NpcType } from "../../engine/components/npc";
import { World } from "../../engine";
import {
  confused,
  rage,
  rage2,
  whistle1,
  whistle2,
} from "../../game/assets/ui";
import { advance, advanceUntil, findEntityAt } from "../../testing/harness";
import { isSnowy } from "../../engine/systems/freeze";
import { moveEntity } from "../../engine/systems/map";
import { castAs } from "../spells/helpers";
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

describe("bandit camp", () => {
  it("whistles by the fire, watches at three cells, and chases as a group at two", () => {
    const { world, hero } = createCreatureWorld("|♀     R*K|", {
      R: "banditRogue",
      K: "banditKnight",
    });
    const rogue = getCreature(world, "banditRogue");
    const knight = getCreature(world, "banditKnight");
    const fire = findEntityAt(world, { x: 7, y: 0 }, [BURNABLE])!;
    rogue[BELONGABLE].group = knight[BELONGABLE].group =
      world.getEntityId(fire);

    const notes = trace(world, 12, () => {
      expect(knight[TOOLTIP].idle).toBeUndefined();
      return rogue[TOOLTIP].idle;
    });
    expect(notes).toContain(whistle1);
    expect(notes).toContain(whistle2);
    moveEntity(world, hero, { x: 11, y: 0 });
    advanceTicks(world, 3);
    expect(rogue[TOOLTIP].idle).toBe(confused);
    expect(knight[TOOLTIP].idle).toBeUndefined();
    expect(rogue[POSITION]).toEqual({ x: 6, y: 0 });
    expect(knight[POSITION]).toEqual({ x: 8, y: 0 });

    moveEntity(world, hero, { x: 4, y: 0 });
    advanceUntil(world, () =>
      [rogue, knight].every((member) => member[TOOLTIP].idle === rage)
    );
    advanceUntil(world, () => rogue[POSITION].x === 5);
    moveEntity(world, hero, { x: 0, y: 0 });
    advanceUntil(world, () => knight[POSITION].x <= 4);
  });

  it("alerts the whole camp when a ranged spell hits one bandit", () => {
    const { world, hero } = createCreatureWorld(
      `|♀   R |
|    *K|`,
      { R: "banditRogue", K: "banditKnight" },
      { level: "LEVEL_ISLAND" }
    );
    const rogue = getCreature(world, "banditRogue");
    const knight = getCreature(world, "banditKnight");
    const fire = findEntityAt(world, { x: 4, y: 1 }, [BURNABLE, POSITION])!;
    rogue[BELONGABLE].group = knight[BELONGABLE].group =
      world.getEntityId(fire);
    toughen(hero);
    advanceTicks(world, 2);
    castAs(world, hero, { spell: "beam", material: "iron" }, "right");
    advanceUntil(world, () => rogue[STATS].hp < rogue[STATS].maxHp);
    expect(knight[STATS].hp).toBe(knight[STATS].maxHp);
    advanceUntil(world, () =>
      [rogue, knight].every((member) => member[TOOLTIP].idle === rage)
    );
    advanceUntil(world, () => hero[STATS].hp < hero[STATS].maxHp);

    moveEntity(world, hero, { x: 5, y: 12 });
    advanceUntil(world, () =>
      [rogue, knight].every(
        (mate) => distanceBetween(world, mate[POSITION], fire[POSITION]) <= 1
      )
    );
    moveEntity(world, hero, { x: 0, y: 0 });
    advanceUntil(world, () => knight[POSITION].x <= 2);
  });

  it("alerts survivors when the first ranged hit kills a campmate", () => {
    const { world, hero } = createCreatureWorld(
      `|♀   R |
|    * |
|     K|`,
      { R: "banditRogue", K: "banditKnight" }
    );
    const rogue = getCreature(world, "banditRogue");
    const knight = getCreature(world, "banditKnight");
    const fire = findEntityAt(world, { x: 4, y: 1 }, [BURNABLE])!;
    knight[BELONGABLE].group = rogue[BELONGABLE].group =
      world.getEntityId(fire);
    rogue[STATS].maxHp = rogue[STATS].hp = 1;
    advanceTicks(world, 2);
    castAs(world, hero, { spell: "beam", material: "iron" }, "right");
    advanceUntil(world, () => rogue[STATS].hp === 0);
    advanceUntil(world, () => knight[TOOLTIP].idle === rage);
    expect(knight[STATS].hp).toBe(knight[STATS].maxHp);
    advanceUntil(world, () => hero[STATS].hp < hero[STATS].maxHp);
  });

  it.each(["banditKnight", "banditPriest"] as const)(
    "recovers at the fire after a ranged attack on the %s",
    (targetType) => {
      const { world, hero } = createCreatureWorld(
        `|♀   A |
|    * |
|     B|`,
        {
          A: targetType,
          B: targetType === "banditKnight" ? "banditPriest" : "banditKnight",
        }
      );
      const knight = getCreature(world, "banditKnight");
      const priest = getCreature(world, "banditPriest");
      const target = getCreature(world, targetType);
      const fire = findEntityAt(world, { x: 4, y: 1 }, [BURNABLE, POSITION])!;
      priest[BELONGABLE].group = knight[BELONGABLE].group =
        world.getEntityId(fire);
      advanceTicks(world, 2);
      castAs(world, hero, { spell: "beam", material: "gold" }, "right");
      advanceUntil(world, () => target[STATS].hp < target[STATS].maxHp);
      advanceUntil(world, () => knight[TOOLTIP].idle === rage);
      moveEntity(world, hero, { x: 20, y: 20 });
      advanceUntil(
        world,
        () =>
          [knight, priest].every(
            (mate) => mate[STATS].hp === mate[STATS].maxHp
          ),
        30000
      );
      advanceUntil(world, () =>
        [knight, priest].some((mate) =>
          [whistle1, whistle2].includes(mate[TOOLTIP].idle!)
        )
      );
      moveEntity(world, hero, { x: 0, y: 0 });
      advanceTicks(world, 6);
      expect(distanceBetween(world, knight[POSITION], fire[POSITION])).toBe(1);
      expect(distanceBetween(world, priest[POSITION], fire[POSITION])).toBe(1);
    }
  );

  it("returns to the fire beyond fifteen cells and can be drawn back into combat on the way", () => {
    const { world, hero } = createCreatureWorld("|*R ♀|", { R: "banditRogue" });
    const rogue = getCreature(world, "banditRogue");
    const fire = findEntityAt(world, { x: 0, y: 0 }, [BURNABLE])!;
    rogue[BELONGABLE].group = world.getEntityId(fire);
    advanceUntil(world, () => rogue[POSITION].x === 2);
    moveEntity(world, hero, { x: 15, y: 0 });
    advanceUntil(world, () => rogue[POSITION].x === 12);
    moveEntity(world, hero, { x: 17, y: 0 });
    advanceUntil(world, () => rogue[POSITION].x === 10);
    moveEntity(world, hero, { x: 12, y: 0 });
    advanceUntil(world, () => rogue[POSITION].x === 11);
    moveEntity(world, hero, { x: 18, y: 0 });
    advanceUntil(
      world,
      () => distanceBetween(world, rogue[POSITION], { x: 0, y: 0 }) === 1
    );
    const rest = { ...rogue[POSITION] };
    advanceTicks(world, 6);
    expect(rogue[POSITION]).toEqual(rest);
  });
});

describe("bandit knight", () => {
  it("chases every tick, warns for two ticks, then slashes at most every three seconds", () => {
    const { world, hero, bandit } = setup("banditKnight", "|    ♀ B|");
    const slash = () =>
      world
        .getEntities([CASTABLE, SEQUENCABLE])
        .find(
          (effect) =>
            effect[SEQUENCABLE].states.slash &&
            effect[CASTABLE].caster === world.getEntityId(bandit)
        );
    advanceUntil(world, () => bandit[POSITION].x === 5);
    moveEntity(world, hero, { x: 0, y: 0 });
    advanceTicks(world, 1);
    expect(bandit[POSITION].x).toBe(4);
    advanceUntil(world, () => bandit[TOOLTIP].idle === rage2);
    advanceTicks(world, 1);
    expect(bandit[TOOLTIP].idle).toBe(rage2);
    const showsWarning = () =>
      world
        .getEntities([PARTICLE, SPRITE])
        .some((particle) => particle[SPRITE] === rage2);
    expect(showsWarning()).toBe(true);
    expect(slash()).toBeUndefined();
    advanceTicks(world, 1);
    expect(slash()?.[CASTABLE].melee).toBe(5);
    const firstCast = world.metadata.playtime;
    advanceUntil(world, () => !slash() && !showsWarning());
    advanceUntil(world, showsWarning);
    expect(slash()).toBeUndefined();
    advanceUntil(world, () => !!slash());
    expect(world.metadata.playtime - firstCast).toBeGreaterThanOrEqual(3000);
  });
});

describe("bandit mage", () => {
  const traps = (world: World) =>
    world
      .getEntities([CASTABLE, SEQUENCABLE])
      .filter((effect) => effect[SEQUENCABLE].states.aura?.name === "trapAura");

  it("aims its wand for a tick before hitting a distant hero", () => {
    const { world, hero, bandit } = setup("banditMage", "|     ♀ B|");
    advanceUntil(world, () => traps(world).length > 0);
    moveEntity(world, hero, { x: 0, y: 0 });
    advanceUntil(world, () => bandit[TOOLTIP].idle === rage);
    advanceTicks(world, 1);
    expect(bandit[TOOLTIP].idle).toBeUndefined();
    advanceUntil(world, () => hero[STATS].hp < hero[STATS].maxHp);
    expect(hero[STATS].maxHp - hero[STATS].hp).toBe(3);
  });

  it("leaves a freezing trap when approached at most once every four seconds", () => {
    const { world, hero, bandit } = setup("banditMage", "|♀ B|");
    advanceUntil(world, () => traps(world).length > 0);
    const first = traps(world)[0];
    const firstCast = world.metadata.playtime;
    const origin = { ...bandit[POSITION] };
    expect(first[CASTABLE]).toMatchObject({ magic: 3, freeze: 3 });
    advanceUntil(
      world,
      () => distanceBetween(world, bandit[POSITION], origin) > 0
    );
    advanceUntil(world, () => {
      if (distanceBetween(world, bandit[POSITION], hero[POSITION]) > 1) {
        moveEntity(world, hero, {
          x: bandit[POSITION].x - 1,
          y: bandit[POSITION].y,
        });
      }
      return traps(world).some((trap) => trap !== first);
    });
    expect(world.metadata.playtime - firstCast).toBeGreaterThanOrEqual(4000);
  });

  it("cannot arm or stack traps under its feet when cornered", () => {
    const { world, bandit } = setup(
      "banditMage",
      `
|████|
|█♀B█|
|████|
`
    );
    const start = { ...bandit[POSITION] };
    advanceUntil(world, () => traps(world).length > 0);
    advance(world, 6500);
    expect(bandit[POSITION]).toEqual(start);
    expect(traps(world)).toHaveLength(1);
    expect(traps(world)[0][SEQUENCABLE].states.aura!.particles).toEqual({});
  });
});

describe("bandit rogue", () => {
  it("chases with its sword at half health, then backs off to shoot below half", () => {
    const { world, hero, bandit } = setup("banditRogue", "|♀ B|");
    bandit[STATS].hp = bandit[STATS].maxHp / 2;
    advanceUntil(world, () => hero[STATS].hp < hero[STATS].maxHp);
    expect(hero[STATS].maxHp - hero[STATS].hp).toBe(4);
    bandit[STATS].hp -= 1;
    advanceUntil(world, () => world.getEntities([PROJECTILE]).length > 0);
    expect(
      distanceBetween(world, bandit[POSITION], hero[POSITION])
    ).toBeGreaterThan(2);
    const hp = hero[STATS].hp;
    advanceUntil(world, () => hero[STATS].hp < hp);
    expect(hp - hero[STATS].hp).toBe(4);
  });
});

describe("bandit priest", () => {
  it("heals the weakest injured campmate with its sword and waves, even without a fire", () => {
    const { world } = createCreatureWorld("|♀ KPMR|", {
      P: "banditPriest",
      K: "banditKnight",
      M: "banditMage",
      R: "banditRogue",
    });
    const priest = getCreature(world, "banditPriest");
    const knight = getCreature(world, "banditKnight");
    const mage = getCreature(world, "banditMage");
    const rogue = getCreature(world, "banditRogue");
    for (const mate of [knight, mage, rogue]) {
      mate[BEHAVIOUR].patterns = [];
      mate[STATS].maxHp = 99;
    }
    for (const member of [priest, knight, mage])
      member[BELONGABLE].group = 999999;
    knight[STATS].hp = 10;
    mage[STATS].hp = 50;
    rogue[STATS].hp = 1;
    advanceUntil(world, () => knight[STATS].hp > 10);
    expect(knight[STATS].hp).toBe(13);
    expect(mage[STATS].hp).toBe(50);
    expect(rogue[STATS].hp).toBe(1);
    advanceUntil(world, () => getSpells(world, priest).length > 0);
    expect(
      distanceBetween(world, knight[POSITION], priest[POSITION])
    ).toBeGreaterThan(1);
    expect(getSpells(world, priest)[0][CASTABLE]).toMatchObject({
      heal: 2,
      magic: 0,
      melee: 0,
    });
    advanceUntil(world, () => mage[STATS].hp > 50);
    expect(mage[STATS].hp).toBe(52);
  });

  it("flees alone and uses a bubble only while it has at least 15% HP", () => {
    const { world, hero } = createCreatureWorld("|♀P  K|", {
      P: "banditPriest",
      K: "banditKnight",
    });
    const bandit = getCreature(world, "banditPriest");
    const mate = getCreature(world, "banditKnight");
    mate[BEHAVIOUR].patterns = [];
    mate[BELONGABLE].group = bandit[BELONGABLE].group = 999999;
    bandit[STATS].hp = bandit[STATS].maxHp * 0.15;
    advanceTicks(world, 4);
    expect(bandit[CONDITIONABLE]?.block).toBeUndefined();
    mate[STATS].hp = 0;
    advanceUntil(world, () => !!bandit[CONDITIONABLE]?.block);
    advanceUntil(
      world,
      () => distanceBetween(world, bandit[POSITION], hero[POSITION]) >= 3
    );
    delete bandit[CONDITIONABLE]!.block;
    bandit[STATS].hp -= 1;
    advance(world, 3500);
    moveEntity(world, hero, {
      x: bandit[POSITION].x - 1,
      y: bandit[POSITION].y,
    });
    advanceTicks(world, 2);
    expect(bandit[CONDITIONABLE]?.block).toBeUndefined();
    expect(getSpells(world, bandit)).toHaveLength(0);
  });
});

it("regroups with surviving campmates if the campfire is gone", () => {
  const { world, hero } = createCreatureWorld("|♀ K      R|", {
    K: "banditKnight",
    R: "banditRogue",
  });
  const knight = getCreature(world, "banditKnight");
  const rogue = getCreature(world, "banditRogue");
  knight[BELONGABLE].group = rogue[BELONGABLE].group = 999999;
  moveEntity(world, hero, { x: 20, y: 20 });
  advanceUntil(
    world,
    () => distanceBetween(world, knight[POSITION], rogue[POSITION]) <= 2
  );
});

it("chases around a burning campfire instead of crossing it", () => {
  const { world, hero, bandit } = setup("banditRogue", "|♀*B|");
  const fire = findEntityAt(world, { x: 1, y: 0 }, [BURNABLE, POSITION])!;
  bandit[BELONGABLE].group = world.getEntityId(fire);
  advanceUntil(world, () => {
    expect(bandit[POSITION]).not.toEqual(fire[POSITION]);
    return hero[STATS].hp < hero[STATS].maxHp;
  });
});

it("keeps a fleeing priest near its fire and returns if separated", () => {
  const { world, bandit } = setup("banditPriest", "|♀*B|");
  const fire = findEntityAt(world, { x: 1, y: 0 }, [BURNABLE, POSITION])!;
  bandit[BELONGABLE].group = world.getEntityId(fire);
  const fromFire = () =>
    distanceBetween(world, bandit[POSITION], fire[POSITION]);
  const retreat = trace(world, 30, fromFire);
  expect(Math.max(...retreat)).toBe(6);
  moveEntity(world, bandit, { x: 11, y: 0 });
  advanceUntil(world, () => fromFire() <= 6);
});

describe("bandits crossing snow", () => {
  it.each([
    ["banditRogue", "|█B+♀█|", 1, 2],
    ["banditPriest", "|█♀B+█|", 2, 3],
  ] as const)(
    "%s clears the next cell before stepping into it",
    (type, row, startX, snowX) => {
      const { world, bandit } = setup(
        type,
        `|█████|
${row}
|█████|`
      );
      const snow = { x: snowX, y: 1 };
      expect(isSnowy(world, snow)).toBe(true);
      advanceUntil(world, () => !isSnowy(world, snow));
      expect(bandit[POSITION]).toEqual({ x: startX, y: 1 });
      advanceUntil(world, () => bandit[POSITION].x === snowX);
    }
  );

  it("follows a route through snow and around a wall", () => {
    const { world, bandit } = setup(
      "banditKnight",
      `
|███████|
|█B█  ♀█|
|█++ ███|
|███████|
`
    );
    const destination = { x: 4, y: 1 };
    bandit[BEHAVIOUR].patterns = [
      { name: "move", memory: { targetPosition: destination } },
    ];
    advanceUntil(
      world,
      () =>
        bandit[POSITION].x === destination.x &&
        bandit[POSITION].y === destination.y
    );
    expect(isSnowy(world, { x: 1, y: 2 })).toBe(false);
    expect(isSnowy(world, { x: 2, y: 2 })).toBe(false);
  });
});
