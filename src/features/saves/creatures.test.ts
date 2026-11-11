import {
  advanceUntil,
  assertHero,
  findEntityAt,
  holdMove,
} from "../../testing/harness";
import { saveAndLoad } from "../../testing/saves";
import { World } from "../../engine";
import { BEHAVIOUR, Pattern } from "../../engine/components/behaviour";
import { IDENTIFIABLE } from "../../engine/components/identifiable";
import { MELEE } from "../../engine/components/melee";
import { ORIENTABLE } from "../../engine/components/orientable";
import { POSITION } from "../../engine/components/position";
import { STATS } from "../../engine/components/stats";
import { TOOLTIP } from "../../engine/components/tooltip";
import { setIdentifier } from "../../engine/utils";
import { confused, rage, sleep1, sleep2 } from "../../game/assets/ui";
import {
  advanceTicks,
  createCreatureWorld,
  distanceBetween,
  getCreature,
  getCreatures,
  giveSword,
  teleport,
  toughen,
  trace,
} from "../creatures/helpers";

// 0 eye far from the hero
const eyeRoom = `
|              |
| ♀           0|
|              |
`;

const getHero = (world: World) =>
  world.assertComponents(assertHero(world), [POSITION, STATS]);

const getSpawned = (world: World) =>
  world
    .getEntities([IDENTIFIABLE, STATS])
    .filter((entity) => entity[IDENTIFIABLE].name === "arena:mob");

const getPhases = (world: World) =>
  getCreature(world, "golem")
    [BEHAVIOUR].patterns.filter((pattern: Pattern) => pattern.name === "golem")
    .map((pattern: Pattern) => pattern.memory.phase as number);

describe("saved creatures", () => {
  it("keeps a prism walking along its corridor", () => {
    const { world, hero } = createCreatureWorld(`
|          |
| ♀        |
|██████    |
|█◀   █    |
|██████    |
`);
    toughen(hero);
    getCreature(world, "prism")[ORIENTABLE].facing = "right";
    advanceTicks(world, 2);

    const loaded = saveAndLoad(world);
    const prism = getCreature(loaded, "prism");
    const states = trace(loaded, 24, () => ({
      ...prism[POSITION],
      facing: prism[ORIENTABLE].facing,
    }));

    expect(states.every(({ y }) => y === 3)).toBe(true);
    expect(states.every(({ x }) => x >= 1 && x <= 4)).toBe(true);
    expect(states.some(({ x }) => x === 4)).toBe(true);
    expect(states.some(({ x }) => x === 1)).toBe(true);
    expect(new Set(states.map(({ facing }) => facing))).toEqual(
      new Set(["left", "right"])
    );
  });

  it("keeps a sleeping eye asleep until the hero comes close", () => {
    const { world, hero } = createCreatureWorld(eyeRoom);
    toughen(hero);
    advanceTicks(world, 2);

    const loaded = saveAndLoad(world);
    const eye = getCreature(loaded, "eye");
    const start = { ...eye[POSITION] };
    advanceTicks(loaded, 3);
    expect([sleep1, sleep2]).toContain(eye[TOOLTIP].idle);
    expect(eye[POSITION]).toEqual(start);

    teleport(loaded, assertHero(loaded), { x: start.x - 6, y: start.y });
    advanceTicks(loaded, 3);
    expect(eye[TOOLTIP].idle).toBe(confused);
    expect(eye[ORIENTABLE].facing).toBe("left");
  });

  it("keeps an awake eye chasing and hurting the hero", () => {
    const { world, hero } = createCreatureWorld(eyeRoom);
    toughen(hero);
    advanceTicks(world, 2);
    const eye = getCreature(world, "eye");
    teleport(world, hero, { x: eye[POSITION].x - 4, y: eye[POSITION].y });
    advanceUntil(world, () => eye[TOOLTIP].idle === rage, 5000);

    const loaded = saveAndLoad(world);
    const loadedHero = getHero(loaded);
    const loadedEye = getCreature(loaded, "eye");
    advanceTicks(loaded, 3);
    expect(
      distanceBetween(loaded, loadedEye[POSITION], loadedHero[POSITION])
    ).toBeLessThan(4);

    advanceUntil(
      loaded,
      () => loadedHero[STATS].hp < loadedHero[STATS].maxHp,
      5000
    );
  });

  it("keeps spawning a wave after the first mob was defeated", () => {
    const { world, hero } = createCreatureWorld(`
|          |
| ♀        |
|          |
|     ÷    |
`);
    toughen(hero);
    const spawner = findEntityAt(world, { x: 5, y: 3 }, [BEHAVIOUR])!;
    spawner[BEHAVIOUR].patterns = [
      { name: "spawner", memory: { types: ["prism", "eye"], name: "arena" } },
    ];
    setIdentifier(world, spawner, "arena:spawner");
    const spawnerId = world.getEntityId(spawner);
    advanceUntil(world, () => getSpawned(world).length === 1, 10000);

    const loaded = saveAndLoad(world);
    expect(getCreatures(loaded, "prism")).toHaveLength(1);
    advanceTicks(loaded, 20);
    expect(getCreatures(loaded, "eye")).toHaveLength(0);

    getSpawned(loaded)[0][STATS].hp = 0;
    advanceUntil(loaded, () => getCreatures(loaded, "eye").length === 1, 15000);

    getCreature(loaded, "eye")[STATS].hp = 0;
    advanceUntil(loaded, () => !loaded.getEntityById(spawnerId), 15000);
  });

  it("keeps an unfolded golem melee attacking after loading", () => {
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
    holdMove(world, ["up"]);
    advanceUntil(world, () => golem[STATS].hp < golem[STATS].maxHp, 5000);
    holdMove(world, []);
    advanceUntil(world, () => getPhases(world).some((phase) => phase >= 10));

    const loaded = saveAndLoad(world);
    const loadedHero = getHero(loaded);
    const loadedGolem = getCreature(loaded, "golem");
    const melee = loaded.assertComponents(loadedGolem, [MELEE])[MELEE];
    const hits = melee.hits;
    const hp = loadedHero[STATS].hp;
    expect(getPhases(loaded).some((phase) => phase >= 10)).toBe(true);

    advanceUntil(loaded, () => loadedHero[STATS].hp < hp, 20000);
    expect(melee.hits).toBeGreaterThan(hits);
  });
});
