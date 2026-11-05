import Systems from ".";
import {
  assertHero,
  createAreaWorld,
  findInArea,
  holdMove,
  snapshot,
} from "../../testing/harness";
import { renderScene } from "../../testing/render";
import { LEVEL } from "../../engine/components/level";
import { POSITION } from "../../engine/components/position";
import { STICKY } from "../../engine/components/sticky";
import { CASTABLE } from "../../engine/components/castable";
import { normalize } from "../../game/math/std";
import { TypedEntity } from "../../engine/entities";
import type { ReactThreeTest } from "@react-three/test-renderer";

// replace entity visuals with a plain group carrying its render props
jest.mock("../Entity", () => ({
  __esModule: true,
  default: (props: any) =>
    require("react").createElement("group", {
      userData: { entity: props.entity, x: props.x, y: props.y },
    }),
}));

type EntityGroup = { entity: TypedEntity<"POSITION">; x: number; y: number };

const getEntityGroups = (scene: ReactThreeTest.Renderer["scene"]) =>
  scene
    .findAll((node) => !!node.instance.userData?.entity)
    .map((node) => node.instance.userData as EntityGroup);

// ♀ hero, █ mountain, # tree, ~ shallow water, ¾ sign, " " air
const area = `
|██████████|
|█ #   ~~ █|
|█   ♀    █|
|█ ¾    # █|
|██████████|
`;

const spawn = findInArea(area, "♀");

// larger than the viewport to not render wrapped duplicates
const createWorld = () => createAreaWorld(area, { size: 48 });

describe("Systems", () => {
  it("renders every entity within the viewport at its own cell", async () => {
    const world = createWorld();
    const hero = assertHero(world);
    const size = world.metadata.gameEntity[LEVEL].size;
    const { renderedColumns, renderedRows } = world.metadata.dimensions;

    const { renderer, advanceFrames } = await renderScene(world, <Systems />);
    await advanceFrames(2);

    const visible = getEntityGroups(renderer.scene);
    expect(visible.length).toBeGreaterThan(renderedColumns);
    expect(visible).toContainEqual({ entity: hero, ...spawn });

    // viewpoint starts at 0,0 and the overscan keeps cells rendered while
    // sliding over to the hero
    const within = (value: number, target: number, radius: number) =>
      value >= Math.min(0, target) - radius - 1 &&
      value <= Math.max(0, target) + radius + 1;

    for (const { entity, x, y } of visible) {
      if (STICKY in entity || CASTABLE in entity) continue;

      expect(normalize(x, size)).toBe(entity[POSITION].x);
      expect(normalize(y, size)).toBe(entity[POSITION].y);
      expect(within(x, hero[POSITION].x, renderedColumns / 2)).toBe(true);
      expect(within(y, hero[POSITION].y, renderedRows / 2)).toBe(true);
    }
  });

  it("advances the world from the render loop and follows the hero", async () => {
    const world = createWorld();
    const hero = assertHero(world);
    const { renderer, advanceFrames } = await renderScene(world, <Systems />);
    await advanceFrames(2);

    holdMove(world, ["right"]);
    await advanceFrames(10);
    holdMove(world, []);

    const moved = { x: spawn.x + 1, y: spawn.y };
    expect(hero[POSITION]).toEqual(moved);
    expect(getEntityGroups(renderer.scene)).toContainEqual({
      entity: hero,
      ...moved,
    });
  });

  it("does not advance the world while paused", async () => {
    const world = createWorld();
    const { advanceFrames } = await renderScene(world, <Systems />, {
      paused: true,
    });
    const before = snapshot(world);
    const generation = world.metadata.gameEntity.RENDERABLE.generation;

    holdMove(world, ["right"]);
    await advanceFrames(30);

    expect(world.metadata.gameEntity.RENDERABLE.generation).toBe(generation);
    expect(snapshot(world)).toBe(before);
  });
});
