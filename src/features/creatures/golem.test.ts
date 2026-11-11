import { BEHAVIOUR, Pattern } from "../../engine/components/behaviour";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { MELEE } from "../../engine/components/melee";
import { POSITION } from "../../engine/components/position";
import { FRAGMENT } from "../../engine/components/fragment";
import { PLAYER } from "../../engine/components/player";
import { STATS } from "../../engine/components/stats";
import { isDead } from "../../engine/systems/damage";
import { advanceUntil, holdMove } from "../../testing/harness";
import {
  advanceTicks,
  countDrops,
  createCreatureWorld,
  distanceBetween,
  getCreature,
  getCreatures,
  getSpells,
  giveSword,
  toughen,
} from "./helpers";
import { CASTABLE } from "../../engine/components/castable";
import { moveEntity } from "../../engine/systems/map";
import { getFragment } from "../../engine/systems/enter";
import { add } from "../../game/math/std";
import { orientationPoints } from "../../engine/components/orientable";

const setup = () => {
  const { world, hero } = createCreatureWorld(
    `
|           |
|     G     |
|           |
|           |
|     ♀     |
`,
    { G: "golem" }
  );
  toughen(hero);
  giveSword(world, hero);
  const golem = getCreature(world, "golem");
  const phases = () =>
    golem[BEHAVIOUR].patterns
      .filter((pattern: Pattern) => pattern.name === "golem")
      .map((pattern: Pattern) => pattern.memory.phase);
  return { world, hero, golem, phases };
};

const provoke = (
  world: ReturnType<typeof setup>["world"],
  golem: ReturnType<typeof setup>["golem"]
) => {
  holdMove(world, ["up"]);
  advanceUntil(world, () => golem[STATS].hp < golem[STATS].maxHp, 5000);
  holdMove(world, []);
};

