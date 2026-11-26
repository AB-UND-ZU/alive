import { entities, World } from "../../engine";
import { BURNABLE } from "../../engine/components/burnable";
import { COVERABLE } from "../../engine/components/coverable";
import { FARMABLE } from "../../engine/components/farmable";
import { FREEZABLE } from "../../engine/components/freezable";
import { IMMERSIBLE } from "../../engine/components/immersible";
import { LIQUID } from "../../engine/components/liquid";
import { Position, POSITION } from "../../engine/components/position";
import { RENDERABLE } from "../../engine/components/renderable";
import {
  SEQUENCABLE,
  WeatherSequence,
} from "../../engine/components/sequencable";
import { SPRITE } from "../../engine/components/sprite";
import { getSceneFrame } from "../../renderers/interface/frame";
import { getActiveViewable } from "../../renderers/interface/hooks";
import { VIEWABLE } from "../../engine/components/viewable";
import { PARTICLE } from "../../engine/components/particle";
import { moveEntity, registerEntity } from "../../engine/systems/map";
import { signedDistance } from "../../game/math/std";
import { saveAndLoad } from "../../testing/saves";
import { coverSnow, isSnowy } from "../../engine/systems/freeze";
import { createSequence } from "../../engine/systems/sequence";
import { disposeSequence } from "../../engine/systems/map";
import {
  calculateWeatherIntensity,
  createBubble,
  Weather,
  weatherIntensity,
} from "../../engine/systems/water";
import { jetty, none, snowCover, soilWet } from "../../game/assets/sprites";
import { getSegments } from "../../renderers/interface/segments";
import { playedSounds } from "../../testing/env";
import {
  advance,
  assertHero,
  createAreaWorld,
  findEntityAt,
  findInArea,
  getEntitiesAt,
  parseArea,
} from "../../testing/harness";
import { getGeneration } from "../creatures/helpers";

/** Let it rain or snow over the whole small map. */
const addStorm = (world: World, type: Weather, end = Infinity) => {
  const storm = entities.createAnchor(world, {
    [POSITION]: { x: 0, y: 0 },
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: none,
  });
  registerEntity(world, storm);
  createSequence<"weather", WeatherSequence>(
    world,
    storm,
    "weather",
    "weatherStorm",
    {
      position: { x: 0, y: 0 },
      generation: 0,
      intensity: 100,
      drops: [],
      start: 0,
      end,
      type,
    }
  );
  return storm;
};

/** Positions of every occurrence of `char` within an area. */
const findAllInArea = (area: string, char: string) =>
  parseArea(area).flatMap((row, y) =>
    row.split("").flatMap((cell, x) => (cell === char ? [{ x, y }] : []))
  );

// ♀ hero, * campfire, S dry soil, ≈ deep water
const meadow = `
|                |
|  ♀  *  S  ≈≈   |
|                |
`;

// ▒ path, ░ sand, ~ shallow water, █ mountain, D door
const valley = `
|                |
|  ♀             |
|   ▒▒▒▒  ░░░░   |
|   ~~~~  ████   |
|  D             |
|                |
`;

