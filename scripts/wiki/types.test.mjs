import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const generator = fileURLToPath(new URL("./types.mjs", import.meta.url));
async function fixture() {
  const directory = await mkdtemp(path.join(tmpdir(), "alive-wiki-types-"));
  await mkdir(path.join(directory, "src"));
  return directory;
}
const generate = (cwd) =>
  spawnSync(process.execPath, [generator], { cwd, encoding: "utf8" });

test("source schemas refresh without removing authored examples or changing type anchors", async () => {
  const directory = await fixture();
  try {
    const source = path.join(directory, "src/example.ts");
    const target = path.join(directory, "src/example.md");
    const introduction =
      "# Example\n\nStores a named value.\n\n```ts\ntype Sample = { value: string };\n```";
    await writeFile(source, "export type Example = { name: string };\n");
    await writeFile(target, introduction + "\n");
    assert.equal(generate(directory).status, 0);
    const initial = await readFile(target, "utf8");
    assert.ok(initial.startsWith(introduction));
    assert.equal(initial.match(/^## Example$/gm)?.length, 1);
    assert.match(
      await readFile(path.join(directory, "src/types.md"), "utf8"),
      /example\.md#type-example/
    );
    assert.equal(generate(directory).status, 0);
    assert.equal(await readFile(target, "utf8"), initial);
    await writeFile(
      source,
      "export type Example = { name: string; amount: number };\n"
    );
    assert.equal(generate(directory).status, 0);
    const updated = await readFile(target, "utf8");
    assert.ok(updated.startsWith(introduction));
    assert.match(updated, /amount: number/);
    assert.equal(updated.match(/^## Example$/gm)?.length, 1);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("a missing module contract stops generation without creating bare pages or partial updates", async () => {
  const directory = await fixture();
  try {
    const target = path.join(directory, "src/a.md");
    const original = "# Existing\n\nIts authored contract.\n";
    await writeFile(target, original);
    await writeFile(
      path.join(directory, "src/a.ts"),
      "export type A = string;\n"
    );
    await writeFile(
      path.join(directory, "src/z.ts"),
      "export type Z = number;\n"
    );
    const result = generate(directory);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Write src\/z\.md with the module contract/);
    assert.equal(await readFile(target, "utf8"), original);
    await assert.rejects(readFile(path.join(directory, "src/z.md")), {
      code: "ENOENT",
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
