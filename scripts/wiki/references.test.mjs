import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const generator = fileURLToPath(new URL("./references.mjs", import.meta.url));
async function fixture() {
  const directory = await mkdtemp(
    path.join(tmpdir(), "alive-wiki-references-")
  );
  await mkdir(path.join(directory, "src"));
  return directory;
}
const generate = (cwd) =>
  spawnSync(process.execPath, [generator], { cwd, encoding: "utf8" });

test("source links refresh declarations, imports and local aliases from the route registry", async () => {
  const directory = await fixture();
  try {
    await mkdir(path.join(directory, "src/wiki"));
    await writeFile(
      path.join(directory, "src/a.ts"),
      "export type Example = { name: string };\nexport default function factory() {}\n"
    );
    await writeFile(path.join(directory, "src/a.md"), "# A\n\nA contract.\n");
    await writeFile(
      path.join(directory, "src/b.ts"),
      'import make, { Example as Renamed } from "./a";\nexport function consume(value: Renamed) { return make(); }\n'
    );
    await writeFile(path.join(directory, "src/b.md"), "# B\n\nA caller.\n");
    await writeFile(
      path.join(directory, "src/wiki/pages.json"),
      JSON.stringify([
        { source: "src/a.md", route: "development/a.html" },
        { source: "src/b.md", route: "development/b.html" },
      ])
    );
    const result = generate(directory);
    assert.equal(result.status, 0, result.stderr);
    const index = JSON.parse(
      await readFile(
        path.join(directory, "src/wiki/sourceReferences.json"),
        "utf8"
      )
    );
    assert.equal(
      index.references.Example.href,
      "development/a.html#type-example"
    );
    assert.equal(
      index.pages["src/b.md"].Renamed.href,
      "development/a.html#type-example"
    );
    assert.equal(index.pages["src/b.md"].make.href, "development/a.html");
    assert.equal(index.pages["src/b.md"].default, undefined);
    assert.equal(
      await readFile(path.join(directory, "src/a.md"), "utf8"),
      "# A\n\nA contract.\n"
    );
    await assert.rejects(readFile(path.join(directory, "src/types.md")), {
      code: "ENOENT",
    });
    const initial = await readFile(
      path.join(directory, "src/wiki/sourceReferences.json"),
      "utf8"
    );
    assert.equal(generate(directory).status, 0);
    assert.equal(
      await readFile(
        path.join(directory, "src/wiki/sourceReferences.json"),
        "utf8"
      ),
      initial
    );
    await writeFile(
      path.join(directory, "src/a.ts"),
      "export type Updated = string;\n"
    );
    assert.equal(generate(directory).status, 0);
    const updated = JSON.parse(
      await readFile(
        path.join(directory, "src/wiki/sourceReferences.json"),
        "utf8"
      )
    );
    assert.equal(updated.references.Example, undefined);
    assert.equal(updated.pages["src/b.md"].Renamed, undefined);
    assert.equal(
      updated.references.Updated.href,
      "development/a.html#type-updated"
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
