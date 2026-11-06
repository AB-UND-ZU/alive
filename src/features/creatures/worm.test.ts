import { World } from "../../engine";
import { FRAGMENT } from "../../engine/components/fragment";
import { POSITION } from "../../engine/components/position";
import { STATS } from "../../engine/components/stats";
import { TypedEntity } from "../../engine/entities";
import { getIdentifier } from "../../engine/utils";
import { advanceTicks, createCreatureWorld, toughen, trace } from "./helpers";

const setup = () => {
  const { world, hero } = createCreatureWorld(
    `
|           |
|     W     |
|           |
|           |
|     ♀     |
`,
    { W: "worm_boss" }
  );
  toughen(hero);
  const worm = getIdentifier(world, "worm_boss") as TypedEntity<"POSITION">;
  return { world, hero, worm };
};

const getSegments = (world: World, worm: TypedEntity) =>
  world
    .getEntities([FRAGMENT, POSITION])
    .filter(
      (segment) =>
        segment[FRAGMENT].structure === world.getEntityId(worm) &&
        segment !== worm
    );

describe("worm boss", () => {
  it("rests for a moment before it starts to move", () => {
    const { world, worm } = setup();
    const start = { ...worm[POSITION] };

    advanceTicks(world, 4);

    expect(worm[POSITION]).toEqual(start);
  });

  it("winds its head along a looping path", () => {
    const { world, worm } = setup();

    const positions = trace(
      world,
      30,
      () => `${worm[POSITION].x},${worm[POSITION].y}`
    );

    expect(new Set(positions).size).toBeGreaterThan(10);
  });

  it("grows its body one segment at a time up to fourteen", () => {
    const { world, hero, worm } = setup();

    const counts = trace(world, 40, () => getSegments(world, worm).length);
    const growth = counts.slice(0, counts.indexOf(14) + 1).filter(Boolean);

    expect(growth).toEqual(Array.from({ length: 14 }, (_, index) => index + 1));
    expect(Math.max(...counts)).toBe(14);
    expect(hero[STATS].hp).toBe(hero[STATS].maxHp);
  });
});
