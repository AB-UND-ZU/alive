import {
  countItems,
  findEntityAt,
  findInArea,
  step,
  walk,
} from "../../testing/harness";
import { FARMABLE } from "../../engine/components/farmable";
import { soilWet } from "../../game/assets/sprites";
import { SPRITE } from "../../engine/components/sprite";
import { setupTools } from "./helpers";

const emptyBucket = { consume: "bucket", material: "iron" } as const;
const waterBucket = { ...emptyBucket, element: "water" } as const;
const onlyEmpty = { ...emptyBucket, element: undefined };

// ♀ hero, ~ shallow water, ⌠ fountain, S soil
const lake = `
|         |
| ♀~ S    |
|         |
`;

describe("bucket", () => {
  it("fills all empty buckets when wading into water", () => {
    const { world, hero } = setupTools(lake, [{ ...emptyBucket, amount: 2 }]);

    walk(world, "right");
    step(world, 10);

    expect(countItems(world, hero, waterBucket)).toBe(2);
    expect(countItems(world, hero, onlyEmpty)).toBe(0);
  });

  it("fills buckets at the pond of a fountain", () => {
    const plaza = `
|       |
|♀  ⌠   |
|       |
`;
    const { world, hero } = setupTools(plaza, [{ ...emptyBucket, amount: 1 }]);

    walk(world, "right", 2);
    step(world, 10);

    expect(countItems(world, hero, waterBucket)).toBe(1);
  });

  it("keeps buckets empty on dry land", () => {
    const { world, hero } = setupTools(lake, [{ ...emptyBucket, amount: 1 }]);

    walk(world, "down");
    walk(world, "right");
    step(world, 10);

    expect(countItems(world, hero, onlyEmpty)).toBe(1);
  });

  it("waters dry soil by stepping on it and empties one bucket", () => {
    const { world, hero } = setupTools(lake, [{ ...waterBucket, amount: 2 }], {
      S: "soil",
    });
    const soilPosition = findInArea(lake, "S");
    const soil = findEntityAt(world, soilPosition, [FARMABLE, SPRITE])!;

    walk(world, "down");
    walk(world, "right", 3);
    walk(world, "up");
    step(world, 10);

    expect(soil[FARMABLE].watered).toBe(true);
    expect(soil[SPRITE]).toBe(soilWet);
    expect(countItems(world, hero, waterBucket)).toBe(1);
    expect(countItems(world, hero, onlyEmpty)).toBe(1);
  });

  it("does not water soil without a filled bucket", () => {
    const { world, hero } = setupTools(lake, [{ ...emptyBucket, amount: 1 }], {
      S: "soil",
    });
    const soil = findEntityAt(world, findInArea(lake, "S"), [FARMABLE])!;

    walk(world, "down");
    walk(world, "right", 3);
    walk(world, "up");
    step(world, 10);

    expect(soil[FARMABLE].watered).toBe(false);
    expect(countItems(world, hero, onlyEmpty)).toBe(1);
  });
});
