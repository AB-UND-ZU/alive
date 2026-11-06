import { readFile, writeFile, mkdir, readdir, rm, cp } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Marked } from "marked";
import { build } from "esbuild";

export const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);
const escape = (text) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
const slug = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
async function markdownFiles(directory) {
  const files = [];
  for (const entry of await readdir(path.join(root, directory), {
    withFileTypes: true,
  })) {
    const name = path.posix.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await markdownFiles(name)));
    else if (entry.name.endsWith(".md")) files.push(name);
  }
  return files.sort();
}
export async function buildDocs(output = ".docs-build") {
  const out = path.resolve(root, output);
  if (
    out === root ||
    !out.startsWith(root + path.sep) ||
    ![".docs-build", "build/docs"].includes(path.relative(root, out))
  ) {
    throw new Error("Documentation output must be .docs-build or build/docs");
  }
  const sources = [
    ...(await markdownFiles("docs")),
    ...(await markdownFiles("src")),
  ];
  const pages = await Promise.all(
    sources.map(async (source) => {
      const markdown = await readFile(path.join(root, source), "utf8");
      const title = markdown.match(/^# (.+)$/m)?.[1];
      if (!title) throw new Error(`Missing title: ${source}`);
      const output = source.startsWith("docs/")
        ? source.slice(5).replace(/\.md$/, ".html")
        : `development/${source.replace(/\.md$/, ".html")}`;
      return { source, markdown, title, output };
    })
  );
  // Keep the reading order in the guide's own Markdown links.
  const home = pages.find((page) => page.source === "docs/index.md");
  const order = [
    "docs/index.md",
    ...Array.from(
      home.markdown.matchAll(/\]\(([^)#]+\.md)(?:#[^)]*)?\)/g),
      (match) => path.posix.normalize(path.posix.join("docs", match[1]))
    ),
  ];
  const rank = (page) => {
    const index = order.indexOf(page.source);
    return index < 0 ? order.length : index;
  };
  pages.sort((a, b) => rank(a) - rank(b));
  const bySource = new Map(pages.map((page) => [page.source, page]));
  await rm(out, { recursive: true, force: true });
  await mkdir(path.join(out, "assets"), { recursive: true });
  await cp(path.join(root, "public/fonts"), path.join(out, "assets/fonts"), {
    recursive: true,
  });
  await cp(path.join(root, "docs/media"), path.join(out, "media"), {
    recursive: true,
  });
  await cp(
    path.join(root, "scripts/docs/style.css"),
    path.join(out, "assets/style.css")
  );
  await writeFile(path.join(out, ".nojekyll"), "");
  const sceneIds = JSON.parse(
    await readFile(path.join(root, "src/documentation/scenes.json"), "utf8")
  );
  for (const page of pages) {
    const relative = (target) =>
      path.posix.relative(path.posix.dirname(page.output), target) || "./";
    const headings = [];
    const headingIds = new Map();
    const parser = new Marked({
      renderer: {
        heading({ tokens, depth, text }) {
          const base = slug(text);
          const count = headingIds.get(base) || 0;
          headingIds.set(base, count + 1);
          const id = count ? `${base}-${count}` : base;
          if (depth === 2) headings.push({ id, text });
          return `<h${depth} id="${id}">${this.parser.parseInline(
            tokens
          )}</h${depth}>`;
        },
        code({ text, lang }) {
          if (lang !== "scene") return false;
          const id = text.trim();
          if (!sceneIds.includes(id))
            throw new Error(`Unknown scene ${id} in ${page.source}`);
          return `<div class="scene" data-scene="${id}"><p>Interactive example. Enable JavaScript to use its controls.</p></div>`;
        },
        link({ href, tokens }) {
          if (/^(https?:|mailto:|#)/.test(href)) return false;
          const [file, hash] = href.split("#");
          const source = path.posix.normalize(
            path.posix.join(path.posix.dirname(page.source), file)
          );
          const target = bySource.get(source);
          if (!target)
            throw new Error(
              `Unknown documentation link ${href} in ${page.source}`
            );
          return `<a href="${escape(
            relative(target.output) + (hash ? "#" + hash : "")
          )}">${this.parser.parseInline(tokens)}</a>`;
        },
        image({ href, text }) {
          if (!href.startsWith("media/"))
            throw new Error(`Images must use docs/media: ${href}`);
          return `<figure><img src="${escape(relative(href))}" alt="${escape(
            text
          )}" loading="lazy"><figcaption>${escape(text)}</figcaption></figure>`;
        },
      },
    });
    const content = parser.parse(page.markdown);
    const nav = (technical) =>
      pages
        .filter((item) => item.source.startsWith("docs/") !== technical)
        .map(
          (item) =>
            `<a ${item === page ? 'aria-current="page"' : ""} href="${relative(
              item.output
            )}">${escape(item.title)}</a>`
        )
        .join("");
    const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#000000"><title>${escape(
      page.title
    )} | Alive</title><link rel="icon" href="data:,"><link rel="stylesheet" href="${relative(
      "assets/style.css"
    )}">${
      content.includes("data-scene=")
        ? `<script defer src="${relative("assets/scenes.js")}"></script>`
        : ""
    }</head>
<body><a class="skip" href="#content">Skip to content</a><header><a class="brand" href="${relative(
      "index.html"
    )}"><span class="halo">°</span><span class="heart">♥</span> ALIVE</a><span>FIELD GUIDE</span><a href="https://ab-und-zu.github.io/alive/">[ PLAY GAME ]</a></header>
<div class="layout"><nav aria-label="Chapters"><details open><summary>Player guide</summary>${nav(
      false
    )}</details><details open><summary>Development</summary>${nav(
      true
    )}</details><a class="source" href="https://github.com/AB-UND-ZU/alive">[ SOURCE ]</a></nav><main id="content" tabindex="-1"><p class="eyebrow">${
      page.source.startsWith("docs/") ? "PLAYER GUIDE" : "DEVELOPMENT"
    }</p>${content}<footer>ALIVE · <a href="https://github.com/AB-UND-ZU/alive/blob/main/${
      page.source
    }">Edit this page</a></footer></main><aside aria-label="On this page">On this page${headings
      .map(({ id, text }) => `<a href="#${id}">${escape(text)}</a>`)
      .join("")}</aside></div></body></html>`;
    await mkdir(path.dirname(path.join(out, page.output)), { recursive: true });
    await writeFile(path.join(out, page.output), html);
  }
  await build({
    absWorkingDir: root,
    entryPoints: ["src/documentation/index.ts"],
    bundle: true,
    outfile: path.join(out, "assets/scenes.js"),
    format: "iife",
    target: "es2020",
    // jsfxr assigns a global in its CommonJS wrapper and needs a non-strict bundle.
    tsconfigRaw: { compilerOptions: { alwaysStrict: false, jsx: "react-jsx" } },
    minify: true,
    define: { "process.env.NODE_ENV": '"production"' },
  });
  console.log(
    `Built ${pages.length} Markdown pages in ${path.relative(root, out)}`
  );
}
if (process.argv[1] === fileURLToPath(import.meta.url))
  await buildDocs(process.argv[2]);
