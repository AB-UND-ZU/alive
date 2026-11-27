import "../../engine";
import { composeCharacterPixels } from "../../components/Row/characters";
import { colors } from "./colors";
import { bandit, hostileBar, listBullet, none } from "./sprites";
import { getUpdates } from "./updates";
import { createUnitName, getUnitSprite, getClassSprite, getItemSprite } from "./utils";
import { createText } from "./ui";

it("offers every release newest first with readable 17-cell rows", () => {
  const updates = getUpdates();
  expect(updates.map((update) => update.title)).toEqual([
    "V0x09",
    "V0x08",
    "V0x07",
    "V0x06",
    "V0x05",
    "V0x04",
    "V0x03",
    "V0x02",
    "V0x01",
    "V0x00",
  ]);
  for (const update of updates) {
    expect(update.description!.length).toBe(update.title === "V0x00" ? 5 : 9);
    expect(update.content[0][0].id).toBe(listBullet.id);
  }
  expect(
    updates.flatMap((update) =>
      [update.description || [], ...update.content]
        .filter((row) => row.length > 17)
        .map((row) => ({
          version: update.title,
          width: row.length,
          text: row
            .map((sprite) => sprite.layers.map((layer) => layer.char).join(""))
            .join(""),
        }))
    )
  ).toEqual([]);
});

it("keeps white save-style dates in descriptions, including the original year", () => {
  for (const update of getUpdates()) {
    const date = update.description!.slice(1);
    expect(
      date
        .map((sprite) => sprite.layers[0]?.char)
        .join("")
        .trimEnd()
    ).toMatch(/^(\d{8}|2009)$/);
    expect(
      date.every((sprite) =>
        sprite.layers.every((layer) => layer.color === colors.white)
      )
    ).toBe(true);
  }
});

it("uses silver prose, white data accents and the original spell glyphs", () => {
  const updates = getUpdates();
  const original = updates.find((update) => update.title === "V0x00")!;
  const fixed = original.content.find((row) =>
    row.some((sprite) => sprite.layers[0]?.char === "8")
  )!;
  expect(
    fixed
      .slice(1, 7)
      .every((sprite) => sprite.layers[0].color === colors.silver)
  ).toBe(true);
  expect(
    fixed
      .slice(7, 12)
      .every((sprite) => sprite.layers[0].color === colors.white)
  ).toBe(true);
  const early = updates.find((update) => update.title === "V0x01")!;
  const deltas = early.content
    .flat()
    .filter(
      (sprite) => sprite.layers.length === 1 && sprite.layers[0].char === "δ"
    );
  expect(deltas.map((sprite) => sprite.layers[0].color)).toEqual([
    colors.red,
    colors.aqua,
    colors.lime,
  ]);
  expect(
    early.content.flat().some((sprite) => sprite.layers[0]?.char === "\u0114")
  ).toBe(true);
  const quest = early.content.find(
    (row) =>
      row.some((sprite) => sprite.name === "XP") &&
      row.some((sprite) => sprite.layers[0]?.char === "1")
  )!;
  const digits = quest.filter((sprite) =>
    ["1", "0"].includes(sprite.layers[0]?.char)
  );
  expect(digits.map((sprite) => sprite.layers[0].color)).toEqual([
    colors.lime,
    colors.lime,
  ]);
});

it("uses a compact gray dash-and-dot bullet", () => {
  const pixels = composeCharacterPixels(listBullet.layers);
  const dash = composeCharacterPixels(createText("-", colors.grey)[0].layers);
  const points = (pixels: (string | undefined)[]) =>
    pixels.flatMap((color, index) =>
      color === colors.grey ? [[index % 9, Math.floor(index / 9)]] : []
    );
  const visible = points(pixels);
  expect(visible.length).toBeGreaterThan(0);
  expect(
    Math.max(...visible.map(([x]) => x)) - Math.min(...visible.map(([x]) => x))
  ).toBeLessThan(
    Math.max(...points(dash).map(([x]) => x)) -
      Math.min(...points(dash).map(([x]) => x))
  );
});

