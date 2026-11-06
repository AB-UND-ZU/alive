import { ORIENTABLE } from "../../engine/components/orientable";
import { POSITION } from "../../engine/components/position";
import { STATS } from "../../engine/components/stats";
import { TOOLTIP } from "../../engine/components/tooltip";
import { LEVEL } from "../../engine/components/level";
import { rage } from "../../game/assets/ui";
import { createMatrix } from "../../game/math/matrix";
import { advanceUntil, findInArea } from "../../testing/harness";
import {
  attackUntilDead,
  countDrops,
  createCreatureWorld,
  getCreature,
  giveSword,
  toughen,
  trace,
} from "./helpers";

const setup = (area: string, facing: "up" | "right" | "down" | "left") => {
  const { world, hero } = createCreatureWorld(area);
  toughen(hero);
  const prism = getCreature(world, "prism");
  prism[ORIENTABLE].facing = facing;
  return { world, hero, prism };
};

describe("prism", () => {
  it("walks straight ahead in its facing direction", () => {
    const area = `
|♀         |
|          |
|  ◀       |
`;
    const { world, prism } = setup(area, "right");
    const start = findInArea(area, "◀");

    const positions = trace(world, 5, () => ({ ...prism[POSITION] }));

    expect(positions.every(({ y }) => y === start.y)).toBe(true);
    expect(positions[positions.length - 1].x).toBeGreaterThan(start.x + 2);
    positions.slice(1).forEach((position, index) => {
      expect(position.x).toBeGreaterThanOrEqual(positions[index].x);
    });
  });

  it("turns around at the walls of a corridor without leaving it", () => {
    const area = `
|♀         |
|██████    |
|█◀   █    |
|██████    |
`;
    const { world, prism } = setup(area, "right");

    const states = trace(world, 24, () => ({
      ...prism[POSITION],
      facing: prism[ORIENTABLE].facing,
    }));

    expect(states.every(({ y }) => y === 2)).toBe(true);
    expect(states.every(({ x }) => x >= 1 && x <= 4)).toBe(true);
    expect(states.some(({ x }) => x === 4)).toBe(true);
    expect(states.filter(({ x }) => x === 1).length).toBeGreaterThan(1);
    expect(new Set(states.map(({ facing }) => facing))).toEqual(
      new Set(["left", "right"])
    );
  });

  it("turns sideways when it walks into a wall in an open room", () => {
    const area = `
|██████████|
|          |
|    ◀     |
|          |
|♀         |
`;
    const { world, prism } = setup(area, "up");

    advanceUntil(world, () => prism[ORIENTABLE].facing !== "up", 3000);

    expect(prism[POSITION].y).toBe(1);
    expect(["left", "right"]).toContain(prism[ORIENTABLE].facing);
  });

  it("turns around at the border of its biome", () => {
    const { world, prism } = setup(
      `
|♀         |
|          |
|  ◀       |
`,
      "right"
    );
    const level = world.metadata.gameEntity[LEVEL];
    level.biomes = createMatrix(level.size, level.size, "jungle");
    for (let x = 5; x < level.size; x += 1) {
      for (let y = 0; y < level.size; y += 1) level.biomes[x][y] = "desert";
    }

    const positions = trace(world, 12, () => prism[POSITION].x);

    expect(Math.max(...positions)).toBe(4);
  });

  it("shows rage while the hero stands in its line of movement", () => {
    const { world, prism } = setup(
      `
|◀      ♀|
`,
      "right"
    );

    advanceUntil(world, () => prism[TOOLTIP].idle === rage, 2000);
  });

  it("stays calm when a wall blocks its line to the hero", () => {
    const { world, prism } = setup(
      `
|♀ █   ◀  |
`,
      "left"
    );

    const idles = trace(world, 6, () => prism[TOOLTIP].idle);

    expect(idles).not.toContain(rage);
  });

  it("attacks the hero by walking into it", () => {
    const { world, hero } = setup(
      `
|◀   ♀|
`,
      "right"
    );

    advanceUntil(world, () => hero[STATS].hp < hero[STATS].maxHp, 5000);
  });

  it("drops coins and xp when defeated", () => {
    const { world, hero, prism } = setup(
      `
|█████|
|█♀ ◀█|
|█████|
`,
      "left"
    );
    giveSword(world, hero);

    attackUntilDead(world, prism, "right");
    advanceUntil(world, () => countDrops(world, { stat: "xp" }) > 0);

    expect(countDrops(world, { stackable: "coin" })).toBe(1);
    expect(countDrops(world, { stat: "xp" })).toBe(1);
  });
});
