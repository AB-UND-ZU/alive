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
for (const file of await walk("src")) {
  const source = await readFile(file, "utf8"),
    ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
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
    previous = `# ${path.basename(file)}\n`;
  }
  const prefix = previous
    .split(marker)[0]
    .replace(
      /```(?:ts|tsx)[^\n]*\n(?:export\s+)?(?:type|interface|enum)\s+[\s\S]*?```\n*/g,
      ""
    )
    .trimEnd();
  const sections = declarations.map(
    (node) =>
      `## ${node.name.text}\n\n\`\`\`ts ${file}\n${node.getText(ast)}\n\`\`\``
  );
  await writeFile(
    target,
    prefix + marker + "\n" + sections.join("\n\n") + "\n"
  );
  count += declarations.length;
  for (const node of declarations)
    index.push(
      `| [${node.name.text}](${target.replace(
        /^src\//,
        ""
      )}#type-${node.name.text.toLowerCase()}) | \`${file}\` |`
    );
}
console.log(`Documented ${count} source types.`);

await writeFile(
  "src/types.md",
  "# Types\n\n| Type | Source |\n| --- | --- |\n" +
    index.sort().join("\n") +
    "\n"
);
