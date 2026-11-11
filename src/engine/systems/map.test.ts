import { assertHero, createAreaWorld, step } from "../../testing/harness";
import { HOOKABLE } from "../components/hookable";
import { LEVEL } from "../components/level";
import { initializeCell } from "./initialize";
import { POPUP } from "../components/popup";
import { POSITION } from "../components/position";
import setupMap, { disposeEntity, getCellEntities } from "./map";
import { createPopup } from "./popup";

test("bulk cleanup removes a popup and its owned viewpoint only once", () => {
  const world = createAreaWorld(`
    |   |
    | ♀ |
    |   |
  `);
  const owner = assertHero(world);
  createPopup(world, owner, { tabs: ["inspect"] });
  const viewpoint = world.assertByIdAndComponents(
    world.assertComponents(owner, [POPUP])[POPUP].viewpoint,
    [POSITION]
  );
  setupMap(world).onUpdate(0);
  expect(getCellEntities(world, viewpoint[POSITION])).toContain(viewpoint);
  const warnings = jest.spyOn(console, "warn").mockImplementation(() => {});

  try {
    for (const entity of [owner, viewpoint, owner]) {
      disposeEntity(world, entity);
    }
    world.cleanup();

    expect(getCellEntities(world, viewpoint[POSITION])).not.toContain(viewpoint);
    expect(getCellEntities(world, owner[POSITION])).not.toContain(owner);
    expect(world.getEntityId(viewpoint)).toBeUndefined();
    expect(world.getEntityId(owner)).toBeUndefined();
    expect(warnings.mock.calls).toEqual([]);
  } finally {
    warnings.mockRestore();
  }
});

test("newly initialized fish enter the map before their first movement", () => {
  const world = createAreaWorld(`
    |   |
    | ♀ |
    |   |
  `);
  const level = world.metadata.gameEntity[LEVEL];
  level.cells[0][0] = "water_fish";
  level.initialized[0][0] = false;
  const warnings = jest.spyOn(console, "warn").mockImplementation(() => {});

  try {
    initializeCell(world, 0, 0);
    const fish = getCellEntities(world, { x: 0, y: 0 }).find(
      (entity) => HOOKABLE in entity
    );
    expect(fish).toBeDefined();
    step(world);
    expect(warnings.mock.calls).toEqual([]);
  } finally {
    warnings.mockRestore();
  }
});
