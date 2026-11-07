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
import { STICKY } from "../../engine/components/sticky";
import { isSnowy } from "../../engine/systems/freeze";
import { createSequence } from "../../engine/systems/sequence";
import {
  calculateWeatherIntensity,
  Weather,
  weatherIntensity,
} from "../../engine/systems/water";
import { none, snowCover, soilWet } from "../../game/assets/sprites";
import { playedSounds } from "../../testing/env";
import {
  advance,
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
    [STICKY]: {},
    [SPRITE]: none,
  });
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
      viewable: { x: 0, y: 0 },
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

  it("snow covers open ground in a loose layer", () => {
    const world = createAreaWorld(meadow, { size: 16 });
    addStorm(world, "snow");

    advance(world, 60000);

    const ground = findAllInArea(meadow, " ");
    const snowy = ground.filter((position) => isSnowy(world, position));
    expect(snowy.length).toBeGreaterThan(ground.length / 4);
    expect(snowy.length).toBeLessThan(ground.length);
  });

  it("snow freezes water into ice covered by snow", () => {
    const world = createAreaWorld(meadow, { size: 16 });
    const lake = findAllInArea(meadow, "≈");
    addStorm(world, "snow");

    advance(world, 90000);

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
