import { build } from "esbuild";
import { createHash } from "node:crypto";
import { readFile, writeFile, readdir, mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { JSDOM } from "jsdom";

async function sourceFiles(folder) {
  const result = [];
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const file = path.join(folder, entry.name);
    if (entry.isDirectory()) result.push(...(await sourceFiles(file)));
    else if (/\.(ts|tsx|json)$/.test(file) && !/\.test\./.test(file))
      result.push(file);
  }
  return result.sort();
}
export async function rebuildMinimapSnapshot(root) {
  const target = path.join(root, "src/wiki/minimap.json");
  const hash = createHash("sha256");
  const sources = [
    ...(await sourceFiles(path.join(root, "src/engine"))),
    ...(await sourceFiles(path.join(root, "src/game"))),
    ...(await sourceFiles(path.join(root, "src/bindings"))),
    ...[
      "src/testing/harness.ts",
      "src/testing/island.ts",
      "src/testing/env.ts",
      "src/wiki/MinimapData.ts",
      "src/wiki/DialogSnapshot.tsx",
    ].map((file) => path.join(root, file)),
  ];
  for (const file of sources)
    hash.update(path.relative(root, file)).update(await readFile(file));
  hash.update(await readFile(new URL(import.meta.url)));
  const sourceHash = hash.digest("hex");
  const temporary = await mkdtemp(path.join(os.tmpdir(), "alive-minimap-"));
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "http://localhost/",
  });
  const previous = new Map(
    ["window", "document", "navigator"].map((key) => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key),
    ])
  );
  class AudioContext {
    state = "suspended";
    destination = {};
    createGain() {
      return { gain: { value: 0 }, connect() {} };
    }
  }
  dom.window.AudioContext = AudioContext;
  dom.window.matchMedia = () => ({ matches: false });
  for (const key of previous.keys())
    Object.defineProperty(globalThis, key, {
      configurable: true,
      value: dom.window[key],
    });
  const nativeRandom = Math.random;
  try {
    const bundle = path.join(temporary, "snapshot.cjs");
    await build({
      stdin: {
        contents: `export { prepareMinimaps } from "./src/wiki/MinimapData"; export { seedRandom } from "./src/testing/env";`,
        resolveDir: root,
        loader: "ts",
      },
      outfile: bundle,
      bundle: true,
      platform: "node",
      format: "cjs",
      loader: { ".css": "empty" },
      define: { "process.env.NODE_ENV": '"production"' },
      logLevel: "silent",
    });
    const { default: generator } = await import(pathToFileURL(bundle).href);
    generator.seedRandom(2026);
    const sample = generator.prepareMinimaps();
    await writeFile(target, JSON.stringify({ sourceHash, sample }) + "\n");
  } finally {
    Math.random = nativeRandom;
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
    dom.window.close();
    await rm(temporary, { recursive: true, force: true });
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const root = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../.."
  );
  await rebuildMinimapSnapshot(root);
  console.log("Rebuilt src/wiki/minimap.json");
}
