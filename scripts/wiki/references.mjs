import ts from "typescript";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const pages = JSON.parse(await readFile("src/wiki/pages.json", "utf8"));
if (pages.length) {
  const sources = new Map();
  for (const page of pages) {
    if (!page.source.startsWith("src/")) continue;
    for (const extension of [".ts", ".tsx"]) {
      const file = page.source.replace(/\.md$/, extension);
      try {
        const source = await readFile(file, "utf8");
        sources.set(
          file,
          ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true)
        );
        break;
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
    }
  }
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
    JSON.stringify({ references, pages: scopes }) + "\n"
  );
}
