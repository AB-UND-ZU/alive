const { test, expect } = require("@playwright/test");
const { build } = require("esbuild");

let fixture;
test.beforeAll(async () => {
  const result = await build({
    stdin: {
      resolveDir: process.cwd(),
      loader: "tsx",
      contents: `
        import { createRoot } from "react-dom/client";
        import Dimensions from "./src/components/Dimensions";
        import Row from "./src/components/Row";
        import { createText } from "./src/game/assets/ui";
        import "./src/components/App/index.css";
        const white = "#ffffff";
        const stacked = { name: "solid_stack", layers: [
          { char: "█", color: white },
          { char: "A", color: white },
          { char: "B", color: white },
        ] };
        createRoot(document.getElementById("root")).render(
          <Dimensions className="App">
            {["text", "backgrounds", "sprites"].map((kind, group) =>
              <div className="RasterStrip" key={kind} style={{
                position: "absolute", left: 12,
                top: "calc(64px + var(--cell-height) * " + group * 4 + ")",
                width: "calc(var(--cell-width) * 17)",
              }}>
                {Array.from({ length: 3 }, (_, row) =>
                  <Row key={row} cells={kind === "sprites"
                    ? Array(17).fill(stacked)
                    : kind === "backgrounds"
                    ? Array.from({ length: 17 }, (_, column) =>
                        createText("█", white, column % 2 ? "#000000" : "#000080")[0])
                    : createText("█".repeat(17), white)} />)}
              </div>)}
          </Dimensions>
        );
      `,
    },
    bundle: true,
    write: false,
    outdir: "out",
    jsx: "automatic",
    loader: { ".woff": "dataurl", ".woff2": "dataurl" },
    define: {
      "process.env.NODE_ENV": '"production"',
      "process.env.PUBLIC_URL": '""',
    },
    logLevel: "silent",
  });
  fixture = {
    js: result.outputFiles.find((file) => file.path.endsWith(".js")).text,
    css: result.outputFiles.find((file) => file.path.endsWith(".css")).text,
  };
});

async function expectSolid(page, clip, color) {
  const actual = await page.screenshot({ clip });
  await page.evaluate(
    ({ clip, color }) => {
      const reference = document.createElement("div");
      reference.id = "raster-reference";
      Object.assign(reference.style, {
        position: "fixed",
        left: `${clip.x}px`,
        top: `${clip.y}px`,
        width: `${clip.width}px`,
        height: `${clip.height}px`,
        background: color,
        zIndex: "2147483647",
      });
      document.body.append(reference);
    },
    { clip, color }
  );
  const expected = await page.screenshot({ clip });
  await page
    .locator("#raster-reference")
    .evaluate((element) => element.remove());
  expect(actual.equals(expected)).toBe(true);
}

test("whole font pixels keep adjacent text and stacked sprites continuous", async ({
  browser,
  baseURL,
}) => {
  for (const [width, height, deviceScaleFactor] of [
    [1214, 774, 2],
    [390, 670, 3],
    [1440, 1000, 1],
  ]) {
    const context = await browser.newContext({
      baseURL,
      viewport: { width, height },
      deviceScaleFactor,
    });
    try {
      const page = await context.newPage();
      await page.route("**/rendering-test.html", (route) =>
        route.fulfill({
          contentType: "text/html",
          body: '<!doctype html><div id="root"></div>',
        })
      );
      await page.goto("/rendering-test.html");
      await page.addStyleTag({ content: fixture.css });
      await page.addScriptTag({ content: fixture.js });
      await expect(page.locator(".RasterStrip")).toHaveCount(3);
      await page.evaluate(() => document.fonts.ready);
      const scale = await page.evaluate(() =>
        Number.parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--pixel-size"
          )
        )
      );
      expect(Number.isInteger(scale)).toBe(true);
      for (const strip of await page.locator(".RasterStrip").all()) {
        const bounds = await strip.boundingBox();
        await expectSolid(
          page,
          {
            x: Math.ceil(bounds.x + 1),
            y: Math.ceil(bounds.y + 1),
            width: Math.floor(bounds.width - 2),
            height: Math.floor(bounds.height - 2),
          },
          "#ffffff"
        );
      }
    } finally {
      await context.close();
    }
  }
});

test("the bottom terminal edge stays inside the centered game frame", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1214, height: 774 });
  await page.goto("/preview.html?test#game");
  await expect(page.locator(".ControlsEdge")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const terminal = await page.locator(".Terminal").boundingBox();
  const edge = await page.locator(".ControlsEdge").boundingBox();
  await expectSolid(
    page,
    {
      x: 20,
      y: Math.ceil(edge.y + 1),
      width: Math.floor(terminal.x - 40),
      height: Math.floor(edge.height - 2),
    },
    "#000000"
  );
  await expectSolid(
    page,
    {
      x: Math.ceil(terminal.x + terminal.width + 20),
      y: Math.ceil(edge.y + 1),
      width: Math.floor(1214 - terminal.x - terminal.width - 40),
      height: Math.floor(edge.height - 2),
    },
    "#000000"
  );
});
