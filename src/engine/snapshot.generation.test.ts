import { deserialize, serialize } from "v8";
import { advance, assertHero, createTestWorld } from "../testing/harness";
import { createSystems, preloadLevel, World } from "./ecs";
import { createSnapshot, restoreSnapshot, WorldSnapshot } from "./snapshot";
import { BEHAVIOUR } from "./components/behaviour";
import { POSITION } from "./components/position";
import { TypedEntity } from "./entities";

const getEntrances = (world: World) =>
  world
    .getEntities([BEHAVIOUR])
    .flatMap((entity) =>
      entity[BEHAVIOUR].patterns.map(
        (pattern: { memory?: { entrance?: TypedEntity } }) =>
          pattern.memory?.entrance
      )
    )
    .filter((entrance): entrance is TypedEntity => !!entrance);

describe("island snapshot", () => {
  it("restores a generated island with references between entities", () => {
    const world = createTestWorld({ level: "LEVEL_ISLAND" });
    advance(world, 1000);

    const restored = restoreSnapshot(
      deserialize(serialize(createSnapshot(world))) as WorldSnapshot
    );
    createSystems(restored);
    preloadLevel(restored);

    const entrances = getEntrances(restored);
    expect(entrances.length).toBeGreaterThan(0);
    expect(entrances.map((entrance) => restored.getEntityId(entrance))).toEqual(
      getEntrances(world).map((entrance) => world.getEntityId(entrance))
    );

    advance(restored, 3000);
    expect(assertHero(restored)[POSITION]).toEqual(assertHero(world)[POSITION]);
  });
});
