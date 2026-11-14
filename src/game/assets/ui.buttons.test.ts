import fs from "fs";
import path from "path";
import ts from "typescript";

it("keeps in-game dialog and interaction button labels within five characters", () => {
  const violations: string[] = [];
  const labels = (node: ts.Node): string[] => {
    if (ts.isStringLiteral(node)) return [node.text];
    if (ts.isConditionalExpression(node))
      return [...labels(node.whenTrue), ...labels(node.whenFalse)];
    if (ts.isParenthesizedExpression(node)) return labels(node.expression);
    return [];
  };
  const inspect = (directory: string) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) inspect(file);
      else if (
        /\.(ts|tsx)$/.test(file) &&
        !file.includes(".test.") &&
        file !== path.join("src", "components", "Paused", "index.tsx")
      ) {
        const ast = ts.createSourceFile(
          file,
          fs.readFileSync(file, "utf8"),
          ts.ScriptTarget.Latest,
          true
        );
        const visit = (node: ts.Node) => {
          if (
            ts.isCallExpression(node) &&
            node.expression.getText(ast) === "createButton" &&
            node.arguments[0]
          )
            for (const text of labels(node.arguments[0]))
              if ([...text].length > 5) violations.push(`${file}: ${text}`);
          ts.forEachChild(node, visit);
        };
        visit(ast);
      }
    }
  };
  for (const directory of ["src/game", "src/bindings", "src/components"])
    inspect(directory);
  expect(violations).toEqual([]);
});
