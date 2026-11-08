import { mapPlayer } from "../game/assets/sprites";
import { renderToStaticMarkup } from "react-dom/server";
import { Minimap, minimapSnapshots } from "./Minimap";
import { mapScroll } from "../engine/systems/popup";

test("stored native zooms render directly without generating a new world", () => {
  const sample = minimapSnapshots();
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
  expect(sample.hidden).toBeGreaterThan(0);
  expect(sample.remembered).toBeGreaterThan(0);
  expect(sample.visible).toBeGreaterThan(0);
  expect(sample.roadSteps).toBeGreaterThan(0);
  expect(sample.reachedTown).toBe(true);
  expect(sample.visitedLandmarks).toEqual([
    "Earth Town",
    "Fire Haven",
    "Nomad",
  ]);
  expect(sample.heroOnPoi).toBe(false);
  expect(sample.remembered).toBeGreaterThan(2000);
  expect(minimapSnapshots()).toBe(sample);
  const view = renderToStaticMarkup(<Minimap />);
  for (let zoom = 1; zoom <= mapScroll; zoom++)
    expect(view).toContain(`aria-label="Native minimap zoom ${zoom}"`);
});
