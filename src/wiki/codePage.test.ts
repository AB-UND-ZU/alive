import { codePage437 } from "./codePage";
import glyphAliases from "./glyphAliases.json";
import font from "../game/assets/font.json";

test("the DOS atlas contains all 256 positions in code-page order", () => {
  expect(codePage437).toHaveLength(256);
  expect(codePage437.slice(32, 127).join("")).toBe(
    Array.from({ length: 95 }, (_, index) =>
      String.fromCharCode(index + 32)
    ).join("")
  );
  expect(codePage437[128]).toBe("Ç");
  expect(codePage437[176]).toBe("░");
  expect(codePage437[196]).toBe("─");
  expect(codePage437[219]).toBe("█");
  expect(codePage437[224]).toBe("α");
  expect(codePage437[255]).toBe("\u00a0");
});

test("graphical controls use the game font's glyphs rather than control codes", () => {
  expect(codePage437[0]).toBe(" ");
  expect(codePage437[1]).toBe("\u0100");
  expect(codePage437[24]).toBe("\u0117");
  expect(codePage437[25]).toBe("\u0118");
  expect(codePage437[26]).toBe("\u0119");
  expect(codePage437[27]).toBe("\u011a");
  expect(codePage437[31]).toBe("\u011e");
  expect(codePage437[127]).toBe("\u011f");
  for (const character of codePage437)
    expect(font.glyphs).toHaveProperty([character]);
});

test("Unicode graphical symbols map to the matching DOS font positions", () => {
  expect(glyphAliases["♀"]).toBe(codePage437[12]);
  expect(glyphAliases["♂"]).toBe(codePage437[11]);
  expect(glyphAliases["♥"]).toBe(codePage437[3]);
  for (const alias of Object.values(glyphAliases))
    for (const character of alias)
      expect(font.glyphs).toHaveProperty([character]);
});
