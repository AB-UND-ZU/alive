import {
  customSprite,
  namedSprite,
  parseSprite,
  resolveSprite,
  spriteDefinition,
  spriteRef,
} from "./spriteIds";
import * as sprites from "./sprites";
import "./templates/creatures";
import "./templates/equipments";
import "./templates/items";
import "./templates/particles";
import "./templates/units";
import "../balancing/units";
import { colors } from "./colors";

jest.mock("./spriteIds", () => {
  const actual = jest.requireActual("./spriteIds");
  return { ...actual, namedSprite: jest.fn(actual.namedSprite) };
});

const definitions = (namedSprite as jest.MockedFunction<typeof namedSprite>)
  .mock.calls;

test("every named sprite and template variant has a unique snake_case ID", () => {
  const seen = new Set<string>();
  const ids = [
    ...Object.values(sprites).map((sprite) => sprite.id),
    ...definitions.map(([id]) => id),
  ];
  const duplicates = ids.flatMap((id) => {
    if (seen.has(id)) return [id];
    seen.add(id);
    return [];
  });
  expect(seen.has("wood_chest")).toBe(true);
  expect(seen.has("spear_gold_air")).toBe(true);
  expect(duplicates).toEqual([]);
  expect(ids.filter((id) => id.startsWith("custom_"))).toEqual([]);
  expect(
    [...seen].filter((id) => !/^[a-z][a-z0-9]*(_[a-z0-9]+)*$/.test(id))
  ).toEqual([]);
});

test("custom stacks start with a color and survive a component round trip", () => {
  const glyph = parseSprite("AB\x02C");
  expect(spriteDefinition(glyph)).toBe("\x0fAB\x02C");
  expect(glyph.id).toMatch(/^custom_[a-z0-9]+_[a-z0-9]+$/);
  expect(spriteRef(glyph)).toEqual({ id: glyph.id, custom: true, definition: "\x0fAB\x02C" });
  expect(resolveSprite({ ...spriteRef(glyph) })).toEqual(glyph);
  expect(parseSprite("\x0fA\x0fB").id).toBe(parseSprite("AB").id);
  expect(resolveSprite(spriteRef(customSprite({ layers: [] })))).toEqual(
    customSprite({ layers: [] })
  );
  const reference = spriteRef(glyph);
  resolveSprite(reference);
  Object.assign(reference, spriteRef(parseSprite("D")));
  expect(resolveSprite(reference).layers[0].char).toBe("D");
  const rich = customSprite({
    name: "Preview",
    layers: [{ char: "█", color: "#606060" }],
    facing: { up: glyph.layers },
    amounts: { double: [] },
    terminal: { layers: [{ char: "↑", color: colors.green }] },
  });
  expect(resolveSprite({ ...spriteRef(rich) })).toEqual(rich);
});
