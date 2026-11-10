import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const script = fileURLToPath(new URL("./routes.mjs", import.meta.url));
test("direct wiki and preview URLs load the same bundle under a hosting subdirectory", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "alive-wiki-routes-"));
  try {
    await mkdir(path.join(root, "src/wiki"), { recursive: true });
    await mkdir(path.join(root, "build/wiki"), { recursive: true });
    await writeFile(
      path.join(root, "src/wiki/pages.json"),
      JSON.stringify([
        {
          route: "game-design/controls/interface.html",
          aliases: ["interface.html"],
        },
      ])
    );
    const html =
      '<div id="root"></div><script src="/alive/wiki/static/js/main.js"></script>';
    await writeFile(path.join(root, "build/wiki/index.html"), html);
    const result = spawnSync(process.execPath, [script], {
      cwd: root,
      env: { ...process.env, BUILD_PATH: "build/wiki" },
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
    for (const route of [
      "game-design/controls/interface.html",
      "interface.html",
      "preview.html",
      "interface-preview.html",
    ]) {
      const shell = await readFile(
        path.join(root, "build/wiki", route),
        "utf8"
      );
      assert.equal(shell, html);
      assert.equal(
        new URL(
          shell.match(/src="([^"]+)"/)[1],
          `https://example.com/alive/wiki/${route}`
        ).href,
        "https://example.com/alive/wiki/static/js/main.js"
      );
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("wiki output rejects paths outside its build directories", () => {
  const result = spawnSync(process.execPath, [script], {
    env: { ...process.env, BUILD_PATH: "public" },
    encoding: "utf8",
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Output must be/);
});
