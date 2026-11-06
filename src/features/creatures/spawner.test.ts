import { World } from "../../engine";
import { BEHAVIOUR } from "../../engine/components/behaviour";
import { IDENTIFIABLE } from "../../engine/components/identifiable";
import { STATS } from "../../engine/components/stats";
import { TypedEntity } from "../../engine/entities";
import { setIdentifier } from "../../engine/utils";
import { advanceUntil, findEntityAt } from "../../testing/harness";
import {
  advanceTicks,
  createCreatureWorld,
  getCreatures,
  toughen,
} from "./helpers";

const setup = (types: string[]) => {
  const { world, hero } = createCreatureWorld(`
|♀         |
|          |
|          |
|     ÷    |
`);
  toughen(hero);
  const spawner = findEntityAt(world, { x: 5, y: 3 }, [BEHAVIOUR])!;
  spawner[BEHAVIOUR].patterns = [
    { name: "spawner", memory: { types, name: "arena" } },
  ];
  setIdentifier(world, spawner, "arena:spawner");
  return { world, spawner };
};

const getSpawned = (world: World) =>
  world
    .getEntities([IDENTIFIABLE, STATS])
    .filter(
      (entity) => entity[IDENTIFIABLE].name === "arena:mob"
    ) as TypedEntity<"STATS" | "NPC">[];

describe("mob spawner", () => {
  it("counts down before spawning the first mob of its wave", () => {
    const { world } = setup(["prism", "eye"]);

    advanceTicks(world, 8);
    expect(getSpawned(world)).toHaveLength(0);

    advanceUntil(world, () => getSpawned(world).length === 1, 5000);
    expect(getCreatures(world, "prism")).toHaveLength(1);
  });

  it("waits for the spawned mob to be defeated before the next one", () => {
    const { world } = setup(["prism", "eye"]);
    advanceUntil(world, () => getSpawned(world).length === 1, 10000);

    advanceTicks(world, 20);
    expect(getCreatures(world, "eye")).toHaveLength(0);

    getSpawned(world)[0][STATS].hp = 0;
    advanceUntil(world, () => getCreatures(world, "eye").length === 1, 15000);
  });

  it("disappears once its wave is defeated", () => {
    const { world, spawner } = setup(["prism"]);
    advanceUntil(world, () => getSpawned(world).length === 1, 10000);

    getSpawned(world)[0][STATS].hp = 0;
    advanceUntil(
      world,
      () => !world.getEntityById(world.getEntityId(spawner)),
      15000
    );
  });
});
