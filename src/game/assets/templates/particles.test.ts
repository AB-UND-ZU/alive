import { composeCharacterPixels } from "../../../components/Row/characters";
import { materials, elements } from "../../../engine/components/item";
import { Sprite } from "../../../engine/components/sprite";
import { Orientation } from "../../../engine/components/orientable";
import { colors } from "../colors";
import { getFacingLayers } from "../ui";
import { trigger, triggerCorner, triggerSide, trapBorder } from "./particles";

const visiblePixels = (sprite: Sprite, facing?: Orientation) =>
  composeCharacterPixels(getFacingLayers(sprite, facing)).flatMap((color, i) =>
    color && color !== colors.black
      ? [{ x: i % 9, y: Math.floor(i / 9), color }]
      : []
  );

describe("trap area sprites", () => {
  it.each(materials)(
    "keeps %s warning rays one pixel wide and uses the trigger palette",
    (material) => {
      for (const element of ["default", ...elements] as const) {
        const vertical = visiblePixels(triggerSide[material][element], "up");
        expect(vertical.map(({ x, y }) => [x, y])).toEqual([
          [4, 2],
          [4, 4],
          [4, 6],
          [4, 8],
          [4, 10],
        ]);
        const horizontal = visiblePixels(
          triggerSide[material][element],
          "right"
        );
        expect(horizontal.map(({ x, y }) => [x, y])).toEqual([
          [1, 7],
          [3, 7],
          [5, 7],
        ]);
        const rays = [...vertical, ...horizontal];
        for (const facing of ["up", "right", "down", "left"] as const) {
          const diagonal = visiblePixels(
            triggerCorner[material][element],
            facing
          );
          expect(diagonal).toHaveLength(7);
          expect(new Set(diagonal.map(({ y }) => y)).size).toBe(
            diagonal.length
          );
          rays.push(...diagonal);
        }
        expect(new Set(rays.map(({ color }) => color))).toEqual(
          new Set(
            visiblePixels(trigger[material][element]).map(({ color }) => color)
          )
        );
      }
    }
  );

  it("joins eight activated cells into one single-line outer frame", () => {
    const positions = [
      [1, 0],
      [2, 0],
      [2, 1],
      [2, 2],
      [1, 2],
      [0, 2],
      [0, 1],
      [0, 0],
    ];
    const width = 27;
    const cells = trapBorder.flatMap((template, index) =>
      visiblePixels(template.wood.fire).map(
        ({ x, y }) =>
          (positions[index][1] * 16 + y) * width + positions[index][0] * 9 + x
      )
    );
    const pixels = new Set(cells);
    const visited = new Set<number>();
    const pending = [cells[0]];
    while (pending.length) {
      const point = pending.pop()!;
      if (visited.has(point)) continue;
      visited.add(point);
      for (const delta of [-width, width, -1, 1]) {
        const neighbor = point + delta;
        if (pixels.has(neighbor) && !visited.has(neighbor))
          pending.push(neighbor);
      }
    }
    expect(visited.size).toBe(pixels.size);
    expect(pixels.size).toBe(164);
    for (const point of pixels) {
      const x = point % width;
      const y = Math.floor(point / width);
      expect(
        x === 3 || x === 4 || x === 21 || x === 22 || y === 7 || y === 39
      ).toBe(true);
    }
    expect(
      trapBorder.map((template) => template.wood.fire.layers[0].char)
    ).toEqual(["─", "┐", "│", "┘", "─", "└", "│", "┌"]);
    expect(
      new Set(
        trapBorder.flatMap((template) =>
          visiblePixels(template.wood.fire).map(({ color }) => color)
        )
      )
    ).toEqual(
      new Set(visiblePixels(trigger.wood.fire).map(({ color }) => color))
    );
  });
});
