import { entities, World } from "../../engine";
import { BELONGABLE } from "../../engine/components/belongable";
import { CASTABLE, getEmptyCastable } from "../../engine/components/castable";
import { BiomeName, LEVEL } from "../../engine/components/level";
import { MOVABLE } from "../../engine/components/movable";
import { ORIENTABLE } from "../../engine/components/orientable";
import { POSITION } from "../../engine/components/position";
import { RENDERABLE } from "../../engine/components/renderable";
import {
  SEQUENCABLE,
  TornadoSequence,
  WeatherSequence,
} from "../../engine/components/sequencable";
import { SPRITE } from "../../engine/components/sprite";
import { STICKY } from "../../engine/components/sticky";
import { createSequence, getSequence } from "../../engine/systems/sequence";
import { none } from "../../game/assets/sprites";
import { npcSequence } from "../../game/assets/utils";
import { createMatrix } from "../../game/math/matrix";
import { advanceUntil, step } from "../../testing/harness";
import {
  advanceTicks,
  createCreatureWorld,
  getGeneration,
  toughen,
} from "../creatures/helpers";

const area = `
|♀ |
`;

const setupWorld = () => {
  const { world, hero } = createCreatureWorld(area);
  toughen(hero);
  return world;
};

const createStorm = (world: World, weather = true) => {
  const storm = entities.createAnchor(world, {
    [POSITION]: { x: 0, y: 0 },
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [STICKY]: {},
    [SPRITE]: none,
  });
  if (weather) {
    createSequence<"weather", WeatherSequence>(
      world,
      storm,
      "weather",
      "weatherStorm",
      {
        position: { x: 0, y: 0 },
        generation: 0,
        intensity: 0,
        drops: [],
        start: 0,
        end: 0,
        type: "rain",
        viewable: { x: 0, y: 0 },
        ratio: 1,
      }
    );
  }
  npcSequence(world, storm, "oscillatingStormNpc", {
    center: { x: 20, y: 10 },
    degrees: 0,
    amplitude: 6,
    frequency: 1 / 4,
    ratio: 1,
  });
  return storm;
};

const setBiomes = (world: World, biome: (x: number) => BiomeName) => {
  const size = world.metadata.gameEntity[LEVEL].size;
  const biomes = createMatrix<BiomeName>(size, size, "jungle");
  biomes.forEach((column, x) => column.fill(biome(x)));
  world.metadata.gameEntity[LEVEL].biomes = biomes;
};

const createTornado = (world: World, memory: object) => {
  const tornado = entities.createTornado(world, {
    [BELONGABLE]: { faction: "hostile" },
    [CASTABLE]: {
      ...getEmptyCastable(world, world.metadata.gameEntity),
      reproc: 3,
    },
    [MOVABLE]: {
      orientations: [],
      reference: world.getEntityId(world.metadata.gameEntity),
      spring: { duration: 200 },
      lastInteraction: 0,
      flying: true,
      swimming: false,
    },
    [ORIENTABLE]: {},
    [POSITION]: { x: 20, y: 20 },
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: none,
  });
  tornado[CASTABLE].caster = world.getEntityId(tornado);
  createSequence<"tornado", TornadoSequence>(
    world,
    tornado,
    "tornado",
    "tornadoSpin",
    {
      element: "air",
      position: { x: 20, y: 20 },
      radius: 0,
      amount: 2,
      exertables: [],
      gusts: [],
      generation: 0,
    }
  );
  const generation = getGeneration(world);
  npcSequence(world, tornado, "wanderingTornadoNpc", {
    maximum: 3,
    lastMove: generation,
    lastGrow: generation,
    orientation: "right",
    growing: false,
    biome: "desert",
    center: { x: 20, y: 20 },
    angle: 90,
    radius: 12,
    ratio: 1,
    ...memory,
  });
  return tornado;
};

describe("storms", () => {
  it("keeps rain going and sways it back and forth", () => {
    const world = setupWorld();
    const storm = createStorm(world);
    const weather = () => getSequence(world, storm, "weather")!.args;

    step(world, 5);
    expect(weather().end).toBe(Infinity);

    const positions = new Set<number>();
    for (let tick = 0; tick < 30; tick += 1) {
      advanceTicks(world, 1);
      positions.add(weather().position.x);
      expect(weather().position.y).toBe(10);
    }

    expect(Math.min(...Array.from(positions))).toBe(14);
    expect(Math.max(...Array.from(positions))).toBe(26);
  });

  it("stays put without any weather", () => {
    const world = setupWorld();
    const storm = createStorm(world, false);

    advanceTicks(world, 5);

    expect(storm[POSITION]).toEqual({ x: 0, y: 0 });
    expect(getSequence(world, storm, "npc")).toBeDefined();
  });
});

describe("tornados", () => {
  it("reappear somewhere in the desert and grow while wandering", () => {
    const world = setupWorld();
    setBiomes(world, () => "desert");
    const tornado = createTornado(world, {});
    const radius = () => getSequence(world, tornado, "tornado")!.args.radius;

    advanceUntil(world, () => radius() === 3, 60000);

    expect(tornado[POSITION]).not.toEqual({ x: 20, y: 20 });
  });

  it("shrink when reaching the end of the desert", () => {
    const world = setupWorld();
    setBiomes(world, (x) => (x < 24 ? "desert" : "jungle"));
    const tornado = createTornado(world, {
      growing: true,
      orientation: "right",
    });
    const spin = getSequence(world, tornado, "tornado")!.args;
    spin.radius = 2;

    advanceUntil(world, () => spin.radius === 0, 30000);

    expect(tornado[POSITION].x).toBe(23);
  });
});
