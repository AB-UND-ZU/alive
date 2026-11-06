import { World } from "../../engine";
import { BEHAVIOUR, Pattern } from "../../engine/components/behaviour";
import { INVENTORY } from "../../engine/components/inventory";
import { POSITION } from "../../engine/components/position";
import { TypedEntity } from "../../engine/entities";
import { dropEntity } from "../../engine/systems/drop";
import { giveItems } from "../../testing/harness";
import {
  advanceTicks,
  createCreatureWorld,
  distanceBetween,
  teleport,
  trace,
} from "./helpers";

const getCritter = (world: World, name: Pattern["name"]) =>
  world
    .getEntities([BEHAVIOUR, POSITION])
    .find((entity) =>
      entity[BEHAVIOUR].patterns.some(
        (pattern: Pattern) => pattern.name === name
      )
    ) as TypedEntity<"BEHAVIOUR" | "POSITION">;

const pond = `
|≈≈≈≈≈≈≈≈≈≈≈|
|≈≈≈≈≈≈≈≈≈≈≈|
|≈≈≈≈≈α≈≈≈≈≈|
|≈≈≈≈≈≈≈≈≈≈≈|
|≈≈≈≈≈≈≈≈≈≈≈|
|           |
|♀          |
`;

describe("fish", () => {
  it("swims around its spot in the water", () => {
    const { world, hero } = createCreatureWorld(pond);
    teleport(world, hero, { x: 30, y: 30 });
    const fish = getCritter(world, "fish");
    const start = { ...fish[POSITION] };

    const positions = trace(world, 40, () => ({ ...fish[POSITION] }));

    expect(positions.some(({ x, y }) => x !== start.x || y !== start.y)).toBe(
      true
    );
    positions.forEach((position) => {
      expect(distanceBetween(world, position, start)).toBeLessThanOrEqual(8);
      expect(position.y).toBeLessThan(5);
    });
  });

  it("darts away from a hero swimming close by", () => {
    const { world, hero } = createCreatureWorld(pond);
    const fish = getCritter(world, "fish");
    teleport(world, hero, { x: fish[POSITION].x - 2, y: fish[POSITION].y });
    const start = distanceBetween(world, fish[POSITION], hero[POSITION]);

    advanceTicks(world, 3);

    expect(
      distanceBetween(world, fish[POSITION], hero[POSITION])
    ).toBeGreaterThan(start);
  });
});

describe("worm", () => {
  const dropWorm = () => {
    const { world, hero } = createCreatureWorld(`
|♀          |
|           |
|           |
|           |
`);
    const [worm] = giveItems(world, hero, [{ stackable: "worm", amount: 1 }]);
    hero[INVENTORY].items = [];
    dropEntity(
      world,
      { [INVENTORY]: { items: [world.getEntityId(worm)] } },
      { x: 5, y: 2 }
    );
    teleport(world, hero, { x: 30, y: 30 });
    return { world, critter: getCritter(world, "worm") };
  };

  it("crawls around where it was dropped", () => {
    const { world, critter } = dropWorm();
    const start = { ...critter[POSITION] };

    const positions = trace(world, 40, () => ({ ...critter[POSITION] }));

    expect(positions.some(({ x, y }) => x !== start.x || y !== start.y)).toBe(
      true
    );
    positions.forEach((position) => {
      expect(distanceBetween(world, position, start)).toBeLessThanOrEqual(5);
    });
  });
});
