const path = require("node:path");
const { buildSync } = require("esbuild");
const { test, expect } = require("./fixtures.cjs");

let rendererBundle;
test.beforeAll(() => {
  const root = path.resolve(__dirname, "../../..");
  const { outputFiles } = buildSync({
    stdin: {
      contents: `
        export { Color, DisplayMode, Engine } from "excalibur";
        export { startGame } from "./src/renderers/excalibur/game";
        export { createAreaWorld, getHero } from "./src/testing/harness";
        export { getCameraMotion, getMotion, moveMotion } from "./src/engine/motion";
        export { createGraphics } from "./src/renderers/excalibur/graphics";
        export { fogOfWar } from "./src/game/assets/sprites/terrain";
        export { goldChest } from "./src/game/assets/sprites/units";
        export { composeCharacterPixels } from "./src/components/Row/characters";
        export { createLighting } from "./src/renderers/excalibur/lighting";
      `,
      resolveDir: root,
    },
    bundle: true,
    write: false,
    format: "iife",
    globalName: "rendererTest",
    define: {
      "process.env.NODE_ENV": '"production"',
      "process.env.PUBLIC_URL": '""',
    },
    loader: { ".css": "empty" },
    logLevel: "silent",
  });
  rendererBundle = outputFiles[0].text;
});

test.beforeEach(async ({ page }) => {
  await page.route("**/renderer-scene", (route) =>
    route.fulfill({ contentType: "text/html", body: "<canvas></canvas>" })
  );
  await page.goto("/renderer-scene");
  await page.addScriptTag({ content: rendererBundle });
});

test("Excalibur lights respond to opening a half wall, entering a room and disabling shadows", async ({
  page,
}) => {
  const samples = await page.evaluate(async () => {
    const { Engine, Color, DisplayMode, createLighting } = window.rendererTest;
    const width = 160,
      height = 64;
    const engine = new Engine({
      canvasElement: document.querySelector("canvas"),
      width,
      height,
      pixelRatio: 1,
      displayMode: DisplayMode.Fixed,
      backgroundColor: Color.White,
      physics: false,
      suppressPlayButton: true,
      suppressConsoleBootMessage: true,
    });
    await engine.start();
    try {
      engine.clock.stop();
      engine.clock = engine.clock.toTestClock();
      engine.clock.start();
      const update = createLighting(engine.currentScene);
      const lamp = {
        key: "hero",
        x: 4,
        y: 1,
        inside: false,
        entity: { LIGHT: { brightness: 4, darkness: 0 } },
      };
      const door = {
        key: "door",
        x: 5,
        y: 1,
        inside: false,
        entity: { LIGHT: { brightness: 0, darkness: 1, orientation: "left" } },
      };
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      function sample(enabled = true) {
        update({}, [lamp, door], enabled);
        engine.clock.run(3, 1000 / 30);
        ctx.drawImage(engine.canvas, 0, 0);
        const pixel = (x) => ctx.getImageData(x, 24, 1, 1).data[0];
        return { behind: pixel(64), clear: pixel(16), far: pixel(155) };
      }
      const closed = sample();
      // Light passes through the lower half when the indoor view exposes it.
      door.entity.ENTERABLE = { inside: true, orientation: "up" };
      const rotated = sample();
      delete door.entity.ENTERABLE;
      door.entity.LIGHT.darkness = 0;
      const open = sample();
      const disabled = sample(false);
      lamp.inside = true;
      const indoors = sample();
      lamp.inside = false;
      return { closed, rotated, open, disabled, indoors, restored: sample() };
    } finally {
      engine.dispose();
    }
  });

  expect(samples.closed.behind).toBeLessThan(samples.closed.clear);
  expect(samples.rotated.behind).toBeGreaterThan(samples.closed.behind);
  expect(samples.open.behind).toBeGreaterThan(samples.closed.behind);
  expect(samples.open.far).toBeLessThan(samples.open.clear);
  expect(samples.disabled.far).toBe(255);
  expect(samples.indoors.far).toBe(255);
  expect(samples.restored).toEqual(samples.open);
});

