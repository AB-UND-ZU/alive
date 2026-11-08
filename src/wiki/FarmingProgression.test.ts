import { farmingProgression } from "./FarmingProgression";
import { getCellEntities } from "../engine/systems/map";
import { getFarmable } from "../engine/systems/harvest";

test("the farming specimen waters dry soil and grows planted grain into Wheat", () => {
  const { stages, world, soil } = farmingProgression();
  expect(stages.map((stage) => stage.name)).toEqual([
    "Dry Soil",
    "Watered Soil",
    "Planted",
    "Stage 2",
    "Stage 3",
    "Stage 4",
    "Stage 5",
    "Wheat",
  ]);
  expect(stages[0].rows).not.toEqual(stages[1].rows);
  expect(soil.FARMABLE.planted).toBeUndefined();
  const crops = getCellEntities(world, { x: 6, y: 6 })
    .flatMap((entity) => entity.INVENTORY?.items || [])
    .map((id) => world.assertByIdAndComponents(id, ["ITEM"]));
  expect(
    crops.some(
      (item) => item.ITEM.stackable === "wheat" && item.ITEM.amount === 1
    )
  ).toBe(true);
  expect(getFarmable(world, { x: 6, y: 6 })).toBe(soil);
});