describe("weather", () => {
  it.each(["rain", "snow"] as const)(
    "keeps %s near the viewpoint across map edges and loading",
    (type) => {
      let world = createAreaWorld(meadow, { size: 240 });
      const storm = addStorm(world, type);
      storm[SEQUENCABLE].states.weather!.args.start = -200;
      for (const position of [
        { x: 190, y: 190 },
        { x: 239, y: 0 },
        { x: 0, y: 239 },
        { x: 120, y: 120 },
      ]) {
        moveEntity(world, assertHero(world), position);
        advance(world, 800);
        const active = getActiveViewable(
          world.getEntities([VIEWABLE, POSITION])
        );
        const anchor = world.getEntities([SEQUENCABLE, POSITION])
          .find((entity) => entity[SEQUENCABLE].states.weather)!;
        expect(anchor[POSITION]).toEqual(active[POSITION]);
        const weather = anchor[SEQUENCABLE].states.weather!;
        expect(weather.args.drops.length).toBeGreaterThan(0);
        for (const drop of weather.args.drops) {
          expect(drop.position.x).toBeGreaterThanOrEqual(0);
          expect(drop.position.x).toBeLessThan(240);
          expect(drop.position.y).toBeGreaterThanOrEqual(0);
          expect(drop.position.y).toBeLessThan(240);
          const particle = world.assertByIdAndComponents(
            weather.particles[drop.particle],
            [PARTICLE]
          );
          expect(particle[PARTICLE].offsetX).toBe(
            signedDistance(active[POSITION].x, drop.position.x, 240)
          );
          expect(particle[PARTICLE].offsetY).toBeLessThanOrEqual(
            signedDistance(active[POSITION].y, drop.position.y, 240)
          );
        }
        world = saveAndLoad(world);
      }
    }
  );

  it("keeps falling snow over its landing cell between a viewpoint change and the next storm update", () => {
    const world = createAreaWorld(meadow, { size: 96 });
    const hero = assertHero(world);
    const storm = addStorm(world, "snow");
    storm[SEQUENCABLE].states.weather!.args.start = -200;
    advance(world, 800);
    const snowfall = () => getSceneFrame(world, 33, 17)
      .filter((entry) => entry.entity === storm && entry.particle);
    const before = snowfall();
    expect(before.length).toBeGreaterThan(0);
    moveEntity(world, hero, { x: hero[POSITION].x + 2, y: hero[POSITION].y });
    expect(snowfall().map(({ x }) => x)).toEqual(before.map(({ x }) => x - 2));
  });

  it("lands rain at the end of its fall and keeps the splash lifetime when loaded", () => {
    let world = createAreaWorld(meadow, { size: 48 });
    const storm = addStorm(world, "rain");
    const weather = storm[SEQUENCABLE].states.weather!;
    weather.args.start = -200;
    world.update(0);
    weather.args.end = 0;
    const duration = (drop: WeatherSequence["drops"][number]) =>
      drop.fast ? 600 : 1200;
    const first = Math.min(...weather.args.drops.map(duration));
    world.update(first - 1);
    expect(world.getEntities([LIQUID])).toHaveLength(0);
    world.update(1);
    expect(world.getEntities([LIQUID]).length).toBeGreaterThan(0);
    advance(world, 600);
    expect(world.getEntities([LIQUID]).length).toBeGreaterThan(0);
    world = saveAndLoad(world);
    world.update(1000);
    expect(world.getEntities([LIQUID])).toHaveLength(0);
  });

  it("keeps a bubble's exact remaining lifetime through loading", () => {
    let world = createAreaWorld(meadow, { size: 48 });
    createBubble(world, findInArea(meadow, "≈"), "water");
    world.update(499);
    expect(world.getEntities([LIQUID])[0][LIQUID].amount).toBe(1);
    world = saveAndLoad(world);
    world.update(1);
    expect(world.getEntities([LIQUID])[0][LIQUID].amount).toBe(2);
    world.update(500);
    expect(world.getEntities([LIQUID])).toHaveLength(0);
  });

  it("finishes liquid effects saved before sequence-owned lifetimes", () => {
    const saved = createAreaWorld(meadow, { size: 48 });
    createBubble(saved, findInArea(meadow, "≈"), "water");
    const effect = saved.getEntities([LIQUID, SEQUENCABLE])[0];
    disposeSequence(saved, effect, "splash");
    effect[LIQUID].amount = 2;
    effect[LIQUID].timestamp = 12345;
    const loaded = saveAndLoad(saved);
    loaded.update(499);
    expect(loaded.getEntities([LIQUID])).toHaveLength(1);
    loaded.update(1);
    expect(loaded.getEntities([LIQUID])).toHaveLength(0);
  });

  it("rain waters dry soil", () => {
    const world = createAreaWorld(meadow, { size: 16, legend: { S: "soil" } });
    const soil = findEntityAt(world, findInArea(meadow, "S"), [
      FARMABLE,
      SPRITE,
    ])!;
    addStorm(world, "rain");

    advance(world, 60000);

    expect(soil[FARMABLE].watered).toBe(true);
    expect(soil[SPRITE]).toBe(soilWet);
  });

  it("rain puts out a campfire", () => {
    const world = createAreaWorld(meadow, { size: 16 });
    const fire = findEntityAt(world, findInArea(meadow, "*"), [BURNABLE])!;
    expect(fire[BURNABLE].burning).toBe(true);
    addStorm(world, "rain");

    advance(world, 60000);

    expect(fire[BURNABLE].burning).toBe(false);
  });

  it("rain drops on land and splashes into water with sounds", () => {
    const world = createAreaWorld(meadow, { size: 16 });
    addStorm(world, "rain");
    const types = new Set<string>();

    for (let second = 0; second < 30; second += 1) {
      advance(world, 1000);
      world
        .getEntities([LIQUID])
        .forEach((entity) => types.add(entity[LIQUID].type));
    }

    expect([...types].sort()).toEqual(["drop", "splash"]);
    expect(playedSounds).toContain("rain");
  });

  it("rain stops after a passing storm ended", () => {
    const world = createAreaWorld(meadow, { size: 16 });
    addStorm(world, "rain", getGeneration(world) + 10);

    advance(world, 3000);
    expect(world.getEntities([LIQUID]).length).toBeGreaterThan(0);

    advance(world, 20000);
    expect(world.getEntities([LIQUID])).toHaveLength(0);
  });

  it("keeps falling and newly landing snow out of a lit campfire's warmth", () => {
    // This small wrapped map fits entirely within the fire's radius.
    const layout = `|♀ *≈ |`;
    const world = createAreaWorld(layout);
    const fire = findEntityAt(world, findInArea(layout, "*"), [BURNABLE])!;
    const lake = findInArea(layout, "≈");
    const weather = addStorm(world, "snow")[SEQUENCABLE].states.weather!;
    weather.args.start = -200;
    advance(world, 800);
    expect(weather.args.drops).toHaveLength(0);
    fire[BURNABLE].burning = false;
    advance(world, 800);
    expect(weather.args.drops.length).toBeGreaterThan(0);
    weather.args.drops.forEach((drop) => {
      drop.position = lake;
    });
    weather.args.end = 0;
    fire[BURNABLE].burning = true;
    advance(world, 7200);
    expect(findEntityAt(world, lake, [FREEZABLE])![FREEZABLE].frozen).toBe(
      false
    );
    expect(world.getEntities([COVERABLE])).toHaveLength(0);
  });

  it("snow covers open ground in a loose layer", () => {
    const world = createAreaWorld(meadow.replace("*", " "), { size: 16 });
    addStorm(world, "snow");

    advance(world, 60000);

    const ground = findAllInArea(meadow, " ");
    const snowy = ground.filter((position) => isSnowy(world, position));
    expect(snowy.length).toBeGreaterThan(ground.length / 4);
    expect(snowy.length).toBeLessThan(ground.length);
  });

  it("snow freezes water into ice covered by snow", () => {
    const world = createAreaWorld(meadow.replace("*", " "), { size: 16 });
    const lake = findAllInArea(meadow, "≈");
    // Land two successive flurries on the lake: first ice, then snow cover.
    for (let pass = 0; pass < 2; pass++) {
      const storm = addStorm(world, "snow");
      const sequence = storm[SEQUENCABLE].states.weather!;
      sequence.args.start = -200;
      world.update(0);
      expect(sequence.args.drops.length).toBeGreaterThanOrEqual(lake.length);
      sequence.args.drops.forEach((drop, index) => {
        drop.position = lake[index % lake.length];
      });
      sequence.args.end = 0;
      advance(world, 7200);
    }

    lake.forEach((position) => {
      const water = findEntityAt(world, position, [FREEZABLE])!;
      expect(water[FREEZABLE].frozen).toBe(true);
      expect(IMMERSIBLE in water).toBe(false);
    });
    const covers = lake.flatMap((position) =>
      getEntitiesAt(world, position).filter(
        (entity) => entity[COVERABLE]?.type === "snow"
      )
    );
    expect(covers.length).toBeGreaterThan(0);
    covers.forEach((cover) => expect(cover[SPRITE]).toBe(snowCover));
  });

  it("settles snow above rubble and both jetty orientations", () => {
    const layout = "|♀ H V R|";
    const world = createAreaWorld(layout, {
      size: 16,
      legend: { H: "jetty_horizontal", V: "jetty_vertical", R: "rubble" },
    });
    for (const symbol of ["H", "V", "R"]) {
      const position = findInArea(layout, symbol);
      coverSnow(world, position);
      world.update(0);
      const surface = getEntitiesAt(world, position).find(
        (e) => e[SPRITE] === jetty || e.HARVESTABLE?.resource === "rubble"
      )!;
      const cover = findEntityAt(world, position, [COVERABLE])!;
      expect(cover[SPRITE]).toBe(snowCover);
      const props = { isTransparent: false, receiveShadow: false };
      expect(getSegments(world, cover, props)[0].offsetZ).toBeGreaterThan(
        getSegments(world, surface, props)[0].offsetZ
      );
    }
  });

  it("snow stays off paths, sand, mountains and doors", () => {
    const world = createAreaWorld(valley, {
      size: 16,
      legend: { D: "iron_door" },
    });
    addStorm(world, "snow");

    advance(world, 60000);

    const clear: Position[] = ["▒", "░", "█", "D"].flatMap((char) =>
      findAllInArea(valley, char)
    );
    clear.forEach((position) => expect(isSnowy(world, position)).toBe(false));
    expect(
      findAllInArea(valley, " ").some((position) => isSnowy(world, position))
    ).toBe(true);
  });

  it("builds up, holds and fades out the intensity of a passing storm", () => {
    const scale = weatherIntensity.rain;

    expect(calculateWeatherIntensity(100, -1, scale)).toBe(0);
    expect(calculateWeatherIntensity(100, 5, scale)).toBe(scale / 2);
    expect(calculateWeatherIntensity(100, 50, scale)).toBe(scale);
    expect(calculateWeatherIntensity(100, 95, scale)).toBe(scale / 2);
    expect(calculateWeatherIntensity(100, 101, scale)).toBe(0);
    expect(calculateWeatherIntensity(Infinity, 5, scale)).toBe(0.5);
    expect(calculateWeatherIntensity(Infinity, 500, scale)).toBe(scale);
  });
});
