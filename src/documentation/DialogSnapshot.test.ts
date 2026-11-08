import { dialogSnapshot } from "./DialogSnapshot";
import { getSaveSummaries } from "../game/saves";
import { colors } from "../game/assets/colors";

beforeAll(() => jest.useFakeTimers());
afterAll(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

for (const screen of [
  "chat",
  "load",
  "buy",
  "sell",
  "craft",
  "brew",
  "forge",
  "forge:add",
  "forge:result",
  "brew:recipe",
  "brew:ingredients",
  "stats",
  "gear",
  "inspect",
  "use",
  "plant",
  "build",
  "class",
  "style",
  "warp",
  "sign",
  "quest",
  "message",
  "menu_sign",
  "potion_sign",
  "fruit_sign",
  "guide_sign",
  "trader_sign",
  "worm_sign",
  "credits_sign",
  "equip:spell",
  "equip:skill",
  "equip:tool",
  "inspect:food",
])
  test(`${screen} popup uses its native frame and populated cells`, () => {
    const rows = dialogSnapshot(screen);
    expect(rows.length).toBeGreaterThan(screen === "message" ? 0 : 3);
    expect(rows[0].length).toBeGreaterThanOrEqual(
      screen === "message" ? 1 : 19
    );
    expect(
      rows
        .flat()
        .some((cell) => cell.layers.length > (screen === "message" ? 0 : 1))
    ).toBe(true);
  });

test("the load specimen leaves the player's save summaries unchanged", () => {
  const saves = getSaveSummaries();
  dialogSnapshot("load");
  expect(getSaveSummaries()).toEqual(saves);
});

test.each([
  ["equip:spell", "Wave"],
  ["equip:skill", "Slash"],
  ["equip:tool", "Axe"],
  ["inspect:food", "Apple"],
])("%s selects the relevant %s item", (screen, name) => {
  const rows = dialogSnapshot(screen);
  expect(
    rows.some((row) =>
      row.some((_, start) =>
        [...name].every((char, index) =>
          row[start + index]?.layers.some(
            (layer) => layer.char === char && layer.color === colors.white
          )
        )
      )
    )
  ).toBe(true);
});

test("the message specimen shows native equipment feedback above its hero", () => {
  const rows = dialogSnapshot("message");
  const lines = rows.map((row) =>
    row.map((cell) => cell.layers[cell.layers.length - 1]?.char || " ").join("")
  );
  expect(lines.some((line) => line.includes("Equipped"))).toBe(true);
  expect(lines.some((line) => line.includes("Sword"))).toBe(true);
  expect(
    rows
      .slice(3)
      .flat()
      .some((cell) => cell.layers.length > 0)
  ).toBe(true);
});

test("the Gear specimen shows the native equipped slot dialog", () => {
  const rows = dialogSnapshot("gear");
  const text = rows
    .map((row) =>
      row.map((cell) => cell.layers.slice(-1)[0]?.char || " ").join("")
    )
    .join("\n");
  expect(text).toContain("GEAR");
  expect(text).not.toContain("EQUIP");
});
