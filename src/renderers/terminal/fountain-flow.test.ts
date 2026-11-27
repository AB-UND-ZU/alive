import { resolveSprite } from "../../game/assets/spriteIds";
import {
  advance,
  assertHero,
  createAreaWorld,
  step,
  advanceUntil,
} from "../../testing/harness";
import { getSceneFrame } from "../interface/frame";
import { collectTerminalSprites, createTerminalFrame } from "./frame";
import { colors } from "../../game/assets/colors";
import { getSequence } from "../../engine/systems/sequence";
import { SPRITE } from "../../engine/components/sprite";
import { moveEntity } from "../../engine/systems/map";
import { fountain, fountainHeal } from "../../game/assets/sprites";
import { PARTICLE } from "../../engine/components/particle";

it("overlaps neighboring fountain segments and leaves a gap before the next flow", () => {
  const world = createAreaWorld("| ⌠ ♀ |", { size: 48 });
  const phases: string[] = [];
  for (let tick = 0; tick < 200; tick++) {
    step(world);
    const scene = getSceneFrame(world, 25, 17, undefined, { instant: true });
    const center = scene.find((entry) => entry.particleName === "fountain")!;
    const drops = collectTerminalSprites(scene).filter(
      (entry) => entry.sprite.name === "fountain_drop"
    );
    const phase = drops
      .map(
        (entry) =>
          `${entry.layers[0].char}:${entry.x - Math.ceil(center.x)},${
            entry.y - Math.ceil(center.y)
          }`
      )
      .join(" ");
    if (phase !== phases[phases.length - 1]) phases.push(phase);
    if (phases.length === 18) break;
  }
  expect(phases).toEqual([
    "|:0,-1",
    "|:0,-1 ┬:0,-2",
    "┬:0,-2 ::-1,-2 ::1,-2",
    "::-1,-2 ::1,-2 ::-1,-1 ::1,-1",
    "::-1,-1 ::1,-1",
    "",
    "|:0,-1",
    "|:0,-1 ┬:0,-2",
    "┬:0,-2 .:-1,-2 .:1,-2",
    ".:-1,-2 .:1,-2 .:-1,-1 .:1,-1",
    ".:-1,-1 .:1,-1",
    "",
    "|:0,-1",
    "|:0,-1 ┬:0,-2",
    "┬:0,-2 ,:-1,-2 ,:1,-2",
    ",:-1,-2 ,:1,-2 ,:-1,-1 ,:1,-1",
    ",:-1,-1 ,:1,-1",
    "",
  ]);
});

it("keeps healing flow lime without changing the engine's water particles", () => {
  const world = createAreaWorld("| ♀⌠ |", { size: 48 });
  const hero = assertHero(world);
  hero.STATS!.maxHp = 20;
  hero.STATS!.hp = 5;
  advance(world, 2000);
  const scene = getSceneFrame(world, 25, 17, undefined, { instant: true });
  const source = scene.find((entry) => entry.particleName === "fountain")!;
  const sequence = getSequence(world, source.entity, "fountain")!;
  const drops = Object.entries(sequence.particles).filter(([name]) =>
    name.startsWith("drop-")
  );
  expect(drops.length).toBeGreaterThan(0);
  const before = drops.map(([, id]) => {
    const particle = world.assertByIdAndComponents(id, [PARTICLE, SPRITE]);
    return { ...particle[PARTICLE], sprite: resolveSprite(particle[SPRITE]) };
  });
  const result = collectTerminalSprites(scene).filter(
    (entry) => entry.sprite.name === "fountain_heal"
  );
  expect(result.length).toBeGreaterThan(0);
  expect(result.every((entry) => entry.layers[0].color === colors.lime)).toBe(
    true
  );
  expect(
    drops.map(([, id]) => {
      const particle = world.assertByIdAndComponents(id, [PARTICLE, SPRITE]);
      return { ...particle[PARTICLE], sprite: resolveSprite(particle[SPRITE]) };
    })
  ).toEqual(before);
});

it("keeps all displayed water lime while an earlier healing drop is still in the air", () => {
  const world = createAreaWorld("| ♀⌠      |", { size: 48 });
  const hero = assertHero(world);
  hero.STATS!.maxHp = 20;
  hero.STATS!.hp = 5;
  advance(world, 2000);
  const origin = { ...hero.POSITION! };
  moveEntity(world, hero, { x: origin.x + 5, y: origin.y });
  let scene = getSceneFrame(world, 25, 17, undefined, { instant: true });
  advanceUntil(
    world,
    () => {
      scene = getSceneFrame(world, 25, 17, undefined, { instant: true });
      const center = scene.find((entry) => entry.particleName === "fountain");
      return (
        !!center &&
        center.sprite.id === fountain.id &&
        scene.some((entry) => entry.sprite.id === fountainHeal.id) &&
        Math.floor(
          getSequence(world, center.entity, "fountain")!.elapsed / 125
        ) %
          6 !==
          5
      );
    },
    1000
  );
  const center = scene.find((entry) => entry.particleName === "fountain")!;
  expect(center.sprite.id).toBe(fountain.id);
  expect(scene.some((entry) => entry.sprite.id === fountainHeal.id)).toBe(true);
  const displayed = collectTerminalSprites(scene);
  const water = displayed.filter((entry) =>
    ["fountain_drop", "fountain_heal"].includes(entry.sprite.name || "")
  );
  expect(water.length).toBeGreaterThan(0);
  expect(water.every((entry) => entry.layers[0].color === colors.lime)).toBe(
    true
  );
  expect(
    displayed.find(
      (entry) => entry.overlay && entry.sprite.id === center.sprite.id
    )!.terminalLayers
  ).toEqual([
    { char: "█", color: colors.navy },
    { char: "v", color: colors.lime },
  ]);
  expect(
    createTerminalFrame(displayed, 25, 17)[Math.ceil(center.y)][
      Math.ceil(center.x)
    ]
  ).toMatchObject({ char: "v", foreground: colors.lime });
});
