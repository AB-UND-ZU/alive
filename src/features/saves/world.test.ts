import {
  advanceUntil,
  assertHero,
  createAreaWorld,
  findEntityAt,
  getHero,
  step,
  trigger,
  walk,
} from "../../testing/harness";
import { saveAndLoad } from "../../testing/saves";
import { assignBuilding } from "../../bindings/creation";
import { World } from "../../engine";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { FOG } from "../../engine/components/fog";
import { IMMERSIBLE } from "../../engine/components/immersible";
import { ITEM } from "../../engine/components/item";
import { LAYER } from "../../engine/components/layer";
import { LOCKABLE } from "../../engine/components/lockable";
import { MOUNTABLE } from "../../engine/components/mountable";
import { MOVABLE } from "../../engine/components/movable";
import { ORIENTABLE } from "../../engine/components/orientable";
import { POSITION } from "../../engine/components/position";
import { REVIVABLE } from "../../engine/components/revivable";
import { STATS } from "../../engine/components/stats";
import { TRACKABLE } from "../../engine/components/trackable";
import { VIEWABLE } from "../../engine/components/viewable";
import { TypedEntity } from "../../engine/entities";
import { isInside } from "../../engine/systems/enter";
import { isGhost } from "../../engine/systems/fate";
import { isMounting } from "../../engine/systems/vessel";
import { isHidden } from "../../engine/systems/visibility";
import { getIdentifier, getIdentifierAndComponents } from "../../engine/utils";
import {
  addCell,
  assertPlayer,
  assertUnit,
  hold,
  interactAsPlayer,
  tryMove,
} from "../world/helpers";

const field = `
|           |
|           |
|  ♀        |
|           |
|           |
`;

// D wooden door
const house = `
|          |
| ╒╦╦╕     |
| ╠╬╬╣     |
| ╞╪╪╡     |
| └D┴┘     |
|  ♀       |
|          |
`;

const door = { x: 2, y: 4 };

const lake = `
|                |
|   ≈≈≈≈≈≈≈≈     |
|  ♀≈≈≈≈≈≈≈≈     |
|   ≈≈≈≈≈≈≈≈     |
|                |
`;

const shore = { x: 10, y: 2 };

