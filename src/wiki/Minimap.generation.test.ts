import { mapPlayer } from "../game/assets/sprites";
import { prepareMinimaps } from "./MinimapData";
import { levelConfig } from "../game/levels";
import { mapScroll } from "../engine/systems/popup";

test("native map zooms share one generated Island and preserve unexplored and remembered terrain", () => {
  const generator = jest.spyOn(levelConfig.LEVEL_ISLAND, "generator");
  const sample = prepareMinimaps();
  expect(sample.rows).toHaveLength(mapScroll);
  expect(
    sample.rows.every((rows) =>
      rows
        .flat()
        .some((cell) =>
          cell.layers.some(
            (layer) =>
              layer.char === mapPlayer.layers[0].char &&
              layer.color === mapPlayer.layers[0].color
          )
        )
    )
  ).toBe(true);
  expect(
    sample.rows.every((rows) => rows.length > 5 && rows[0].length > 5)
  ).toBe(true);
  expect(sample.roadSteps).toBeGreaterThan(0);
  expect(sample.reachedTown).toBe(true);
  expect(sample.visitedLandmarks).toEqual([
    "Earth Town",
    "Fire Haven",
    "Nomad",
  ]);
  expect(sample.heroOnPoi).toBe(false);
  expect(sample.remembered).toBeGreaterThan(2000);
  expect(sample.hidden).toBeGreaterThan(0);
  expect(sample.remembered).toBeGreaterThan(0);
  expect(sample.visible).toBeGreaterThan(0);
  expect(sample.rows[0]).not.toEqual(sample.rows[3]);
  expect(generator).toHaveBeenCalledTimes(1);
  generator.mockRestore();
}, 30000);
