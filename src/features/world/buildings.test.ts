import {
  AreaWorldOptions,
  advanceUntil,
  createAreaWorld,
  findEntityAt,
  step,
  trigger,
} from "../../testing/harness";
import { assignBuilding } from "../../bindings/creation";
import { World } from "../../engine";
import { FOG } from "../../engine/components/fog";
import { LAYER } from "../../engine/components/layer";
import { LOCKABLE } from "../../engine/components/lockable";
import { POSITION } from "../../engine/components/position";
import { VIEWABLE } from "../../engine/components/viewable";
import { isInside } from "../../engine/systems/enter";
import { assertUnit, hold, tryMove } from "./helpers";

// D wooden door
const area = `
|          |
| ╒╦╦╕     |
| ╠╬╬╣     |
| ╞╪╪╡     |
| └D┴┘     |
|  ♀       |
|          |
`;

const door = { x: 2, y: 4 };

const createHouse = (options: AreaWorldOptions = {}) => {
  const world = createAreaWorld(area, {
    ...options,
    legend: { D: "wood_door" },
  });
  const { building, fragments } = assignBuilding(world, { x: 3, y: 2 });
  const hero = assertUnit(world);
  return { world, hero, building, fragments };
};

const openDoor = (world: World) => {
  const lockable = findEntityAt(world, door, [LOCKABLE])!;
  step(world, 15);
  trigger(world, "interact");
  advanceUntil(world, () => !lockable[LOCKABLE].locked, 3000);
};

describe("buildings", () => {
  it("keeps the hero outside while the door is locked", () => {
    const { world, hero, building } = createHouse();

    tryMove(world, "up");

    expect(hero[POSITION]).toEqual({ x: 2, y: 5 });
    expect(isInside(world, hero)).toBe(false);
    expect(building[VIEWABLE].active).toBe(false);
  });

  it("enters the building layer through the opened door", () => {
    const { world, hero, building } = createHouse();
    openDoor(world);

    hold(world, ["up"]);
    advanceUntil(world, () => hero[POSITION].y === door.y, 1000);

    expect(hero[LAYER].structure).toBe(world.getEntityId(building));
    expect(building[VIEWABLE].active).toBe(true);

    advanceUntil(world, () => hero[POSITION].y === 2, 1000);
    hold(world, []);
    step(world, 30);

    expect(hero[POSITION]).toEqual({ x: 2, y: 2 });
    expect(isInside(world, hero)).toBe(true);
  });

  it("reveals the whole inside of the building", () => {
    const { world, hero, fragments } = createHouse({ level: "LEVEL_ISLAND" });
    openDoor(world);

    hold(world, ["up"]);
    advanceUntil(world, () => isInside(world, hero), 1000);
    hold(world, []);
    step(world, 5);

    fragments.forEach((fragment) =>
      expect(fragment[FOG].visibility).toBe("visible")
    );
  });

  it("leaves the building layer when walking out", () => {
    const { world, hero, building } = createHouse();
    openDoor(world);

    hold(world, ["up"]);
    advanceUntil(world, () => hero[POSITION].y === 2, 1000);
    hold(world, ["down"]);
    advanceUntil(world, () => hero[POSITION].y === 6, 2000);
    hold(world, []);

    expect(isInside(world, hero)).toBe(false);
    expect(hero[LAYER].structure).toBeUndefined();
    expect(building[VIEWABLE].active).toBe(false);
  });

  it("is blocked by the walls from inside", () => {
    const { world, hero } = createHouse();
    openDoor(world);

    hold(world, ["up"]);
    advanceUntil(world, () => hero[POSITION].y === 2, 1000);
    hold(world, []);
    tryMove(world, "left");
    tryMove(world, "up");

    expect(hero[POSITION]).toEqual({ x: 2, y: 2 });
  });
});