describe("golem", () => {
  it("lies still as a pile of rocks while unhurt", () => {
    const { world, golem, phases } = setup();
    const start = { ...golem[POSITION] };

    advanceTicks(world, 10);

    expect(golem[POSITION]).toEqual(start);
    expect(phases()).toEqual([0]);
  });

  it("unfolds after being hit and starts walking", () => {
    const { world, golem, phases } = setup();
    const start = { ...golem[POSITION] };

    provoke(world, golem);
    advanceUntil(world, () => phases().some((phase) => phase >= 10), 10000);
    advanceUntil(
      world,
      () => golem[POSITION].x !== start.x || golem[POSITION].y !== start.y,
      10000
    );
  });

  it("chases the hero into melee range and strikes", () => {
    const { world, hero, golem } = setup();
    provoke(world, golem);
    const hp = hero[STATS].hp;
    const distance = distanceBetween(world, golem[POSITION], hero[POSITION]);

    advanceUntil(world, () => hero[STATS].hp < hp, 20000);
    expect(world.assertComponents(golem, [MELEE])[MELEE].hits).toBeGreaterThan(
      0
    );
    expect(
      distanceBetween(world, golem[POSITION], hero[POSITION])
    ).toBeLessThanOrEqual(distance);
  });

  it.each(["up", "down", "left", "right"] as const)(
    "melee attacks the hero beside its %s limb while chasing",
    (orientation) => {
      const { world, hero, golem, phases } = setup();
      provoke(world, golem);
      advanceUntil(world, () => phases().includes(11), 10000);
      const delta = orientationPoints[orientation];
      moveEntity(
        world,
        hero,
        add(golem[POSITION], { x: delta.x * 2, y: delta.y * 2 })
      );
      golem[BEHAVIOUR].patterns = [
        { name: "golem", memory: { phase: 11 } },
        { name: "chase_slow", memory: {} },
      ];
      const melee = world.assertComponents(golem, [MELEE])[MELEE];
      const hits = melee.hits;
      const received = world.assertComponents(hero, [PLAYER])[PLAYER]
        .receivedStats;
      const damage = received.melee;

      advanceTicks(world, 2);

      expect(melee.hits).toBeGreaterThan(hits);
      expect(received.melee - damage).toBeGreaterThanOrEqual(4);
      expect(getSpells(world, golem)).toHaveLength(0);
    }
  );

  it("cannot melee attack through a limb without its root weapon", () => {
    const { world, hero, golem, phases } = setup();
    provoke(world, golem);
    advanceUntil(world, () => phases().includes(11), 10000);
    delete world.assertComponents(golem, [EQUIPPABLE])[EQUIPPABLE].weapon;
    moveEntity(world, hero, add(golem[POSITION], { x: 0, y: 2 }));
    golem[BEHAVIOUR].patterns = [
      { name: "golem", memory: { phase: 11 } },
      { name: "chase_slow", memory: {} },
    ];
    const melee = world.assertComponents(golem, [MELEE])[MELEE];
    const hits = melee.hits;
    const hp = hero[STATS].hp;

    advanceTicks(world, 2);

    expect(melee.hits).toBe(hits);
    expect(hero[STATS].hp).toBe(hp);
  });

  it("deals melee damage when its extended fist reaches the hero", () => {
    const { world, hero, golem, phases } = setup();
    provoke(world, golem);
    advanceUntil(world, () => phases().includes(11), 10000);
    const arm = getFragment(world, add(golem[POSITION], { x: 1, y: 0 }))!;
    moveEntity(world, hero, add(arm[POSITION], { x: 0, y: 3 }));
    golem[BEHAVIOUR].patterns = [
      {
        name: "golem",
        memory: {
          phase: 30,
          limbId: world.getEntityId(arm),
          orientation: "down",
        },
      },
    ];
    const received = world.assertComponents(hero, [PLAYER])[PLAYER]
      .receivedStats;
    const melee = received.melee;
    const position = { ...hero[POSITION] };

    advanceUntil(world, () => phases().includes(33), 10000);
    advanceUntil(world, () => phases().includes(10), 10000);

    expect(received.melee).toBeGreaterThan(melee);
    expect(hero[POSITION]).not.toEqual(position);
    expect(getSpells(world, golem)).toHaveLength(0);
  });

  it("casts bolts at the hero once both arms are broken off", () => {
    const { world, golem, phases } = setup();
    provoke(world, golem);
    advanceUntil(world, () => phases().includes(11), 10000);

    (["left", "right"] as const).forEach((side) => {
      const arm = getFragment(
        world,
        add(golem[POSITION], orientationPoints[side])
      );
      if (arm?.[STATS]) arm[STATS].hp = 0;
    });

    advanceUntil(world, () => phases().includes(40), 20000);
    advanceUntil(
      world,
      () =>
        world
          .getEntities([CASTABLE])
          .some(
            (spell) =>
              spell !== golem &&
              spell[CASTABLE].caster === world.getEntityId(golem)
          ),
      10000
    );
  });

  it("leaves a golem trophy when defeated", () => {
    const { world, golem, phases } = setup();
    provoke(world, golem);
    advanceUntil(world, () => phases().some((phase) => phase >= 10), 10000);

    golem[STATS].hp = 1;
    holdMove(world, ["up"]);
    advanceUntil(world, () => isDead(world, golem), 20000);
    holdMove(world, []);
    advanceUntil(world, () => countDrops(world, { stackable: "golem" }) > 0);
  });
  it("vanishes entirely after its defeat and counts as defeated", () => {
    const { world, hero, golem, phases } = setup();
    provoke(world, golem);
    advanceUntil(world, () => phases().some((phase) => phase >= 10), 10000);

    golem[STATS].hp = 1;
    holdMove(world, ["up"]);
    advanceUntil(world, () => isDead(world, golem), 20000);
    holdMove(world, []);
    advanceUntil(world, () => getCreatures(world, "golem").length === 0, 20000);

    expect(world.getEntities([FRAGMENT])).toHaveLength(0);
    expect(
      world.assertComponents(hero, [PLAYER])[PLAYER].defeatedUnits.golem
    ).toBe(1);
  });
  it("stomps with an arm and sends a wave when the hero is close", () => {
    const { world, hero, golem, phases } = setup();
    provoke(world, golem);
    advanceUntil(
      world,
      () => {
        hero[STATS].hp = hero[STATS].maxHp;
        return phases().includes(21);
      },
      60000
    );
    advanceUntil(world, () => getSpells(world, golem).length > 0, 3000);
  });

  it("strikes with a fist that extends towards the hero and retracts", () => {
    const { world, hero, golem, phases } = setup();
    provoke(world, golem);
    const limbs = () => world.getEntities([FRAGMENT]).length;
    const resting = limbs();

    advanceUntil(
      world,
      () => {
        hero[STATS].hp = hero[STATS].maxHp;
        return phases().includes(33) && limbs() > resting;
      },
      30000
    );
    advanceUntil(world, () => phases().includes(10), 10000);

    expect(limbs()).toBe(resting);
  });
});
