import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { clientBuilds, verifyClientBundle } from "./build-clients.mjs";

test("each client keeps its own Pages URL and asset output", () => {
  assert.deepEqual(clientBuilds("build", "/alive/"), [
    { renderer: "three-js", output: "build", publicUrl: "/alive" },
    { renderer: "html", output: "build/html", publicUrl: "/alive/html" },
    {
      renderer: "terminal",
      output: "build/terminal",
      publicUrl: "/alive/terminal",
    },
  ]);
  assert.deepEqual(clientBuilds("dist", "/", "html"), [
    { renderer: "html", output: "dist/html", publicUrl: "/html" },
  ]);
  assert.throws(() => clientBuilds("build", "/alive", "unknown"));
});

test("emitted client bundles reject other renderers and ThreeJS runtime dependencies", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "alive-client-bundle-"));
  const assets = path.join(directory, "static/js");
  await mkdir(assets, { recursive: true });
  const sources = ["engine/ecs.ts", "renderers/html/index.tsx"];
  const write = () =>
    writeFile(path.join(assets, "main.js.map"), JSON.stringify({ sources }));
  try {
    await write();
    await verifyClientBundle(directory, "html");
    sources.push("renderers/three-js/index.tsx");
    await write();
    await assert.rejects(
      verifyClientBundle(directory, "html"),
      /includes three-js/
    );
    sources.pop();
    sources.push("../node_modules/three/build/three.module.js");
    await write();
    await assert.rejects(
      verifyClientBundle(directory, "html"),
      /ThreeJS dependencies/
    );
    sources.pop();
    sources.pop();
    await write();
    await assert.rejects(
      verifyClientBundle(directory, "html"),
      /does not contain its renderer/
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("local directory entries serve clients without hiding missing script files", async () => {
  const { createServer } = await import("node:http");
  const { createRequire } = await import("node:module");
  const { readFile } = await import("node:fs/promises");
  const handler = createRequire(import.meta.url)("serve-handler");
  const root = await mkdtemp(path.join(tmpdir(), "alive-client-routes-"));
  const config = JSON.parse(await readFile("scripts/wiki/serve.json", "utf8"));
  const server = createServer((request, response) =>
    handler(request, response, { ...config, public: root })
  );
  try {
    for (const folder of ["", "html", "terminal", "wiki"]) {
      await mkdir(path.join(root, folder), { recursive: true });
      await writeFile(
        path.join(root, folder, "index.html"),
        folder || "three-js"
      );
    }
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    for (const folder of ["", "html", "terminal", "wiki"]) {
      const response = await fetch(
        `${base}/${folder}${folder ? "/" : ""}?preview`
      );
      assert.equal(response.status, 200);
      assert.equal(await response.text(), folder || "three-js");
    }
    assert.equal(
      (await fetch(`${base}/html/static/js/missing.js`)).status,
      404
    );
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(root, { recursive: true, force: true });
  }
});
