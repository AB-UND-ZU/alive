import "../../../engine";
import { seedRandom } from "../../../testing/env";
import { aspectRatio } from "../../../renderers/interface/dimensions";
import { iterateMatrix } from "../../math/matrix";
import * as path from "../../math/path";
import { pixelCircle } from "../../math/tracing";
import { Point } from "../../math/std";
import {
  createIglooClearing,
  generateIgloo,
  generateIglooVillage,
  iglooRadius,
} from "./igloos";

const villageAt = (direction: Point) =>
  generateIglooVillage(createIglooClearing(direction));

it.each([
  [4, 1],
  [7, 1],
  [8, 1],
  [9, 2],
  [12, 2],
  [13, 3],
  [17, 4],
])(
  "rounds both ends of a %i-cell roof and places a wood frame inside the wall",
  (width, rounded) => {
    const igloo = generateIgloo(width, 3, width - 3);
    expect(igloo.map((col) => col[0])).toEqual([
      "igloo_roof_left_up",
      ...Array(rounded).fill("igloo_roof_up"),
      ...Array(width - 2 - rounded * 2).fill("igloo_roof"),
      ...Array(rounded).fill("igloo_roof_up"),
      "igloo_roof_up_right",
    ]);
    expect(igloo[width - 2][2]).toBe("wood_frame");
    expect(generateIgloo(width, 4, 0)[1][3]).toBe("wood_frame");
  }
);

it("connects every quadrant and the glacier-facing opening to the village center", () => {
  let supplyCells = 0,
    pots = 0,
    chests = 0;
  for (let seed = 0; seed < 400; seed++) {
    seedRandom(seed);
    const angle = (seed * Math.PI) / 64;
    const { matrix, objects, center, plaza, gate, houses } = villageAt({
      x: Math.cos(angle),
      y: Math.sin(angle),
    });
    const boardwalk = matrix.map((col) =>
      col.map((cell) =>
        Number(cell === "jetty_horizontal" || cell === "jetty_vertical")
      )
    );
    expect(boardwalk[plaza.x][plaza.y]).toBe(1);
    const fence = pixelCircle(center, iglooRadius);
    for (const point of fence) {
      const inGate =
        Math.abs(point.x - gate.x) <= 1 && Math.abs(point.y - gate.y) <= 1;
      expect(objects[point.x][point.y] === "rock").toBe(!inGate);
      expect(inGate || matrix[point.x][point.y] === "sand").toBe(true);
    }
    expect(
      new Set(
        houses.map((h) =>
          [
            Math.sign(h.center.x - plaza.x),
            Math.sign(h.center.y - plaza.y),
          ].join()
        )
      ).size
    ).toBe(4);
    const chief = houses.find((house) => house.npc === "waterChief")!;
    expect(Math.sign(plaza.x - center.x)).toBe(
      Math.sign(chief.center.x - center.x)
    );
    expect(Math.sign(plaza.y - center.y)).toBe(
      Math.sign(chief.center.y - center.y)
    );
    expect(matrix.flat()).toContain("rubble");
    for (const { entrance, resident } of houses.filter(
      (house) => house.npc !== "waterChief"
    )) {
      const top = resident.y;
      let left = resident.x;
      while (matrix[left - 1][top] === "igloo") left--;
      let right = resident.x;
      while (matrix[right + 1][top] === "igloo") right++;
      expect((right - left + 3) * aspectRatio).toBeGreaterThan(
        entrance.y - top + 2
      );
      supplyCells += right - left - 1;
      for (let x = left; x <= right; x++) {
        for (let y = top; y < entrance.y; y++) {
          const object = objects[x][y];
          if (object !== "ironChest" && object !== "pot") continue;
          expect(y).toBe(top);
          expect(x).toBeGreaterThan(left);
          expect(x).toBeLessThan(right);
          if (object === "ironChest") chests++;
          else pots++;
        }
      }
    }
    for (const { entrance, resident } of houses) {
      const doorstep = { x: entrance.x, y: entrance.y + 1 };
      expect(path.findPathSimple(boardwalk, plaza, doorstep)).toContainEqual(
        doorstep
      );
      expect(matrix[entrance.x][entrance.y]).toBe("wood_frame");
      expect(objects[entrance.x][entrance.y - 1]).toBeUndefined();
      expect(objects[resident.x][resident.y]).toBeUndefined();
    }
    for (const dx of [-1, 0, 1])
      for (const dy of [-1, 0, 1]) {
        expect(matrix[gate.x + dx][gate.y + dy]).toBe("sand");
        boardwalk[gate.x + dx][gate.y + dy] = 1;
      }
    expect(path.findPathSimple(boardwalk, plaza, gate)).toContainEqual(gate);
  }
  expect(Math.abs(pots / supplyCells - 0.2)).toBeLessThan(0.02);
  expect(Math.abs(chests / supplyCells - 0.1)).toBeLessThan(0.02);
});

