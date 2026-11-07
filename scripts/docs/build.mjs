import ts from "typescript";
import { readFile, writeFile, mkdir, readdir, rm, cp } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Marked } from "marked";
import { build } from "esbuild";
export const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);
const escape = (s) =>
  s.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
async function files(dir) {
  const result = [];
  for (const e of await readdir(path.join(root, dir), {
    withFileTypes: true,
  })) {
    const f = path.posix.join(dir, e.name);
    if (e.isDirectory()) result.push(...(await files(f)));
    else if (f.endsWith(".md")) result.push(f);
  }
  return result.sort();
}
export async function buildDocs(output = ".docs-build") {
  const out = path.resolve(root, output);
  if (
    ![".docs-build", ".docs-dev", "build/docs"].includes(
      path.relative(root, out)
    )
  )
    throw Error("Output must be .docs-build, .docs-dev or build/docs");
  const pkg = JSON.parse(
    await readFile(path.join(root, "package.json"), "utf8")
  );
  const [major, minor, patch] = pkg.version.split(".").map(Number);
  const version = `V${major}x${String(minor).padStart(2, "0")}${
    patch ? "." + patch : ""
  }`;
  const capitalize = (title) =>
    title.replace(/\b[a-zA-Z][a-zA-Z0-9]*/g, (word) =>
      [
        "ALIVE",
        "UI",
        "ECS",
        "NPC",
        "NPCs",
        "HP",
        "MP",
        "XP",
        "ThreeJS",
      ].includes(word)
        ? word
        : word === word.toUpperCase()
        ? word.charAt(0) + word.slice(1).toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1)
    );
  const parser = new Marked({
    extensions: [
      {
        name: "game",
        level: "inline",
        start: (s) => s.indexOf("[["),
        tokenizer(s) {
          const m = /^\[\[(key|item|button):([^\]]+)\]\]/.exec(s);
          if (m) return { type: "game", raw: m[0], kind: m[1], value: m[2] };
        },
      },
    ],
  });
  const navigation = JSON.parse(
    await readFile(path.join(root, "scripts/docs/navigation.json"), "utf8")
  );
  const designOrder = Object.entries(navigation).flatMap(([group, names]) =>
    names.map((name) => ({ source: `docs/${name}.md`, group }))
  );
  const implementationGroups = [
    "Engine",
    "Entities",
    "Systems",
    "Components",
    "Types",
    "UI",
    "Docs",
  ];
  const slug = (value) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  const oldOverviews = {
    crates: "containers",
    abilities: "spells",
    characters: "classes",
    combat: "damage",
    controls: "keyboard-mouse",
    gathering: "harvesting",
    items: "gear",
    life: "consumables",
    making: "crafting",
    world: "map",
  };
  const pages = await Promise.all(
    [...(await files("docs")), ...(await files("src"))].map(async (source) => {
      const md = await readFile(path.join(root, source), "utf8"),
        title = md.match(/^# (.+)$/m)?.[1];
      if (!title) throw Error("Missing title: " + source);
      const gameplay = source.startsWith("docs/");
      const listed = designOrder.find((entry) => entry.source === source);
      const implementationGroup =
        source === "src/types.md"
          ? "Types"
          : source.startsWith("src/documentation/")
          ? "Docs"
          : source.startsWith("src/components/")
          ? "UI"
          : source.startsWith("src/engine/components/")
          ? "Components"
          : source.startsWith("src/engine/systems/")
          ? "Systems"
          : source === "src/engine/entities.md" ||
            source === "src/bindings/creation.md"
          ? "Entities"
          : "Engine";
      const group = gameplay ? listed?.group || "Archive" : implementationGroup;
      const oldRoute = gameplay
        ? source.slice(5).replace(/\.md$/, ".html")
        : "development/" + source.replace(/\.md$/, ".html");
      const name = source.slice(gameplay ? 5 : 4).replace(/\.md$/, "");
      const implementationName = name
        .replace(
          /^(engine\/(components|systems)\/|components\/|documentation\/|engine\/|bindings\/)/,
          ""
        )
        .replace(/\/index$/, "")
        .toLowerCase();
      const route =
        source === "docs/index.md"
          ? "index.html"
          : gameplay
          ? (group === "Intro"
              ? "intro/"
              : "game-design/" + slug(group) + "/") +
            name +
            ".html"
          : "development/" + slug(group) + "/" + implementationName + ".html";
      return {
        source,
        title: capitalize(title.replace(/\.(tsx?|jsx?)$/, "")),
        route,
        aliases: [
          ...(oldRoute !== route ? [oldRoute] : []),
          ...Object.entries(oldOverviews)
            .filter(([, target]) => source === `docs/${target}.md`)
            .flatMap(([name]) =>
              name === "crates"
                ? ["crates.html", "game-design/cells/crates.html"]
                : [name + ".html"]
            ),
        ],
        chapter: gameplay ? "Gameplay" : "Development",
        group,
        navigation: gameplay ? source === "docs/index.md" || !!listed : true,
        disabled: false,
        tokens: parser.lexer(
          md.replace(
            /^# .+$/m,
            "# " + capitalize(title.replace(/\.(tsx?|jsx?)$/, ""))
          )
        ),
      };
    })
  );
  const routes = new Set();
  for (const page of pages)
    for (const route of [page.route, ...page.aliases]) {
      if (routes.has(route))
        throw Error("Duplicate documentation route: " + route);
      routes.add(route);
    }
  const order = designOrder.map((entry) => entry.source);
  const rank = (page) =>
    page.chapter === "Gameplay"
      ? order.indexOf(page.source) < 0
        ? 1000
        : order.indexOf(page.source)
      : 2000 + implementationGroups.indexOf(page.group);
  pages.sort((a, b) => rank(a) - rank(b));
  const bySource = new Map(pages.map((p) => [p.source, p]));
  const sceneIds = JSON.parse(
    await readFile(path.join(root, "src/documentation/scenes.json"), "utf8")
  );
  for (const page of pages)
    parser.walkTokens(page.tokens, (token) => {
      if (token.type === "link" && !/^(https?:|mailto:|#)/.test(token.href)) {
        const [file, hash] = token.href.split("#"),
          target = bySource.get(
            path.posix.normalize(
              path.posix.join(path.posix.dirname(page.source), file)
            )
          );
        if (!target)
          throw Error(
            "Unknown documentation link " + token.href + " in " + page.source
          );
        token.href = target.route + (hash ? "#" + hash : "");
      }
      if (
        token.type === "code" &&
        token.lang === "scene" &&
        !sceneIds.includes(token.text.trim())
      )
        throw Error("Unknown scene " + token.text);
    });
  for (const page of pages)
    parser.walkTokens(page.tokens, (token) => {
      if (
        token.type !== "code" ||
        !/^(tsx?|jsx?|json)(?:\s|$)/.test(token.lang || "")
      )
        return;
      const scanner = ts.createScanner(
        ts.ScriptTarget.Latest,
        false,
        ts.LanguageVariant.JSX,
        token.text
      );
      const lines = [[]];
      for (
        let current = scanner.scan();
        current !== ts.SyntaxKind.EndOfFileToken;
        current = scanner.scan()
      ) {
        const value = scanner.getTokenText();
        const kind =
          current === ts.SyntaxKind.SingleLineCommentTrivia ||
          current === ts.SyntaxKind.MultiLineCommentTrivia
            ? "comment"
            : current === ts.SyntaxKind.StringLiteral ||
              [
                ts.SyntaxKind.NoSubstitutionTemplateLiteral,
                ts.SyntaxKind.TemplateHead,
                ts.SyntaxKind.TemplateMiddle,
                ts.SyntaxKind.TemplateTail,
              ].includes(current)
            ? "string"
            : current === ts.SyntaxKind.NumericLiteral ||
              current === ts.SyntaxKind.BigIntLiteral
            ? "number"
            : current >= ts.SyntaxKind.FirstKeyword &&
              current <= ts.SyntaxKind.LastKeyword
            ? "keyword"
            : current === ts.SyntaxKind.Identifier && /^[A-Z]/.test(value)
            ? "type"
            : "plain";
        value.split("\n").forEach((text, index) => {
          if (index) lines.push([]);
          if (text) lines[lines.length - 1].push({ text, kind });
        });
      }
      token.syntax = lines;
    });
  const references = {};
  const sourceTypes = new Map();
  const sourceImports = new Map();
  for (const page of pages) {
    if (!page.source.startsWith("src/")) continue;
    for (const extension of [".ts", ".tsx"]) {
      let source;
      try {
        source = await readFile(
          path.join(root, page.source.replace(/\.md$/, extension)),
          "utf8"
        );
      } catch {
        continue;
      }
      const ast = ts.createSourceFile(
        page.source,
        source,
        ts.ScriptTarget.Latest,
        true
      );
      page.references ||= {};
      sourceTypes.set(page.source.replace(/\.md$/, extension), page.references);
      sourceImports.set(page, ast.statements.filter(ts.isImportDeclaration));
      for (const node of ast.statements) {
        const names =
          ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)
            ? node.name
              ? [node.name.text]
              : []
            : ts.isVariableStatement(node) &&
              node.modifiers?.some(
                (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword
              )
            ? node.declarationList.declarations
                .filter((declaration) => ts.isIdentifier(declaration.name))
                .map((declaration) => declaration.name.text)
            : [];
        for (const name of names) {
          const reference = { href: page.route, kind: "code" };
          page.references[name] = reference;
          references[name] ||= reference;
          if (
            node.modifiers?.some(
              (modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword
            )
          )
            page.references.default = reference;
        }
      }

      for (const node of ast.statements)
        if (
          ts.isTypeAliasDeclaration(node) ||
          ts.isInterfaceDeclaration(node) ||
          ts.isEnumDeclaration(node)
        ) {
          const name = node.name.text;
          const id = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
          const reference = { href: page.route + "#type-" + id, kind: "type" };
          page.references[name] = reference;
          if (!references[name] || page.source.startsWith("src/engine/"))
            references[name] = reference;
        }
    }
  }
  for (const [page, imports] of sourceImports)
    for (const node of imports) {
      const module = node.moduleSpecifier.text;
      if (!module.startsWith(".")) continue;
      const stem = path.posix.normalize(
        path.posix.join(path.posix.dirname(page.source), module)
      );
      const target = [
        stem + ".ts",
        stem + ".tsx",
        stem + "/index.ts",
        stem + "/index.tsx",
      ]
        .map((file) => sourceTypes.get(file))
        .find(Boolean);
      if (node.importClause?.name && target?.default)
        page.references[node.importClause.name.text] = target.default;
      const bindings = node.importClause?.namedBindings;
      if (bindings && ts.isNamedImports(bindings))
        for (const entry of bindings.elements) {
          const reference =
            target?.[entry.propertyName?.text || entry.name.text] ||
            references[entry.propertyName?.text || entry.name.text];
          if (reference) page.references[entry.name.text] = reference;
        }
    }
  for (const page of pages) delete page.references?.default;
  for (const page of pages)
    parser.walkTokens(page.tokens, (token) => {
      if (
        token.type === "heading" &&
        token.depth > 1 &&
        page.references?.[token.text]?.href.startsWith(page.route + "#")
      )
        token.anchor =
          "type-" + token.text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    });
  const anchors = new Map(
    pages.map((page) => {
      const ids = new Set();
      parser.walkTokens(page.tokens, (token) => {
        if (token.type === "heading")
          ids.add(
            token.anchor ||
              token.text
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "")
          );
      });
      return [page.route, ids];
    })
  );
  for (const reference of [
    ...Object.values(references),
    ...pages.flatMap((page) => Object.values(page.references || {})),
  ]) {
    const [route, id] = reference.href.split("#");
    if (id ? !anchors.get(route)?.has(id) : !anchors.has(route))
      throw Error("Unknown type reference: " + reference.href);
  }
  const title = (
    await readFile(path.join(root, "src/game/levels/menu/areas.ts"), "utf8")
  )
    .split("\n")
    .filter((line) => /[▓▀▄]/.test(line))
    .map((line) => line.slice(1, -1));
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
  await writeFile(
    path.join(out, "manifest.json"),
    JSON.stringify({ version, pages, title, references })
  );
  const options = {
    absWorkingDir: root,
    bundle: true,
    format: "iife",
    target: "es2021",
    tsconfigRaw: { compilerOptions: { alwaysStrict: false, jsx: "react-jsx" } },
    minify: true,
    define: {
      "process.env.NODE_ENV": '"production"',
      "process.env.PUBLIC_URL": '"assets"',
    },
    loader: { ".woff": "file", ".woff2": "file" },
    assetNames: "[name]-[hash]",
  };
  await build({
    ...options,
    entryPoints: {
      app: "src/documentation/App.tsx",
      preview: "src/documentation/preview.tsx",
    },
    outdir: path.join(out, "assets"),
    plugins: [
      {
        name: "docs-manifest",
        setup(build) {
          build.onResolve({ filter: /^docs-manifest$/ }, () => ({
            path: path.join(out, "manifest.json"),
          }));
        },
      },
    ],
  });
  for (const page of pages)
    for (const route of [page.route, ...page.aliases]) {
      const rel = (target) =>
        path.posix.relative(path.posix.dirname(route), target) || "./";
      await mkdir(path.dirname(path.join(out, route)), { recursive: true });
      await writeFile(
        path.join(out, route),
        `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="docs-root" content="${rel(
          "index.html"
        )}"><title>${escape(
          page.title
        )} | Alive ${version} Documentation</title><link rel="icon" href="data:,"><link rel="stylesheet" href="${rel(
          "assets/app.css"
        )}"><link rel="stylesheet" href="${rel(
          "assets/style.css"
        )}"><script defer src="${rel(
          "assets/app.js"
        )}"></script></head><body class="App Docs"><div id="docs-root"></div></body></html>`
      );
    }
  await writeFile(
    path.join(out, "preview.html"),
    '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><link rel="stylesheet" href="assets/preview.css"><style>html,body,#root{margin:0;height:100%;overflow:hidden}body{background:#000}.InterfaceLabels{position:absolute;inset:0;pointer-events:none;z-index:3}.preview .Paused{display:none}.preview-movement .Stats,.preview-water .Stats,.preview-pushing .Stats{visibility:hidden}.preview-movement .Controls>.Row,.preview-water .Controls>.Row,.preview-pushing .Controls>.Row{visibility:hidden}.preview .LeftEdge,.preview .RightEdge{display:none}.DemoFrame{position:absolute;inset:0;pointer-events:none;z-index:2;overflow:hidden}.DemoFrame .Row{justify-content:center}.DemoActions{position:absolute;top:calc(var(--cell-height) * 2);right:var(--pixel-size);display:flex;z-index:4}.preview:not(.preview-interface) .Controls{top:var(--bottom-offset)}.preview:not(.preview-interface) .Controls>.Row:nth-of-type(3){justify-content:flex-start;padding-left:calc((100% - 21 * var(--cell-width)) / 2)}.DemoActions button{background:none;border:0;padding:0;color:inherit;font:inherit;cursor:pointer}.DemoActions .Row{width:max-content}.preview .Menu{pointer-events:none}.preview:not(.preview-interface) .Stats>.Row:nth-last-child(2){visibility:hidden}.preview:not(.preview-interface) .Stats>.Row:last-of-type,.preview .Controls>.Row:nth-of-type(2){visibility:hidden}.preview-interface{pointer-events:none}.preview-combat .Stats>.Row:nth-of-type(2),.preview-food .Stats>.Row:nth-of-type(2),.preview-skills .Stats>.Row:nth-of-type(2){visibility:hidden}.preview-classes .Stats{visibility:hidden}.preview-harvesting .Stats,.preview-fishing .Stats,.preview-farming .Stats,.preview-crafting .Stats,.preview-brewing .Stats,.preview-forging .Stats,.preview-building .Stats,.preview-trading .Stats,.preview-gear .Stats,.preview-chat .Stats{visibility:hidden}.preview-movement .Skill,.preview-movement .Spell,.preview-water .Skill,.preview-water .Spell,.preview-pushing .Skill,.preview-pushing .Spell{pointer-events:none}</style><script defer src="assets/preview.js"></script></head><body><div id="root"></div></body></html>'
  );
  console.log(
    `Built ${pages.length} Markdown routes in ${path.relative(root, out)}`
  );
}
if (process.argv[1] === fileURLToPath(import.meta.url))
  await buildDocs(process.argv[2]);
