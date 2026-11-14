import {
  createArea,
  createSpellWorld,
  cast,
} from "../../features/spells/helpers";
import { FRAME, step } from "../../testing/harness";
import { orientations } from "../../engine/components/orientable";
import { materials, elements } from "../../engine/components/item";
import { colors } from "../../game/assets/colors";
import { getSceneFrame } from "../interface/frame";
import { CASTABLE } from "../../engine/components/castable";
import { POSITION } from "../../engine/components/position";
import { SEQUENCABLE } from "../../engine/components/sequencable";
import { getTriggerElapsed } from "../../engine/systems/magic";
import { moveEntity } from "../../engine/systems/map";
import {
  collectTerminalSprites,
  createTerminalFrame,
  frameToText,
} from "./frame";

it("shows beam bolts moving through terminal cells before reaching their endpoint", () => {
  const { world } = createSpellWorld(
    createArea(15, 9, { "♀": { x: 3, y: 4 } }),
    { spell: "beam", material: "iron", element: "fire" },
    { size: 40 }
  );
  cast(world, "right");
  const columns = new Set<number>();
  for (let tick = 0; tick < 30; tick++) {
    step(world);
    const scene = getSceneFrame(world, 33, 21, undefined, { instant: true });
    const bolts = collectTerminalSprites(scene).filter((entry) =>
      entry.sprite.name.startsWith("bolt")
    );
    const frame = createTerminalFrame(bolts, 33, 21);
    for (const row of frame)
      row.forEach((cell, x) => {
        if (cell.char === "•" && cell.foreground === colors.red) columns.add(x);
      });
  }
  expect(columns.size).toBeGreaterThan(2);
});

it("draws a complete terminal frame when a trap activates before it implodes", () => {
  const { world, hero } = createSpellWorld(
    createArea(11, 11, { "♀": { x: 5, y: 5 }, D: { x: 1, y: 1 } }),
    { spell: "trap", material: "iron", element: "fire" },
    { size: 40 }
  );
  cast(world, "down");
  const spell = world
    .getEntities([CASTABLE, POSITION, SEQUENCABLE])
    .find((entity) => entity[SEQUENCABLE].states.aura?.name === "trapAura")!;
  const center = spell[POSITION];
  moveEntity(world, hero, { x: center.x, y: center.y + 3 });
  step(world);
  const dummy = world
    .getEntities([POSITION])
    .find((entity) => entity.NPC?.type === "dummy");
  if (!dummy) throw new Error("Missing trap target");
  moveEntity(world, dummy, center);
  step(world);
  const trigger = spell[CASTABLE].trigger!;
  while (getTriggerElapsed(world, trigger) + FRAME < trigger.delay) step(world);
  world.update(trigger.delay - getTriggerElapsed(world, trigger));
  for (const elapsed of [0, 50, 150, 300, 450]) {
    world.update(trigger.delay + elapsed - getTriggerElapsed(world, trigger));
    const scene = getSceneFrame(world, 33, 21, undefined, { instant: true });
    const border = collectTerminalSprites(scene).filter(
      (entry) => entry.sprite.name === "trap_border"
    );
    const frame = createTerminalFrame(border, 33, 21);
    expect(
      frameToText(frame)
        .split("\n")
        .map((row) => row.trim())
        .filter(Boolean)
    ).toEqual(["┌─┐", "│ │", "└─┘"]);
  }
});

it.each(orientations)(
  "keeps expanding waves centered while casting %s",
  (direction) => {
    const { world } = createSpellWorld(
      createArea(15, 15, { "♀": { x: 7, y: 7 } }),
      { spell: "wave", material: "iron", element: "fire" },
      { size: 64 }
    );
    cast(world, direction);
    let frames = 0;
    for (let tick = 0; tick < 35; tick++) {
      step(world);
      const scene = getSceneFrame(world, 33, 21, undefined, { instant: true });
      const center = scene.find(
        (entry) => entry.entity.CASTABLE && /body0$/.test(entry.key)
      );
      const ring = collectTerminalSprites(scene).filter((entry) =>
        /^wave_(side|corner)/.test(entry.sprite.name)
      );
      if (!center || !ring.length) continue;
      frames++;
      const xs = ring.map((entry) => entry.x),
        ys = ring.map((entry) => entry.y);
      expect(Math.min(...xs) + Math.max(...xs)).toBe(2 * Math.ceil(center.x));
      expect(Math.min(...ys) + Math.max(...ys)).toBe(2 * Math.ceil(center.y));
      expect(
        ring.every(
          (entry) => Number.isInteger(entry.x) && Number.isInteger(entry.y)
        )
      ).toBe(true);
    }
    expect(frames).toBeGreaterThan(20);
  }
);

it.each(orientations)(
  "keeps beam endpoints above interior bolts when casting %s",
  (direction) => {
    let overlaps = 0;
    for (const material of materials)
      for (const element of elements) {
        const { world } = createSpellWorld(
          createArea(15, 15, { "♀": { x: 7, y: 7 } }),
          { spell: "beam", material, element },
          { size: 64, mp: 99 }
        );
        cast(world, direction);
        let capFrames = 0;
        for (let tick = 0; tick < 35; tick++) {
          step(world);
          const scene = getSceneFrame(world, 33, 21, undefined, {
            instant: true,
          });
          const beam = collectTerminalSprites(scene).filter((entry) =>
            /^(edge|bolt)/.test(entry.sprite.name)
          );
          const caps = beam.filter((entry) => /^edge/.test(entry.sprite.name));
          if (!caps.length) continue;
          capFrames++;
          const frame = createTerminalFrame(beam, 33, 21);
          const positions = new Map(
            caps.map((entry) => [`${entry.x},${entry.y}`, entry])
          );
          for (const cap of positions.values()) {
            if (cap.x < 0 || cap.x >= 33 || cap.y < 0 || cap.y >= 21) continue;
            if (
              beam.some(
                (entry) =>
                  /^bolt/.test(entry.sprite.name) &&
                  entry.x === cap.x &&
                  entry.y === cap.y
              )
            )
              overlaps++;
            const capOnly = createTerminalFrame([cap], 33, 21)[cap.y][cap.x];
            expect(frame[cap.y][cap.x]).toEqual(capOnly);
            expect(capOnly.char).not.toBe(":");
          }
        }
        expect(capFrames).toBeGreaterThan(3);
      }
    expect(overlaps).toBeGreaterThan(0);
  }
);
