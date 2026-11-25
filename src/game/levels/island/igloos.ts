import type { CellType } from "../../../bindings/creation";
import { aspectRatio } from "../../../renderers/interface/dimensions";
import { createMatrix, iterateMatrix, matrixFactory } from "../../math/matrix";
import { findPathSimple } from "../../math/path";
import {
  add,
  angledOffset,
  choice,
  distribution,
  Point,
  random,
  range,
  shuffle,
} from "../../math/std";
import { pixelCircle, pointToDegree } from "../../math/tracing";

export const iglooRadius = 9;

// Dimensions include the walls. The door offset starts just inside the left wall.
export function generateIgloo(width: number, height: number, door: number) {
  if (width < 4 || height < 3 || door < 0 || door >= width - 2)
    throw new RangeError("Invalid igloo dimensions or door position");

  const rounded = Math.max(1, Math.ceil(width / 4) - 1);
  return matrixFactory<CellType>(width, height, (x, y) => {
    const edge = Math.min(x, width - 1 - x);
    if (y === 0) {
      if (!edge) return x === 0 ? "igloo_roof_left_up" : "igloo_roof_up_right";
      return edge <= rounded ? "igloo_roof_up" : "igloo_roof";
    }
    if (y === height - 1) {
      if (!edge)
        return x === 0 ? "igloo_basement_left" : "igloo_basement_right";
      return x === door + 1 ? "wood_frame" : "igloo_wall";
    }
    if (!edge) return x === 0 ? "igloo_house_left" : "igloo_house_right";
    return "igloo";
  });
}

const IGLOO_TRIES = 5;

export function generateIglooVillage(
  clearing: ReturnType<typeof createIglooClearing>
) {
  for (let attempt = 0; attempt < IGLOO_TRIES; attempt++) {
    const village = tryIglooVillage(clearing);
    if (village) return village;
  }
  throw new Error("Could not generate igloo village!");
}

export function createIglooClearing(towardGlacier: Point) {
  const center = {
    x: Math.ceil(iglooRadius / aspectRatio) + 1,
    y: iglooRadius + 1,
  };
  const width = center.x * 2 + 1;
  const height = center.y * 2 + 1;
  const matrix = createMatrix<CellType | undefined>(width, height, undefined);
  const objects = createMatrix<CellType | undefined>(width, height, undefined);
  const angle = pointToDegree({
    x: towardGlacier.x * aspectRatio,
    y: towardGlacier.y,
  });
  const gate = angledOffset(width, center, angle, iglooRadius);

  for (const { x, y } of pixelCircle(center, iglooRadius, aspectRatio, true))
    matrix[x][y] = "rubble";
  for (const { x, y } of pixelCircle(center, iglooRadius)) {
    matrix[x][y] = "sand";
    if (Math.abs(x - gate.x) > 1 || Math.abs(y - gate.y) > 1)
      objects[x][y] = "rock";
  }
  for (const dx of [-1, 0, 1])
    for (const dy of [-1, 0, 1]) matrix[gate.x + dx][gate.y + dy] = "sand";

  return { matrix, objects, center, gate };
}

