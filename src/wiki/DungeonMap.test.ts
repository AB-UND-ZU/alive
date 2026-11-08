import { dungeonMapRows } from "./DungeonMap";
import { tutorialRooms } from "../game/levels/tutorial/areas";
import { getUnitSprite } from "../game/assets/utils";

test("the Dungeon diagram keeps the pond branch and the actual wave units", () => {
  const rows = dungeonMapRows();
  expect(rows).toHaveLength(13);
  expect(rows.every((row) => row.length === 13)).toBe(true);
  expect(rows[7][8].layers.length).toBeGreaterThan(0);
  for (let number = 1; number <= 7; number++) {
    expect(
      rows
        .flat()
        .some((sprite) =>
          sprite.layers.some((layer) => layer.char === String(number))
        )
    ).toBe(true);
  }
  const waveRoom = tutorialRooms.find((room) => room.name === "north3")!;
  const units = [...new Set(waveRoom.waves!.flatMap((wave) => wave.types))];
  for (const [i, unit] of units.entries()) {
    expect(rows[5][2 + i]).toEqual(getUnitSprite(unit!));
  }
});

it("connects shared native room corners without masking their strokes", () => {
  const rows = dungeonMapRows();
  expect(rows[2][0].layers.map((layer) => layer.char)).toEqual(
    expect.arrayContaining(["┌", "└"])
  );
  expect(rows[6][6].layers.map((layer) => layer.char)).toEqual(
    expect.arrayContaining(["┌", "┐", "┘"])
  );
  expect(
    rows
      .flat()
      .flatMap((sprite) => sprite.layers)
      .some((layer) => ["▌", "▐"].includes(layer.char))
  ).toBe(false);
});
