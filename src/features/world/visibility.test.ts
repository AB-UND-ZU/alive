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
import { getEntityVision, isHidden } from "../../engine/systems/visibility";

import { EQUIPPABLE } from "../../engine/components/equippable";
import { equipItem, unequipItem } from "../../engine/systems/collect";
import { getSequence } from "../../engine/systems/sequence";
import { saveAndLoad } from "../../testing/saves";

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

describe("torch vision transitions", () => {
  const setup = () => {
    const world = createAreaWorld(fieldArea, {
      level: "LEVEL_ISLAND",
      size: 32,
    });
    return { world, hero: assertUnit(world) };
  };
  const addTorch = (
    world: World,
    hero: ReturnType<typeof assertUnit>,
    material: "wood" | "gold" = "gold"
  ) => {
    const [torch] = giveItems(world, hero, [
      { accessory: "torch", material, amount: 1 },
    ]);
    if (hero[EQUIPPABLE].torch !== world.getEntityId(torch))
      equipItem(world, hero, torch);
    return torch;
  };

  it("applies a torch equipped during the level's opening vision animation", () => {
    const { world, hero } = setup();
    step(world);
    const opening = getSequence(world, hero, "vision");
    expect(opening).toBeDefined();
    addTorch(world, hero);
    step(world);
    expect(getSequence(world, hero, "vision")).toBe(opening);

    advance(world, 6000);

    expect(hero[LIGHT]).toEqual(getEntityVision(world, hero));
    expect(getWaterVisibility(world, findInArea(fieldArea, "~"))).toBe(
      "visible"
    );
    expect(getSequence(world, hero, "vision")).toBeUndefined();
  });

  it("returns to torch vision when re-equipped during contraction", () => {
    const { world, hero } = setup();
    advance(world, 2500);
    const torch = addTorch(world, hero);
    advance(world, 3000);
    expect(hero[LIGHT]).toEqual(getEntityVision(world, hero));
    unequipItem(world, hero, torch);
    advanceUntil(world, () => !!getSequence(world, hero, "vision"), 1000);
    advance(world, 250);

    equipItem(world, hero, torch);
    advance(world, 6000);

    expect(hero[LIGHT]).toEqual(getEntityVision(world, hero));
    expect(getWaterVisibility(world, findInArea(fieldArea, "~"))).toBe(
      "visible"
    );
    expect(getSequence(world, hero, "vision")).toBeUndefined();
  });

  it.each(["remove", "replace", "restore"])(
    "settles to the current torch after %s during expansion",
    (change) => {
      const { world, hero } = setup();
      advance(world, 2500);
      const torch = addTorch(world, hero);
      advanceUntil(world, () => !!getSequence(world, hero, "vision"), 1000);
      advance(world, 250);
      if (change === "replace") addTorch(world, hero, "wood");
      else unequipItem(world, hero, torch);
      step(world);

      const current = change === "restore" ? saveAndLoad(world) : world;
      const player = assertUnit(current);
      advance(current, 6000);

      expect(player[LIGHT]).toEqual(getEntityVision(current, player));
      expect(getSequence(current, player, "vision")).toBeUndefined();
    }
  );
});