test("Excalibur preserves layered DOS glyphs, fog, counters and loot through collection", async ({
  page,
}) => {
  const pixels = await page.evaluate(async () => {
    const {
      Engine,
      Color,
      DisplayMode,
      createGraphics,
      composeCharacterPixels,
      goldChest,
    } = window.rendererTest;
    const canvas = document.querySelector("canvas");
    const engine = new Engine({
      canvasElement: canvas,
      width: 54,
      height: 16,
      pixelRatio: 1,
      displayMode: DisplayMode.Fixed,
      backgroundColor: Color.Black,
      physics: false,
      antialiasing: false,
      suppressPlayButton: true,
      suppressConsoleBootMessage: true,
    });
    await engine.start();
    try {
      engine.clock.stop();
      engine.clock = engine.clock.toTestClock();
      engine.clock.start();
      const draw = createGraphics(engine.currentScene);
      const world = { metadata: { renderTime: 0 } };
      const block = (color) => [{ char: "█", color }];
      const cell = (key, x, z, layers, flags = {}) => ({
        key,
        x,
        y: 0,
        z,
        layers,
        entity: {},
        ...flags,
      });
      const entries = [
        cell("ground", 0, 0, block("#0000ff")),
        cell("chest", 0, 1, goldChest.layers),
        cell("explored", 1, 1, block("#ffffff"), { fog: true }),
        cell("fog", 1, 7, window.rendererTest.fogOfWar.layers),
        cell("swimming", 2, 2, [], { swimming: true }),
        cell("dots", 3, 2.5, [], { dots: 6 }),
        cell("loot", 4, 4, block("#ff0000"), { loot: true }),
        cell("hp", 5, 9, [], {
          hp: { value: 4, maximum: 8, color: "#00ff00", scale: 1, x: 0, y: 0 },
        }),
      ];
      const captured = document.createElement("canvas");
      captured.width = canvas.width;
      captured.height = canvas.height;
      const ctx = captured.getContext("2d", { willReadFrequently: true });
      function frame(time, visible) {
        world.metadata.renderTime = time;
        draw(world, visible);
        engine.clock.run(1, 1000 / 30);
        ctx.drawImage(canvas, 0, 0);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        return (x, y) =>
          Array.from(
            data.slice(
              (y * canvas.width + x) * 4,
              (y * canvas.width + x) * 4 + 3
            )
          );
      }
      const first = frame(0, entries);
      const visible = frame(200, entries);
      const removed = entries.filter((entry) => !entry.loot);
      frame(210, removed);
      const fading = frame(310, removed);
      const gone = frame(410, removed);
      const matchesChest = composeCharacterPixels(goldChest.layers).every(
        (color, i) => {
          const rgb = visible(i % 9, Math.floor(i / 9));
          return (
            ((rgb[0] << 16) | (rgb[1] << 8) | rgb[2]) ===
            parseInt((color || "#0000ff").slice(1), 16)
          );
        }
      );
      return {
        matchesChest,
        fog: Array.from({ length: 9 }, (_, x) => visible(9 + x, 0)[0]),
        swim: [visible(18, 2), visible(18, 9)],
        dots: [
          visible(27, 13),
          visible(29, 13),
          visible(27, 15),
          visible(28, 13),
        ],
        bar: [visible(45, 13), visible(52, 13)],
        loot: [first, visible, fading, gone].map((sample) => sample(36, 0)[0]),
      };
    } finally {
      engine.dispose();
    }
  });
  expect(pixels.matchesChest).toBe(true);
  expect(pixels.fog).toContain(0);
  expect(pixels.fog).toContain(255);
  expect(pixels.swim).toEqual([
    [0, 0, 0],
    [0, 0, 128],
  ]);
  expect(pixels.dots).toEqual([
    [192, 192, 192],
    [192, 192, 192],
    [192, 192, 192],
    [0, 0, 0],
  ]);
  expect(pixels.bar).toEqual([
    [0, 255, 0],
    [0, 38, 0],
  ]);
  expect(pixels.loot[0]).toBe(0);
  expect(pixels.loot[1]).toBe(255);
  expect(pixels.loot[2]).toBeGreaterThan(120);
  expect(pixels.loot[2]).toBeLessThan(135);
  expect(pixels.loot[3]).toBe(0);
});

test("a glyph keeps its shape while the camera and the unit move at fractional zoom", async ({
  page,
}) => {
  await page.setContent(
    '<main style="width:201px;height:157px"><canvas></canvas></main>'
  );
  const result = await page.evaluate(async () => {
    const {
      startGame,
      createAreaWorld,
      getHero,
      goldChest,
      getCameraMotion,
      moveMotion,
      getMotion,
    } = window.rendererTest;
    const world = createAreaWorld("|       |\n|   ♀   |\n|       |", {
      size: 48,
    });
    const hero = getHero(world);
    hero.FOG.visibility = "visible";
    hero.SPRITE = goldChest;
    hero.EQUIPPABLE = {};
    hero.STATS.scale = 0;
    const canvas = document.querySelector("canvas");
    const dispose = startGame(canvas, () => ({
      world,
      columns: 11,
      rows: 5,
      cellWidth: 20.25,
      cellHeight: 36,
      paused: true,
      suspended: false,
      shadows: false,
    }));
    const engine = window.___EXCALIBUR_DEVTOOL;
    try {
      while (!engine.isReady) await new Promise(requestAnimationFrame);
      engine.clock.stop();
      engine.clock = engine.clock.toTestClock();
      engine.clock.start();
      const density = devicePixelRatio;
      const copy = document.createElement("canvas");
      copy.width = Math.round(201 * density);
      copy.height = Math.round(157 * density);
      const ctx = copy.getContext("2d", { willReadFrequently: true });

      function capture() {
        engine.clock.run(2, 1000 / 30);
        ctx.drawImage(canvas, 0, 0, copy.width, copy.height);
        const { data } = ctx.getImageData(0, 0, copy.width, copy.height);
        const gold = [];
        for (let i = 0; i < data.length; i += 4) {
          if (
            data[i] > 110 &&
            data[i + 1] > 110 &&
            data[i + 2] < data[i] * 0.65
          ) {
            gold.push({
              x: (i / 4) % copy.width,
              y: Math.floor(i / 4 / copy.width),
            });
          }
        }
        const left = Math.min(...gold.map((p) => p.x));
        const top = Math.min(...gold.map((p) => p.y));
        return {
          left,
          shape: gold.map((p) => (p.y - top) * copy.width + p.x - left),
        };
      }

      const initial = capture();
      const camera = getCameraMotion(world);
      camera.fromX = camera.x += 0.19;
      camera.fromY = camera.y += 0.11;
      const pan = capture();
      moveMotion(world, hero, hero.POSITION.x, hero.POSITION.y, 48);
      const unit = getMotion(hero);
      unit.fromX = unit.x + 0.36;
      unit.fromY = unit.y + 0.14;
      unit.startedAt = world.metadata.renderTime;
      const walk = capture();
      return {
        nativeResolution:
          canvas.width === copy.width && canvas.height === copy.height,
        initial,
        pan,
        walk,
      };
    } finally {
      dispose();
    }
  });
  expect(result.initial.shape.length).toBeGreaterThan(20);
  expect(result.pan.left).toBeLessThan(result.initial.left);
  expect(result.walk.left).toBeGreaterThan(result.pan.left);
  expect(result.pan.shape).toEqual(result.initial.shape);
  expect(result.walk.shape).toEqual(result.initial.shape);
  expect(result.nativeResolution).toBe(true);
});

