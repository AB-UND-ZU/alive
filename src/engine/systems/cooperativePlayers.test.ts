import { getSequence } from "./sequence";
import {
  advance,
  advanceUntil,
  assertHero,
  createAreaWorld,
} from "../../testing/harness";
import { createHero, canRevive } from "./fate";
import { moveEntity, registerEntity } from "./map";
import { isMovable } from "./movement";
import { PLAYER } from "../components/player";
import { POSITION } from "../components/position";

it("lets teammates pass in a narrow passage while retaining terrain collisions", () => {
  const world = createAreaWorld("|██████|\n| ♀   █|\n|██████|", { size: 16 });
  advance(world, 2500);
  const first = assertHero(world);
  const second = createHero(world, first);
  registerEntity(world, second);
  moveEntity(world, second, { x: 3, y: 1 });
  expect(isMovable(world, first, second[POSITION])).toBe(false);
  world.metadata.warpPlayer = () => {};
  expect(isMovable(world, first, second[POSITION])).toBe(true);
  expect(isMovable(world, first, { x: 3, y: 0 })).toBe(false);
});

it("keeps another player's tombstone available for its owner", () => {
  const world = createAreaWorld("|      |\n| ♀    |\n|      |", { size: 16 });
  const hero = assertHero(world);
  const grave = world.createEntity();
  world.addComponentToEntity(grave, "REVIVABLE", { available: true });
  world.addComponentToEntity(hero, "SOUL", {
    ready: false,
    stats: { level: 1, maxHp: 5, maxMp: 0, maxXp: 10 },
    tombstoneId: world.getEntityId(grave),
  });
  hero[PLAYER].ghost = true;
  world.metadata.warpPlayer = () => {};
  expect(canRevive(world, grave, hero)).toBe(true);
  const otherGrave = world.createEntity();
  world.addComponentToEntity(otherGrave, "REVIVABLE", { available: true });
  expect(canRevive(world, otherGrave, hero)).toBe(false);
});

it("shows nearby unit text for a teammate while the first player is elsewhere", () => {
  const world = createAreaWorld(
    "|             |\n| ♀        A  |\n|             |",
    {
      size: 32,
      legend: { A: "dummy" },
    }
  );
  advance(world, 2500);
  const first = assertHero(world);
  const second = createHero(world, first);
  registerEntity(world, second);
  moveEntity(world, first, { x: 20, y: 20 });
  const target = world.getEntity(["NPC", POSITION])!;
  moveEntity(world, second, {
    x: target[POSITION].x - 1,
    y: target[POSITION].y,
  });
  world.metadata.warpPlayer = () => {};
  advanceUntil(world, () => !!getSequence(world, target, "dialog"), 2000);
  expect(getSequence(world, target, "dialog")!.args.isIdle).toBe(false);
});
