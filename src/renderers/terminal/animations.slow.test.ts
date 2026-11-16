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

it("keeps fountain side drops mirrored throughout their path", () => {
  const world = createAreaWorld("| ⌠ ♀ |", { size: 48 });
  advance(world, 2000);
  let seen = 0;
  for (let tick = 0; tick < 150; tick++) {
    step(world);
    const scene = getSceneFrame(world, 25, 17, undefined, { instant: true });
    const center = scene.find((entry) => entry.particleName === "fountain")!;
    const drops = collectTerminalSprites(scene).filter((entry) =>
      ["fountain_drop", "fountain_heal"].includes(entry.sprite.name)
    );
    const left = drops.filter((entry) => entry.x < Math.ceil(center.x));
    for (const drop of left) {
      expect(
        drops.some(
          (other) =>
            other.x === 2 * Math.ceil(center.x) - drop.x && other.y === drop.y
        )
      ).toBe(true);
      seen++;
    }
  }
  expect(seen).toBeGreaterThan(50);
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