test("touching cells stay filled and explored wall faces show the torch radius above cast shadows", async ({
  page,
}) => {
  await page.setContent(
    '<main style="width:321px;height:201px"><canvas></canvas></main>'
  );
  const results = await page.evaluate(async () => {
    const { startGame, createAreaWorld, getHero } = window.rendererTest;
    const area = Array.from(
      { length: 11 },
      (_, y) => "|" + (y === 5 ? "██████████♀██████████" : "█".repeat(21)) + "|"
    ).join("\n");
    const world = createAreaWorld(area, { size: 32 });
    const hero = getHero(world);
    hero.LIGHT.brightness = 3.25;
    for (const tile of world.getEntities(["POSITION", "SPRITE", "FOG"])) {
      tile.FOG.visibility = "visible";
      if (tile.SPRITE.name !== "wall_solid") continue;
      const { x, y } = tile.POSITION;
      const wall = y === 5 && (x === 12 || x === 15);
      tile.LIGHT.darkness = wall ? 1 : 0;
      tile.FOG.visibility = wall ? "fog" : "visible";
      if (y < 5) tile.BUMPABLE = { generation: 0 };
    }
    const props = {
      world,
      columns: 21,
      rows: 11,
      cellWidth: 18,
      cellHeight: 32,
      paused: true,
      suspended: false,
      shadows: false,
    };
    const canvas = document.querySelector("canvas");
    const dispose = startGame(canvas, () => props);
    const engine = window.___EXCALIBUR_DEVTOOL;
    try {
      while (!engine.isReady) await new Promise(requestAnimationFrame);
      engine.clock.stop();
      engine.clock = engine.clock.toTestClock();
      engine.clock.start();
      const copy = document.createElement("canvas");
      const ctx = copy.getContext("2d", { willReadFrequently: true });
      function capture(shadows) {
        props.shadows = shadows;
        engine.clock.run(3, 1000 / 30);
        copy.width = canvas.width;
        copy.height = canvas.height;
        ctx.drawImage(canvas, 0, 0);
        return ctx.getImageData(0, 0, copy.width, copy.height);
      }
      return [32, 33, 36, 41].map((height) => {
        props.cellHeight = height;
        props.cellWidth = (height * 9) / 16;
        const flat = capture(false);
        const lit = capture(true);
        const pixel = (image, x, y) =>
          image.data[
            4 *
              (Math.floor(copy.height / 2 + y * devicePixelRatio) * copy.width +
                Math.floor(copy.width / 2 + x * devicePixelRatio))
          ];
        const floor = pixel(flat, -30, -40);
        let gaps = 0;
        for (let y = -75; y < -30; y++)
          for (let x = -95; x <= 95; x++)
            if (pixel(flat, x, y) !== floor) gaps++;
        const edge = 3 * height;
        return {
          gaps,
          floor,
          wallInside: pixel(lit, edge - 3, 0),
          wallOutside: pixel(lit, edge + 2, 0),
          clear: pixel(lit, -3 * props.cellWidth, 0),
          shadow: pixel(lit, 3 * props.cellWidth, 0),
        };
      });
    } finally {
      dispose();
    }
  });
  for (const frame of results) {
    expect(frame.floor).toBe(128);
    expect(frame.gaps).toBe(0);
    expect(frame.wallInside).toBe(frame.floor);
    expect(frame.wallOutside).toBeLessThan(frame.wallInside / 2);
    expect(frame.clear - frame.shadow).toBeGreaterThan(25);
  }
});
