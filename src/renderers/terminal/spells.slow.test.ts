import {
  createArea,
  createSpellWorld,
  cast,
} from "../../features/spells/helpers";
import { FRAME, step } from "../../testing/harness";
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
});
