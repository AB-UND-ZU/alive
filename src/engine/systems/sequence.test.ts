import { assertHero, createAreaWorld } from "../../testing/harness";
import { createSequence, getSequence, replaceSequence } from "./sequence";
import { entities } from "..";
import { fire } from "../../game/assets/sprites";
import { VisionSequence } from "../components/sequencable";

test("replacing a vision transition removes its old particles and frame and starts the new target", () => {
  const world = createAreaWorld("|♀ |");
  const hero = assertHero(world);
  replaceSequence<"vision", VisionSequence>(
    world,
    hero,
    "vision",
    "changeRadius",
    { fast: false }
  );
  const previous = getSequence(world, hero, "vision")!;
  const particle = entities.createParticle(world, {
    PARTICLE: { offsetX: 0, offsetY: 0, offsetZ: 0 },
    SPRITE: fire,
    RENDERABLE: { generation: 0 },
  });
  previous.particles.fire = world.getEntityId(particle);
  previous.elapsed = 100;
  const light = { ...hero.LIGHT!, visibility: 5 };
  replaceSequence<"vision", VisionSequence>(
    world,
    hero,
    "vision",
    "changeRadius",
    { fast: true, light }
  );
  world.cleanup();
  expect(world.getEntityById(previous.reference)).toBeUndefined();
  expect(world.getEntityId(particle)).toBeUndefined();
  expect(getSequence(world, hero, "vision")).toMatchObject({
    elapsed: 0,
    particles: {},
    args: { fast: true, light },
  });
  expect(
    world.getEntityById(getSequence(world, hero, "vision")!.reference)
  ).toBeDefined();
});

test("starting an occupied sequence without declaring replacement still warns", () => {
  const world = createAreaWorld("|♀ |");
  const hero = assertHero(world);
  replaceSequence<"vision", VisionSequence>(
    world,
    hero,
    "vision",
    "changeRadius",
    { fast: false }
  );
  const warning = jest.spyOn(console, "warn").mockImplementation(() => {});
  try {
    createSequence<"vision", VisionSequence>(
      world,
      hero,
      "vision",
      "changeRadius",
      { fast: true }
    );
    expect(warning).toHaveBeenCalledTimes(1);
    expect(warning).toHaveBeenCalledWith(
      expect.stringContaining('Aborting previous sequence "vision"'),
      hero
    );
  } finally {
    warning.mockRestore();
  }
});