it("shows the iron wand in the bandit mage portrait", () => {
  const wand = getItemSprite({ weapon: "wand", material: "iron" });
  const portrait = createUnitName("banditMage")[0];
  expect(composeCharacterPixels(portrait.layers)).toEqual(
    composeCharacterPixels([...bandit.layers, ...wand.layers, ...hostileBar.layers])
  );
});

it("builds native unit labels without rolling gameplay loot", () => {
  const random = jest.spyOn(Math, "random");
  try {
    const prism = createUnitName("prism");
    expect(
      prism[0].layers.some(
        (layer) => layer.char === "_" && layer.color === colors.red
      )
    ).toBe(true);
    expect(
      getUnitSprite("goldOrb").layers.some(
        (layer) => layer.char === "_" && layer.color === colors.red
      )
    ).toBe(true);
    expect(random).not.toHaveBeenCalled();
  } finally {
    random.mockRestore();
  }
});

it("names creatures explicitly when their native labels differ", () => {
  const release = getUpdates().find((update) => update.title === "V0x02")!;
  const text = release.content.map((row) =>
    row
      .filter((sprite) => sprite.name === "text_generic")
      .map((sprite) => sprite.layers[0].char)
      .join("")
  );
  expect(text).toEqual(
    expect.arrayContaining(["Chick animal", "and Tumbleweed"])
  );
  expect(release.content[text.indexOf("and Tumbleweed")][0].id).toBe(none.id);
});

it("renders every history character with the existing DOS font", () => {
  const glyphs = require("../../../public/fonts/MostPerfectDOSVGA.json").glyphs;
  const missing = getUpdates()
    .flatMap((update) =>
      [update.description || [], ...update.content].flatMap((row) =>
        row.flatMap((sprite) => sprite.layers.map((layer) => layer.char))
      )
    )
    .filter((char) => !glyphs[char]);
  expect([...new Set(missing)]).toEqual([]);
});

it("keeps class backdrops and right-aligns short dates", () => {
  expect(
    getClassSprite("rogue").layers.some(
      (layer) => layer.char === "┘" && layer.color === colors.white
    )
  ).toBe(true);
  const updates = getUpdates();
  expect(updates.map((update) => update.description!.length)).toEqual([
    9, 9, 9, 9, 9, 9, 9, 9, 9, 5,
  ]);
  expect(
    updates[updates.length - 1]
      .description!.slice(1, 5)
      .map((sprite) => sprite.layers[0].char)
      .join("")
  ).toBe("2009");
  expect(
    updates[updates.length - 1]
      .description!.slice(5)
      .map((sprite) => sprite.layers[0].char)
      .join("")
  ).toBe("");
});

it("separates changes while keeping grouped entries as continuations", () => {
  const updates = getUpdates();
  for (const release of updates) {
    expect(
      release.content.filter(
        (row, index) =>
          row[0]?.id === listBullet.id &&
          index > 0 &&
          release.content[index - 1].length !== 0
      )
    ).toEqual([]);
  }
  const rows = updates.find((update) => update.title === "V0x02")!.content;
  const text = (row: (typeof rows)[number]) =>
    row
      .filter((sprite) => sprite.name === "text_generic")
      .map((sprite) => sprite.layers[0].char)
      .join("")
      .trim();
  for (const [heading, count] of [
    ["Four classes:", 4],
    ["New stats:", 9],
    ["New plant mobs:", 3],
    ["New Spells:", 3],
    ["New weapons:", 2],
    ["Skill items", 5],
  ] as const) {
    const index = rows.findIndex((row) => text(row) === heading);
    expect(index).toBeGreaterThanOrEqual(0);
    expect(
      rows.slice(index + 1, index + 1 + count).map((row) => row[0])
    ).toEqual(Array(count).fill(none));
  }
});
