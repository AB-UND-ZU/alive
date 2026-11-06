import {
  createAreaWorld,
  findEntityAt,
  getEntitiesAt,
  step,
  walk,
} from "../../testing/harness";
import { assertUnit } from "./helpers";
import { World } from "../../engine";
import { FOG } from "../../engine/components/fog";
import { IMMERSIBLE } from "../../engine/components/immersible";
import { POSITION, Position } from "../../engine/components/position";
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

const createIsland = () => {
  const world = createAreaWorld(area, { level: "LEVEL_ISLAND" });
  step(world, 60);
  return world;
};

const getFog = (world: World, position: Position) =>
  getEntitiesAt(world, position).filter((entity) => FOG in entity);

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
});
