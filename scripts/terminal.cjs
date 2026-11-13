const { buildSync } = require("esbuild");
const { mkdtempSync, rmSync } = require("fs");
const { tmpdir } = require("os");
const { join } = require("path");
const { spawnSync } = require("child_process");

const directory = mkdtempSync(join(tmpdir(), "alive-terminal-"));
try {
  const outfile = join(directory, "alive.cjs");
  buildSync({
    entryPoints: [join(__dirname, "../src/renderers/terminal/cli.tsx")],
    outfile,
    bundle: true,
    platform: "node",
    format: "cjs",
    loader: { ".css": "empty", ".woff": "empty", ".woff2": "empty" },
    external: ["jsfxr"],
    define: { "process.env.NODE_ENV": '"production"' },
    logLevel: "error",
  });
  const result = spawnSync(
    process.execPath,
    [outfile, ...process.argv.slice(2)],
    {
      stdio: "inherit",
      env: { ...process.env, NODE_PATH: join(__dirname, "../node_modules") },
    }
  );
  process.exitCode = result.status ?? 1;
} finally {
  rmSync(directory, { recursive: true, force: true });
}
