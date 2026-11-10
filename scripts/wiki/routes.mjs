import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const output = process.env.BUILD_PATH || ".wiki-build";
if (![".wiki-build", "build/wiki"].includes(output))
  throw Error("Output must be .wiki-build or build/wiki");
const pages = JSON.parse(await readFile("src/wiki/pages.json", "utf8"));
const html = await readFile(path.join(output, "index.html"));
for (const route of [
  ...pages.flatMap((page) => [page.route, ...(page.aliases || [])]),
  "preview.html",
  "interface-preview.html",
]) {
  await mkdir(path.dirname(path.join(output, route)), { recursive: true });
  await writeFile(path.join(output, route), html);
}
