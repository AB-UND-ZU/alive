import "../../engine";
import { SparseGraph } from "./sparseGraph";
import { findPath, findPathSimple } from "./path";
import { createRng } from "./rng";
// @ts-ignore
import { Graph as ReferenceGraph, astar } from "javascript-astar";

it("preserves weighted routes and closest/unreachable behavior on rectangular maps", () => {
  const random = createRng(77);
  for (let sample = 0; sample < 80; sample += 1) {
    const width = 8 + (sample % 13);
    const height = 7 + (sample % 17);
    const matrix = Array.from({ length: width }, () =>
      Array.from({ length: height }, () =>
        random() < 0.3 ? 0 : 1 + Math.floor(random() * 4)
      )
    );
    for (let query = 0; query < 15; query += 1) {
      const from = {
        x: Math.floor(random() * width),
        y: Math.floor(random() * height),
      };
      const to = {
        x: Math.floor(random() * width),
        y: Math.floor(random() * height),
      };
      const reference = new ReferenceGraph(matrix);
      const sparse = new SparseGraph(matrix);
      const closest = query % 2 === 0;
      const expected = astar.search(
        reference,
        reference.grid[from.x][from.y],
        reference.grid[to.x][to.y],
        { closest }
      );
      const result = astar.search(
        sparse,
        sparse.node(from.x, from.y),
        sparse.node(to.x, to.y),
        { closest }
      );
      expect(
        result.map(({ x, y }: { x: number; y: number }) => ({ x, y }))
      ).toEqual(
        expected.map(({ x, y }: { x: number; y: number }) => ({ x, y }))
      );
    }
  }
});

it("routes across world seams and allows a blocked goal only for the requested search", () => {
  const matrix = Array.from({ length: 12 }, () => Array(12).fill(1));
  expect(findPath(matrix, { x: 0, y: 2 }, { x: 5, y: 2 })).toEqual([
    { x: 5, y: 2 },
  ]);
  matrix[1][0] = 0;
  const before = matrix.map((column) => [...column]);
  expect(findPath(matrix, { x: 0, y: 0 }, { x: 1, y: 0 }, true, true)).toEqual([
    { x: 1, y: 0 },
  ]);
  expect(findPath(matrix, { x: 0, y: 0 }, { x: 1, y: 0 }, false, true)).toEqual(
    []
  );
  expect(matrix).toEqual(before);
});

it("observes doors opening and closing, equal endpoints, and narrow corridors", () => {
  const matrix = [[1], [0], [1]];
  expect(findPathSimple(matrix, { x: 0, y: 0 }, { x: 2, y: 0 })).toEqual([]);
  matrix[1][0] = 1;
  expect(findPathSimple(matrix, { x: 0, y: 0 }, { x: 2, y: 0 })).toEqual([
    { x: 1, y: 0 },
    { x: 2, y: 0 },
  ]);
  expect(findPathSimple(matrix, { x: 1, y: 0 }, { x: 1, y: 0 })).toEqual([]);
  matrix[1][0] = 0;
  expect(findPathSimple(matrix, { x: 0, y: 0 }, { x: 2, y: 0 })).toEqual([]);
});
