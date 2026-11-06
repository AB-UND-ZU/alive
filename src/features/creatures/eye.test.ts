import { ORIENTABLE } from "../../engine/components/orientable";
import { POSITION } from "../../engine/components/position";
import { STATS } from "../../engine/components/stats";
import { TOOLTIP } from "../../engine/components/tooltip";
import { confused, rage, sleep1, sleep2 } from "../../game/assets/ui";
import { advanceUntil, assertHero } from "../../testing/harness";
import {
  advanceTicks,
  createCreatureWorld,
  distanceBetween,
  getCreature,
  teleport,
  toughen,
  trace,
} from "./helpers";

const setup = (area: string) => {
  const { world, hero } = createCreatureWorld(area);
  toughen(hero);
  const eye = getCreature(world, "eye");
  return { world, hero, eye };
};

describe("eye", () => {
  it("sleeps with closed eyes and stays in place while the hero is far", () => {
    const { world, eye } = setup(`
|♀           0|
`);
    const start = { ...eye[POSITION] };

    const states = trace(world, 6, () => ({
      idle: eye[TOOLTIP].idle,
      facing: eye[ORIENTABLE].facing,
    }));

    expect(eye[POSITION]).toEqual(start);
    states.slice(2).forEach(({ idle, facing }) => {
      expect([sleep1, sleep2]).toContain(idle);
      expect(facing).toBeUndefined();
    });
  });

  it("opens its eyes towards the hero and looks confused when the hero comes close", () => {
    const { world, hero, eye } = setup(`
|♀           0|
`);
    advanceTicks(world, 2);
    const start = { ...eye[POSITION] };

    teleport(world, hero, { x: start.x - 6, y: start.y });
    advanceTicks(world, 3);

    expect(eye[TOOLTIP].idle).toBe(confused);
    expect(eye[ORIENTABLE].facing).toBe("left");
    expect(eye[POSITION]).toEqual(start);
  });

  it("wakes up with rage and chases the hero within aggro range", () => {
    const { world, hero, eye } = setup(`
|♀           0|
`);
    advanceTicks(world, 2);
    const start = { ...eye[POSITION] };

    teleport(world, hero, { x: start.x - 4, y: start.y });
    const idles = trace(world, 4, () => eye[TOOLTIP].idle);

    expect(idles).toContain(rage);
    expect(distanceBetween(world, eye[POSITION], hero[POSITION])).toBeLessThan(
      4
    );
  });

  it("chases at once without rage when it first sees the hero close by", () => {
    const { world, hero, eye } = setup(`
|♀   0|
`);

    const idles = trace(world, 3, () => eye[TOOLTIP].idle);

    expect(idles).not.toContain(rage);
    expect(distanceBetween(world, eye[POSITION], hero[POSITION])).toBeLessThan(
      4
    );
  });

  it("hurts the hero once it reaches it", () => {
    const { world, hero } = setup(`
|♀   0|
`);

    advanceUntil(world, () => hero[STATS].hp < hero[STATS].maxHp, 5000);
  });

  it("falls asleep again after the hero escapes", () => {
    const { world, eye } = setup(`
|♀   0|
`);
    advanceUntil(world, () => !eye[TOOLTIP].idle, 3000);
    const position = { ...eye[POSITION] };

    teleport(world, assertHero(world), { x: 25, y: 20 });
    advanceTicks(world, 3);
    const resting = { ...eye[POSITION] };
    advanceTicks(world, 3);

    expect([sleep1, sleep2]).toContain(eye[TOOLTIP].idle);
    expect(eye[ORIENTABLE].facing).toBeUndefined();
    expect(distanceBetween(world, resting, position)).toBeLessThanOrEqual(1);
    expect(eye[POSITION]).toEqual(resting);
  });
});
