#!/usr/bin/env node
// Requires ImageMagick 7 (`magick` on PATH).
const { execFileSync } = require("node:child_process");
const { mkdtempSync, readFileSync, writeFileSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const path = require("node:path");
const { version } = require("../package.json");
const font = require("../public/fonts/MostPerfectDOSVGA.json");

const root = path.resolve(__dirname, "..");
const source = (file) => readFileSync(path.join(root, file), "utf8");
// Read the menu artwork itself so future title changes are reflected here.
const rows = source("src/game/levels/menu/areas.ts")
  .split("\n")
  .filter((line) => /[▓▀▄]/.test(line))
  .map((line) => line.slice(1, -1));
if (rows.length !== 3 || rows.some((row) => row.length !== 17)) {
  throw new Error("Expected three 17-column title rows in menu/areas.ts");
}
const sizing = source("src/components/Dimensions/sizing.tsx");
const aspectMatch = sizing.match(/export const aspectRatio = (\d+) \/ (\d+)/);
const aspect = Number(aspectMatch[1]) / Number(aspectMatch[2]);
const textMatch = source("src/components/Entity/utils.ts").match(
  /export const textSize = (\d+) \/ (\d+) \+ ([\d.]+)/
);
const textSize =
  Number(textMatch[1]) / Number(textMatch[2]) + Number(textMatch[3]);
const colors = source("src/game/assets/colors.ts");
const color = (name) =>
  colors.match(new RegExp(`const ${name} = "(#[a-f0-9]+)"`))[1];
const [major = 0, minor = 0, patch = 0] = version
  .split(".")
  .map((part) => parseInt(part, 10) || 0);
const label = `V${major}x${String(minor).padStart(2, "0")}${
  patch ? `.${patch}` : ""
}`;
if (label.length > 17) throw new Error("Version exceeds the menu's 17 columns");

try {
  execFileSync("magick", ["-version"], { stdio: "ignore" });
} catch {
  console.error("ImageMagick 7 is required; ensure `magick` is on PATH.");
  process.exit(1);
}

const temporary = mkdtempSync(path.join(tmpdir(), "alive-titles-"));
try {
  for (const size of [1024, 2048]) {
    const cellHeight = (size * 3) / 32;
    const cellWidth = cellHeight * aspect;
    const left = (size - 17 * cellWidth) / 2;
    const top = (size - 4 * cellHeight) / 2;
    const scale = (cellHeight * textSize) / font.resolution;
    const paths = [];
    function glyph(char, column, row, fill) {
      const outline = font.glyphs[char].o.trim().split(/\s+/);
      const x = left + column * cellWidth;
      // Same glyph origin as Entity/Layer.tsx: [-aspectRatio / 2, -0.25].
      const baseline = top + (row + 0.75) * cellHeight;
      let d = "";
      for (let i = 0; i < outline.length; i += 3) {
        const command = outline[i];
        if (command !== "m" && command !== "l") {
          throw new Error(`Unsupported outline command: ${command}`);
        }
        if (command === "m" && d) d += " Z ";
        d += `${command.toUpperCase()} ${x + Number(outline[i + 1]) * scale} ${
          baseline - Number(outline[i + 2]) * scale
        } `;
      }
      paths.push(`<path fill="${fill}" fill-rule="evenodd" d="${d} Z"/>`);
    }
    rows.forEach((row, y) =>
      [...row].forEach((char, x) => {
        if (char === "▓" || char === "▀") glyph("▀", x, y, color("maroon"));
        if (char === "▓" || char === "▄") glyph("▄", x, y, color("maroon"));
      })
    );
    [...label.padStart(17)].forEach((char, x) => {
      if (char !== " ") glyph(char, x, 3, color("grey"));
    });
    const svg = path.join(temporary, `${size}.svg`);
    writeFileSync(
      svg,
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${paths.join(
        ""
      )}</svg>`
    );
    const target = path.join(root, "media", `title-${size}x${size}.png`);
    execFileSync("magick", [
      "-background",
      "none",
      `MSVG:${svg}`,
      "-depth",
      "8",
      `PNG32:${target}`,
    ]);
    console.log(
      `Generated ${path.relative(root, target)} (${label}, transparent)`
    );
  }
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
