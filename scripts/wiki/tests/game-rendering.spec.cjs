const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.addEventListener("message", ({ data }) => {
      if (data?.type === "preview-ready") window.previewReady = true;
    });
    window.EventSource = class {
      close() {}
    };
  });
});

async function expectSolid(page, clip, color, label) {
  const screenshot = await page.screenshot({ clip });
  const differences = await page.evaluate(
    async ({ base64, color }) => {
      const image = new Image();
      image.src = "data:image/png;base64," + base64;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0);
      const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
      const rgb = [1, 3, 5].map((start) =>
        parseInt(color.slice(start, start + 2), 16)
      );
      let differences = 0;
      for (let i = 0; i < data.length; i += 4)
        for (let channel = 0; channel < 3; channel++)
          if (data[i + channel] !== rgb[channel]) differences++;
      return differences;
    },
    { base64: screenshot.toString("base64"), color }
  );
  expect(differences, label).toBe(0);
}

test("the bottom terminal edge stays inside the centered game frame", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1214, height: 774 });
  await page.goto("/preview.html?test#game");
  await expect(page.locator(".ControlsEdge")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const terminal = await page.locator(".Terminal").boundingBox();
  const edge = await page.locator(".ControlsEdge").boundingBox();
  const lineWidth = await page
    .locator(".ControlsEdge")
    .evaluate((row) =>
      Array.from(row.children).reduce(
        (width, cell) => width + cell.getBoundingClientRect().width,
        0
      )
    );
  expect(lineWidth).toBeGreaterThanOrEqual(edge.width);
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

test("layered cells have no internal seams at fractional scale", async ({ page }) => {
  const { build } = require("esbuild");
  const result = await build({
    stdin: { resolveDir: process.cwd(), loader: "tsx", contents: `
      import { createRoot } from "react-dom/client";
      import Row from "./src/components/Row";
      import "./src/index.css";
      const sprite = {name:"solid", layers:[{char:"▀",color:"#ffffff"},{char:"▄",color:"#ffffff"}]};
      createRoot(document.getElementById("root")).render(<Row cells={[sprite]} />);
    ` },
    bundle: true, write: false, outdir: "out", jsx: "automatic",
    loader: { ".woff": "dataurl", ".woff2": "dataurl" },
    define: { "process.env.NODE_ENV": '"production"', "process.env.PUBLIC_URL": '""' },
    logLevel: "silent",
  });
  await page.route("**/rendering.html", route => route.fulfill({
    contentType: "text/html", body: '<!doctype html><div id="root"></div>',
  }));
  await page.goto("/rendering.html");
  await page.addStyleTag({content: result.outputFiles.find(file => file.path.endsWith(".css")).text});
  await page.addStyleTag({content: ':root{--cell-height:33px;--cell-width:18.5625px;--pixel-size:2.0625px} body{margin:0;background:black;min-height:2000px} #root{position:absolute;left:12.234px;top:300.671px;width:40px}'});
  await page.addScriptTag({content: result.outputFiles.find(file => file.path.endsWith(".js")).text});
  await expect(page.locator(".Cell > svg")).toHaveCount(1);
  await expect(page.locator(".Cell .Layer")).toHaveCount(0);
  for (const width of [40, 12]) for (const zoom of [0.67, 1, 1.25, 1.75, 2.5]) {
    await page.evaluate(({zoom, width}) => {
      document.getElementById("root").style.width = width + "px";
      document.body.style.zoom = String(zoom); window.scrollTo(0,127);
    }, {zoom, width});
    const box = await page.locator(".Cell").boundingBox();
    await expectSolid(page, {x:box.x+2,y:box.y+2,width:box.width-4,height:box.height-4}, "#ffffff");
  }
});

const featureScenes = require("../../../src/wiki/scenes.json").filter(
  (scene) => !["game", "interface"].includes(scene)
);

for (const scene of featureScenes) {
  for (const width of [414, 360]) {
    test(`${scene} preview keeps chat above the frame and clear of Reset at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 608 });
      await page.goto(`/preview.html?test#${scene}`);
      await expect(page.locator("canvas")).toBeVisible();
      await page.waitForFunction(() => window.previewReady);
      await page.evaluate(() => {
        window.postMessage({ type: "play" }, location.origin);
        window.dispatchEvent(new Event("focus"));
      });
      await expect(page.locator(".Paused")).toHaveCount(0);
      await expect(
        page.locator("footer > .Row").last().locator(".Cell")
      ).not.toHaveCount(0);
      await page.locator("canvas").click({ position: { x: 4, y: 4 } });
      if (scene !== "chat") {
        const content = page.locator("#content");
        if (!(await content.isVisible())) {
          await page.keyboard.press("q");
          await expect(content).toBeVisible();
        }
        await page.keyboard.press("c");
      }
      const keyboard = page.locator("#keyboard");
      await expect(keyboard).toBeVisible();
      const keys = await keyboard.boundingBox();
      const reset = await page
        .getByRole("button", { name: "Reset", exact: true })
        .boundingBox();
      expect(keys.x).toBeGreaterThanOrEqual(0);
      expect(keys.x + keys.width).toBeLessThanOrEqual(width);
      expect(reset.y).toBeGreaterThanOrEqual(keys.y + keys.height - 1);
      expect(reset.y + reset.height).toBeLessThanOrEqual(609);
      const corner = await page
        .locator(".DemoFrame > .Row")
        .last()
        .locator(".Cell")
        .first()
        .boundingBox();
      await expectSolid(
        page,
        {
          x: Math.ceil(corner.x + corner.width * 0.4),
          y: Math.ceil(corner.y + corner.height * 0.2),
          width: 2,
          height: 2,
        },
        "#000000",
        "The keyboard hides the frame's lower corner"
      );
      const target = await page.evaluate(
        ({ x, y }) => document.elementFromPoint(x, y)?.id,
        { x: keys.x + keys.width / 2, y: keys.y + keys.height / 2 }
      );
      expect(target).toBe("keyboard");
      await page.keyboard.press("Escape");
      await expect(keyboard).toHaveCount(0);
    });
  }
}
