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
        'export {createHost} from "./src/engine/network/host"; export {encodeState, decodeState} from "./src/engine/network/codec"; export {getKeyFromIndex} from "./src/components/Keyboard";',
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
  await page.getByRole("textbox", { name: "Player 1 username" }).fill("Alice");
  await page.getByRole("textbox", { name: "Player 2 username" }).fill("Bob");
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
}, testInfo) => {
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
  const players = [];
  for (let index = 0; index < 2; index++) {
    const frame = page.frameLocator(`iframe[title="Player ${index + 1} game"]`);
    const id = await frame.locator("body").evaluate(
      (_, slot) =>
        Object.keys(localStorage)
          .filter((key) =>
            key.startsWith(`alive.wiki.client.${slot}:alive.server:`)
          )
          .map((key) => JSON.parse(localStorage.getItem(key)))
          .find((claim) => claim.id)?.id,
      index + 1
    );
    const world = server.simulation.worldFor(id);
    const actor = world.getEntityById(server.simulation.actorId(id));
    players.push(actor);
    expect(actor.PLAYER.naming).toBe(true);
    if (index === 0) {
      await page.screenshot({
        path: testInfo.outputPath("username-desktop.png"),
        fullPage: true,
      });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({
        path: testInfo.outputPath("username-mobile.png"),
        fullPage: true,
      });
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
    await frame.locator("canvas").click({ position: { x: 30, y: 30 } });
    await frame
      .locator("body")
      .pressSequentially(index ? "Evan" : "Dora", { delay: 40 });
    await frame.locator("body").press("Enter");
    await expect.poll(() => actor.PLAYER.naming).toBe(false);
  }
  const frame = page.frameLocator('iframe[title="Player 1 game"]');
  await frame.locator("canvas").click({ position: { x: 30, y: 30 } });
  await frame.locator("body").press("c");
  await expect.poll(() => !!players[0].PLAYER.popup).toBe(true);
  await expect(frame.locator("#keyboard")).toBeVisible();
  await frame.locator("body").pressSequentially("hello", { delay: 40 });
  await frame.locator("body").press("Enter");
  await expect
    .poll(() =>
      players[0].TOOLTIP.dialogs[0]
        ?.slice(1, -1)
        .map((sprite) => sprite.layers[sprite.layers.length - 1]?.char || "")
        .join("")
    )
    .toBe("Dora: hello");
  await expect(frame.locator("#keyboard")).toHaveCount(0);
  await expect.poll(() => players[0].TOOLTIP.chatRemaining).toBeLessThan(2000);
  await page.screenshot({
    path: testInfo.outputPath("chat-desktop.png"),
    fullPage: true,
  });
  await expect
    .poll(() => players[0].TOOLTIP.dialogs.length, { timeout: 5000 })
    .toBe(0);
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

test("server admins receive private player lists and complete usernames before granting commands", async ({
  page,
}, testInfo) => {
  const {
    createCredential,
    createPersistence,
  } = require("../../server/persistence.cjs");
  const credential = createCredential();
  const host = engine.createHost();
  host.join(credential.id);
  const file = path.join(directory, "admin.save");
  await createPersistence(file).save({
    accounts: [{ id: credential.id, hash: credential.hash, username: "Admin" }],
    world: host.save(),
  });
  const managed = await createGameServer({
    engine,
    file,
    adminIds: [credential.id],
  });
  try {
    const address = `ws://127.0.0.1:${managed.address.port}/`;
    await page.goto("/game-design/clients/multiplayer.html");
    await page.evaluate(
      ({ address, id, token }) =>
        localStorage.setItem(
          `alive.wiki.client.1:alive.server:${address}`,
          JSON.stringify({ id, token })
        ),
      { address, id: credential.id, token: credential.token }
    );
    await page.getByRole("textbox", { name: "Server URL" }).fill(address);
    await page
      .getByRole("textbox", { name: "Player 2 username" })
      .fill("Friend");
    await page.getByRole("button", { name: "Connect", exact: true }).click();
    await expect(
      page.getByRole("status").filter({ hasText: "connected" })
    ).toHaveCount(2, { timeout: 15000 });
    const world = managed.simulation.worldFor(credential.id);
    const hero = world.getEntityById(managed.simulation.actorId(credential.id));
    const friend = () =>
      world
        .getEntities(["PLAYER"])
        .find((actor) => actor.PLAYER.username === "Friend");
    const frame = page.frameLocator('iframe[title="Player 1 game"]');
    const prompt = () => {
      const popup = world.getEntityById(hero.PLAYER.popup)?.POPUP;
      return popup?.selections[popup.horizontalIndex]
        ?.map(engine.getKeyFromIndex)
        .join("");
    };
    await frame.locator("canvas").click({ position: { x: 30, y: 30 } });
    await frame.locator("body").press("/");
    await expect.poll(prompt).toBe("/");
    await expect(frame.locator("#keyboard")).toBeVisible();
    await frame
      .locator("body")
      .pressSequentially("server players", { delay: 40 });
    await expect
      .poll(() => ({ prompt: prompt(), admin: hero.PLAYER.admin }))
      .toEqual({ prompt: "/server players", admin: true });
    await frame.locator("body").press("Enter");
    await expect
      .poll(() => ({
        output: hero.PLAYER.popup === hero.PLAYER.interface.server,
        prompt: prompt(),
      }))
      .toEqual({ output: true, prompt: "" });
    expect(friend().PLAYER.popup).toBeUndefined();
    await expect(frame.locator("#keyboard")).toHaveCount(0);
    await page.screenshot({
      path: testInfo.outputPath("admin-desktop.png"),
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: testInfo.outputPath("admin-mobile.png"),
      fullPage: true,
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await frame.locator("body").press("Escape");
    await expect.poll(() => hero.PLAYER.popup).toBeUndefined();
    await frame.locator("body").press("/");
    await expect.poll(prompt).toBe("/");
    await expect(frame.locator("#keyboard")).toBeVisible();
    await frame
      .locator("body")
      .pressSequentially("server admin Fr", { delay: 40 });
    await expect.poll(prompt).toBe("/server admin Fr");
    await frame.locator("body").press("Tab");
    await expect.poll(prompt).toBe("/server admin Friend ");
    await frame.locator("body").pressSequentially("on", { delay: 40 });
    await frame.locator("body").press("Enter");
    await expect.poll(() => friend().PLAYER.admin).toBe(true);
  } finally {
    await managed.close();
  }
});
