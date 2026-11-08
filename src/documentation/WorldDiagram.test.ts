import { createAreaWorld } from "../testing/harness";
import { createCell } from "../bindings/creation";
import { worldRows } from "./WorldDiagram";

test("a world diagram shows neighboring cells across a wrapped edge", () => {
  const world = createAreaWorld("|♀|", { size: 16 });
  createCell(world, { x: 15, y: 0 }, "tree", "visible");
  const rows = worldRows(world, { x: -2, y: -1, width: 5, height: 3 });
  expect(rows[1][1].layers.some((layer) => layer.color === "#008000")).toBe(
    true
  );
});
