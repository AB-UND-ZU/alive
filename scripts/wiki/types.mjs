import ts from "typescript";
import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((e) =>
        e.isDirectory()
          ? walk(path.join(dir, e.name))
          : /\.(ts|tsx)$/.test(e.name) && !/(\.test|\.d)\./.test(e.name)
          ? [path.join(dir, e.name)]
          : []
      )
    )
  ).flat();
}
const marker = "\n<!-- source-types -->\n";
let count = 0;
const index = [];
const documents = [];
const sources = new Map();
for (const file of await walk("src")) {
  const source = await readFile(file, "utf8"),
    ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  sources.set(file, ast);
  const declarations = ast.statements.filter(
    (node) =>
      ts.isTypeAliasDeclaration(node) ||
      ts.isInterfaceDeclaration(node) ||
      ts.isEnumDeclaration(node)
  );
  if (!declarations.length) continue;
  const target = file.replace(/\.(ts|tsx)$/, ".md");
  let previous;
  try {
    previous = await readFile(target, "utf8");
  } catch {
    throw new Error(
      `Write ${target} with the module contract before generating its types.`
    );
  }
  const prefix = previous.split(marker)[0].trimEnd();
  const sections = declarations.map(
    (node) =>
      `## ${node.name.text}\n\n\`\`\`ts ${file}\n${node.getText(ast)}\n\`\`\``
  );
  documents.push({
    target,
    text: prefix + marker + "\n" + sections.join("\n\n") + "\n",
  });
  count += declarations.length;
  for (const node of declarations)
    index.push(
      `| [${node.name.text}](${target.replace(
        /^src\//,
        ""
      )}#type-${node.name.text.toLowerCase()}) | \`${file}\` |`
    );
}
for (const { target, text } of documents) await writeFile(target, text);
console.log(`Documented ${count} source types.`);

await writeFile(
  "src/types.md",
  "# Types\n\n| Type | Source |\n| --- | --- |\n" +
    index.sort().join("\n") +
    "\n"
);

// Source links are refreshed explicitly with the adjacent documentation.
const pages = await readFile("src/wiki/pages.json", "utf8")
  .then(JSON.parse)
  .catch((error) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
if (pages.length) {
  const references = {},
    scopes = {},
    files = new Map();
  for (const page of pages) {
    const file = [".ts", ".tsx"]
      .map((extension) => page.source.replace(/\.md$/, extension))
      .find((file) => sources.has(file));
    if (!file) continue;
    const ast = sources.get(file),
      scope = (scopes[page.source] = {});
    files.set(file, scope);
    references[file] = { href: page.route, kind: "code" };
    for (const node of ast.statements) {
      const type =
        ts.isTypeAliasDeclaration(node) ||
        ts.isInterfaceDeclaration(node) ||
        ts.isEnumDeclaration(node);
      const names =
        type || ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)
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
        const reference = {
          href:
            page.route +
            (type
              ? "#type-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
              : ""),
          kind: type ? "type" : "code",
        };
        scope[name] = reference;
        if (
          !references[name] ||
          (type && page.source.startsWith("src/engine/"))
        )
          references[name] = reference;
        if (
          node.modifiers?.some(
            (modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword
          )
        )
          scope.default = reference;
      }
    }
  }
  for (const page of pages) {
    const file = [".ts", ".tsx"]
      .map((extension) => page.source.replace(/\.md$/, extension))
      .find((file) => sources.has(file));
    if (!file) continue;
    for (const node of sources
      .get(file)
      .statements.filter(ts.isImportDeclaration)) {
      if (!node.moduleSpecifier.text.startsWith(".")) continue;
      const stem = path.posix.normalize(
        path.posix.join(path.posix.dirname(file), node.moduleSpecifier.text)
      );
      const target = [
        stem + ".ts",
        stem + ".tsx",
        stem + "/index.ts",
        stem + "/index.tsx",
      ]
        .map((file) => files.get(file))
        .find(Boolean);
      if (node.importClause?.name && target?.default)
        scopes[page.source][node.importClause.name.text] = target.default;
      const bindings = node.importClause?.namedBindings;
      if (bindings && ts.isNamedImports(bindings))
        for (const entry of bindings.elements) {
          const reference =
            target?.[entry.propertyName?.text || entry.name.text];
          if (reference) scopes[page.source][entry.name.text] = reference;
        }
    }
  }
  for (const scope of Object.values(scopes)) delete scope.default;
  await writeFile(
    "src/wiki/sourceReferences.json",
    JSON.stringify({ references, pages: scopes }, null, 2) + "\n"
  );
}
