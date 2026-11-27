import {
  advance,
  assertHero,
  createAreaWorld,
  giveItems,
} from "../../testing/harness";
import { getSceneFrame } from "../interface/frame";
import { createText } from "../../game/assets/ui";
import { queueMessage } from "../../game/assets/utils";
import { getSequence } from "../../engine/systems/sequence";
import { PARTICLE } from "../../engine/components/particle";
import { SPRITE } from "../../engine/components/sprite";
import { STATS } from "../../engine/components/stats";
import {
  attackUntil,
  createCombatWorld,
  getUnit,
} from "../../features/combat/helpers";

it("places damage below a target attacked downwards so it cannot cover the hero", () => {
  const area = "|     |\n|  ♀  |\n|  U  |\n|     |";
  const { world, hero } = createCombatWorld(area, { U: "woodChest" });
  const target = getUnit(world, area, "U");
  giveItems(world, hero, [{ weapon: "sword", material: "iron", amount: 1 }]);
  attackUntil(world, "down", () => target[STATS].hp < 15);
  advance(world, 20);
  const frame = getSceneFrame(world, 15, 11, undefined, { instant: true });
  const bodies = frame.filter(
    (entry) => entry.entity === target && entry.sprite.id === target[SPRITE]?.id
  );
  const damage = frame.filter(
    (entry) =>
      entry.entity === target && entry.particleSequence === "transientMessage"
  );
  expect(damage.length).toBeGreaterThan(0);
  expect(
    damage.every((entry) => bodies.some((body) => entry.y === body.y + 1))
  ).toBe(true);
  expect(
    getSequence(world, target, "message")!.args.messages[0].orientation
  ).toBe("down");
});

it("keeps a pending downward stream together, pushes older rows down, and expires each message on time", () => {
  const world = createAreaWorld("| ♀ |", { size: 48 });
  const hero = assertHero(world);
  advance(world, 2000);
  const add = (text: string, orientation: "up" | "down") =>
    queueMessage(world, hero, {
      line: createText(text),
      orientation,
      fast: true,
      delay: 0,
    });
  const rows = () => {
    const frame = getSceneFrame(world, 15, 11, undefined, { instant: true });
    const body = frame.find(
      (entry) => entry.entity === hero && /body\d+$/.test(entry.key)
    )!;
    return frame
      .filter(
        (entry) =>
          entry.entity === hero && entry.particleSequence === "transientMessage"
      )
      .map((entry) => ({ text: entry.layers[0].char, y: entry.y - body.y }));
  };
  add("A", "down");
  advance(world, 100);
  add("B", "up");
  advance(world, 100);
  expect(rows()).toEqual([
    { text: "A", y: 2 },
    { text: "B", y: 1 },
  ]);
  const sequence = getSequence(world, hero, "message")!;
  expect(sequence.args.messages.map((message) => message.orientation)).toEqual([
    "down",
    "down",
  ]);
  const particles = Object.values(sequence.particles).map((id) =>
    world.assertByIdAndComponents(id, [PARTICLE])
  );
  expect(
    particles.every(
      (particle) =>
        particle[PARTICLE].animatedOrigin!.y === 1 &&
        particle[PARTICLE].offsetY === 4
    )
  ).toBe(true);
  advance(world, 420);
  expect(rows()).toEqual([{ text: "B", y: 1 }]);
  advance(world, 100);
  expect(rows()).toEqual([]);
  add("C", "up");
  advance(world, 100);
  expect(rows()).toEqual([{ text: "C", y: -1 }]);
  const next = getSequence(world, hero, "message")!;
  const particle = world.assertByIdAndComponents(
    Object.values(next.particles)[0],
    [PARTICLE]
  );
  expect(particle[PARTICLE].animatedOrigin!.y).toBe(-1);
  expect(particle[PARTICLE].offsetY).toBe(-4);
});