function tryIglooVillage(clearing: ReturnType<typeof createIglooClearing>) {
  const { center, gate } = clearing;
  const matrix = clearing.matrix.map((column) => column.slice());
  const objects = clearing.objects.map((column) => column.slice());
  const width = matrix.length;
  const height = matrix[0].length;
  const villagers = shuffle<
    "waterTrader" | "waterSmith" | "waterDruid" | "waterChief"
  >(["waterTrader", "waterSmith", "waterDruid", "waterChief"]);
  const chiefQuadrant = villagers.indexOf("waterChief");
  const plaza = add(center, {
    x: chiefQuadrant % 2 ? 2 : -2,
    y: chiefQuadrant >= 2 ? 1 : -1,
  });
  const houses = [];
  for (const [index, npc] of villagers.entries()) {
    const chief = npc === "waterChief";
    let w = chief ? 3 : random(8, 9);
    const h = chief ? 1 : 3;
    let door = 0;
    const positions = [];
    const east = index % 2 === 1;
    const south = index >= 2;
    // A diagonal gate can cut into the room for a workshop.
    for (; w >= (chief ? 3 : 7); w--) {
      door = random(0, w - 1);
      for (const x of range(
        east ? plaza.x + 1 : 0,
        east ? width - w - 2 : plaza.x - w - 2
      )) {
        for (const y of range(
          south ? plaza.y + 1 : 0,
          south ? height - h - 2 : plaza.y - h - 2
        )) {
          const fits = matrix
            .slice(x, x + w + 2)
            .every((column) =>
              column.slice(y, y + h + 2).every((cell) => cell === "rubble")
            );
          const doorstep = matrix[x + door + 1][y + h + 2];
          if (!fits || doorstep !== "rubble") continue;
          const dx = (x + (w + 1) / 2 - plaza.x) * aspectRatio;
          const dy = y + (h + 1) / 2 - plaza.y;
          positions.push({ x, y, weight: Math.round(dx * dx + dy * dy) });
        }
      }
      if (positions.length) break;
    }
    if (!positions.length) return;
    const origin = positions[distribution(...positions.map((p) => p.weight))];
    iterateMatrix(generateIgloo(w + 2, h + 2, door), (x, y, cell) => {
      matrix[origin.x + x][origin.y + y] = cell;
    });
    const left = origin.x + 1;
    const top = origin.y + 1;
    const entrance = { x: left + door, y: top + h };
    const flipped = chief ? door === 0 : choice(true, false);
    const resident = { x: flipped ? left + w - 1 : left, y: top };
    if (!chief) {
      const station = {
        waterTrader: "bench",
        waterSmith: "anvil",
        waterDruid: "kettle",
      } as const;
      objects[flipped ? left : left + w - 1][top] = station[npc];

      const bottom = top + h - 1;
      for (let x = left + 1; x < left + w - 1; x++) {
        const roll = Math.random();
        if (roll < 0.1) objects[x][top] = "ironChest";
        else if (roll < 0.3) objects[x][top] = "pot";
      }

      // Furnish the longer side of the bottom row, leaving the doorway clear.
      const onRight = door < w / 2;
      const end = onRight ? left + w - 1 : left;
      const inward = onRight ? -1 : 1;
      if (choice(true, false)) {
        objects[end + inward][bottom] = "bed";
      } else {
        objects[end][bottom] = "table";
        objects[end + inward][bottom] = onRight ? "chair_left" : "chair_right";
      }
    }
    houses.push({
      npc,
      resident,
      entrance,
      center: add(origin, {
        x: Math.floor((w + 1) / 2),
        y: Math.floor((h + 1) / 2),
      }),
    });
  }

  const weights = matrix.map((column) =>
    column.map<number>((cell, y) => {
      if (cell !== "rubble") return 0;
      const above = column[y - 1];
      return above === "igloo_wall" || above?.startsWith("igloo_basement")
        ? 1000
        : 20;
    })
  );
  for (const target of [
    ...houses.map((house) => add(house.entrance, { x: 0, y: 1 })),
    gate,
  ]) {
    if (target === gate) {
      for (const dx of [-1, 0, 1])
        for (const dy of [-1, 0, 1]) weights[gate.x + dx][gate.y + dy] = 1;
    }
    const path = [plaza, ...findPathSimple(weights, plaza, target)];
    if (path.length === 1 && (target.x !== plaza.x || target.y !== plaza.y))
      return;
    for (const [index, { x, y }] of path.entries()) {
      if (matrix[x][y] === "sand") break;
      if (weights[x][y] === 1) continue;
      const next = path[index + 1];
      matrix[x][y] =
        next && next.x !== x ? "jetty_horizontal" : "jetty_vertical";
      weights[x][y] = 1;
    }
  }
  const rubble: Point[] = [];
  iterateMatrix(matrix, (x, y, cell) => {
    if (cell === "rubble") rubble.push({ x, y });
  });
  const plants = Math.round(rubble.length / 12);
  const planted: Point[] = [];
  for (const point of shuffle(rubble)) {
    if (planted.length === plants) break;
    if (
      planted.some(
        (p) => Math.abs(p.x - point.x) <= 1 && Math.abs(p.y - point.y) <= 1
      )
    )
      continue;
    matrix[point.x][point.y] =
      Math.random() < 0.3 ? choice("flower", "berry") : choice("grass", "bush");
    planted.push(point);
  }

  return { matrix, objects, center, plaza, houses, gate };
}
