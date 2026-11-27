import {
  advance,
  assertHero,
  createAreaWorld,
  step,
  advanceUntil,
} from "../../testing/harness";
import { getSceneFrame } from "../interface/frame";
import { getSequence, replaceSequence } from "../../engine/systems/sequence";
import { VisionSequence } from "../../engine/components/sequencable";
import { PLAYER } from "../../engine/components/player";
import { POSITION } from "../../engine/components/position";
import { reviveEntity } from "../../engine/systems/fate";
import { LIGHT } from "../../engine/components/light";
import { VIEWABLE } from "../../engine/components/viewable";
import { SPRITE } from "../../engine/components/sprite";
import { STATS } from "../../engine/components/stats";

const area = Array.from(
  { length: 21 },
  (_, y) => `|${" ".repeat(12)}${y === 10 ? "♀" : " "}${" ".repeat(12)}|`
).join("\n");

const setup = () => {
  const world = createAreaWorld(area, { size: 64, level: "LEVEL_ISLAND" });
  advance(world, 2500);
  const hero = world.assertComponents(assertHero(world), [
    LIGHT,
    VIEWABLE,
    SPRITE,
    STATS,
  ]);
  return { world, hero };
};

const visibleGrid = (
  world: ReturnType<typeof createAreaWorld>,
  columns: number,
  rows: number
) => {
  const scene = getSceneFrame(world, columns, rows, undefined, {
    instant: true,
    fogCells: true,
  });
  const hero = world.getEntities([PLAYER, POSITION])[0];
  const body = scene.find(
    (entry) => entry.entity === hero && entry.sprite.id === hero[SPRITE]?.id
  );
  const center = body
    ? { x: Math.ceil(body.x), y: Math.ceil(body.y) }
    : { x: Math.ceil((columns - 1) / 2), y: Math.ceil((rows - 1) / 2) };
  const cells = scene.filter(
    (entry) => entry.sprite.name === "visibility" && !entry.fog
  );
  const offsets = new Set(
    cells.map((entry) => `${entry.x - center.x},${entry.y - center.y}`)
  );
  expect(offsets.has("0,0")).toBe(true);
  for (const entry of cells) {
    const x = entry.x - center.x,
      y = entry.y - center.y;
    expect(offsets.has(`${-x},${y}`)).toBe(true);
    expect(offsets.has(`${x},${-y}`)).toBe(true);
  }
  return cells;
};

it.each([
  [33, 15],
  [32, 14],
  [33, 14],
  [32, 15],
])(
  "keeps every contraction step symmetric around the hero at %ix%i cells",
  (columns, rows) => {
    const { world, hero } = setup();
    replaceSequence<"vision", VisionSequence>(
      world,
      hero,
      "vision",
      "changeRadius",
      { fast: false }
    );
    let seen = 0;
    for (let frame = 0; frame < 150; frame++) {
      step(world);
      visibleGrid(world, columns, rows);
      seen++;
    }
    expect(seen).toBe(150);
    expect(getSequence(world, hero, "vision")).toBeUndefined();
    expect(visibleGrid(world, columns, rows)).toHaveLength(1);
    expect(world.metadata.visibleCells.size).toBe(0);
  }
);

it.each([0, 0.5, -0.5])(
  "aligns the last cell with a camera fraction of %s",
  (fraction) => {
    const { world, hero } = setup();
    hero[VIEWABLE].fraction = { x: fraction, y: fraction };
    hero[LIGHT].visibility = 0;
    world.metadata.visibleCells.clear();
    expect(visibleGrid(world, 32, 14)).toHaveLength(1);
    expect(visibleGrid(world, 33, 15)).toHaveLength(1);
  }
);

it("keeps death sight symmetric and reduces real respawn sight to one cell", () => {
  const { world, hero } = setup();
  hero[STATS].hp = 0;
  advanceUntil(
    world,
    () => !!world.getEntity(["REVIVABLE"])?.REVIVABLE.available,
    8000
  );
  const ghost = world.getEntities([PLAYER, POSITION])[0];
  expect(ghost[PLAYER].ghost).toBe(true);
  expect(ghost[LIGHT]!.visibility).toBe(1.5);
  visibleGrid(world, 32, 14);
  const tombstone = world.getEntity(["REVIVABLE"])!;
  reviveEntity(world, tombstone, ghost);
  let smallest = Infinity;
  for (let frame = 0; frame < 80; frame++) {
    step(world);
    smallest = Math.min(smallest, visibleGrid(world, 32, 14).length);
  }
  expect(smallest).toBe(1);
  expect(visibleGrid(world, 32, 14)).toHaveLength(1);
});
