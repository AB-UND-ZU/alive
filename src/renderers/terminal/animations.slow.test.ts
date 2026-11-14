import {
  advance,
  assertHero,
  createAreaWorld,
  step,
} from "../../testing/harness";
import { createSequence } from "../../engine/systems/sequence";
import { ProgressSequence } from "../../engine/components/sequencable";
import { getSceneFrame } from "../interface/frame";
import { collectTerminalSprites } from "./frame";

it("keeps each fountain drop paired with its mirrored partner throughout its path", () => {
  const world = createAreaWorld("| ⌠ ♀ |", { size: 48 });
  advance(world, 2000);
  let seen = 0;
  for (let tick = 0; tick < 150; tick++) {
    step(world);
    const scene = getSceneFrame(world, 25, 17, undefined, { instant: true });
    const owner = scene.find(
      (entry) => entry.particleSequence === "fountainSplash"
    )!.entity;
    const center = scene.find(
      (entry) => entry.entity === owner && /body\d+$/.test(entry.key)
    )!;
    const drops = scene.filter(
      (entry) =>
        entry.entity === owner && entry.particleName?.startsWith("drop-")
    );
    for (const left of drops.filter((entry) =>
      entry.particleName!.endsWith("-left")
    )) {
      const right = drops.find(
        (entry) =>
          entry.particleName === left.particleName!.replace(/left$/, "right")
      )!;
      expect(right).toBeDefined();
      const pair = collectTerminalSprites([center, left, right]).slice(1);
      expect(pair[0].x + pair[1].x).toBe(2 * Math.ceil(center.x));
      expect(pair[0].y).toBe(pair[1].y);
      seen++;
    }
  }
  expect(seen).toBeGreaterThan(150);
});

it("keeps level-up cross and ring particles mirrored at every native-cell step", () => {
  const world = createAreaWorld("| ♀ |", { size: 48 });
  const hero = assertHero(world);
  advance(world, 2000);
  createSequence<"progress", ProgressSequence>(
    world,
    hero,
    "progress",
    "levelUp",
    { level: 2, note: 0, ring: 0, xp: 0, maxXp: 10, maxHp: 0, maxMp: 0 }
  );
  let seen = 0;
  for (let tick = 0; tick < 170; tick++) {
    step(world);
    const scene = getSceneFrame(world, 25, 17, undefined, { instant: true });
    const center = scene.find(
      (entry) => entry.entity === hero && /body\d+$/.test(entry.key)
    )!;
    const particles = collectTerminalSprites(
      scene.filter(
        (entry) =>
          entry.entity === hero &&
          (/body\d+$/.test(entry.key) || entry.particleSequence === "levelUp")
      )
    ).filter((entry) => !entry.hero);
    const points = new Set(particles.map((entry) => `${entry.x},${entry.y}`));
    for (const entry of particles) {
      expect(
        points.has(
          `${2 * Math.ceil(center.x) - entry.x},${
            2 * Math.ceil(center.y) - entry.y
          }`
        )
      ).toBe(true);
      seen++;
    }
  }
  expect(seen).toBeGreaterThan(100);
});
