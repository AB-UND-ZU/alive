import { spawnSync } from "node:child_process";
import { copyFile, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
export const renderers = ["three-js", "html", "terminal"];

export const clientBuilds = (output, publicUrl, renderer) => {
  if (renderer && !renderers.includes(renderer))
    throw new Error(`Unknown renderer: ${renderer}`);
  const base = publicUrl.replace(/\/$/, "");
  return renderers
    .filter((name) => !renderer || name === renderer)
    .map((name) => {
      const folder = name === "three-js" ? "" : name;
      return {
        renderer: name,
        output: path.join(output, folder),
        publicUrl: `${base}${folder ? "/" + folder : ""}` || "/",
      };
    });
};

export const verifyClientBundle = async (output, renderer) => {
  const directory = path.join(output, "static/js");
  const maps = (await readdir(directory)).filter((name) =>
    name.endsWith(".map")
  );
  if (!maps.length) throw new Error(`No source maps in ${output}`);
  const sources = (
    await Promise.all(
      maps.map(
        async (name) =>
          JSON.parse(await readFile(path.join(directory, name), "utf8")).sources
      )
    )
  )
    .flat()
    .map((source) => source.replace(/\\/g, "/"));
  const includes = (name) =>
    sources.some((source) =>
      new RegExp(`(^|/)renderers/${name}/`).test(source)
    );
  if (!includes(renderer))
    throw new Error(`${renderer} build does not contain its renderer`);
  for (const other of renderers)
    if (other !== renderer && includes(other))
      throw new Error(`${renderer} build includes ${other}`);
  if (
    renderer !== "three-js" &&
    sources.some((source) =>
      /(^|\/)node_modules\/(three\/|three-stdlib\/|@react-three\/|@react-spring\/three\/)/.test(
        source
      )
    )
  )
    throw new Error(`${renderer} build includes ThreeJS dependencies`);
};

export const buildClients = async () => {
  const args = process.argv.slice(2);
  const renderer = args[args.indexOf("--renderer") + 1];
  const selected = args.includes("--renderer") ? renderer : undefined;
  if (args.includes("--renderer") && !renderer)
    throw new Error("--renderer needs three-js, html or terminal");
  const { homepage } = JSON.parse(await readFile("package.json", "utf8"));
  const builds = clientBuilds(
    process.env.BUILD_PATH || "build",
    process.env.PUBLIC_URL || new URL(homepage).pathname,
    selected
  );
  for (const build of builds) {
    const result = spawnSync(
      process.execPath,
      [require.resolve("react-scripts/scripts/build")],
      {
        stdio: "inherit",
        env: {
          ...process.env,
          REACT_APP_RENDERER: build.renderer,
          REACT_APP_WIKI: "false",
          PUBLIC_URL: build.publicUrl,
          BUILD_PATH: build.output,
          GENERATE_SOURCEMAP: "true",
        },
      }
    );
    if (result.error) throw result.error;
    if (result.status !== 0)
      throw new Error(`${build.renderer} build failed (${result.status})`);
    for (const entry of ["preview.html", "interface-preview.html"])
      await copyFile(
        path.join(build.output, "index.html"),
        path.join(build.output, entry)
      );
    await verifyClientBundle(build.output, build.renderer);
    process.stdout.write(`Verified isolated ${build.renderer} bundle\n`);
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  buildClients().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
