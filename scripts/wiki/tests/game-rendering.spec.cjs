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
        import "./src/index.css";
        import "./src/components/App/index.css";
        const white = "#ffffff";
        const sprite = { name: "layered_sample", layers: [
          { char: "▀", color: white }, { char: "▄", color: white }
        ] };
        const position = { position: "absolute", left: 12.234375, top: 64.671875,
          width: "calc(var(--cell-width) * 17)", display: "none" };
        createRoot(document.getElementById("root")).render(
          <Dimensions className="App">
            <Row className="Sentence" cells={createText("Open the Bag.")} />
            {["text", "backgrounds", "sprites", "mixed", "halves"].map(kind =>
              <div className="RasterStrip" data-kind={kind} key={kind} style={position}>
                {Array.from({length: 3}, (_, row) => <Row key={row} cells={
                  kind === "sprites" ? Array(17).fill(sprite) :
                  kind === "mixed" ? Array.from({length:17}, (_, column) => column % 2
                    ? sprite : createText(" ", white, white)[0]) :
                  kind === "backgrounds" ? Array.from({length:17}, (_, column) =>
                    createText("█", white, column % 2 ? "#000000" : "#000080")[0]) :
                  createText((kind === "halves" ? ["▄", "█", "▀"][row] : "█").repeat(17), white)
                } />)}
              </div>)}
            <div className="CornerStrip" style={{...position, width:"calc(var(--cell-width) * 6)"}}>
              {["████  ", "  ██  ", "████  ", "  ██  "].map((line,row) =>
                <Row key={row} cells={createText(line, white, "#000080")} />)}
            </div>
            <div className="TitleSample" style={position}>
              {["▄▀▀ █   █ ▄▀▀ █ █", "█   █   █ █   █▄▀", "▀▄▄ ▀▄▄ █ ▀▄▄ █ █"].map((line,row) =>
                <Row key={row} cells={createText(line, white)} />)}
            </div>
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

async function expectStraightEdge(page, clip, label) {
  const screenshot = await page.screenshot({ clip });
  const differences = await page.evaluate(async (base64) => {
    const image = new Image();
    image.src = "data:image/png;base64," + base64;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0);
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    const stride = canvas.width * 4;
    const reference = Math.floor(canvas.height / 8) * stride;
    let differences = 0;
    // Fractional screenshot clips can change edge alpha without changing colors.
    for (let y = 0; y < canvas.height; y++)
      for (let x = 0; x < stride; x++)
        if (
          x % 4 !== 3 &&
          Math.abs(data[y * stride + x] - data[reference + x]) > 1
        )
          differences++;
    return differences;
  }, screenshot.toString("base64"));
  expect(differences, label).toBe(0);
}

test("terminal text and resolved sprites stay joined at fractional zoom", async ({
  browser,
  baseURL,
}) => {
  test.setTimeout(60000);
  const profiles = [
    [1214, 774, 2],
    [390, 670, 3],
    [393, 650, 3],
    [430, 932, 3],
    [1440, 1000, 1],
    ...[0.8, 1.1, 1.25, 1.5, 1.75, 2.5].map((density) => [1214, 774, density]),
    [390, 670, 1.25],
    ...[0.5, 0.67, 0.8, 1.25, 1.5, 2, 2.5].map((zoom) => [
      Math.round(1214 / zoom),
      Math.round(774 / zoom),
      2 * zoom,
    ]),
  ];
  for (const [width, height, deviceScaleFactor] of profiles) {
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
      await expect(page.locator(".RasterStrip")).toHaveCount(5);
      await page.evaluate(() => document.fonts.ready);
      const heightPx = Math.floor(Math.min(width / 21 / (9 / 16), height / 20));
      await expect(page.locator(".Sentence .Cell")).toHaveCSS(
        "font-size",
        heightPx + "px"
      );
      expect(
        await page.locator(".Sentence").evaluate((element) => {
          const range = document.createRange();
          range.selectNodeContents(element);
          const selection = getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
          const text = selection.toString();
          selection.removeAllRanges();
          return text;
        })
      ).toBe("Open the Bag.");
      for (const strip of await page.locator(".RasterStrip").all()) {
        await page
          .locator(".RasterStrip")
          .evaluateAll((elements) =>
            elements.forEach((e) => (e.style.display = "none"))
          );
        await strip.evaluate((element) => (element.style.display = "block"));
        const bounds = await strip.boundingBox();
        const halves = (await strip.getAttribute("data-kind")) === "halves";
        const top = halves ? bounds.y + heightPx / 2 + 2 : bounds.y + 1;
        const bottom = halves
          ? bounds.y + heightPx * 2.375 - 2
          : bounds.y + bounds.height - 1;
        await expectSolid(
          page,
          {
            x: Math.ceil(bounds.x + 1),
            y: Math.ceil(top),
            width: Math.floor(bounds.width - 2),
            height: Math.floor(bottom) - Math.ceil(top),
          },
          "#ffffff",
          `${width}x${height}@${deviceScaleFactor}: ${await strip.getAttribute(
            "data-kind"
          )}`
        );
      }
      await page
        .locator(".RasterStrip")
        .evaluateAll((elements) =>
          elements.forEach((e) => (e.style.display = "none"))
        );
      await page
        .locator(".CornerStrip")
        .evaluate((element) => (element.style.display = "block"));
      const bounds = await page.locator(".CornerStrip").boundingBox();
      await expectStraightEdge(
        page,
        {
          x: Math.floor(bounds.x + bounds.width / 2),
          y: Math.ceil(bounds.y + 1),
          width: Math.ceil(bounds.width / 6 + 5),
          height: Math.floor(bounds.height - 2),
        },
        `${width}x${height}@${deviceScaleFactor}: straight contour`
      );
      if (
        deviceScaleFactor === 2 ||
        (width === 390 && deviceScaleFactor === 3)
      ) {
        await page
          .locator(".CornerStrip")
          .evaluate((e) => (e.style.display = "none"));
        await page
          .locator(".TitleSample")
          .evaluate((e) => (e.style.display = "block"));
        await test.info().attach(`joined-text-${width}`, {
          body: await page.locator(".TitleSample").screenshot(),
          contentType: "image/png",
        });
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
