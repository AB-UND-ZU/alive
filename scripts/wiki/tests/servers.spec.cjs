const { test, expect } = require("@playwright/test");
const { mkdtemp, rm, realpath } = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { buildServer } = require("../../server/build.cjs");
const { createGameServer } = require("../../server/transport.cjs");
let directory, server, engine;
test.beforeAll(async () => {
  directory = await realpath(
    await mkdtemp(path.join(os.tmpdir(), "alive-wiki-servers-"))
  );
  const outfile = path.join(directory, "engine.cjs");
  await buildServer({
    stdin: {
      contents:
        'export {createHost} from "./src/engine/network/host"; export {encodeState, decodeState} from "./src/engine/network/codec";',
      resolveDir: path.resolve(__dirname, "../../.."),
      loader: "ts",
    },
    outfile,
    // Keep jsfxr in its native CommonJS module, outside Playwright's strict transform.
    external: [require.resolve("jsfxr")],
  });
  engine = require(outfile);
  server = await createGameServer({
    engine,
    file: path.join(directory, "server.save"),
  });
});
test.afterAll(async () => {
  await server?.close();
  if (directory) await rm(directory, { recursive: true, force: true });
});

test("Multiplayer connects two independently playable clients and preserves their identities on retry", async ({
  page,
}, testInfo) => {
  const connections = [];
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("websocket", (socket) => {
    const connection = { states: 0 };
    connections.push(connection);
    socket.on("framereceived", ({ payload }) => {
      const message = JSON.parse(payload.toString());
      if (message.type === "welcome") connection.id = message.id;
      if (message.type === "state") {
        connection.states++;
        connection.frame = engine.decodeState(message.state);
      }
    });
  });
  await page.goto("/game-design/clients/multiplayer.html");
  await expect(
    page.getByRole("heading", { name: "Multiplayer", exact: true })
  ).toBeVisible();
  await expect(
    page
      .locator(".NavGroup")
      .filter({ hasText: "[CLIENTS]" })
      .getByRole("link", { name: "Multiplayer", exact: true })
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Server URL" })
    .fill(`127.0.0.1:${server.address.port}`);
  await page.getByRole("button", { name: "Connect", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "connected" })
  ).toHaveCount(2, { timeout: 15000 });
  expect(connections).toHaveLength(2);
  expect(connections[0].id).not.toBe(connections[1].id);
  const ids = connections.map((connection) => connection.id).sort();
  for (let index = 0; index < 2; index++) {
    const frame = page.frameLocator(`iframe[title="Player ${index + 1} game"]`);
    const playerId = await frame.locator("body").evaluate(
      (_, slot) =>
        Object.keys(localStorage)
          .filter((key) =>
            key.startsWith(`alive.wiki.client.${slot}:alive.server:`)
          )
          .map((key) => JSON.parse(localStorage.getItem(key)))
          .find((claim) => claim.id)?.id,
      index + 1
    );
    const world = server.simulation.worldFor(playerId);
    const actor = world.getEntityById(server.simulation.actorId(playerId));
    const before = { ...actor.POSITION };
    await frame.locator("canvas").click({ position: { x: 30, y: 30 } });
    await frame.locator("body").press("ArrowRight");
    await expect.poll(() => actor.POSITION).not.toEqual(before);
  }
  await page.screenshot({
    path: testInfo.outputPath("servers-desktop.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
    )
    .toBe(false);
  await page.screenshot({
    path: testInfo.outputPath("servers-mobile.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  const counts = connections.map((connection) => connection.states);
  await expect
    .poll(() =>
      connections.every(
        (connection, index) => connection.states > counts[index] + 1
      )
    )
    .toBe(true);
  await page.getByRole("button", { name: "Connect", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "connected" })
  ).toHaveCount(2, { timeout: 15000 });
  await expect.poll(() => connections.length).toBe(4);
  await expect
    .poll(() =>
      connections
        .slice(2)
        .map((connection) => connection.id)
        .filter(Boolean)
        .sort()
    )
    .toEqual(ids);
  expect(errors).toEqual([]);
});

test("Multiplayer reports an unreachable host and accepts another address", async ({
  page,
}) => {
  await page.goto("/game-design/clients/multiplayer.html");
  await page.getByRole("textbox", { name: "Server URL" }).fill("127.0.0.1:1");
  await page.getByRole("button", { name: "Connect", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Connection failed");
  await expect(page.locator(".ServerGames iframe")).toHaveCount(0);
  await page
    .getByRole("textbox", { name: "Server URL" })
    .fill(`127.0.0.1:${server.address.port}`);
  await page.getByRole("textbox", { name: "Server URL" }).press("Enter");
  await expect(
    page.getByRole("status").filter({ hasText: "connected" })
  ).toHaveCount(2, { timeout: 15000 });
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("Server documents native startup, shared rules and server-owned saves", async ({
  page,
}, testInfo) => {
  await page.goto("/game-design/clients/server.html");
  await expect(
    page.getByRole("heading", { name: "Server", exact: true })
  ).toBeVisible();
  const content = page.locator("main");
  await expect(content).toContainText("npm run server");
  await expect(content).toContainText("~/.alive/server.save");
  await expect(content).toContainText("ALIVE_SERVER_SAVE");
  await expect(
    content.getByRole("link", { name: "Multiplayer", exact: true })
  ).toHaveAttribute("href", /clients\/multiplayer.html$/);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
      )
      .toBe(false);
    await page.screenshot({
      path: testInfo.outputPath(`server-${width}.png`),
      fullPage: true,
    });
  }
});
