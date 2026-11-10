const { build } = require("esbuild"),
  fs = require("fs"),
  path = require("path"),
  cp = require("child_process");
const stage = process.argv[2] || "baseline";
fs.mkdirSync("results/performance/live/" + stage, { recursive: true });
(async () => {
  await build({
    entryPoints: ["scripts/live-performance/entry.tsx"],
    bundle: true,
    outdir: "results/performance/live/" + stage,
    jsx: "automatic",
    sourcemap: true,
    banner: { js: "var sfxr;" },
    loader: { ".woff": "file", ".woff2": "file" },
    define: {
      "process.env.NODE_ENV": '"production"',
      "process.env.PUBLIC_URL": '""',
    },
    plugins: [
      {
        name: "profile",
        setup(b) {
          b.onLoad({ filter: /\/src\/.*\.(ts|tsx)$/ }, (args) => {
            let s = fs.readFileSync(args.path, "utf8");
            const f = path.relative(process.cwd(), args.path);
            s = require("./pocs.cjs")(process.env.POC, f, s);
            if (f === "src/game/sound/createWorker.ts")
              s = s.replace(
                'new URL("./synthesis.worker.ts", import.meta.url)',
                'new URL("/' + stage + '/synthesis.worker.js", location.href)'
              );
            if (f === "src/components/App/index.tsx") {
              s =
                'import { Live, scenarioFactory } from "../../../scripts/live-performance/probe";\n' +
                s;
              s = s.replace(
                "<World>",
                "<World createInitialWorld={scenarioFactory}><Live />"
              );
            }
            if (f === "src/components/Terminal/index.tsx") {
              s =
                'import { RenderProbe } from "../../../scripts/live-performance/probe";\n' +
                s;
              s = s.replace(
                '<Canvas shadows="basic" flat>',
                '<Canvas shadows="basic" flat><RenderProbe />'
              );
            }
            if (f === "src/engine/ecs.ts") {
              s = s.replace(
                /world.addSystem\(systems\.(\w+)\);/g,
                (_, name) =>
                  `world.addSystem(w=>{const s=systems.${name}(w);const update=s.onUpdate;s.onUpdate=d=>{const t=performance.now();try{return update(d)}finally{window.liveRecord?.('${name}',performance.now()-t)}};return s;});`
              );
            }
            return { contents: s, loader: f.endsWith("tsx") ? "tsx" : "ts" };
          });
        },
      },
    ],
  });
  fs.writeFileSync(
    "results/performance/live/" + stage + "/source.diff",
    cp.execFileSync("git", ["diff", "HEAD"])
  );
  fs.writeFileSync(
    "results/performance/live/" + stage + "/head",
    cp.execFileSync("git", ["rev-parse", "HEAD"])
  );
  if (process.env.POC === "audio-worker")
    await build({
      entryPoints: ["scripts/live-performance/audio.worker.ts"],
      bundle: true,
      outfile: "results/performance/live/" + stage + "/audio.worker.js",
      banner: { js: "var sfxr;" },
    });
  if (fs.existsSync("src/game/sound/synthesis.worker.ts"))
    await build({
      entryPoints: ["src/game/sound/synthesis.worker.ts"],
      bundle: true,
      outfile: "results/performance/live/" + stage + "/synthesis.worker.js",
      banner: { js: "var sfxr;" },
    });
  console.log("Built", stage);
})();
