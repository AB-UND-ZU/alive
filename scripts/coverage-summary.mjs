import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Print jest's json-summary as Markdown, e.g. for $GITHUB_STEP_SUMMARY
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const summary = JSON.parse(
  await readFile(path.join(root, "coverage/coverage-summary.json"), "utf8")
);
const metrics = ["statements", "branches", "functions", "lines"];

const percent = ({ covered, total }) =>
  total === 0 ? "-" : `${((covered / total) * 100).toFixed(1)}%`;
const row = (name, data) =>
  `| ${name} | ${metrics.map((metric) => percent(data[metric])).join(" | ")} |`;

const folders = {};
for (const [file, data] of Object.entries(summary)) {
  if (file === "total") continue;
  const folder = path.relative(root, path.dirname(file));
  folders[folder] ??= Object.fromEntries(
    metrics.map((metric) => [metric, { covered: 0, total: 0 }])
  );
  for (const metric of metrics) {
    folders[folder][metric].covered += data[metric].covered;
    folders[folder][metric].total += data[metric].total;
  }
}

console.log(
  [
    "## Test coverage",
    "",
    "| Folder | Statements | Branches | Functions | Lines |",
    "| --- | --: | --: | --: | --: |",
    row("**Total**", summary.total),
    ...Object.keys(folders)
      .sort()
      .map((folder) => row(folder, folders[folder])),
  ].join("\n")
);
