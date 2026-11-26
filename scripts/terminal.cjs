const { buildSync } = require("esbuild");
const { mkdirSync, mkdtempSync, rmSync } = require("fs");
const { homedir, tmpdir } = require("os");
const { join } = require("path");
const { spawnSync } = require("child_process");

const directory = mkdtempSync(join(tmpdir(), "alive-terminal-"));
try {
  const outfile = join(directory, "alive.cjs");
  buildSync({
    entryPoints: {
      alive: join(__dirname, "../src/renderers/terminal/cli.tsx"),
      generation: join(
        __dirname,
        "../src/renderers/terminal/generation.worker.ts"
      ),
    },
    outdir: directory,
    outExtension: { ".js": ".cjs" },
    bundle: true,
    platform: "node",
    format: "cjs",
    loader: { ".css": "empty", ".woff": "empty", ".woff2": "empty" },
    external: ["jsfxr", "node-web-audio-api"],
    define: { "process.env.NODE_ENV": '"production"' },
    logLevel: "error",
  });
  const dataDirectory = join(
    process.env.XDG_DATA_HOME || join(homedir(), ".local", "share"),
    "alive"
  );
  try {
    mkdirSync(dataDirectory, { recursive: true });
  } catch {}
  const result = spawnSync(
    process.execPath,
    [
      "--experimental-webstorage",
      "--localstorage-file=" + join(dataDirectory, "terminal.storage"),
      outfile,
      ...process.argv.slice(2),
    ],
    {
      stdio: "inherit",
      env: { ...process.env, NODE_PATH: join(__dirname, "../node_modules") },
    }
  );
  process.exitCode = result.status ?? 1;
} finally {
  rmSync(directory, { recursive: true, force: true });
}
