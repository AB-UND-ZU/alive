import { BEHAVIOUR, Pattern } from "../../engine/components/behaviour";
import { POSITION } from "../../engine/components/position";
import { STATS } from "../../engine/components/stats";
import { isDead } from "../../engine/systems/damage";
import { advanceUntil, holdMove } from "../../testing/harness";
import {
  advanceTicks,
  countDrops,
  createCreatureWorld,
  distanceBetween,
  getCreature,
  giveSword,
  toughen,
} from "./helpers";
import { CASTABLE } from "../../engine/components/castable";
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

  it("charges at the hero and knocks it back", () => {
    const { world, hero, golem } = setup();
    provoke(world, golem);
    const hp = hero[STATS].hp;
    const distance = distanceBetween(world, golem[POSITION], hero[POSITION]);

    advanceUntil(world, () => hero[STATS].hp < hp, 20000);
    advanceTicks(world, 4);

    expect(
      distanceBetween(world, golem[POSITION], hero[POSITION])
    ).toBeGreaterThan(distance);
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
          .some((spell) => spell[CASTABLE].caster === world.getEntityId(golem)),
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
});