// █ mountain, ~ water behind it
const island = `
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

// φ compass
const compassField = `
|              |
|              |
|  ♀φ          |
|              |
|              |
`;

const createHouse = () => {
  const world = createAreaWorld(house, { legend: { D: "wood_door" } });
  const { building } = assignBuilding(world, { x: 3, y: 2 });
  const lock = findEntityAt(world, door, [LOCKABLE])!;
  return { world, buildingId: world.getEntityId(building), lock };
};

const openDoor = (world: World) => {
  const lock = findEntityAt(world, door, [LOCKABLE])!;
  step(world, 15);
  trigger(world, "interact");
  advanceUntil(world, () => !lock[LOCKABLE].locked, 3000);
};

const getBuilding = (world: World, buildingId: number) =>
  world.assertByIdAndComponents(buildingId, [VIEWABLE]);

const getTombstone = (world: World) =>
  world.getEntity([REVIVABLE, POSITION]) as
    | TypedEntity<"REVIVABLE" | "POSITION">
    | undefined;

describe("saved world", () => {
  it("keeps the hero's position and facing and walks on from there", () => {
    const world = createAreaWorld(field);
    walk(world, "right", 2);
    walk(world, "down");
    const saved = { ...assertHero(world)[POSITION] };

    const loaded = saveAndLoad(world);
    const hero = assertUnit(loaded);

    expect(hero[POSITION]).toEqual(saved);
    expect(hero[ORIENTABLE].facing).toBe("down");

    walk(loaded, "right", 2);
    walk(world, "right", 2);
    expect(hero[POSITION]).toEqual(assertHero(world)[POSITION]);
    expect(hero[POSITION]).toEqual({ x: saved.x + 2, y: saved.y });
  });

  it("keeps a locked door closed", () => {
    const { world } = createHouse();
    step(world, 15);

    const loaded = saveAndLoad(world);
    const hero = assertUnit(loaded);
    tryMove(loaded, "up");

    expect(findEntityAt(loaded, door, [LOCKABLE])?.[LOCKABLE].locked).toBe(
      true
    );
    expect(hero[POSITION]).toEqual({ x: 2, y: 5 });
    expect(isInside(loaded, hero)).toBe(false);
  });

  it("walks through an opened door into the building", () => {
    const { world, buildingId } = createHouse();
    openDoor(world);

    const loaded = saveAndLoad(world);
    const hero = assertUnit(loaded);
    hold(loaded, ["up"]);
    advanceUntil(loaded, () => hero[POSITION].y === 2, 1000);
    hold(loaded, []);
    step(loaded, 30);

    expect(findEntityAt(loaded, door, [LOCKABLE])?.[LOCKABLE].locked).toBe(
      false
    );
    expect(isInside(loaded, hero)).toBe(true);
    expect(hero[LAYER].structure).toBe(buildingId);
    expect(getBuilding(loaded, buildingId)[VIEWABLE].active).toBe(true);
  });

  it("stays inside a building and leaves it by walking out", () => {
    const { world, buildingId } = createHouse();
    openDoor(world);
    hold(world, ["up"]);
    advanceUntil(world, () => assertHero(world)[POSITION].y === 2, 1000);
    hold(world, []);
    step(world, 30);

    const loaded = saveAndLoad(world);
    const hero = assertUnit(loaded);
    expect(isInside(loaded, hero)).toBe(true);
    expect(getBuilding(loaded, buildingId)[VIEWABLE].active).toBe(true);

    tryMove(loaded, "left");
    expect(hero[POSITION]).toEqual({ x: 2, y: 2 });

    hold(loaded, ["down"]);
    advanceUntil(loaded, () => hero[POSITION].y === 6, 2000);
    hold(loaded, []);

    expect(isInside(loaded, hero)).toBe(false);
    expect(hero[LAYER].structure).toBeUndefined();
    expect(getBuilding(loaded, buildingId)[VIEWABLE].active).toBe(false);
  });

  it("keeps sailing a boarded boat and leaves it at the shore", () => {
    const world = createAreaWorld(lake);
    const boatId = world.getEntityId(addCell(world, { x: 3, y: 2 }, "boat"));
    step(world, 15);
    trigger(world, "interact");
    advanceUntil(world, () => isMounting(world, assertUnit(world)), 1000);
    hold(world, ["right"]);
    advanceUntil(world, () => assertHero(world)[POSITION].x === 5, 2000);
    hold(world, []);

    const loaded = saveAndLoad(world);
    const hero = assertUnit(loaded);
    const boat = loaded.assertByIdAndComponents(boatId, [
      MOUNTABLE,
      MOVABLE,
      POSITION,
    ]);
    expect(isMounting(loaded, hero)).toBe(true);

    advanceUntil(loaded, () => boat[POSITION].x === shore.x, 3000);
    step(loaded, 30);
    expect(hero[POSITION]).toEqual(shore);

    hold(loaded, ["right"]);
    advanceUntil(loaded, () => hero[POSITION].x === shore.x + 1, 2000);
    hold(loaded, []);

    expect(isMounting(loaded, hero)).toBe(false);
    expect(boat[MOUNTABLE].passenger).toBeUndefined();
    expect(boat[POSITION]).toEqual(shore);
  });

  it("revives a saved ghost at the spawn", () => {
    const world = createAreaWorld(field);
    const spawn = { ...assertHero(world)[POSITION] };
    walk(world, "right", 4);
    assertUnit(world)[STATS].hp = 0;
    advanceUntil(world, () => !!getTombstone(world));

    const loaded = saveAndLoad(world);
    expect(isGhost(loaded, assertPlayer(loaded))).toBe(true);

    advanceUntil(loaded, () => !!getTombstone(loaded)?.[REVIVABLE].available);
    advanceUntil(loaded, () => !!loaded.metadata.interact.active, 1000);
    interactAsPlayer(loaded);
    advanceUntil(loaded, () => !!getHero(loaded));
    const revived = assertUnit(loaded);

    expect(revived[POSITION]).toEqual(spawn);
    expect(revived[STATS].hp).toBe(revived[STATS].maxHp);
    expect(isGhost(loaded, revived)).toBe(false);
  });

  it("remembers explored cells in the fog and reveals them again", () => {
    const world = createAreaWorld(island, { level: "LEVEL_ISLAND" });
    step(world, 60);
    walk(world, "up", 3);
    walk(world, "right", 7);
    walk(world, "left", 7);
    walk(world, "down", 3);
    step(world, 30);

    const loaded = saveAndLoad(world);
    step(loaded, 30);
    const lake = findEntityAt(loaded, water, [IMMERSIBLE, FOG])!;
    expect(lake[FOG].visibility).toBe("fog");
    expect(isHidden(loaded, { x: 0, y: 10 })).toBe(true);

    walk(loaded, "up", 3);
    walk(loaded, "right", 7);
    step(loaded, 30);

    expect(lake[FOG].visibility).toBe("visible");
  });

  it("points a carried compass back to the spawn", () => {
    const world = createAreaWorld(compassField);
    tryMove(world, "right");
    step(world, 15);

    const loaded = saveAndLoad(world);
    const hero = assertUnit(loaded);
    const compass = getIdentifierAndComponents(loaded, "compass", [
      ITEM,
      ORIENTABLE,
      TRACKABLE,
    ])!;
    expect(hero[EQUIPPABLE].compass).toBe(loaded.getEntityId(compass));
    expect(compass[TRACKABLE].target).toBe(
      loaded.getEntityId(getIdentifier(loaded, "spawn")!)
    );

    walk(loaded, "down", 5);
    step(loaded, 5);
    expect(compass[ORIENTABLE].facing).toBe("up");
  });
});
