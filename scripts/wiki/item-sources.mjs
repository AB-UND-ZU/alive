import ts from "typescript";
import path from "node:path";
import { readFile, writeFile } from "node:fs/promises";

const itemKeys = new Set([
  "weapon",
  "offhand",
  "spell",
  "skill",
  "tool",
  "accessory",
  "consume",
  "stackable",
  "stat",
  "material",
  "element",
  "amount",
  "bound",
]);
const kindKeys = [
  "weapon",
  "offhand",
  "spell",
  "skill",
  "tool",
  "accessory",
  "consume",
  "stackable",
  "stat",
];
const key = (node) =>
  node && (ts.isIdentifier(node) || ts.isStringLiteral(node))
    ? node.text
    : undefined;
const literal = (node) =>
  ts.isStringLiteral(node) || ts.isNumericLiteral(node)
    ? ts.isNumericLiteral(node)
      ? Number(node.text)
      : node.text
    : node.kind === ts.SyntaxKind.TrueKeyword
    ? true
    : node.kind === ts.SyntaxKind.FalseKeyword
    ? false
    : undefined;

export function extractNpcItemSources(text) {
  const source = ts.createSourceFile(
    "npcs.ts",
    text,
    ts.ScriptTarget.Latest,
    true
  );
  const items = [];
  const unresolved = [];
  function item(node, npc, method) {
    if (!ts.isObjectLiteralExpression(node)) return;
    const value = {};
    for (const property of node.properties) {
      if (
        !ts.isPropertyAssignment(property) ||
        !itemKeys.has(key(property.name))
      )
        continue;
      const parsed = literal(property.initializer);
      if (parsed === undefined) {
        unresolved.push({
          npc,
          method,
          line: source.getLineAndCharacterOfPosition(property.pos).line + 1,
          expression: property.initializer.getText(source),
        });
        return;
      }
      value[key(property.name)] = parsed;
    }
    if (kindKeys.some((name) => value[name]))
      items.push({
        npc,
        method,
        item: value,
        source: "src/game/assets/npcs.ts",
        line: source.getLineAndCharacterOfPosition(node.pos).line + 1,
      });
  }
  function walk(node, npc) {
    if (
      ts.isVariableDeclaration(node) &&
      key(node.name)?.endsWith("Npc") &&
      node.initializer &&
      ts.isArrowFunction(node.initializer)
    )
      npc = key(node.name).slice(0, -3);
    if (
      npc &&
      ts.isPropertyAssignment(node) &&
      ts.isArrayLiteralExpression(node.initializer)
    ) {
      if (key(node.name) === "choices")
        for (const entry of node.initializer.elements)
          item(entry, npc, "quest");
      if (key(node.name) === "deals")
        for (const entry of node.initializer.elements) {
          if (!ts.isObjectLiteralExpression(entry)) continue;
          const reward = entry.properties.find(
            (property) =>
              ts.isPropertyAssignment(property) && key(property.name) === "item"
          );
          if (reward) item(reward.initializer, npc, "quest");
        }
    }
    ts.forEachChild(node, (child) => walk(child, npc));
  }
  walk(source);
  return { items, unresolved };
}

export function extractPatternItemSources(text) {
  const source = ts.createSourceFile(
    "ai.ts",
    text,
    ts.ScriptTarget.Latest,
    true
  );
  const items = [];
  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      key(node.name)?.endsWith("Data") &&
      node.initializer
    ) {
      const expression = ts.isAsExpression(node.initializer)
        ? node.initializer.expression
        : node.initializer;
      if (ts.isObjectLiteralExpression(expression)) {
        const item = Object.fromEntries(
          expression.properties
            .filter(ts.isPropertyAssignment)
            .map((property) => [
              key(property.name),
              literal(property.initializer),
            ])
            .filter(
              ([name, value]) => itemKeys.has(name) && value !== undefined
            )
        );
        if (kindKeys.some((name) => item[name])) {
          let parent = node.parent,
            pattern;
          while (parent && !pattern) {
            if (
              ts.isIfStatement(parent) &&
              ts.isBinaryExpression(parent.expression) &&
              parent.expression.left.getText(source) === "pattern.name" &&
              ts.isStringLiteral(parent.expression.right)
            )
              pattern = parent.expression.right.text;
            parent = parent.parent;
          }
          if (pattern)
            items.push({
              unit: pattern,
              item,
              source: "src/engine/systems/ai.ts",
              line: source.getLineAndCharacterOfPosition(node.pos).line + 1,
            });
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return items;
}

export async function generateItemSources(root) {
  const result = extractNpcItemSources(
    await readFile(path.join(root, "src/game/assets/npcs.ts"), "utf8")
  );
  result.natural = extractPatternItemSources(
    await readFile(path.join(root, "src/engine/systems/ai.ts"), "utf8")
  );
  const destination = path.join(root, "src/wiki/item-sources.json");
  const text = JSON.stringify(result, null, 2) + "\n";
  if ((await readFile(destination, "utf8").catch(() => "")) !== text)
    await writeFile(destination, text);
  return result;
}
