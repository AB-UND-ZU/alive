const { test, expect } = require("@playwright/test");
const { build } = require("esbuild");

test("lit sprite colors survive stacking, distance and overlapping lights, and still receive cast shadows", async ({
  page,
}) => {
  const bundle = await build({
    stdin: {
      resolveDir: process.cwd(),
      loader: "tsx",
      contents: `
      import { createRoot } from "react-dom/client";
      import { Canvas } from "@react-three/fiber";
      import { SpringValue } from "@react-spring/three";
      import { orderedColors } from "./src/game/assets/colors";
      import { shadowFactor } from "./src/renderers/interface/segments";
      import CoveredLight from "./src/renderers/three-js/Entity/CoveredLight";
      import Layer from "./src/renderers/three-js/Entity/Layer";
      import Box from "./src/renderers/three-js/Entity/Box";
      import { InstanceRoot } from "./src/renderers/three-js/Entity/Instances";

      const root = createRoot(document.getElementById("root"));
      const opacity = new SpringValue(1);
      window.palette = orderedColors;
      window.draw = (shadow, overlap = true) => root.render(
        <Canvas flat shadows="basic" orthographic dpr={1}
          camera={{ position: [0, 0, 12], zoom: 32 }}
          gl={{ preserveDrawingBuffer: true }}
          onCreated={({ gl }) => { window.paletteContext = gl.getContext(); }}>
          <ambientLight intensity={Math.PI * shadowFactor} />
          <CoveredLight brightness={6} />
          {overlap && <group position-x={0.5}><CoveredLight brightness={6} /></group>}
          <InstanceRoot />
          {[0, 0.5, 1, 1.5].map((z, row) => orderedColors.map((color, column) =>
            <group key={row * 16 + column} position={[(column - 7.5) * 9 / 16, 1.5 - row, 0]}>
              <Layer layer={{ char: "█", color }} offsetZ={z}
                props={{ receiveShadow: true, opacity: row % 2 ? opacity : undefined }} />
            </group>
          ))}
          {shadow && <group scale={[18, 4, 1]}>
            <Box castShadow height={0.01} offset={2.5}>
              <meshBasicMaterial colorWrite={false} depthWrite={false} />
            </Box>
          </group>}
        </Canvas>);
      window.draw(false);
    `,
    },
    logLevel: "silent",
    bundle: true,
    write: false,
    outdir: "out",
    jsx: "automatic",
    define: {
      "process.env.NODE_ENV": '"production"',
      "process.env.PUBLIC_URL": '""',
      "process.env.REACT_APP_STUB_SOUND": '"true"',
    },
  });
  await page.route("**/palette.html", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<div id="root" style="width:288px;height:128px"></div>',
    })
  );
  await page.goto("/palette.html");
  await page.addScriptTag({
    content: bundle.outputFiles.find((file) => file.path.endsWith(".js")).text,
  });
  const readColors = () =>
    page.evaluate(() => {
      const gl = window.paletteContext;
      if (!gl) return [];
      const pixels = new Uint8Array(288 * 128 * 4);
      gl.readPixels(0, 0, 288, 128, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      return Array.from({ length: 4 }, (_, row) =>
        window.palette.map((_, column) => {
          const index = ((row * 32 + 16) * 288 + column * 18 + 9) * 4;
          return (
            "#" +
            Array.from(pixels.slice(index, index + 3), (byte) =>
              byte.toString(16).padStart(2, "0")
            ).join("")
          );
        })
      );
    });
  const palette = await page.evaluate(() => window.palette);
  await expect(page.locator("canvas")).toBeVisible();
  await expect.poll(readColors, { timeout: 30000 }).toEqual(Array(4).fill(palette));
  await page.evaluate(() => window.draw(true));
  const shadedWhite = Math.round(255 * (1.055 * (1 / 8) ** (1 / 2.4) - 0.055));
  const whiteInShadow = "#" + shadedWhite.toString(16).repeat(3);
  await expect
    .poll(async () => (await readColors()).map((row) => row[15]))
    .toEqual(Array(4).fill(whiteInShadow));
  await page.evaluate(() => window.draw(false, false));
  await expect.poll(readColors).toEqual(Array(4).fill(palette));
});
