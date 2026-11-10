const { build } = require("esbuild");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const stage = process.argv[2] || "baseline";
const folder = path.resolve("results/performance");
const files = [
  "src/game/math/path.ts",
  "src/game/math/sparseGraph.ts",
  "src/components/Entity/Instances.tsx",
  "src/components/Entity/Sprite.tsx",
  "src/components/Entity/Layer.tsx",
  "src/components/Entity/Box.tsx",
  "src/components/Entity/index.tsx",
  "src/components/Entity/Animated.tsx",
  "src/components/Entity/matrixUpdates.ts",
  "src/components/Stats/index.tsx",
  "src/components/Controls/index.tsx",
];
const snapshotPath = path.join(folder, stage + ".source.json");
if (process.argv.includes("--capture"))
  fs.writeFileSync(
    snapshotPath,
    JSON.stringify(
      {
        base: execFileSync("git", ["rev-parse", "HEAD"], {
          encoding: "utf8",
        }).trim(),
        files: Object.fromEntries(
          files.map((file) => [
            file,
            fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null,
          ])
        ),
      },
      null,
      2
    )
  );
if (!process.argv.includes("--capture")) {
  const manifest = JSON.parse(
    fs.readFileSync("scripts/performance/stages.json")
  );
  if (!manifest.order.includes(stage)) throw Error("Unknown stage: " + stage);
  const content = Object.fromEntries(
    manifest.files.map((file) => {
      try {
        return [
          file,
          execFileSync("git", ["show", manifest.base + ":" + file], {
            encoding: "utf8",
            stdio: ["ignore", "pipe", "ignore"],
          }),
        ];
      } catch {
        return [file, null];
      }
    })
  );
  for (const name of manifest.order) {
    if (name !== "baseline") Object.assign(content, manifest.changes[name]);
    if (name === stage) break;
  }
  fs.writeFileSync(
    snapshotPath,
    JSON.stringify({ base: manifest.base, files: content }, null, 2)
  );
}
const snapshot = JSON.parse(fs.readFileSync(snapshotPath));
(async () => {
  await build({
    entryPoints: ["scripts/performance/entry.tsx"],
    bundle: true,
    outdir: path.join(folder, stage),
    jsx: "automatic",
    banner: { js: "var sfxr;" },
    loader: { ".woff": "file", ".woff2": "file" },
    define: {
      "process.env.NODE_ENV": '"production"',
      "process.env.PUBLIC_URL": '""',
    },
    plugins: [
      {
        name: "stage-source",
        setup(build) {
          build.onLoad({ filter: /\/src\/.*\.(ts|tsx)$/ }, (args) => {
            const relative = path.relative(process.cwd(), args.path);
            if (Object.hasOwn(snapshot.files, relative)) {
              const contents = snapshot.files[relative];
              if (contents === null)
                throw Error(
                  "Module did not exist in " + stage + ": " + relative
                );
              return {
                contents,
                loader: relative.endsWith("tsx") ? "tsx" : "ts",
              };
            }
          });
        },
      },
    ],
  });
  console.log("Built " + stage + " against " + snapshot.base);
})();
