import { World } from "../../engine";
import { BELONGABLE } from "../../engine/components/belongable";
import { IDENTIFIABLE } from "../../engine/components/identifiable";
import { POSITION } from "../../engine/components/position";
import { LIGHT } from "../../engine/components/light";
import { STATS } from "../../engine/components/stats";
import { VIEWABLE } from "../../engine/components/viewable";
import { assertIdentifierAndComponents } from "../../engine/utils";
import { advanceUntil, holdMove } from "../../testing/harness";
import { createCreatureWorld, teleport, toughen } from "../creatures/helpers";
import { getStep } from "./helpers";

// ♀ hero, O oak boss, ô bushes
const arena = `
|                     |
|   ô ô         ô ô   |
|                     |
|          O          |
|                     |
|                     |
|   ô ô         ô ô   |
|                     |
|                     |
|          ♀          |
|                     |
`;

const setupOak = () => {
  const { world, ...rest } = createCreatureWorld(arena);
  toughen(rest.hero);
  const hero = world.assertComponents(rest.hero, [LIGHT, STATS, POSITION]);
  const room = assertIdentifierAndComponents(world, "oakRoom", [
    LIGHT,
    VIEWABLE,
  ]);
  const oak = assertIdentifierAndComponents(world, "oak_boss", [
    BELONGABLE,
    STATS,
  ]);
  teleport(world, room, { x: 10, y: 6 });
  return { world, hero, room, oak };
};

const barriers = (world: World) =>
  world
    .getEntities([IDENTIFIABLE])
    .filter((entity) => entity[IDENTIFIABLE].name === "oak:barrier");

const awaken = (world: World, oak: ReturnType<typeof setupOak>["oak"]) => {
  holdMove(world, ["up"]);
  advanceUntil(world, () => oak[BELONGABLE].faction === "wild", 3000);
  holdMove(world, []);
};

describe("oak room", () => {
  it("lights up the room and dims the hero on entering", () => {
    const { world, hero, room } = setupOak();

    advanceUntil(world, () => getStep(world, room) === "enter", 2000);

    expect(room[LIGHT].brightness).toBe(7.2);
    expect(room[VIEWABLE].active).toBe(true);
    expect(hero[LIGHT].brightness).toBe(0);
    expect(barriers(world)).toHaveLength(0);
  });

  it("restores the hero's light after leaving", () => {
    const { world, hero, room } = setupOak();
    advanceUntil(world, () => getStep(world, room) === "enter", 2000);

    teleport(world, hero, { x: 10, y: 30 });
    advanceUntil(world, () => getStep(world, room) === "wait", 2000);

    expect(room[LIGHT].brightness).toBe(0);
    expect(room[VIEWABLE].active).toBe(false);
    expect(hero[LIGHT].brightness).toBe(hero[LIGHT].visibility);
  });

  it("closes the room with a barrier once the oak wakes up", () => {
    const { world, room, oak } = setupOak();
    advanceUntil(world, () => getStep(world, room) === "enter", 2000);

    awaken(world, oak);
    advanceUntil(world, () => getStep(world, room) === "fight", 2000);

    expect(barriers(world).length).toBeGreaterThan(0);
  });

  it("opens the barrier again when the oak is defeated", () => {
    const { world, room, oak } = setupOak();
    advanceUntil(world, () => getStep(world, room) === "enter", 2000);
    awaken(world, oak);
    advanceUntil(world, () => getStep(world, room) === "fight", 2000);

    oak[STATS].hp = 0;
    advanceUntil(world, () => barriers(world).length === 0, 10000);
  });

  it("opens the barrier again when the hero dies", () => {
    const { world, hero, room, oak } = setupOak();
    advanceUntil(world, () => getStep(world, room) === "enter", 2000);
    awaken(world, oak);
    advanceUntil(world, () => getStep(world, room) === "fight", 2000);

    hero[STATS].hp = 0;
    advanceUntil(world, () => barriers(world).length === 0, 5000);
  });
});