it("fits all four houses beside a diagonal opening in the nine-cell radius", () => {
  seedRandom(33678);
  const angle = (33678 * Math.PI) / 64;
  const village = villageAt({
    x: Math.cos(angle),
    y: Math.sin(angle),
  });
  expect(village.center.y - 1).toBe(9);
  expect(village.houses).toHaveLength(4);
});

it("uses both inner and outer sites in the same quadrant", () => {
  const clearances = new Set<number>();
  for (let seed = 0; seed < 100; seed++) {
    seedRandom(seed);
    const { houses, center, plaza } = villageAt({ x: 1, y: 0 });
    const chief = houses.find((h) => h.npc === "waterChief")!;
    if (chief.center.x < plaza.x || chief.center.y < plaza.y) continue;
    const fence = pixelCircle(center, iglooRadius);
    clearances.add(
      Math.min(
        ...fence.map((p) =>
          Math.max(
            Math.abs(p.x - chief.center.x) - 2,
            Math.abs(p.y - chief.center.y) - 1
          )
        )
      )
    );
  }
  expect(clearances.has(1)).toBe(true);
  expect(Math.max(...Array.from(clearances))).toBeGreaterThan(1);
});

it("prefers a gap below the front wall and allows crossing it", () => {
  const crossings = new Set<boolean>();
  for (let seed = 0; seed < 32; seed++) {
    seedRandom(seed);
    const { matrix } = villageAt({ x: 1, y: 0 });
    let crossed = false;
    iterateMatrix(matrix, (x, y, cell) => {
      if (cell === "igloo_wall" || cell?.startsWith("igloo_basement")) {
        crossed ||= matrix[x][y + 1]?.startsWith("jetty_") ?? false;
      }
    });
    crossings.add(crossed);
  }
  expect(crossings).toEqual(new Set([false, true]));
});

it("retries a disconnected layout up to five times", () => {
  const route = jest.spyOn(path, "findPathSimple");
  try {
    route.mockReturnValueOnce([]);
    expect(villageAt({ x: 1, y: 0 }).houses).toHaveLength(4);
    route.mockClear().mockReturnValue([]);
    expect(() => villageAt({ x: 1, y: 0 })).toThrow(
      "Could not generate igloo village"
    );
    expect(route).toHaveBeenCalledTimes(5);
  } finally {
    route.mockRestore();
  }
});

it("plants open rubble with isolated grass and bushes, with items on about 30%", () => {
  let items = 0,
    planted = 0;
  for (let seed = 0; seed < 100; seed++) {
    seedRandom(seed);
    const { matrix, objects } = villageAt({ x: 0, y: 1 });
    const plants = matrix.flatMap((column, x) =>
      column.flatMap((cell, y) =>
        cell && ["grass", "bush", "flower", "berry"].includes(cell)
          ? [{ x, y, cell }]
          : []
      )
    );
    const rubble = matrix.flat().filter((cell) => cell === "rubble").length;
    expect(plants).toHaveLength(Math.round((rubble + plants.length) / 12));
    planted += plants.length;
    items += plants.filter(
      (p) => p.cell === "flower" || p.cell === "berry"
    ).length;
    for (const p of plants) {
      expect(objects[p.x][p.y]).toBeUndefined();
      expect(
        plants.filter(
          (q) => Math.abs(p.x - q.x) <= 1 && Math.abs(p.y - q.y) <= 1
        )
      ).toEqual([p]);
    }
  }
  expect(Math.abs(items / planted - 0.3)).toBeLessThan(0.04);
});
