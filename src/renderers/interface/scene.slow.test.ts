import { collectScene, SceneViewport } from "./scene";
import {
  act,
  assertHero,
  createAreaWorld,
  face,
  giveItems,
  walk,
} from "../../testing/harness";
import { entities } from "../../engine";
import { POSITION, Position } from "../../engine/components/position";
import { emptyCastable } from "../../engine/components/castable";
import { DISPLACABLE } from "../../engine/components/displacable";
import { none } from "../../game/assets/sprites";

const createWorld = () =>
  createAreaWorld(
    `
|████████|
|█ ♀    █|
|████████|
`,
    { size: 8 }
  );

const viewport: SceneViewport = {
  position: { x: 2, y: 1 },
  fraction: { x: 0, y: 0 },
  overscan: { x: 0, y: 0 },
  columns: 19,
  rows: 5,
};

it("keeps repeated world cells when a viewport spans the map boundary", () => {
  const world = createWorld();
  const hero = assertHero(world);
  const instances = collectScene(world, viewport, {}).filter(
    (entry) => entry[4] === hero
  );

  expect(instances.map(([x, y]) => ({ x, y }))).toEqual([
    { x: hero[POSITION].x - 8, y: hero[POSITION].y },
    { x: hero[POSITION].x, y: hero[POSITION].y },
    { x: hero[POSITION].x + 8, y: hero[POSITION].y },
  ]);
});

it("centers sticky effects on the viewpoint and retains projectile wrap quadrants", () => {
  const world = createWorld();
  const hero = assertHero(world);
  const anchor = entities.createAnchor(world, {
    POSITION: { x: 0, y: 0 },
    RENDERABLE: { generation: 0 },
    SEQUENCABLE: { states: {} },
    STICKY: {},
    SPRITE: none,
  });
  const spell = entities.createSpell(world, {
    BELONGABLE: { faction: "unit" },
    CASTABLE: {
      ...emptyCastable,
      caster: world.getEntityId(hero),
      affected: {},
    },
    ORIENTABLE: {},
    POSITION: { x: 7, y: 1 },
    RENDERABLE: { generation: 0 },
    SEQUENCABLE: { states: {} },
    SPRITE: none,
  });
  const quadrants: Record<number, Position> = {};
  const scene = collectScene(world, viewport, quadrants);
  expect(scene.filter((entry) => entry[4] === anchor)).toHaveLength(1);
  expect(scene.find((entry) => entry[4] === anchor)?.slice(0, 2)).toEqual([
    2, 1,
  ]);
  expect(scene.filter((entry) => entry[4] === spell)).toHaveLength(1);
  const first = scene.find((entry) => entry[4] === spell)!;
  expect(first[0]).toBe(-1);

  const moved = collectScene(
    world,
    { ...viewport, position: { x: 8, y: 1 } },
    quadrants
  );
  expect(moved.find((entry) => entry[4] === spell)?.[0]).toBe(first[0]);
  expect(moved.find((entry) => entry[4] === anchor)?.slice(0, 2)).toEqual([
    8, 1,
  ]);
});

it.each(["left", "up"] as const)(
  "keeps a summoned totem visible when pushed %s across a map seam",
  (direction) => {
    const world = createAreaWorld("|    |\n| ♀  |\n|    |", { size: 32 });
    const hero = world.assertComponents(assertHero(world), ["INVENTORY", POSITION]);
    giveItems(world, hero, [
      { skill: "totem", material: "iron", amount: 1 },
      { stackable: "charge", amount: 1 },
    ]);
    face(world, direction);
    act(world, "skill");
    const totem = world.getEntity([DISPLACABLE, POSITION])!;
    const quadrants = {};
    const rendered = () =>
      collectScene(
        world,
        { ...viewport, columns: 7, position: { x: 1, y: 1 } },
        quadrants
      )
        .filter((entry) => entry[4] === totem)
        .map((entry) => entry.slice(0, 2));
    expect(rendered()).toEqual([direction === "left" ? [0, 1] : [1, 0]]);
    walk(world, direction);
    expect(totem[POSITION]).toEqual(
      direction === "left" ? { x: 31, y: 1 } : { x: 1, y: 31 }
    );
    expect(rendered()).toEqual([direction === "left" ? [-1, 1] : [1, -1]]);
  }
);
