import {
  act,
  advance,
  advanceUntil,
  createAreaWorld,
  findEntityAt,
  findInArea,
  getEntitiesAt,
  giveItems,
  parseArea,
  step,
  trigger,
  walk,
} from "../../testing/harness";
import { assertUnit } from "./helpers";
import { getResource, workUntilDepleted } from "../tools/helpers";
import { World } from "../../engine";
import { FOG } from "../../engine/components/fog";
import { IMMERSIBLE } from "../../engine/components/immersible";
import { LIGHT } from "../../engine/components/light";
import { LOCKABLE } from "../../engine/components/lockable";
import { POSITION, Position } from "../../engine/components/position";
import { lockDoor } from "../../engine/systems/trigger";
import { isHidden } from "../../engine/systems/visibility";

// island has the smallest vision, █ mountain, ~ water
const area = `
|                     |
|                     |
|                     |
|          █          |
|          █          |
|      ♀   █    ~     |
|          █          |
|          █          |
|                     |
|                     |
|                     |
`;

const water = { x: 15, y: 5 };
const mountain = { x: 10, y: 5 };

// D wooden door in a wall with water behind it
const doorArea = `
|                 |
|~~~~~~~~~~~~~~~~~|
|~~~~~~~~~~~~~~~~~|
|    ████D████    |
|        ♀        |
|                 |
`;

// water beyond the island's vision without a torch
const fieldArea = `
|                     |
|   ♀        ~        |
|                     |
`;

const createIsland = () => {
  const world = createAreaWorld(area, { level: "LEVEL_ISLAND" });
  step(world, 60);
  return world;
};

const getFog = (world: World, position: Position) =>
  getEntitiesAt(world, position).filter((entity) => FOG in entity);

const getWaterVisibility = (world: World, position: Position) =>
  findEntityAt(world, position, [IMMERSIBLE, FOG])?.[FOG].visibility;

const countWater = (world: World, waterArea: string) => {
  const counts = { hidden: 0, fog: 0, visible: 0 };
  parseArea(waterArea).forEach((row, y) =>
    row.split("").forEach((char, x) => {
      const visibility = char === "~" && getWaterVisibility(world, { x, y });
      if (visibility) counts[visibility] += 1;
    })
  );
  return counts;
};

describe("fog of war", () => {
  it("reveals cells around the hero and removes their dark air", () => {
    const world = createIsland();
    const hero = assertUnit(world);
    const near = { x: hero[POSITION].x + 2, y: hero[POSITION].y };

    expect(isHidden(world, near)).toBe(false);
    expect(
      getFog(world, near).every((entity) => entity[FOG].type !== "air")
    ).toBe(true);
  });

  it("keeps distant cells hidden", () => {
    const world = createIsland();

    expect(isHidden(world, { x: 0, y: 10 })).toBe(true);
    expect(isHidden(world, { x: 6, y: 0 })).toBe(true);
  });

  it("does not see behind mountains", () => {
    const world = createIsland();

    expect(findEntityAt(world, mountain, [FOG])?.[FOG].visibility).toBe(
      "visible"
    );
    expect(isHidden(world, { x: mountain.x + 1, y: mountain.y })).toBe(true);
    expect(
      findEntityAt(world, water, [IMMERSIBLE, FOG])?.[FOG].visibility
    ).toBe("hidden");
  });

  it("reveals cells behind mountains when walking around them", () => {
    const world = createIsland();

    walk(world, "up", 3);
    walk(world, "right", 7);
    step(world, 30);

    expect(
      findEntityAt(world, water, [IMMERSIBLE, FOG])?.[FOG].visibility
    ).toBe("visible");
  });

  it("remembers seen terrain in the fog after walking away", () => {
    const world = createIsland();

    walk(world, "left", 6);
    step(world, 30);

    expect(findEntityAt(world, mountain, [FOG])?.[FOG].visibility).toBe("fog");
  });

  it("sees behind a mountain once it is mined away", () => {
    const world = createIsland();
    const hero = assertUnit(world);
    giveItems(world, hero, [{ tool: "pickaxe", material: "wood", amount: 1 }]);
    walk(world, "right", 3);
    step(world, 30);

    expect(getWaterVisibility(world, water)).toBe("hidden");

    act(world, "skill");
    workUntilDepleted(world, "right", getResource(world, mountain)!);
    advanceUntil(world, () => !findEntityAt(world, mountain, [LIGHT]), 3000);
    step(world, 5);

    expect(getWaterVisibility(world, water)).toBe("visible");
  });

  it("sees through an opened door until it is locked again", () => {
    const world = createAreaWorld(doorArea, {
      level: "LEVEL_ISLAND",
      size: 32,
      legend: { D: "wood_door" },
    });
    const door = findEntityAt(world, findInArea(doorArea, "D"), [LOCKABLE])!;
    step(world, 60);

    expect(countWater(world, doorArea).visible).toBe(0);

    trigger(world, "interact");
    advanceUntil(world, () => !door[LOCKABLE].locked, 1000);
    step(world, 5);
    const seen = countWater(world, doorArea).visible;

    expect(seen).toBeGreaterThan(0);

    lockDoor(world, door);
    step(world, 5);

    expect(countWater(world, doorArea)).toMatchObject({
      visible: 0,
      fog: seen,
    });
  });

  it("sees further while carrying a torch", () => {
    const world = createAreaWorld(fieldArea, {
      level: "LEVEL_ISLAND",
      size: 32,
    });
    const hero = assertUnit(world);
    const farWater = findInArea(fieldArea, "~");
    step(world, 90);

    expect(getWaterVisibility(world, farWater)).toBe("hidden");

    giveItems(world, hero, [
      { accessory: "torch", material: "gold", amount: 1 },
    ]);
    advance(world, 3000);

    expect(getWaterVisibility(world, farWater)).toBe("visible");
  });
});
