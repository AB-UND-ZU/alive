import {
  countItems,
  findEntityAt,
  findInArea,
  step,
  walk,
} from "../../testing/harness";
import { FREEZABLE } from "../../engine/components/freezable";
import { IMMERSIBLE } from "../../engine/components/immersible";
import { HARVESTABLE } from "../../engine/components/harvestable";
import { freezeTerrain, thawTerrain } from "../../engine/systems/freeze";
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

  it("fills buckets from melted natural ice and updates the surrounding shoreline", () => {
    const area = `
|    ~~~ |
| ♀I ~I~ |
|    ~~~ |
`;
    const { world, hero } = setupTools(area, [{ ...emptyBucket, amount: 1 }], {
      I: "ice",
    });
    const position = findInArea(area, "I");
    const ice = findEntityAt(world, position, [FREEZABLE])!;
    const lakeIce = findEntityAt(world, { x: 5, y: 1 }, [FREEZABLE])!;
    thawTerrain(world, lakeIce);
    expect(lakeIce[IMMERSIBLE]?.deep).toBe(true);
    thawTerrain(world, ice);
    expect(ice[IMMERSIBLE]?.deep).toBe(false);
    const shore = findEntityAt(world, { x: position.x, y: 0 }, [HARVESTABLE])!;
    expect(shore[HARVESTABLE].resource).toBe("beach");
    freezeTerrain(world, ice);
    expect(shore[HARVESTABLE].resource).toBe("sand");
    thawTerrain(world, ice);
    walk(world, "right");
    step(world, 10);
    expect(countItems(world, hero, waterBucket)).toBe(1);
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
    expect(soil[SPRITE].id).toBe(soilWet.id);
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
