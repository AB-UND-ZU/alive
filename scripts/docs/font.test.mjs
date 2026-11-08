import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { aliasFont, fontCharacters, fontTables } from "./font.mjs";
const source = await readFile(
  new URL("../../public/fonts/MostPerfectDOSVGA.woff", import.meta.url)
);
const aliases = JSON.parse(
  await readFile(
    new URL("../../src/documentation/glyphAliases.json", import.meta.url)
  )
);
test("readable Unicode symbols use the same native glyph indices", () => {
  const original = fontCharacters(
    fontTables(source).find((table) => table.tag === "cmap").data
  );
  const generated = fontCharacters(
    fontTables(aliasFont(source, aliases)).find((table) => table.tag === "cmap")
      .data
  );
  for (const [code, glyph] of original)
    assert.equal(generated.get(code), glyph);
  for (const [alias, target] of Object.entries(aliases))
    if ([...target].length === 1)
      assert.equal(
        generated.get(alias.codePointAt(0)),
        original.get(target.codePointAt(0))
      );
});
test("aliases preserve all native outlines, metrics and other font tables", () => {
  const generated = new Map(
    fontTables(aliasFont(source, aliases)).map((table) => [
      table.tag,
      table.data,
    ])
  );
  for (const table of fontTables(source))
    if (table.tag !== "cmap")
      assert.deepEqual(generated.get(table.tag), table.data);
});
